import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

const maxBodyBytes = 16 * 1024;
const timestampToleranceSeconds = 300;
const incidentSources = new Set([
  "uptime",
  "numericsThreshold",
  "numericsFreshness",
]);
const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

export function openInbox(path) {
  const database = new DatabaseSync(path);
  database.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA synchronous = FULL;
    CREATE TABLE IF NOT EXISTS inbox (
      sequence INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL UNIQUE,
      body TEXT NOT NULL,
      received_at_ms INTEGER NOT NULL
    );
  `);
  const insert = database.prepare(`
    INSERT INTO inbox (event_id, body, received_at_ms)
    VALUES (?, ?, ?) ON CONFLICT(event_id) DO NOTHING
  `);
  const find = database.prepare("SELECT body FROM inbox WHERE event_id = ?");
  return {
    record(eventId, body, receivedAtMs) {
      // The standalone INSERT commits before run() returns. Inbox rows are immutable.
      if (insert.run(eventId, body, receivedAtMs).changes === 1) return "new";
      return find.get(eventId)?.body === body ? "duplicate" : "conflict";
    },
    close() {
      database.close();
    },
  };
}

function singleHeader(request, name) {
  const values = request.headersDistinct[name];
  return values?.length === 1 ? values[0] : undefined;
}

function validSignature(secret, timestamp, rawBody, signature) {
  if (!/^v1=[a-f0-9]{64}$/.test(signature ?? "")) return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature.slice(3), "hex"));
}

function validEvent(event, eventId) {
  if (
    !event ||
    event.version !== 1 ||
    event.eventId !== eventId ||
    !Number.isSafeInteger(event.occurredAtMs) ||
    event.occurredAtMs < 0
  ) {
    return false;
  }
  if (event.kind === "test") return true;
  return (
    (event.kind === "opened" || event.kind === "recovered") &&
    typeof event.incidentId === "string" &&
    event.incidentId.length > 0 &&
    incidentSources.has(event.source) &&
    typeof event.checkId === "string" &&
    typeof event.checkName === "string"
  );
}

function respond(response, status, result) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify({ result }));
}

export function createReceiver({ secret, inbox, now = Date.now }) {
  if (!secret)
    throw new Error(
      "Set SWITCHBOARD_WEBHOOK_SECRET to the signing secret from Switchboard.",
    );

  return createServer(
    { requestTimeout: 15_000, headersTimeout: 10_000 },
    async (request, response) => {
      if (request.url !== "/switchboard")
        return respond(response, 404, "not_found");
      if (request.method !== "POST") {
        response.setHeader("allow", "POST");
        return respond(response, 405, "method_not_allowed");
      }
      if (
        !/^application\/json(?:\s*;|$)/i.test(
          singleHeader(request, "content-type") ?? "",
        )
      ) {
        return respond(response, 415, "unsupported_content_type");
      }

      const eventId = singleHeader(request, "switchboard-event-id");
      const timestamp = singleHeader(request, "switchboard-timestamp");
      const signature = singleHeader(request, "switchboard-signature");
      const receivedAtMs = now();
      if (
        !eventId ||
        !/^\d{1,12}$/.test(timestamp ?? "") ||
        Math.abs(Math.floor(receivedAtMs / 1000) - Number(timestamp)) >
          timestampToleranceSeconds
      ) {
        return respond(response, 401, "invalid_signature_or_timestamp");
      }

      const chunks = [];
      let size = 0;
      try {
        // Keep the socket available to send a 413 if the body exceeds the limit.
        for await (const chunk of request.iterator({
          destroyOnReturn: false,
        })) {
          size += chunk.length;
          if (size > maxBodyBytes) {
            response.setHeader("connection", "close");
            return respond(response, 413, "body_too_large");
          }
          chunks.push(chunk);
        }
      } catch {
        return respond(response, 400, "incomplete_body");
      }
      const rawBody = Buffer.concat(chunks, size);
      if (!validSignature(secret, timestamp, rawBody, signature)) {
        return respond(response, 401, "invalid_signature_or_timestamp");
      }

      let body;
      let event;
      try {
        body = decoder.decode(rawBody);
        event = JSON.parse(body);
      } catch {
        return respond(response, 400, "invalid_json");
      }
      if (!validEvent(event, eventId))
        return respond(response, 400, "invalid_event");

      try {
        const outcome = inbox.record(eventId, body, receivedAtMs);
        if (outcome === "conflict")
          return respond(response, 409, "event_id_conflict");
        return respond(
          response,
          200,
          outcome === "new" ? "accepted" : "duplicate",
        );
      } catch {
        return respond(response, 503, "inbox_unavailable");
      }
    },
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.umask(0o077);
  const secret = process.env.SWITCHBOARD_WEBHOOK_SECRET;
  if (!secret)
    throw new Error(
      "Set SWITCHBOARD_WEBHOOK_SECRET to the signing secret from Switchboard.",
    );
  const port = Number(process.env.PORT ?? 8789);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Set a valid PORT.");
  const inbox = openInbox(
    process.env.SWITCHBOARD_INBOX_PATH ?? "switchboard-inbox.sqlite",
  );
  createReceiver({ secret, inbox }).listen(port, "127.0.0.1", () => {
    console.log(
      `Switchboard receiver listening on 127.0.0.1:${port}/switchboard`,
    );
  });
}
