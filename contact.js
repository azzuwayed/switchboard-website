(() => {
  const contactUrl = "https://azzuwayed.com/api/v1/contact";
  const turnstileSiteKey = "0x4AAAAAAD56o6T3o4lvLj3N";
  const locale = document.documentElement.lang === "ar" ? "ar" : "en";
  const copy =
    locale === "ar"
      ? {
          incomplete: "أضف اسمك وبريدك الإلكتروني ورسالة قصيرة.",
          verificationFailed:
            "تعذّر التحقق من طلبك. حاول مرة أخرى أو استخدم أحد خيارات الدعم أدناه.",
          send: "أرسل",
          sending: "جارٍ الإرسال…",
          requestFailed:
            "تعذّر إرسال الرسالة. حاول مرة أخرى أو استخدم أحد خيارات الدعم أدناه.",
          reference: "المرجع",
        }
      : {
          incomplete: "Please add your name, email, and a short message.",
          verificationFailed:
            "We couldn't verify your request. Try again or use one of the support options below.",
          send: "Send message",
          sending: "Sending…",
          requestFailed:
            "We couldn't send your message. Try again or use one of the support options below.",
          reference: "Reference",
        };

  const form = document.getElementById("contact-form");
  const fields = document.getElementById("contact-fields");
  const fallback = document.getElementById("contact-fallback");
  const button = document.getElementById("contact-btn");
  const buttonLabel = document.getElementById("contact-btn-label");
  const error = document.getElementById("error");
  const doneSection = document.getElementById("done-section");
  const doneReference = document.getElementById("done-reference");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const categoryInput = document.getElementById("category");
  const messageInput = document.getElementById("message");
  const companyWebsite = document.getElementById("company_website");
  const verificationSlot = document.getElementById("turnstile-slot");

  let turnstileWidgetId = null;
  let verificationUnavailable = false;

  function showFallback(message) {
    error.textContent = message;
    fallback.hidden = false;
  }

  function markVerificationUnavailable() {
    verificationUnavailable = true;
    button.disabled = true;
    showFallback(copy.verificationFailed);
  }

  function waitForVerification() {
    return new Promise((resolve) => {
      const deadline = Date.now() + 10000;

      function poll() {
        if (verificationUnavailable) {
          resolve("");
          return;
        }
        try {
          const token =
            turnstileWidgetId === null
              ? ""
              : window.turnstile.getResponse(turnstileWidgetId);
          if (token || Date.now() >= deadline) {
            resolve(token || "");
          } else {
            setTimeout(poll, 250);
          }
        } catch {
          markVerificationUnavailable();
          resolve("");
        }
      }

      poll();
    });
  }

  function resetVerification() {
    if (turnstileWidgetId === null) return;
    try {
      window.turnstile.reset(turnstileWidgetId);
    } catch {
      markVerificationUnavailable();
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (button.disabled) return;
    error.textContent = "";

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const topic = categoryInput.value;
    const message = messageInput.value.trim();
    const honeypot = companyWebsite.value;
    if (!name || !emailInput.validity.valid || message.length < 10) {
      error.textContent = copy.incomplete;
      return;
    }

    button.disabled = true;
    buttonLabel.textContent = copy.sending;
    try {
      const turnstileToken = await waitForVerification();
      if (!turnstileToken) {
        showFallback(copy.verificationFailed);
        return;
      }

      const response = await fetch(contactUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message: `[${topic}] ${message}`,
          locale,
          company_website: honeypot,
          turnstileToken,
        }),
      });
      const data = await response.json().catch(() => ({}));
      const reference =
        typeof data?.reference === "string" ? data.reference.trim() : "";
      if (response.status === 201 && data?.status === "sent" && reference) {
        doneReference.textContent = `${copy.reference}: ${reference}`;
        form.hidden = true;
        fallback.hidden = true;
        doneSection.hidden = false;
        doneSection.focus();
        return;
      }

      showFallback(
        response.status === 403 && data?.error === "bot_verification_failed"
          ? copy.verificationFailed
          : copy.requestFailed,
      );
      resetVerification();
    } catch {
      showFallback(copy.requestFailed);
      resetVerification();
    } finally {
      button.disabled = verificationUnavailable;
      buttonLabel.textContent = copy.send;
    }
  });

  // Keep the static form hidden and disabled until submit can be intercepted.
  fields.disabled = false;
  form.hidden = false;
  fallback.hidden = true;

  window.__renderTurnstile = () => {
    try {
      turnstileWidgetId = window.turnstile.render(verificationSlot, {
        sitekey: turnstileSiteKey,
        action: "contact_app",
        language: locale,
        appearance: "interaction-only",
      });
    } catch {
      markVerificationUnavailable();
    }
  };

  const script = document.createElement("script");
  script.src =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__renderTurnstile&render=explicit";
  script.async = true;
  script.addEventListener("error", markVerificationUnavailable);
  document.head.appendChild(script);
})();
