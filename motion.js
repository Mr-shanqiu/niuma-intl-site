/* Light enhancement layer.
 *
 * Two independent jobs:
 *  1. The feature showcase tabs. This works with plain DOM APIs, so switching
 *     still works if GSAP fails to load. Without JavaScript at all the panel
 *     CSS keeps every panel visible, so no feature content is lost.
 *  2. The hero entrance. The HTML is visible by default; GSAP only adds a
 *     restrained entrance. If GSAP is missing or errors, nothing is hidden.
 */
(function () {
  "use strict";

  function initFeatureShowcase(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('[role="tabpanel"]'));
    if (!tabs.length || tabs.length !== panels.length) return;

    var current = 0;
    for (var i = 0; i < panels.length; i++) {
      if (panels[i].classList.contains("is-active")) { current = i; break; }
    }

    // Turning on the ready class collapses the no-JS stacked list down to one
    // panel. It is added only here, so a JS failure never hides the content.
    root.classList.add("is-ready");

    function show(index, focusTab) {
      current = (index + panels.length) % panels.length;
      panels.forEach(function (panel, position) {
        var active = position === current;
        panel.classList.toggle("is-active", active);
        panel.setAttribute("aria-hidden", active ? "false" : "true");
      });
      tabs.forEach(function (tab, position) {
        var active = position === current;
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.tabIndex = active ? 0 : -1;
        if (active && focusTab) tab.focus();
      });
    }

    show(current, false);

    tabs.forEach(function (tab, position) {
      tab.addEventListener("click", function () { show(position, false); });
      tab.addEventListener("keydown", function (event) {
        var key = event.key;
        if (key === "ArrowRight" || key === "ArrowDown") {
          event.preventDefault(); show(current + 1, true);
        } else if (key === "ArrowLeft" || key === "ArrowUp") {
          event.preventDefault(); show(current - 1, true);
        } else if (key === "Home") {
          event.preventDefault(); show(0, true);
        } else if (key === "End") {
          event.preventDefault(); show(panels.length - 1, true);
        }
      });
    });

    root.querySelectorAll("[data-feature-dir]").forEach(function (button) {
      button.addEventListener("click", function () {
        show(current + (button.getAttribute("data-feature-dir") === "next" ? 1 : -1), false);
      });
    });
  }

  function initHeroMotion() {
    var number = document.getElementById("meritNum");
    var poke = document.getElementById("meritPoke");
    var current = 0;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function increment() {
      if (!number) return;
      current += Math.floor(Math.random() * 3) + 1;
      number.textContent = current;
      if (window.gsap && !reduce) {
        window.gsap.fromTo(number, { y: 6, autoAlpha: .4 }, { y: 0, autoAlpha: 1, duration: .28, ease: "power2.out" });
      }
    }
    if (poke) poke.addEventListener("click", increment);

    if (!window.gsap) return;

    try {
      var mm = window.gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", function () {
        // fromTo on already-visible content: a failure mid-animation leaves the
        // content on screen rather than starting from a hidden state.
        window.gsap.fromTo(".anim",
          { autoAlpha: 0, y: 22 },
          { autoAlpha: 1, y: 0, duration: .7, ease: "power3.out", stagger: .09, clearProps: "transform,opacity,visibility" });
        window.gsap.to("#fishWrap", { y: -10, duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true });
        var timer = window.setInterval(increment, 1400);
        return function () { window.clearInterval(timer); };
      });
    } catch (error) {
      // Never let a broken motion layer leave the hero hidden.
      window.gsap.set(".anim", { clearProps: "all" });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      Array.prototype.forEach.call(document.querySelectorAll("[data-feature-showcase]"), initFeatureShowcase);
    } catch (error) { /* tabs stay as the readable no-JS list */ }
    try {
      initHeroMotion();
    } catch (error) { /* hero stays visible */ }
  });
})();
