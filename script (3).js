/* =====================================================
   THE ALLEYWAY — Main Script
   
   Sections:
   1. Torch light  (mouse → CSS vars --mx / --my)
   2. Draggable nav
   3. Panel controller  (open / close / Esc)
   4. Name label sync   (follows bin position)
   5. Misc init         (year, placeholder button)
   ===================================================== */

'use strict';

/* ── Helpers ─────────────────────────────────────── */
const qs  = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const px  = n  => `${n}px`;
const num = v  => parseFloat(String(v)) || 0;
const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;


/* ============================================================
   1. TORCH LIGHT
   Writes --mx / --my to :root so the CSS gradients follow
   the cursor with zero JS layout work each frame.
   ============================================================ */
(function initTorch() {
  if (reduced) return;
  const root = document.documentElement;

  function update(clientX, clientY) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mx = ((clientX / vw) * 100).toFixed(2) + '%';
    const my = ((clientY / vh) * 100).toFixed(2) + '%';
    root.style.setProperty('--mx', mx);
    root.style.setProperty('--my', my);
  }

  window.addEventListener('pointermove', e => update(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', e => {
    const t = e.touches[0];
    if (t) update(t.clientX, t.clientY);
  }, { passive: true });
})();


/* ============================================================
   2. DRAGGABLE NAV
   The nav is position:fixed, so all coords are viewport-relative.
   On release it falls with gravity then snaps back to its
   original position.
   ============================================================ */
(function initDraggableNav() {
  const el = document.getElementById('draggableNav');
  if (!el) return;

  /* Store the CSS-defined home position once, on first drag */
  let homeLeft = null;
  let homeTop  = null;

  let dragging  = false;
  let isFalling = false;
  let startClientX = 0, startClientY = 0;
  let startLeft    = 0, startTop     = 0;
  let velocity = 0;
  let fallTs   = 0;
  const GRAVITY = 0.003; // px / ms²

  function captureHome() {
    if (homeLeft !== null) return;
    const r = el.getBoundingClientRect();
    homeLeft = r.left;
    homeTop  = r.top;
    /* Switch to explicit px values so JS can move it */
    el.style.left = px(r.left);
    el.style.top  = px(r.top);
  }

  /* ── drag start ── */
  function onDown(e) {
    if (isFalling) return;
    captureHome();
    const p = e.touches?.[0] ?? e;
    dragging = true;
    el.classList.add('dragging');
    document.body.style.userSelect = 'none';
    startClientX = p.clientX;
    startClientY = p.clientY;
    startLeft    = num(el.style.left);
    startTop     = num(el.style.top);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup',   onUp);
  }

  /* ── drag move ── */
  function onMove(e) {
    if (!dragging) return;
    if (e.cancelable) e.preventDefault();
    const p = e.touches?.[0] ?? e;
    el.style.left = px(startLeft + (p.clientX - startClientX));
    el.style.top  = px(startTop  + (p.clientY - startClientY));
  }

  /* ── drag end → fall ── */
  function onUp() {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('dragging');
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup',   onUp);
    startFall();
  }

  /* ── gravity fall ── */
  function startFall() {
    if (isFalling) return;
    isFalling = true;
    velocity  = 0;
    fallTs    = performance.now();

    if (reduced) {
      snapHome();
      return;
    }
    requestAnimationFrame(fallStep);
  }

  function fallStep(now) {
    if (!isFalling) return;
    const dt        = Math.min(1000 / 60, now - fallTs);
    fallTs          = now;
    velocity       += GRAVITY * dt;
    const nextTop   = num(el.style.top) + velocity * dt;
    /* Floor = viewport height minus element height */
    const floorTop  = window.innerHeight - el.getBoundingClientRect().height;

    if (nextTop >= floorTop) {
      el.style.top = px(floorTop);
      bounce();
    } else {
      el.style.top = px(nextTop);
      requestAnimationFrame(fallStep);
    }
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
   3. PANEL CONTROLLER + 4. NAME LABEL + 5. MISC INIT
   Everything that needs the DOM ready lives in one listener.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ── 3. Panels ─────────────────────────────────── */
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

  /* Circle buttons */
  qsa('#circle-buttons .circle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.hasAttribute('data-toggle-contentbar')) {
        contentBar?.classList.toggle('hidden');
      } else {
        const target = btn.getAttribute('data-target');
        if (target) openPanel(target);
      }
    });
  });

  /* Content-bar icons */
  qsa('#pipe-content-bar .bar-icon').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (target) openPanel(target);
    });
  });

  /* Close buttons inside panels */
  qsa('.panel .close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.panel');
      if (panel) closePanel(panel);
    });
  });

  /* Escape key closes any open panel */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') qsa('.panel.open').forEach(closePanel);
  });


  /* ── 4. Name label — tracks bin bottom-left corner ── */
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


  /* ── 5. Misc init ───────────────────────────────── */

  /* Auto copyright year */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Placeholder button (swap for real handler later) */
  const mainBtn = document.getElementById('myButton');
  if (mainBtn) mainBtn.addEventListener('click', () => alert('Button clicked!'));

});