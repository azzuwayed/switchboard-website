import assert from "node:assert/strict";
import vm from "node:vm";

function contactFixture(script, locale, token) {
  const elements = new Map();
  const requests = [];
  let now = 0;
  let submit;
  let scriptError;
  let action;

  for (const id of [
    "contact-form",
    "contact-fields",
    "contact-fallback",
    "contact-btn",
    "contact-btn-label",
    "error",
    "done-section",
    "done-reference",
    "name",
    "email",
    "category",
    "message",
    "company_website",
    "turnstile-slot",
  ]) {
    elements.set(id, {});
  }

  const form = elements.get("contact-form");
  const fields = elements.get("contact-fields");
  const fallback = elements.get("contact-fallback");
  const confirmation = elements.get("done-section");
  const message = elements.get("message");
  form.hidden = fields.disabled = confirmation.hidden = true;
  fallback.hidden = false;
  confirmation.focus = () => {
    confirmation.focused = true;
  };
  form.addEventListener = (event, listener) => {
    assert.equal(event, "submit");
    assert.equal(
      form.hidden,
      true,
      "hide form until the submit handler is ready",
    );
    assert.equal(
      fields.disabled,
      true,
      "keep controls disabled until the submit handler is ready",
    );
    assert.equal(
      fallback.hidden,
      false,
      "show the fallback until the submit handler is ready",
    );
    submit = listener;
  };
  elements.get("name").value = "Test user";
  Object.assign(elements.get("email"), {
    value: "user@example.invalid",
    validity: { valid: true },
  });
  elements.get("category").value = "Bug report";
  elements.get("company_website").value = "";
  message.value = "A fixture message";

  const window = {
    turnstile: {
      render: (_element, options) => {
        assert.equal(options.language, locale);
        action = options.action;
        return 0;
      },
      getResponse: () => token,
      reset() {},
    },
  };
  const document = {
    documentElement: { lang: locale },
    getElementById: (id) => elements.get(id),
    createElement: () => ({
      addEventListener: (event, listener) => {
        assert.equal(event, "error");
        scriptError = listener;
      },
    }),
    head: { appendChild() {} },
  };

  new vm.Script(script, { filename: "contact.js" }).runInNewContext({
    document,
    window,
    Date: { now: () => now },
    setTimeout(callback, delay) {
      now += delay;
      assert.ok(now <= 11000, "verification wait must end after 10 seconds");
      callback();
    },
    fetch: async (url, options) => {
      assert.equal(url, "https://azzuwayed.com/api/v1/contact");
      assert.equal(options.method, "POST");
      assert.equal(options.headers["Content-Type"], "application/json");
      assert.equal(action, "contact_app");
      requests.push(JSON.parse(options.body));
      return {
        status: 201,
        json: async () => ({ status: "sent", reference: "CT-TEST" }),
      };
    },
  });

  assert.equal(form.hidden, false);
  assert.equal(fields.disabled, false);
  assert.equal(fallback.hidden, true);

  return {
    elements,
    requests,
    confirmation,
    fallback,
    message,
    time: () => now,
    startVerification: window.__renderTurnstile,
    blockVerification: scriptError,
    async submit() {
      let prevented = false;
      await submit({
        preventDefault() {
          prevented = true;
        },
      });
      assert.equal(prevented, true, "submit must prevent native navigation");
    },
  };
}

export async function checkContact({ html, script, locale }) {
  const failures = [];
  const cases = {
    "scriptless fallback"() {
      const form = html.match(
        /<form\b[^>]*\bid="contact-form"[^>]*>([\s\S]*?)<\/form>/i,
      );
      const fields = form?.[1].match(
        /<fieldset\b[^>]*\bid="contact-fields"[^>]*>([\s\S]*?)<\/fieldset>/i,
      );
      assert.ok(form && fields, "missing guest form or fieldset");
      assert.match(form[0].split(">")[0], /\bmethod="post"(?:\s|$)/i);
      assert.match(form[0].split(">")[0], /\bhidden(?:\s|$)/i);
      assert.match(fields[0].split(">")[0], /\bdisabled(?:\s|$)/i);
      assert.doesNotMatch(
        form[1].replace(fields[0], ""),
        /<(?:input|select|textarea|button)\b/i,
        "all form controls must start disabled",
      );

      const fallback = html.match(
        /<p\b[^>]*\bid="contact-fallback"[^>]*>[\s\S]*?<\/p>/i,
      );
      assert.ok(fallback, "missing visible contact fallback");
      assert.doesNotMatch(fallback[0].split(">")[0], /\bhidden\b/i);
      assert.ok(
        fallback[0].includes(
          `https://azzuwayed.com/${locale}/contact?type=support&amp;app=switchboard`,
        ),
      );
      assert.ok(fallback[0].includes('href="mailto:support@azzuwayed.com"'));
      const scriptPath = locale === "ar" ? "../contact.js" : "contact.js";
      assert.ok(html.includes(`<script src="${scriptPath}" defer></script>`));
    },
    async "verified submission"() {
      const test = contactFixture(script, locale, "verified-token");
      test.startVerification();
      await test.submit();
      assert.deepEqual(test.requests, [
        {
          name: "Test user",
          email: "user@example.invalid",
          message: "[Bug report] A fixture message",
          locale,
          company_website: "",
          turnstileToken: "verified-token",
        },
      ]);
      assert.equal(test.confirmation.hidden, false);
      assert.equal(test.confirmation.focused, true);
      assert.match(test.elements.get("done-reference").textContent, /CT-TEST$/);
    },
    async "verification timeout"() {
      const test = contactFixture(script, locale, "");
      test.startVerification();
      await test.submit();
      assert.equal(test.time(), 10000);
      assert.equal(test.requests.length, 0);
      assert.equal(test.fallback.hidden, false);
      assert.equal(test.message.value, "A fixture message");
    },
    async "verification script failure"() {
      const test = contactFixture(script, locale, "");
      test.blockVerification();
      await test.submit();
      assert.equal(test.requests.length, 0);
      assert.equal(test.fallback.hidden, false);
      assert.equal(test.message.value, "A fixture message");
    },
  };

  for (const [name, check] of Object.entries(cases)) {
    try {
      await check();
    } catch (error) {
      failures.push(`contact ${locale} ${name}: ${error.message}`);
    }
  }
  return failures;
}
