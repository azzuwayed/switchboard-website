// Dismissible top banner advertising the currently featured promo code. Reads the
// featured promo from the license worker's pricing endpoint (the single source of
// truth) and injects a strip at the top of <body>. No featured promo → nothing is
// shown. Buyers copy the code and apply it at checkout (or ignore it and pay full
// price). Include with: <script src="promo-banner.js" defer></script> (use
// "../promo-banner.js" from the /ar/ pages).
(function () {
  "use strict";
  var LICENSE_API = "https://switchboard-licenses.azzuwayed.workers.dev";
  var isAr =
    (document.documentElement.lang || "").toLowerCase().indexOf("ar") === 0;

  var STR = isAr
    ? {
        use: "استخدم الكود",
        copy: "نسخ",
        copied: "تم النسخ",
        useIt: "استخدمه",
        dismiss: "إغلاق",
        off: function (v, c) {
          return "خصم " + v + " " + c;
        },
        pct: function (v) {
          return "خصم " + v + "%";
        },
        free: "مجاناً",
      }
    : {
        use: "use code",
        copy: "Copy",
        copied: "Copied",
        useIt: "Use it",
        dismiss: "Dismiss",
        off: function (v, c) {
          return v + " " + c + " off";
        },
        pct: function (v) {
          return v + "% off";
        },
        free: "free",
      };

  function discountText(f) {
    if (f.discountType === "free") return STR.free;
    if (f.discountType === "percent") return STR.pct(f.discountValue);
    return STR.off(f.discountValue, f.currency || "SAR");
  }

  function dismissed(code) {
    try {
      return sessionStorage.getItem("sb-promo-dismissed") === code;
    } catch (e) {
      return false;
    }
  }

  function render(f, currency) {
    f.currency = f.currency || currency || "SAR";
    if (!f.code || dismissed(f.code)) return;

    var strip = document.createElement("div");
    strip.className = "promo-strip";
    strip.setAttribute("role", "region");
    strip.setAttribute("aria-label", isAr ? "عرض ترويجي" : "Promotion");

    var label = (isAr ? f.labelAr || f.label : f.label) || "";
    var msg = document.createElement("span");
    msg.textContent =
      (label ? label + " — " : "") + discountText(f) + " · " + STR.use + " ";

    var codeBtn = document.createElement("button");
    codeBtn.type = "button";
    codeBtn.className = "promo-code";
    codeBtn.textContent = f.code;
    codeBtn.title = STR.copy;
    codeBtn.addEventListener("click", function () {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(f.code).then(function () {
          var prev = codeBtn.textContent;
          codeBtn.textContent = STR.copied;
          setTimeout(function () {
            codeBtn.textContent = prev;
          }, 1400);
        });
      }
    });
    msg.appendChild(codeBtn);

    // Link to checkout with the code prefilled. Relative path resolves correctly
    // from both root pages and /ar/ pages.
    var link = document.createElement("a");
    link.href = "checkout.html?code=" + encodeURIComponent(f.code);
    link.textContent = STR.useIt;

    var dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "promo-dismiss";
    dismiss.setAttribute("aria-label", STR.dismiss);
    dismiss.textContent = "×";
    dismiss.addEventListener("click", function () {
      try {
        sessionStorage.setItem("sb-promo-dismissed", f.code);
      } catch (e) {}
      strip.remove();
    });

    strip.appendChild(msg);
    strip.appendChild(link);
    strip.appendChild(dismiss);
    document.body.insertBefore(strip, document.body.firstChild);
  }

  fetch(LICENSE_API + "/api/checkout/pricing")
    .then(function (r) {
      return r.json();
    })
    .then(function (p) {
      if (p && p.featured && p.featured.code) render(p.featured, p.currency);
    })
    .catch(function () {
      /* no banner if pricing can't load */
    });
})();
