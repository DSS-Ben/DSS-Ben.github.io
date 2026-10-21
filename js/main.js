/* Swiss v2 — only a quiet fade-in for project cards. Nothing else. */
(() => {
  'use strict';
  const cards = document.querySelectorAll('.project');
  if (!('IntersectionObserver' in window)) { cards.forEach(c => c.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  cards.forEach(c => io.observe(c));
})();
