
// === Keep your existing button example ===
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('myButton');
  if (btn) {
    btn.addEventListener('click', () => {
      alert('Button clicked!');
    });
  }
});

// === Orb + Brick Environment Animator ===
(function () {
  const root = document.documentElement;
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let rafId = null;
  let hidden = false;
  let last = performance.now();

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

  // Mouse tracking
  let mouseX = 50, mouseY = 50;
  let mouseIntensity = 0;
  function setMouseFromEvent(e) {
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const x = (e.clientX / vw) * 100;
    const y = (e.clientY / vh) * 100;
    mouseX = Math.max(0, Math.min(100, x));
    mouseY = Math.max(0, Math.min(100, y));
    mouseIntensity = 1;
    root.style.setProperty('--mouse-x', mouseX.toFixed(2) + '%');
    root.style.setProperty('--mouse-y', mouseY.toFixed(2) + '%');
  }
  window.addEventListener('mousemove', setMouseFromEvent, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) setMouseFromEvent(e.touches[0]);
  }, { passive: true });

  const orbs = [
    { h: rand(0, 360), x: 20, y: 30 },
    { h: rand(0, 360), x: 80, y: 70 },
    { h: rand(0, 360), x: 50, y: 50 }
  ];
  function newOrbTargets() {
    orbs.forEach((o) => {
      o.ht = rand(0, 360);
      o.xt = rand(10, 90);
      o.yt = rand(10, 90);
    });
  }
  newOrbTargets();
  setInterval(newOrbTargets, 10000);

  const env = {
    bh: 12, bht: 12,
    bs: 55,
    bl: 36,
    mh: 28, mht: 28,
    ms: 12,
    ml: 74,
    angle: 180, anglet: 180,
    noise: 0.14, noiset: 0.14,
    speck: 0.16, speckt: 0.16,
  };
  function newEnvTargets() {
    env.bht = wrapDeg(env.bh + rand(-25, 25));
    env.mht = wrapDeg(env.bht + rand(10, 40));
    env.anglet = clamp(140, 220, env.angle + rand(-30, 30));
    env.noiset = clamp(0.10, 0.22, env.noise + rand(-0.04, 0.04));
    env.speckt = clamp(0.12, 0.22, env.speck + rand(-0.03, 0.03));
  }
  newEnvTargets();
  setInterval(newEnvTargets, 14000);

  const orbColorEase = reduced ? 0.004 : 0.010;
  const orbPosEase = reduced ? 0.006 : 0.015;
  const envEase = reduced ? 0.003 : 0.008;

  function tick(now) {
    if (hidden) return;
    const dt = Math.min(1000 / 60, now - last);
    last = now;

    const decay = reduced ? 0.985 : 0.97;
    mouseIntensity = Math.max(0, mouseIntensity * decay);
    root.style.setProperty('--mouse-brightness-amount', mouseIntensity.toFixed(3));

    const mouseFactor = (reduced ? 0.15 : 0.35) * mouseIntensity;
    orbs.forEach((o, i) => {
      o.h = easeAngle(o.h, o.ht, orbColorEase);
      const xtEff = (1 - mouseFactor) * o.xt + mouseFactor * mouseX;
      const ytEff = (1 - mouseFactor) * o.yt + mouseFactor * mouseY;
      o.x += (xtEff - o.x) * orbPosEase;
      o.y += (ytEff - o.y) * orbPosEase;
      root.style.setProperty(`--orb${i + 1}-hue`, o.h.toFixed(1));
      root.style.setProperty(`--orb${i + 1}-pos-x`, `${o.x}%`);
      root.style.setProperty(`--orb${i + 1}-pos-y`, `${o.y}%`);
    });

    env.bh = easeAngle(env.bh, env.bht, envEase);
    env.mh = easeAngle(env.mh, env.mht, envEase);
    env.angle += (env.anglet - env.angle) * envEase;
    env.noise += (env.noiset - env.noise) * envEase;
    env.speck += (env.speckt - env.speck) * envEase;

    const brick = hsl(env.bh, env.bs, env.bl);
    const brickDk = hsl(env.bh, env.bs * 0.9, env.bl * 0.72);
    const mortar = hsl(env.mh, env.ms, env.ml);

    const tintHue = env.bh;
    const extra = 0.10 * mouseIntensity;
    const tintFrom = hsla(tintHue, 25, 18 + 5 * mouseIntensity, clamp(0,1,0.35 + extra));
    const tintTo = hsla(tintHue, 25, 18 + 5 * mouseIntensity, clamp(0,1,0.10 + extra * 0.5));

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

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); }
  function wrapDeg(d) { return ((d % 360) + 360) % 360; }
  function angleDelta(a, b) { let d = wrapDeg(b) - wrapDeg(a); if (d > 180) d -= 360; if (d < -180) d += 360; return d; }
  function easeAngle(current, target, ease) { return wrapDeg(current + angleDelta(current, target) * ease); }
  function hsl(h, s, l) { return `hsl(${wrapDeg(h).toFixed(1)} ${clamp(0,100,s).toFixed(1)}% ${clamp(0,100,l).toFixed(1)}%)`; }
  function hsla(h, s, l, a) { return `hsla(${wrapDeg(h).toFixed(1)}, ${clamp(0,100,s).toFixed(1)}%, ${clamp(0,100,l).toFixed(1)}%, ${clamp(0,1,a).toFixed(2)})`; }

  start();
})();

