# Switchboard signed webhook receiver

[العربية](README.ar.md) · [Download receiver.mjs](https://switchboard.azzuwayed.com/examples/monitoring-webhook/receiver.mjs)

Run this example on infrastructure you control with Node.js 24 and a persistent
disk. It uses Node's SQLite module and has no package dependencies.

1. Inject `SWITCHBOARD_WEBHOOK_SECRET` from your host's secret store. Use the
   same value you enter in Switchboard. Set `SWITCHBOARD_INBOX_PATH` to a
   writable path on the persistent disk, inside a private directory. The
   default is `switchboard-inbox.sqlite` in the working directory.
2. Run `node receiver.mjs` from the download directory. It listens on
   `127.0.0.1:8789`. Use `PORT` to choose a different port.
3. Terminate TLS at your HTTPS reverse proxy and forward
   `POST /switchboard` to the receiver. Preserve the three Switchboard
   headers and the request body bytes. Set the proxy body limit to 16 KiB
   and keep the host clock synchronized.
4. In Switchboard, open **Settings → Monitoring → Alert webhook →
   Configure webhook**. Enter the HTTPS URL ending in `/switchboard` and
   the signing secret. Select **Send test webhook** with automatic delivery
   off. Open the test receipt and check for endpoint acceptance and an
   attempt count. Enable automatic delivery when the test succeeds.

The receiver verifies HMAC-SHA256 over the timestamp header, a period, and the
raw request bytes. It accepts an attempt timestamp within five minutes of the
receiver clock and requires the verified body to carry the header's event ID.
The event occurrence time can be older when a queued attempt is retried.
The receiver commits to SQLite before returning success. Identical retries
receive success, while a different payload for an existing ID receives HTTP 409. SQLite write failures return HTTP 503 so Switchboard can retry.

## Inspect and forward events

Use SQLite to confirm the test was recorded. Substitute the configured path
if you changed the default.

```sh
sqlite3 -readonly switchboard-inbox.sqlite \
  "SELECT sequence, event_id, json_extract(body, '$.kind'), received_at_ms FROM inbox ORDER BY sequence;"
```

To forward incidents, run your own worker or automation against the inbox.
Read rows in order with a per-destination cursor. Start the cursor at zero.

```sql
SELECT sequence, event_id, body
FROM inbox
WHERE sequence > :last_forwarded_sequence
ORDER BY sequence
LIMIT 100;
```

For each row, parse `body` and route `opened` and `recovered` to the channel
you configure. Use `incidentId` to correlate the two transitions and
`event_id` as the idempotency key when the destination supports one. Advance
your durable cursor only after that destination confirms delivery, or after
intentionally skipping a `test` event. A forwarder that exits after sending
and before saving its cursor can send the same event again.

The Switchboard receipt confirms that this HTTPS endpoint accepted the event.
Use your forwarder's delivery records to confirm it reached the channel.
Keep the inbox private because it contains check names and identifiers.

Run the local example tests with `node --test examples/monitoring-webhook/receiver.test.mjs`
from the repository checkout.
