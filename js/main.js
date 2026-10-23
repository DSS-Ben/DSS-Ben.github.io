/* Portfolio v3 — motion layer.
   Principles (Apple HIG / "Designing Fluid Interfaces"):
   - one orchestrated load moment (hero), quiet reveals after that
   - anything the pointer touches runs on an interruptible per-frame spring
   - feedback on press, never only on release
   - reduced motion / no-hover devices get calm, static equivalents       */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Split text into word spans (text content is unchanged) ---------- */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return el.querySelectorAll('.w');
  }

  /* ---------- 1. Hero load sequence ---------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    const h1 = hero.querySelector('[data-split]');
    const words = h1 ? splitWords(h1) : [];
    const label = hero.querySelector('[data-hero="1"]');
    if (label) label.style.setProperty('--d', '0ms');
    words.forEach((w, i) => w.style.setProperty('--d', (120 + i * 28) + 'ms'));
    const after = 120 + words.length * 28;
    hero.querySelectorAll('[data-hero="2"]').forEach(el => el.style.setProperty('--d', (after + 80) + 'ms'));
    hero.querySelectorAll('[data-hero="3"]').forEach(el => el.style.setProperty('--d', (after + 180) + 'ms'));
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-in')));
  }

  /* ---------- 2. Scroll reveal with sibling stagger ---------- */
  const reveals = document.querySelectorAll('[data-reveal]');
  reveals.forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
    const i = sibs.indexOf(el);
    if (sibs.length > 1) el.style.setProperty('--d', (i * 80) + 'ms');
  });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => io.observe(el));
  }

  /* ---------- 3. Header: material state, progress, active section ---------- */
  const header = document.querySelector('.site-header');
  const navLinks = [...document.querySelectorAll('.site-header nav a')];
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const max = root.scrollHeight - innerHeight;
      header.classList.toggle('is-scrolled', y > 4);
      header.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
      scrubLead();
      ticking = false;
    });
  }
  if ('IntersectionObserver' in window) {
    const targets = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const link = navLinks.find(a => a.getAttribute('href') === '#' + e.target.id);
        if (link && e.isIntersecting) {
          navLinks.forEach(a => a.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(t => spy.observe(t));
  }

  /* ---------- 4. About lead: words light up as you read (scroll-linked) ---------- */
  const lead = document.querySelector('[data-scrub]');
  const leadWords = lead && !reduceMotion ? splitWords(lead) : [];
  function scrubLead() {
    if (!leadWords.length) return;
    const r = lead.getBoundingClientRect();
    const start = innerHeight * 0.85, end = innerHeight * 0.35;
    const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * 0.5)));
    const lit = p * leadWords.length;
    leadWords.forEach((w, i) => {
      const o = Math.min(1, Math.max(0, lit - i + 1));
      w.style.setProperty('--o', (0.16 + o * 0.84).toFixed(3));
    });
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- 5. Project tiles: weighted spring tilt + glare ---------- */
  const MAX_TILT = 5;      // degrees — Apple-subtle, not a gimmick
  const LIFT = 1.012;
  const STIFF = 0.12;
  const DAMP = 0.78;

  function attachTilt(wrap) {
    const card = wrap.querySelector('.tilt-card');
    const glare = wrap.querySelector('.card-glare');
    if (!card) return;
    let tx = 0, ty = 0, tl = 1, cx = 0, cy = 0, cl = 1, vx = 0, vy = 0, vl = 0;
    let raf = null, engaged = false;

    function frame() {
      vx = (vx + (tx - cx) * STIFF) * DAMP; cx += vx;
      vy = (vy + (ty - cy) * STIFF) * DAMP; cy += vy;
      vl = (vl + (tl - cl) * STIFF) * DAMP; cl += vl;
      card.style.setProperty('--rx', cx.toFixed(3) + 'deg');
      card.style.setProperty('--ry', cy.toFixed(3) + 'deg');
      card.style.setProperty('--sx', cx.toFixed(3));
      card.style.setProperty('--sy', cy.toFixed(3));
      card.style.setProperty('--lift', cl.toFixed(4));
      const settled = Math.abs(tx - cx) < 0.01 && Math.abs(ty - cy) < 0.01 &&
        Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01 && Math.abs(tl - cl) < 0.0005 && Math.abs(vl) < 0.0005;
      if (settled && !engaged) { raf = null; return; }
      raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    wrap.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tx = -py * MAX_TILT * 2;
      ty = px * MAX_TILT * 2;
      tl = LIFT; engaged = true;
      if (glare) {
        glare.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(2) + '%');
        glare.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(2) + '%');
        glare.style.setProperty('--glare', '1');
      }
      kick();
    });
    const release = () => {
      engaged = false; tx = 0; ty = 0; tl = 1;
      if (glare) glare.style.setProperty('--glare', '0');
      kick();
    };
    wrap.addEventListener('pointerleave', release);
    wrap.addEventListener('pointercancel', release);
    wrap.addEventListener('pointerdown', () => { tl = 0.99; kick(); });
    wrap.addEventListener('pointerup', () => { tl = engaged ? LIFT : 1; kick(); });
  }
  if (canHover && !reduceMotion) document.querySelectorAll('[data-tilt]').forEach(attachTilt);

  /* ---------- 6. Contact tile: light follows the pointer (springed) ---------- */
  const contact = document.querySelector('.contact-card');
  if (contact && canHover && !reduceMotion) {
    let tx = 80, ty = 10, cx = 80, cy = 10, raf = null;
    const step = () => {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      contact.style.setProperty('--mx', cx.toFixed(2) + '%');
      contact.style.setProperty('--my', cy.toFixed(2) + '%');
      raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(step) : null;
    };
    contact.addEventListener('pointermove', e => {
      const r = contact.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width * 100;
      ty = (e.clientY - r.top) / r.height * 100;
      if (!raf) raf = requestAnimationFrame(step);
    });
    contact.addEventListener('pointerleave', () => { tx = 80; ty = 10; if (!raf) raf = requestAnimationFrame(step); });
  }
})();

/* OPTIONAL: only needed for the phone effect (gradient plays once on scroll into view).
   CSS alone can't play an animation exactly once on scroll, so this small script adds a class.
   Without it, phones simply show the black title. Desktop hover is CSS only. */
(function () {
  var note = document.querySelector('.ai-note');
  var title = note && note.querySelector('.ai-note-title');
  if (!title) return;
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      io.disconnect();
      title.classList.add('ai-note-play');
      title.addEventListener('animationend', function () {
        title.classList.remove('ai-note-play');
      }, { once: true });
    });
  }, { threshold: 0.5 });

  io.observe(note);
})();
