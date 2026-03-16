
// Button click handler
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('myButton');
  if (btn) {
    btn.addEventListener('click', () => alert('Button clicked!'));
  }
});

// === Torch light: track mouse → update --mx / --my on :root ===
(function () {
  const root = document.documentElement;
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (reduced) return;

  function update(clientX, clientY) {
    const vw = window.innerWidth  || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    root.style.setProperty('--mouse-x', ((clientX / vw) * 100).toFixed(2) + '%');
    root.style.setProperty('--mouse-y', ((clientY / vh) * 100).toFixed(2) + '%');
    root.style.setProperty('--mx', root.style.getPropertyValue('--mouse-x'));
    root.style.setProperty('--my', root.style.getPropertyValue('--mouse-y'));
  }

  window.addEventListener('pointermove', e => update(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove',   e => { const t = e.touches[0]; if (t) update(t.clientX, t.clientY); }, { passive: true });
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



// === Overlay / Panel controller ===
document.addEventListener('DOMContentLoaded', () => {
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const contentBar = qs('#pipe-content-bar');

  function openPanel(sel) {
    const p = qs(sel);
    if (!p) return;
    p.classList.add('open');
    p.setAttribute('aria-hidden','false');
    const close = p.querySelector('.close-btn');
    if (close) close.focus();
  }
  function closePanel(p) {
    p.classList.remove('open');
    p.setAttribute('aria-hidden','true');
  }

  // Wire circle buttons
  qsa('#circle-buttons .circle-btn').forEach(btn => {
    const target = btn.getAttribute('data-target');
    const toggleBar = btn.hasAttribute('data-toggle-contentbar');
    btn.addEventListener('click', () => {
      if (toggleBar) {
        if (contentBar) contentBar.classList.toggle('hidden');
      } else if (target) {
        openPanel(target);
      }
    });
  });

  // Wire content bar icons
  qsa('#pipe-content-bar .bar-icon').forEach(btn => {
    const target = btn.getAttribute('data-target');
    btn.addEventListener('click', () => target && openPanel(target));
  });

  // Close buttons + Esc
  qsa('.panel .close-btn').forEach(btn => btn.addEventListener('click', () => {
    const panel = btn.closest('.panel');
    if (panel) closePanel(panel);
  }));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') qsa('.panel.open').forEach(closePanel);
  });
});

// === Layout sync: keep name label near bin corner ===
document.addEventListener('DOMContentLoaded', () => {
  const bin = document.getElementById('bin-main');
  const label = document.getElementById('name-label');
  function layout() {
    if (!bin || !label) return;
    const r = bin.getBoundingClientRect();
    const lpad = 6, bpad = 10;
    label.style.left = `${Math.round(r.left + lpad)}px`;
    label.style.top = `${Math.round(r.bottom - label.offsetHeight - bpad)}px`;
  }
  layout();
  window.addEventListener('resize', layout);
  window.addEventListener('scroll', layout, { passive: true });
});
