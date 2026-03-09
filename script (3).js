
// Button click handler
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('myButton');
  if (btn) {
    btn.addEventListener('click', () => alert('Button clicked!'));
  }
});

// === Mouse glow + colour orbs animator ===
// Writes --mouse-x, --mouse-y, --mouse-brightness-amount, and --orbN-* to :root each frame.
// The CSS background layers and #mouse-light-overlay read these variables directly.
(function () {
  const root = document.documentElement;
  const supportsPE = 'onpointermove' in window;
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let rafId = null, hidden = false, last = performance.now();
  let mouseX = 50, mouseY = 50, mouseIntensity = 0;

  function start() { if (!rafId) { last = performance.now(); rafId = requestAnimationFrame(tick); } }
  function stop()  { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  function setFromClientXY(clientX, clientY) {
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    mouseX = Math.max(0, Math.min(100, (clientX / vw) * 100));
    mouseY = Math.max(0, Math.min(100, (clientY / vh) * 100));
    mouseIntensity = 1; // spike on movement
    root.style.setProperty('--mouse-x', mouseX.toFixed(2) + '%');
    root.style.setProperty('--mouse-y', mouseY.toFixed(2) + '%');
  }

  function onPointerMove(e) { setFromClientXY(e.clientX, e.clientY); }
  function onMouseMove(e)   { setFromClientXY(e.clientX, e.clientY); }
  function onTouchMove(e)   { const t = e.touches && e.touches[0]; if (t) setFromClientXY(t.clientX, t.clientY); }

  if (supportsPE) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
  } else {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
  }

  document.addEventListener('visibilitychange', () => { hidden = document.hidden; if (hidden) stop(); else start(); });

  const orbs = [
    { h: 24,  x: 25, y: 35, xt: 25, yt: 35 },
    { h: 210, x: 75, y: 65, xt: 75, yt: 65 },
    { h: 120, x: 50, y: 50, xt: 50, yt: 50 }
  ];
  function newOrbTargets() {
    orbs.forEach(o => { o.xt = clamp(10, 90, o.x + rand(-20, 20)); o.yt = clamp(10, 90, o.y + rand(-20, 20)); });
  }
  setInterval(newOrbTargets, 9000);

  const posEase = reduced ? 0.006 : 0.015;

  function tick(now) {
    if (hidden) return;
    const dt = Math.min(1000/60, now - last); last = now;

    const decay = reduced ? 0.985 : 0.95; // decay slower so glow is obvious
    mouseIntensity = Math.max(0, mouseIntensity * decay);
    root.style.setProperty('--mouse-brightness-amount', mouseIntensity.toFixed(3));

    const steer = (reduced ? 0.15 : 0.40) * mouseIntensity;
    orbs.forEach((o, i) => {
      const xtEff = (1 - steer) * o.xt + steer * mouseX;
      const ytEff = (1 - steer) * o.yt + steer * mouseY;
      o.x += (xtEff - o.x) * posEase;
      o.y += (ytEff - o.y) * posEase;
      root.style.setProperty(`--orb${i + 1}-hue`, String(o.h));
      root.style.setProperty(`--orb${i + 1}-pos-x`, `${o.x}%`);
      root.style.setProperty(`--orb${i + 1}-pos-y`, `${o.y}%`);
    });

    rafId = requestAnimationFrame(tick);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); }

  start();
})();

// === Draggable + Gravity for NAV (unchanged logic, now uses Pointer Events) ===
(function () {
  const el = document.getElementById('draggableNav') || document.querySelector('nav');
  if (!el) return;

  let dragging = false, isFalling = false;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;
  let originalLeft = null, originalTop = null;
  let fallStart = 0, velocity = 0;
  const gravity = 0.003; // px/ms^2
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const px = n => `${n}px`;
  const num = v => parseFloat(String(v).replace('px','')) || 0;

  function normalize() {
    const cs = getComputedStyle(el);
    if (cs.position !== 'absolute') el.style.position = 'absolute';
    const r = el.getBoundingClientRect();
    const docLeft = scrollX + r.left, docTop = scrollY + r.top;
    if (cs.left === 'auto') el.style.left = px(docLeft);
    if (cs.top  === 'auto') el.style.top  = px(docTop);
    if (originalLeft == null || originalTop == null) {
      originalLeft = num(el.style.left); originalTop = num(el.style.top);
    }
  }
  const viewportBottom = () => scrollY + document.documentElement.clientHeight;
  const elementHeight  = () => el.getBoundingClientRect().height;

  function onStart(e) {
    if (isFalling) return;
    const p = e.touches?.[0] ?? e;
    normalize();
    dragging = true; el.classList.add('dragging'); document.body.style.userSelect = 'none';
    startX = p.clientX; startY = p.clientY; startLeft = num(el.style.left); startTop = num(el.style.top);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onEnd, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: true });
  }
  function onMove(e) {
    if (!dragging || isFalling) return;
    const p = e.touches?.[0] ?? e; if (!p) return;
    if (e.cancelable) e.preventDefault();
    el.style.left = px(startLeft + (p.clientX - startX));
    el.style.top  = px(startTop  + (p.clientY - startY));
  }
  function onEnd() {
    if (!dragging) return; dragging = false; el.classList.remove('dragging'); document.body.style.userSelect = '';
    startFall();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onEnd);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onEnd);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onEnd);
  }

  function startFall() {
    if (isFalling) return; isFalling = true; velocity = 0; fallStart = performance.now();
    if (reduced) { el.style.left = px(originalLeft); el.style.top = px(originalTop); isFalling = false; return; }
    requestAnimationFrame(step);
  }
  function step(now) {
    if (!isFalling) return;
    const dt = Math.min(1000/60, now - fallStart); fallStart = now;
    const limitTop = viewportBottom() - elementHeight();
    const currentTop = num(el.style.top);
    velocity += gravity * dt; let nextTop = currentTop + velocity * dt;
    if (nextTop >= limitTop) { el.style.top = px(limitTop); bounceAndReset(); }
    else { el.style.top = px(nextTop); requestAnimationFrame(step); }
  }
  function bounceAndReset() {
    const bounce = 16, t = 150;
    el.animate([{transform:'translateY(0)'},{transform:`translateY(-${bounce}px)`},{transform:'translateY(0)'}],{duration:t,easing:'ease-out'})
      .finished.finally(()=>{ el.style.left = px(originalLeft); el.style.top = px(originalTop); isFalling = false; });
  }

  el.addEventListener('pointerdown', onStart, { passive: true });
  el.addEventListener('mousedown', onStart, { passive: true });
  el.addEventListener('touchstart', onStart, { passive: true });
})();
