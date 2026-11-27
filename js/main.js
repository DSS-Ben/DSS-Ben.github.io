/* Portfolio v5 — page behaviour. No dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Missing media: drop the element so the tinted number shows ---------- */
  [].forEach.call(document.querySelectorAll('.card-media img, .card-media video, .contact-portrait'), function (m) {
    m.addEventListener('error', function () { m.remove(); }, { once: true });
    if (m.tagName === 'IMG' && m.complete && m.naturalWidth === 0 && m.src) m.remove();
  });

  /* ---------- Scroll reveal with sibling stagger ---------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  [].forEach.call(reveals, function (el) {
    var sibs = [].filter.call(el.parentElement.children, function (c) { return c.hasAttribute('data-reveal'); });
    if (sibs.length > 1) el.style.setProperty('--d', (sibs.indexOf(el) % 3) * 90 + 'ms');
  });
  if (reduce || !hasIO) {
    [].forEach.call(reveals, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    [].forEach.call(reveals, function (el) { io.observe(el); });
  }

  /* ---------- Card videos: play only while visible ---------- */
  var vids = document.querySelectorAll('video[data-autoplay]');
  if (hasIO && !reduce) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.25 });
    [].forEach.call(vids, function (v) { vio.observe(v); });
  }

  /* ---------- Header: shadow, progress, active section ---------- */
  var header = document.querySelector('.site-header');
  var navLinks = [].slice.call(document.querySelectorAll('.nav a'));
  /* scroll-linked word highlight (Apple product-page style) */
  var scrubs = [];
  if (!reduce) [].forEach.call(document.querySelectorAll('[data-scrub]'), function (el) {
    var text = el.textContent.trim(), words = [];
    el.setAttribute('aria-label', text);
    el.textContent = '';
    text.split(/\s+/).forEach(function (w, i, a) {
      var s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.textContent = w;
      el.appendChild(s); if (i < a.length - 1) el.appendChild(document.createTextNode(' '));
      words.push(s);
    });
    scrubs.push({ el: el, words: words });
  });
  function scrubLead() {
    scrubs.forEach(function (sc) {
      var r = sc.el.getBoundingClientRect();
      var start = innerHeight * 0.88, end = innerHeight * 0.3;
      var p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * 0.4)));
      var lit = p * sc.words.length;
      sc.words.forEach(function (w, i) { w.style.setProperty('--o', (0.14 + Math.min(1, Math.max(0, lit - i + 1)) * 0.86).toFixed(3)); });
    });
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = scrollY, max = root.scrollHeight - innerHeight;
      header.classList.toggle('is-scrolled', y > 4);
      header.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
      scrubLead();
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  if (hasIO) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var t = document.querySelector(a.getAttribute('href')); if (t) spy.observe(t); });
  }

  /* ---------- Work filters ---------- */
  var buttons = document.querySelectorAll('.filter');
  var cards = document.querySelectorAll('#work .card[data-discipline]');
  var status = document.getElementById('filter-status');
  var LABELS = { brand: 'Brand', motion: 'Motion', digital: 'Digital', 'ai-video': 'AI Video' };
  function apply(filter) {
    var shown = 0;
    [].forEach.call(cards, function (c) {
      var match = filter === 'all' || c.getAttribute('data-discipline') === filter;
      c.hidden = !match;
      if (match) { shown++; c.classList.add('in'); }
    });
    ['start', 'more'].forEach(function (g) {
      var grid = document.querySelector('.grid[data-group="' + g + '"]');
      var any = grid && grid.querySelector('.card:not([hidden])');
      [].forEach.call(document.querySelectorAll('[data-group="' + g + '"]'), function (el) { el.hidden = !any; });
    });
    [].forEach.call(buttons, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filter') === filter ? 'true' : 'false'); });
    if (status) status.textContent = filter === 'all' ? 'Showing all ' + cards.length + ' projects.' : 'Showing ' + shown + ' ' + LABELS[filter] + ' project' + (shown === 1 ? '' : 's') + '.';
  }
  [].forEach.call(buttons, function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-filter')); }); });
  // keep the counts honest if projects are added or removed
  [].forEach.call(buttons, function (b) {
    var f = b.getAttribute('data-filter'), n = 0;
    [].forEach.call(cards, function (c) { if (f === 'all' || c.getAttribute('data-discipline') === f) n++; });
    var cnt = b.querySelector('.count'); if (cnt) cnt.textContent = n;
  });

  /* ---------- Contact: light follows the pointer ---------- */
  var contact = document.querySelector('.contact-card');
  if (contact && canHover && !reduce) {
    var tx = 80, ty = 10, cx = 80, cy = 10, raf = null;
    var step = function () {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      contact.style.setProperty('--mx', cx.toFixed(2) + '%');
      contact.style.setProperty('--my', cy.toFixed(2) + '%');
      raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(step) : null;
    };
    contact.addEventListener('pointermove', function (e) {
      var r = contact.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width * 100; ty = (e.clientY - r.top) / r.height * 100;
      if (!raf) raf = requestAnimationFrame(step);
    });
    contact.addEventListener('pointerleave', function () { tx = 80; ty = 10; if (!raf) raf = requestAnimationFrame(step); });
  }
})();
