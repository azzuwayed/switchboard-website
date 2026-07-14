// Dismissible top banner for the currently featured Hub promotion. It is only
// rendered when Hub reports an active offer for Switchboard.
(function () {
  "use strict";

  var PROMO_ENDPOINT =
    "https://azzuwayed.com/api/v1/apps/switchboard/featured-promo";
  var isAr =
    (document.documentElement.lang || "").toLowerCase().indexOf("ar") === 0;
  var productUrl = isAr
    ? "https://azzuwayed.com/ar/products/switchboard"
    : "https://azzuwayed.com/en/products/switchboard";
  var STR = isAr
    ? {
        use: "استخدم الكود",
        copy: "نسخ",
        copied: "تم النسخ",
        useIt: "استخدمه",
        dismiss: "إغلاق",
        off: function (value, currency) {
          return "خصم " + value + " " + currency;
        },
        pct: function (value) {
          return "خصم " + value + "%";
        },
        free: "مجاناً",
      }
    : {
        use: "use code",
        copy: "Copy",
        copied: "Copied",
        useIt: "Use it",
        dismiss: "Dismiss",
        off: function (value, currency) {
          return value + " " + currency + " off";
        },
        pct: function (value) {
          return value + "% off";
        },
        free: "free",
      };

  function discountText(promo) {
    if (promo.discountType === "free") return STR.free;
    if (promo.discountType === "percent") return STR.pct(promo.discountValue);
    return STR.off(promo.discountValue, promo.currency || "SAR");
  }

  function dismissed(code) {
    try {
      return sessionStorage.getItem("sb-promo-dismissed") === code;
    } catch {
      return false;
    }
  }

  function render(promo) {
    if (!promo || !promo.code || dismissed(promo.code)) return;

    var strip = document.createElement("div");
    strip.className = "promo-strip";
    strip.setAttribute("role", "region");
    strip.setAttribute("aria-label", isAr ? "عرض ترويجي" : "Promotion");

    var label = (isAr ? promo.labelAr || promo.label : promo.label) || "";
    var message = document.createElement("span");
    message.textContent =
      (label ? label + " — " : "") +
      discountText(promo) +
      " · " +
      STR.use +
      " ";

    var code = document.createElement("button");
    code.type = "button";
    code.className = "promo-code";
    code.textContent = promo.code;
    code.title = STR.copy;
    code.addEventListener("click", function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(promo.code).then(function () {
        var previous = code.textContent;
        code.textContent = STR.copied;
        setTimeout(function () {
          code.textContent = previous;
        }, 1400);
      });
    });
    message.appendChild(code);

    var link = document.createElement("a");
    link.href = productUrl + "?promo=" + encodeURIComponent(promo.code);
    link.textContent = STR.useIt;

    var close = document.createElement("button");
    close.type = "button";
    close.className = "promo-dismiss";
    close.setAttribute("aria-label", STR.dismiss);
    close.textContent = "×";
    close.addEventListener("click", function () {
      try {
        sessionStorage.setItem("sb-promo-dismissed", promo.code);
      } catch {}
      strip.remove();
    });

    strip.appendChild(message);
    strip.appendChild(link);
    strip.appendChild(close);
    document.body.insertBefore(strip, document.body.firstChild);
  }

  fetch(PROMO_ENDPOINT)
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .then(function (response) {
      render(response && response.promo);
    })
    .catch(function () {
      // The page remains unchanged when Hub is unavailable or has no offer.
    });
})();
