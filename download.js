/* Recommend the matching installer without hiding the other platform. */
(function () {
  function detectPlatform() {
    var platform = "";
    try {
      platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    } catch (e) {}
    var signature = (platform + " " + (navigator.userAgent || "")).toLowerCase();
    if (signature.indexOf("win") !== -1) return "windows";
    if (signature.indexOf("mac") !== -1) return "macos";
    return null;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var detected = detectPlatform();
    document.querySelectorAll("[data-platform]").forEach(function (card) {
      var platform = card.getAttribute("data-platform");
      var recommended = platform === detected;
      card.setAttribute("data-recommended", recommended ? "true" : "false");

      var status = card.querySelector("[data-platform-status]");
      if (status) {
        var key = recommended ? "download.detected" : "download." + platform + "Req";
        var lang = document.documentElement.lang || "en";
        var dict = window.CCM_I18N || {};
        status.setAttribute("data-i18n", key);
        status.textContent = (dict[lang] && dict[lang][key]) || (dict.en && dict.en[key]) || status.textContent;
      }

      var button = card.querySelector("[data-download-link]");
      if (button) {
        button.classList.toggle("button-primary", recommended || !detected);
        button.classList.toggle("button-secondary", !recommended && !!detected);
      }
    });

    document.querySelectorAll("[data-download-link][aria-disabled='true']").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
      });
    });
  });
})();
