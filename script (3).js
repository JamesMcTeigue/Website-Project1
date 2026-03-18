/* =====================================================
   THE ALLEYWAY — Main Script

   1. Torch light
   2. Draggable nav
   3. Panel controller
   4. Name label sync
   5. Misc init
   ===================================================== */

'use strict';

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const px  = n => `${n}px`;
const num = v => parseFloat(String(v)) || 0;
const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;


/* ============================================================
   1. TORCH LIGHT — writes --mx / --my so CSS gradients follow
   ============================================================ */
(function initTorch() {
  if (reduced) return;
  const root = document.documentElement;

  function update(clientX, clientY) {
    root.style.setProperty('--mx', ((clientX / window.innerWidth)  * 100).toFixed(2) + '%');
    root.style.setProperty('--my', ((clientY / window.innerHeight) * 100).toFixed(2) + '%');
  }

  window.addEventListener('pointermove', e => update(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', e => {
    const t = e.touches[0]; if (t) update(t.clientX, t.clientY);
  }, { passive: true });
})();


/* ============================================================
   2. DRAGGABLE NAV — fixed positioning, viewport coords
   ============================================================ */
(function initDraggableNav() {
  const el = document.getElementById('draggableNav');
  if (!el) return;

  let homeLeft = null, homeTop = null;
  let dragging = false, isFalling = false;
  let startClientX = 0, startClientY = 0, startLeft = 0, startTop = 0;
  let velocity = 0, fallTs = 0;
  const GRAVITY = 0.003;

  function captureHome() {
    if (homeLeft !== null) return;
    const r = el.getBoundingClientRect();
    homeLeft = r.left;
    homeTop  = r.top;
    el.style.left = px(homeLeft);
    el.style.top  = px(homeTop);
  }

  function onDown(e) {
    if (isFalling) return;
    captureHome();
    const p = e.touches?.[0] ?? e;
    dragging = true;
    el.classList.add('dragging');
    document.body.style.userSelect = 'none';
    startClientX = p.clientX; startClientY = p.clientY;
    startLeft = num(el.style.left); startTop = num(el.style.top);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
  }

  function onMove(e) {
    if (!dragging) return;
    if (e.cancelable) e.preventDefault();
    const p = e.touches?.[0] ?? e;
    el.style.left = px(startLeft + (p.clientX - startClientX));
    el.style.top  = px(startTop  + (p.clientY - startClientY));
  }

  function onUp() {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('dragging');
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    startFall();
  }

  function startFall() {
    if (isFalling) return;
    isFalling = true; velocity = 0; fallTs = performance.now();
    if (reduced) { snapHome(); return; }
    requestAnimationFrame(fallStep);
  }

  function fallStep(now) {
    if (!isFalling) return;
    const dt   = Math.min(1000 / 60, now - fallTs); fallTs = now;
    velocity  += GRAVITY * dt;
    const next = num(el.style.top) + velocity * dt;
    const floor = window.innerHeight - el.getBoundingClientRect().height;
    if (next >= floor) { el.style.top = px(floor); bounce(); }
    else { el.style.top = px(next); requestAnimationFrame(fallStep); }
  }

  function bounce() {
    el.animate(
      [{ transform: 'translateY(0)' }, { transform: 'translateY(-16px)' }, { transform: 'translateY(0)' }],
      { duration: 150, easing: 'ease-out' }
    ).finished.finally(snapHome);
  }

  function snapHome() {
    el.style.left = px(homeLeft);
    el.style.top  = px(homeTop);
    isFalling = false;
  }

  el.addEventListener('pointerdown', onDown, { passive: true });
  el.addEventListener('touchstart',  onDown, { passive: true });
})();


/* ============================================================
   3. PANELS  +  4. NAME LABEL  +  5. MISC INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* Year */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Placeholder button */
  const mainBtn = document.getElementById('myButton');
  if (mainBtn) mainBtn.addEventListener('click', () => alert('Button clicked!'));

  /* Panels */
  const contentBar = qs('#pipe-content-bar');

  function openPanel(selector) {
    const panel = qs(selector);
    if (!panel) return;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    qs('.close-btn', panel)?.focus();
  }

  function closePanel(panel) {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  qsa('#circle-buttons .circle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.hasAttribute('data-toggle-contentbar')) {
        contentBar?.classList.toggle('hidden');
      } else {
        const t = btn.getAttribute('data-target');
        if (t) openPanel(t);
      }
    });
  });

  qsa('#pipe-content-bar .bar-icon').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.getAttribute('data-target'); if (t) openPanel(t);
    });
  });

  qsa('.panel .close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.panel'); if (panel) closePanel(panel);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') qsa('.panel.open').forEach(closePanel);
  });

  /* Name label — tracks bin bottom-left corner */
  const bin   = document.getElementById('bin-main');
  const label = document.getElementById('name-label');

  function syncLabel() {
    if (!bin || !label) return;
    const r = bin.getBoundingClientRect();
    label.style.left = px(Math.round(r.left + 6));
    label.style.top  = px(Math.round(r.bottom - label.offsetHeight - 10));
  }

  syncLabel();
  window.addEventListener('resize', syncLabel);
});