// === Draggable + Gravity for NAV ===
(function () {
  // Prefer #draggableNav; fallback to the first <nav>
  const el = document.getElementById('draggableNav') || document.querySelector('nav');
  if (!el) return;

  // State
  let dragging = false;
  let isFalling = false;

  let startMouseX = 0, startMouseY = 0;
  let startLeft = 0, startTop = 0;
  let originalLeft = null, originalTop = null;

  let fallStart = 0;
  let velocity = 0;              // px/ms
  const gravity = 0.003;         // px/ms^2
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function px(n) { return `${n}px`; }
  function num(v) { return parseFloat(String(v).replace('px','')) || 0; }

  function normalizePositioning() {
    const cs = getComputedStyle(el);
    if (cs.position !== 'absolute') el.style.position = 'absolute';

    const rect = el.getBoundingClientRect();
    const docLeft = scrollX + rect.left;
    const docTop  = scrollY + rect.top;

    if (cs.left === 'auto') el.style.left = px(docLeft);
    if (cs.top  === 'auto') el.style.top  = px(docTop);

    if (originalLeft == null || originalTop == null) {
      originalLeft = num(el.style.left);
      originalTop  = num(el.style.top);
    }
  }

  function viewportBottom() {
    return scrollY + document.documentElement.clientHeight;
  }

  function elementBox() {
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height, l: scrollX + r.left, t: scrollY + r.top };
  }

  function onDown(e) {
    if (isFalling) return;

    const point = 'touches' in e ? e.touches[0] : e;
    if (!point) return;

    normalizePositioning();

    dragging = true;
    el.classList.add('dragging');
    document.body.style.userSelect = 'none';

    startMouseX = point.clientX;
    startMouseY = point.clientY;
    startLeft = num(el.style.left);
    startTop  = num(el.style.top);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp, { passive: true });
  }

  function onMove(e) {
    if (!dragging || isFalling) return;

    const point = 'touches' in e ? e.touches[0] : e;
    if (!point) return;

    if ('touches' in e) e.preventDefault(); // prevent page scroll while dragging

    const dx = point.clientX - startMouseX;
    const dy = point.clientY - startMouseY;

    el.style.left = px(startLeft + dx);
    el.style.top  = px(startTop  + dy);
  }

  function onUp() {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('dragging');
    document.body.style.userSelect = '';

    startFall();
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onUp);
  }

  function startFall() {
    if (isFalling) return;
    isFalling = true;
    velocity = 0;
    fallStart = performance.now();
    if (reduced) {
      // With reduced motion, just snap back gently
      el.style.left = px(originalLeft);
      el.style.top  = px(originalTop);
      isFalling = false;
      return;
    }
    requestAnimationFrame(step);
  }

  function step(now) {
    if (!isFalling) return;

    const dt = Math.min(1000/60, now - fallStart);
    fallStart = now;

    const currentTop = num(el.style.top);
    const { h } = elementBox();
    const limitTop = viewportBottom() - h;

    velocity += gravity * dt;          // v = v0 + a*dt
    let nextTop = currentTop + velocity * dt; // s = s0 + v*dt

    if (nextTop >= limitTop) {
      el.style.top = px(limitTop);
      bounceAndReset();
    } else {
      el.style.top = px(nextTop);
      requestAnimationFrame(step);
    }
  }

  function bounceAndReset() {
    const bounce = 14;  // px
    const t = 140;      // ms
    el.animate(
      [{ transform: 'translateY(0)' }, { transform: `translateY(-${bounce}px)` }, { transform: 'translateY(0)' }],
      { duration: t, easing: 'ease-out' }
    ).finished.finally(() => {
      el.style.left = px(originalLeft);
      el.style.top  = px(originalTop);
      isFalling = false;
    });
  }

  el.addEventListener('mousedown', onDown, { passive: true });
  el.addEventListener('touchstart', onDown, { passive: true });
})();
