/* One quiet entrance; no scroll effects or perpetual motion. */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    if (!window.gsap) return;

    var mm = window.gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", function () {
      window.gsap.from(
        [".hero-badge", ".hero h1", ".hero-lead", ".cta-row", ".hero-object"],
        {
          autoAlpha: 0,
          y: 16,
          duration: 0.55,
          stagger: 0.06,
          ease: "power2.out",
          clearProps: "transform,opacity,visibility"
        }
      );
    });
  });
})();
