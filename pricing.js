// Single source of truth for the displayed price. The license worker
// (LICENSE_API/api/checkout/pricing) owns the SAR base price and the featured
// promo; the USD figure is DERIVED from a live SAR->USD rate so no price is ever
// hardcoded on the site. Elements opt in by data attribute:
//   data-sb-price="sar"  -> "146.25 SAR" (or "146.25 ريالاً" on /ar/ pages)
//   data-sb-price="usd"  -> "$39" (worker SAR * live rate, rounded)
//   data-sb-promo-badge  -> in-card featured-promo badge (optional, one per page)
// The site-wide top banner is handled separately by promo-banner.js. In-markup
// values are a no-JS fallback (the current regular price); JS owns the live value.
// Include with <script src="pricing.js" defer> (use "../pricing.js" from /ar/).
(function () {
  "use strict";
  var LICENSE_API = "https://switchboard-licenses.azzuwayed.workers.dev";
  var FX_API = "https://open.er-api.com/v6/latest/SAR";
  var SAR_PER_USD = 3.75; // SAR is pegged to USD; offline/failure fallback rate.
  var FX_CACHE_KEY = "sb-sar-usd-rate";
  var FX_TTL_MS = 12 * 60 * 60 * 1000; // 12h
  var isAr =
    (document.documentElement.lang || "").toLowerCase().indexOf("ar") === 0;

  function fmtSar(sar) {
    var n = Math.round(sar * 100) / 100;
    return isAr ? n + " ريالاً" : n + " SAR";
  }
  function fmtUsd(sar, rate) {
    return "$" + Math.round(sar * rate);
  }

  function cachedRate() {
    try {
      var raw = JSON.parse(localStorage.getItem(FX_CACHE_KEY) || "null");
      if (
        raw &&
        typeof raw.rate === "number" &&
        Date.now() - raw.at < FX_TTL_MS
      ) {
        return raw.rate;
      }
    } catch (e) {}
    return null;
  }
  function storeRate(rate) {
    try {
      localStorage.setItem(
        FX_CACHE_KEY,
        JSON.stringify({ rate: rate, at: Date.now() }),
      );
    } catch (e) {}
  }

  // SAR->USD rate: cached -> live FX -> pegged fallback. Never throws.
  function resolveRate() {
    var cached = cachedRate();
    if (cached) return Promise.resolve(cached);
    return fetch(FX_API)
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        var rate = d && d.result === "success" && d.rates && d.rates.USD;
        if (typeof rate === "number" && rate > 0) {
          storeRate(rate);
          return rate;
        }
        return 1 / SAR_PER_USD;
      })
      .catch(function () {
        return 1 / SAR_PER_USD;
      });
  }

  function setText(selector, text) {
    var els = document.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) els[i].textContent = text;
  }

  function renderPromoBadge(featured, currency) {
    var badge = document.querySelector("[data-sb-promo-badge]");
    if (!badge || !featured || !featured.code) return;
    var cur = currency || "SAR";
    var off =
      featured.discountType === "free"
        ? isAr
          ? "مجاناً"
          : "free"
        : featured.discountType === "percent"
          ? isAr
            ? "خصم " + featured.discountValue + "%"
            : featured.discountValue + "% off"
          : isAr
            ? "خصم " + featured.discountValue + " " + cur
            : featured.discountValue + " " + cur + " off";
    var label =
      (isAr ? featured.labelAr || featured.label : featured.label) ||
      (isAr ? "عرض" : "Offer");
    badge.textContent =
      label + " · " + off + " · " + (isAr ? "الكود " : "code ") + featured.code;
    badge.hidden = false;
  }

  Promise.all([
    fetch(LICENSE_API + "/api/checkout/pricing").then(function (r) {
      return r.json();
    }),
    resolveRate(),
  ])
    .then(function (res) {
      var p = res[0] || {};
      var rate = res[1];
      var base = typeof p.basePrice === "number" ? p.basePrice : p.amount;
      if (typeof base !== "number") return;
      setText('[data-sb-price="sar"]', fmtSar(base));
      setText('[data-sb-price="usd"]', fmtUsd(base, rate));
      renderPromoBadge(p.featured, p.currency);
    })
    .catch(function () {
      // Leave the in-markup fallback values if pricing or FX can't load.
    });

  // Purchasing-paused switch for the buy button (gateway watchdog). Mirrors what
  // used to live inline on the pricing page; a no-op on pages without a buy CTA.
  (function checkAvailability() {
    var cta = document.getElementById("buy-cta");
    if (!cta) return;
    fetch(LICENSE_API + "/api/checkout/availability")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data || data.enabled !== false) return;
        var note = document.getElementById("purchase-paused");
        if (note) {
          note.textContent =
            data.message ||
            (isAr
              ? "الشراء متوقف مؤقتاً — حاول لاحقاً."
              : "Purchasing is temporarily paused — please check back soon.");
          note.hidden = false;
        }
        cta.textContent = isAr ? "الشراء متوقف" : "Purchasing paused";
        cta.setAttribute("aria-disabled", "true");
        cta.setAttribute("tabindex", "-1");
        cta.removeAttribute("href");
        cta.style.pointerEvents = "none";
        cta.style.opacity = "0.6";
      })
      .catch(function () {
        // Leave the page as-is; checkout still guards server-side.
      });
  })();
})();
