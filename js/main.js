/* Ben Alvis portfolio — vanilla JS only. No sound, no gate, no preloader, no gloss.
   One job: the converging circles. Scroll progress drives them, blank page to finished piece. */
(() => {
  'use strict';
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1920, H = 1080, CX = W / 2, CY = H / 2;
  const gridG = document.getElementById('grid');
  const circG = document.getElementById('circles');
  const orb = document.getElementById('orb');
  if (!gridG || !circG) return;

  for (let x = 0; x <= W; x += 96) {
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', x); l.setAttribute('x2', x); l.setAttribute('y1', 0); l.setAttribute('y2', H);
    gridG.appendChild(l);
  }
  for (let y = 0; y <= H; y += 96) {
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('y1', y); l.setAttribute('y2', y); l.setAttribute('x1', 0); l.setAttribute('x2', W);
    gridG.appendChild(l);
  }

  const START = [
    { x: 0, y: 0, r: 70 },
    { x: 0, y: -250, r: 54 }, { x: 250, y: 0, r: 54 }, { x: 0, y: 250, r: 54 }, { x: -250, y: 0, r: 54 },
    { x: 300, y: -300, r: 82 }, { x: 300, y: 300, r: 82 }, { x: -300, y: 300, r: 82 }, { x: -300, y: -300, r: 82 },
    { x: 0, y: -440, r: 36 }, { x: 560, y: 0, r: 110 }, { x: 0, y: 440, r: 36 }, { x: -560, y: 0, r: 110 }
  ];
  const circles = START.map((s, i) => {
    const g = document.createElementNS(NS, 'g');
    const out = document.createElementNS(NS, 'circle');
    out.setAttribute('class', 'c-out');
    g.appendChild(out); circG.appendChild(g);
    return { g, out, s, dir: i % 2 ? -1 : 1, delay: (i % 5) * 0.04 };
  });

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);

  function update(p) {
    p = clamp(p, 0, 1);
    gridG.style.opacity = (0.5 * (1 - ease(p)) + 0.2).toFixed(3);
    circles.forEach(c => {
      const t = ease(clamp((p - c.delay) / (1 - c.delay), 0, 1));
      const x = CX + c.s.x * (1 - t);
      const y = CY + c.s.y * (1 - t);
      const r = lerp(c.s.r, 300, t);
      c.g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(c.dir * 90 * t).toFixed(1)})`);
      c.out.setAttribute('r', r.toFixed(1));
      c.out.style.opacity = (0.55 * (1 - t * 0.45)).toFixed(3);
    });
    if (orb) orb.style.transform = `scale(${(1 + 1.4 * p).toFixed(3)})`;
  }

  function progress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { update(progress()); ticking = false; });
  }

  if (REDUCED) { update(1); }
  else { window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); update(0); }

  // Nav active state
  const navLinks = Array.from(document.querySelectorAll('.site-header nav a'));
  function updateNav() {
    const mid = window.scrollY + window.innerHeight * 0.5;
    let current = '';
    ['work', 'about', 'process', 'contact'].forEach(id => {
      const el = document.getElementById(id);
      if (el && mid >= el.offsetTop && mid < el.offsetTop + el.offsetHeight) current = id;
    });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  }
  window.addEventListener('scroll', updateNav, { passive: true }); updateNav();

  // Card reveal
  const cards = document.querySelectorAll('.card');
  if ('IntersectionObserver' in window && !REDUCED) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    cards.forEach(c => io.observe(c));
  } else { cards.forEach(c => c.classList.add('in')); }
})();
