import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { createReceiver, openInbox } from "./receiver.mjs";

const secret = "local-test-signing-secret";
const now = 1_800_000_000_000;
const incident = {
  version: 1,
  eventId: "fixture-opened",
  kind: "opened",
  occurredAtMs: now - 3_600_000,
  incidentId: "fixture-incident",
  source: "uptime",
  checkId: "fixture-http",
  checkName: "واجهة الاختبار",
};

async function startReceiver(t, inbox, clock = now) {
  const server = createReceiver({ secret, inbox, now: () => clock });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return async function deliver(body, options = {}) {
    const timestamp = options.timestamp ?? String(clock / 1000);
    const eventId = options.eventId ?? incident.eventId;
    const signature =
      options.signature ??
      `v1=${createHmac("sha256", secret)
        .update(timestamp + ".")
        .update(options.signedBody ?? body)
        .digest("hex")}`;
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/switchboard`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "switchboard-event-id": eventId,
          "switchboard-timestamp": timestamp,
          "switchboard-signature": signature,
        },
        body,
      },
    );
    return [response.status, (await response.json()).result];
  };
}

test("commits signed raw events, accepts re-signed retries across restart, and rejects conflicts", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "switchboard-webhook-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, "inbox.sqlite");
  const inbox = openInbox(path);
  const deliver = await startReceiver(t, inbox);
  const body = JSON.stringify(incident, null, 2) + "\n";
  assert.deepEqual(await deliver(body), [200, "accepted"]);
  inbox.close();

  const reopened = openInbox(path);
  const retry = await startReceiver(t, reopened);
  try {
    assert.deepEqual(
      await retry(body, { timestamp: String(now / 1000 + 15) }),
      [200, "duplicate"],
    );
    assert.deepEqual(await retry(JSON.stringify(incident)), [
      409,
      "event_id_conflict",
    ]);
    const recovery = {
      ...incident,
      eventId: "fixture-recovered",
      kind: "recovered",
    };
    assert.deepEqual(
      await retry(JSON.stringify(recovery), { eventId: recovery.eventId }),
      [200, "accepted"],
    );
    const database = new DatabaseSync(path, { readOnly: true });
    try {
      const rows = database
        .prepare("SELECT body, received_at_ms FROM inbox ORDER BY sequence")
        .all();
      assert.deepEqual(
        rows.map((row) => row.body),
        [body, JSON.stringify(recovery)],
      );
      assert.equal(rows[0].received_at_ms, now);
    } finally {
      database.close();
    }
  } finally {
    reopened.close();
  }
});

test("rejects invalid signatures, timestamps, IDs, JSON and oversized requests before writes", async (t) => {
  const deliver = await startReceiver(t, {
    record() {
      assert.fail("unverified event reached SQLite");
    },
  });
  const body = JSON.stringify(incident);
  assert.deepEqual(await deliver(body, { signedBody: body + " " }), [
    401,
    "invalid_signature_or_timestamp",
  ]);
  for (const offset of [-301, 301]) {
    assert.deepEqual(
      await deliver(body, { timestamp: String(now / 1000 + offset) }),
      [401, "invalid_signature_or_timestamp"],
    );
  }
  assert.deepEqual(await deliver(body, { eventId: "other-event" }), [
    400,
    "invalid_event",
  ]);
  assert.deepEqual(await deliver(Buffer.from([0x22, 0xff, 0x22])), [
    400,
    "invalid_json",
  ]);
  assert.deepEqual(await deliver(" ".repeat(17 * 1024)), [
    413,
    "body_too_large",
  ]);
});

test("accepts the known test payload and signature from the Switchboard sender", async (t) => {
  const inbox = openInbox(":memory:");
  t.after(() => inbox.close());
  const deliver = await startReceiver(t, inbox, 1_700_000_000_000);
  const body =
    '{"version":1,"eventId":"test-abc","kind":"test","occurredAtMs":1700000000000}';
  const signature =
    "v1=afbc472dedfc3b9be38c6e8f9ef568d97bf51488606e590d4011042b698e8bb7";
  assert.deepEqual(await deliver(body, { eventId: "test-abc", signature }), [
    200,
    "accepted",
  ]);
});

test("asks Switchboard to retry a test event when the inbox write fails", async (t) => {
  const deliver = await startReceiver(t, {
    record() {
      throw new Error("inbox unavailable");
    },
  });
  const event = {
    version: 1,
    eventId: "fixture-test",
    kind: "test",
    occurredAtMs: now,
  };
  assert.deepEqual(
    await deliver(JSON.stringify(event), { eventId: event.eventId }),
    [503, "inbox_unavailable"],
  );
});
