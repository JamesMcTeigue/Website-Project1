// === Your existing code (kept) ===
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('myButton');
  if (btn) {
    btn.addEventListener('click', () => {
      alert('Button clicked!');
    });
  }
});

// === Orb + Brick Texture + Mouse-Reactive Animation (friendly CSS vars) ===
(function () {
  const root = document.documentElement;

  // Respect reduced motion & pause when hidden
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let rafId = null;
  let hidden = false;
  let last = performance.now(); // initialized before handlers

  function start() {
    if (!rafId) {
      last = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  }
  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    if (hidden) stop(); else start();
  });

  // ===== Mouse tracking (for glow + steering) =====
  let mouseX = 50, mouseY = 50; // percent of viewport
  let mouseIntensity = 0;       // 0..1 (decays when idle)

  function setMouseFromEvent(e) {
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const x = (e.clientX / vw) * 100;
    const y = (e.clientY / vh) * 100;
    mouseX = Math.max(0, Math.min(100, x));
    mouseY = Math.max(0, Math.min(100, y));

    // Peak brightness on movement, decays in tick
    mouseIntensity = 1;

    root.style.setProperty('--mouse-x', mouseX.toFixed(2) + '%');
    root.style.setProperty('--mouse-y', mouseY.toFixed(2) + '%');
  }

  window.addEventListener('mousemove', setMouseFromEvent, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) setMouseFromEvent(e.touches[0]);
  }, { passive: true });

  // ===== Orbs (steered by mouse) =====
  const orbs = [
    { h: rand(0, 360), x: 20, y: 30 },
    { h: rand(0, 360), x: 80, y: 70 },
    { h: rand(0, 360), x: 50, y: 50 }
  ];
  function newOrbTargets() {
    orbs.forEach((o) => {
      o.ht = rand(0, 360);        // new hue
      o.xt = rand(10, 90);        // new X%
      o.yt = rand(10, 90);        // new Y%
    });
  }
  newOrbTargets();
  setInterval(newOrbTargets, 10000);

  // ===== Brick system (animated texture) =====
  const env = {
    // Brick color (HSL core)
    bh: 12,  bht: 12,  // hue (deg)
    bs: 55,            // saturation (%)
    bl: 36,            // lightness (%)

    // Mortar: cooler, desaturated, lighter
    mh: 28, mht: 28,   // hue (deg)
    ms: 12,
    ml: 74,

    // Tint gradient angle & color bias
    angle: 180, anglet: 180,

    // Texture strengths
    noise: 0.14,  noiset: 0.14,   // 0–0.4
    speck: 0.16,  speckt: 0.16,   // 0–0.4
  };

  function newEnvTargets() {
    // Gentle palette wandering
    env.bht = wrapDeg(env.bh + rand(-25, 25));
    env.mht = wrapDeg(env.bht + rand(10, 40));
    env.anglet = clamp(140, 220, env.angle + rand(-30, 30));
    env.noiset = clamp(0.10, 0.22, env.noise + rand(-0.04, 0.04));
    env.speckt = clamp(0.12, 0.22, env.speck + rand(-0.03, 0.03));
  }
  newEnvTargets();
  setInterval(newEnvTargets, 14000);

  // Easing coefficients
  const orbColorEase = reduced ? 0.004 : 0.010;
  const orbPosEase   = reduced ? 0.006 : 0.015;
  const envEase      = reduced ? 0.003 : 0.008;

  function tick(now) {
    if (hidden) return;
    const dt = Math.min(1000 / 60, now - last);
    last = now;

    // Decay mouse intensity smoothly
    const decay = reduced ? 0.985 : 0.97;
    mouseIntensity = Math.max(0, mouseIntensity * decay);
    root.style.setProperty('--mouse-brightness-amount', mouseIntensity.toFixed(3));

    // --- Orbs ---
    const mouseFactor = (reduced ? 0.15 : 0.35) * mouseIntensity; // steer strength
    orbs.forEach((o, i) => {
      o.h = easeAngle(o.h, o.ht, orbColorEase);

      // Blend target toward mouse position
      const xtEff = (1 - mouseFactor) * o.xt + mouseFactor * mouseX;
      const ytEff = (1 - mouseFactor) * o.yt + mouseFactor * mouseY;

      o.x += (xtEff - o.x) * orbPosEase;
      o.y += (ytEff - o.y) * orbPosEase;

      root.style.setProperty(`--orb${i + 1}-hue`, o.h.toFixed(1));
      root.style.setProperty(`--orb${i + 1}-pos-x`, `${o.x}%`);
      root.style.setProperty(`--orb${i + 1}-pos-y`, `${o.y}%`);
    });

    // --- Brick environment (colors + texture) ---
    env.bh = easeAngle(env.bh, env.bht, envEase);
    env.mh = easeAngle(env.mh, env.mht, envEase);
    env.angle += (env.anglet - env.angle) * envEase;
    env.noise += (env.noiset - env.noise) * envEase;
    env.speck += (env.speckt - env.speck) * envEase;

    // Derive darker brick for bevel/shading
    const brick = hsl(env.bh, env.bs, env.bl);
    const brickDk = hsl(env.bh, env.bs * 0.9, env.bl * 0.72);

    // Mortar stays light & desaturated
    const mortar = hsl(env.mh, env.ms, env.ml);

    // Tint follows brick hue but darker + alpha; increase slightly with mouseIntensity
    const tintHue = env.bh;
    const extra = 0.10 * mouseIntensity; // global brightness kick
    const tintFrom = hsla(tintHue, 25, 18 + 5 * mouseIntensity, clamp(0,1,0.35 + extra));
    const tintTo   = hsla(tintHue, 25, 18 + 5 * mouseIntensity, clamp(0,1,0.10 + extra * 0.5));

    // Push to FRIENDLY CSS variables
    root.style.setProperty('--color-brick-base', brick);
    root.style.setProperty('--color-brick-shade', brickDk);
    root.style.setProperty('--color-mortar', mortar);

    root.style.setProperty('--tint-color-top', tintFrom);
    root.style.setProperty('--tint-color-bottom', tintTo);
    root.style.setProperty('--tint-angle-deg', env.angle.toFixed(1) + 'deg');

    root.style.setProperty('--texture-noise-strength', env.noise.toFixed(3));
    root.style.setProperty('--texture-speckle-amount', env.speck.toFixed(3));

    rafId = requestAnimationFrame(tick);
  }

  // Utilities
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); }
  function wrapDeg(d) { return ((d % 360) + 360) % 360; }
  function angleDelta(a, b) { let d = wrapDeg(b) - wrapDeg(a); if (d > 180) d -= 360; if (d < -180) d += 360; return d; }
  function easeAngle(current, target, ease) { return wrapDeg(current + angleDelta(current, target) * ease); }
  function hsl(h, s, l) { return `hsl(${wrapDeg(h).toFixed(1)} ${clamp(0,100,s).toFixed(1)}% ${clamp(0,100,l).toFixed(1)}%)`; }
  function hsla(h, s, l, a) { return `hsla(${wrapDeg(h).toFixed(1)}, ${clamp(0,100,s).toFixed(1)}%, ${clamp(0,100,l).toFixed(1)}%, ${clamp(0,1,a).toFixed(2)})`; }

  // Start
  start();
})();
