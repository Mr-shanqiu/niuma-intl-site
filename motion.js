/* Approved hero motion: one entrance, a quiet float, and an optional counter. */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var number = document.getElementById("meritNum");
    var poke = document.getElementById("meritPoke");
    var current = 0;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    var mm = window.gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", function () {
      window.gsap.from(".anim", {
        autoAlpha: 0,
        y: 22,
        duration: .7,
        ease: "power3.out",
        stagger: .09,
        clearProps: "transform,opacity,visibility"
      });
      window.gsap.to("#fishWrap", { y: -10, duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true });
      var timer = window.setInterval(increment, 1400);
      return function () { window.clearInterval(timer); };
    });
  });
})();
