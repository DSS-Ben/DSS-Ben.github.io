/* Press — an interactive CMYK ink wheel for the hero.
   Every swatch is mixed from real process inks (not a screen hue wheel):
   colour = paper × each ink at its coverage, the way ink layers on stock.
   So the C/M/Y/K numbers in the chip are exactly what made the swatch.
   Drag or click the ring to pick a mix; outer → inner ring = 100 / 60 / 30% tint.
   Hover or tap the centre and the C, M and Y plates split out of register.
   Keyboard: ←/→ walk the wheel, ↑/↓ change the tint.                          */
(function () {
  'use strict';
  var root = document.querySelector('[data-press]');
  if (!root) return;
  var svg = root.querySelector('.wheel');
  var segG = svg.querySelector('.wheel-segs');
  var stage = document.querySelector('[data-hero]');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- inks (sRGB approximations of process inks on coated stock) ---------- */
  var INK = { c: [0, 174, 239], m: [236, 0, 140], y: [255, 242, 0], k: [35, 31, 32] };
  function mix(c, m, y, k) {
    var out = [255, 255, 255];
    [['c', c], ['m', m], ['y', y], ['k', k]].forEach(function (p) {
      var cov = p[1] / 100, ink = INK[p[0]];
      for (var i = 0; i < 3; i++) out[i] *= 1 - cov * (1 - ink[i] / 255);
    });
    return out.map(Math.round);
  }
  function hex(rgb) { return '#' + rgb.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('').toUpperCase(); }

  /* ---------- 24 hues, walking the subtractive circle Y → R → M → B → C → G ---------- */
  var KEYS = [[0, 0, 100], [0, 100, 100], [0, 100, 0], [100, 100, 0], [100, 0, 0], [100, 0, 100]];
  var HUES = [];
  for (var leg = 0; leg < 6; leg++) {
    var a = KEYS[leg], b = KEYS[(leg + 1) % 6];
    for (var s = 0; s < 4; s++) {
      var t = s / 4;
      HUES.push([0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }));
    }
  }
  var TINTS = [1, 0.6, 0.3];
  var RINGS = [[196, 150], [146, 112], [108, 82]]; // outer, inner radius per tint ring
  var N = HUES.length, STEP = 360 / N;

  function cmyk(i, ring) { var h = HUES[i], f = TINTS[ring]; return [Math.round(h[0] * f), Math.round(h[1] * f), Math.round(h[2] * f), 0]; }

  /* ---------- draw the wheel ---------- */
  function polar(r, deg) { var a = (deg - 90) * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; }
  function wedge(r0, r1, d0, d1) {
    var p0 = polar(r1, d0), p1 = polar(r1, d1), p2 = polar(r0, d1), p3 = polar(r0, d0);
    return 'M' + p0 + 'A' + r1 + ',' + r1 + ' 0 0 1 ' + p1 + 'L' + p2 + 'A' + r0 + ',' + r0 + ' 0 0 0 ' + p3 + 'Z';
  }
  var cells = [];
  for (var ring = 0; ring < 3; ring++) {
    for (var i = 0; i < N; i++) {
      var p = document.createElementNS(NS, 'path');
      var d0 = i * STEP - STEP / 2 + 0.6, d1 = i * STEP + STEP / 2 - 0.6;
      p.setAttribute('d', wedge(RINGS[ring][1], RINGS[ring][0], d0, d1));
      var v = cmyk(i, ring);
      p.setAttribute('fill', hex(mix(v[0], v[1], v[2], v[3])));
      p.setAttribute('class', 'cell');
      p.style.setProperty('--i', i); p.style.setProperty('--r', ring);
      var mid = polar(1, i * STEP);
      p.style.setProperty('--dx', (mid[0] * 9).toFixed(2) + 'px');
      p.style.setProperty('--dy', (mid[1] * 9).toFixed(2) + 'px');
      segG.appendChild(p);
      cells.push({ el: p, i: i, ring: ring });
    }
  }

  /* ---------- the chip ---------- */
  var chipSw = root.querySelector('.chip-swatch');
  var chipName = root.querySelector('.chip-name');
  var chipHex = root.querySelector('.chip-hex');
  var bars = {};
  ['c', 'm', 'y', 'k'].forEach(function (k) { bars[k] = { bar: root.querySelector('[data-ink="' + k + '"] i'), val: root.querySelector('[data-ink="' + k + '"] b') }; });
  var shown = { c: 0, m: 0, y: 0, k: 0 }, target = { c: 0, m: 0, y: 0, k: 0 }, raf = null;
  function tick() {
    var moving = false;
    ['c', 'm', 'y', 'k'].forEach(function (k) {
      var d = target[k] - shown[k];
      shown[k] = Math.abs(d) < 0.4 ? target[k] : shown[k] + d * 0.22;
      if (shown[k] !== target[k]) moving = true;
      bars[k].bar.style.setProperty('--v', (shown[k] / 100).toFixed(3));
      var n = Math.round(shown[k]);
      bars[k].val.textContent = n < 10 ? '0' + n : String(n);
    });
    raf = moving ? requestAnimationFrame(tick) : null;
  }

  /* ---------- selection ---------- */
  var sel = { i: 14, ring: 0 }; // C100 M50 — the blue family the site lives in
  var touched = false;
  function select(i, ring, fromUser) {
    i = (i % N + N) % N; ring = Math.max(0, Math.min(2, ring));
    sel.i = i; sel.ring = ring;
    var v = cmyk(i, ring), rgb = mix(v[0], v[1], v[2], v[3]), h = hex(rgb);
    cells.forEach(function (c) { c.el.classList.toggle('is-sel', c.i === i && c.ring === ring); c.el.classList.toggle('is-col', c.i === i); });
    chipSw.style.background = h;
    chipHex.textContent = h;
    chipName.textContent = 'BA ' + ('0' + (i + 1)).slice(-2) + '·' + Math.round(TINTS[ring] * 100);
    target = { c: v[0], m: v[1], y: v[2], k: v[3] };
    if (reduce) { shown = Object.assign({}, target); tick(); } else if (!raf) raf = requestAnimationFrame(tick);
    svg.setAttribute('aria-valuenow', i);
    svg.setAttribute('aria-valuetext', 'Cyan ' + v[0] + '%, magenta ' + v[1] + '%, yellow ' + v[2] + '%, black ' + v[3] + '%, ' + h);
    if (fromUser) {
      touched = true;
      if (stage) stage.style.setProperty('--press', h);
      root.classList.add('is-touched');
    }
  }

  /* ---------- pointer: angle picks the hue, radius picks the tint ---------- */
  function fromEvent(e) {
    var r = svg.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width * 420 - 210, y = (e.clientY - r.top) / r.height * 420 - 210;
    var dist = Math.sqrt(x * x + y * y);
    var deg = (Math.atan2(y, x) * 180 / Math.PI + 90 + 360) % 360;
    var i = Math.round(deg / STEP) % N;
    var ring = dist > 148 ? 0 : dist > 110 ? 1 : dist > 74 ? 2 : -1;
    return { i: i, ring: ring, dist: dist };
  }
  var dragging = false;
  svg.addEventListener('pointerdown', function (e) {
    var f = fromEvent(e);
    if (f.ring < 0) return; // the centre is for the plates
    dragging = true; svg.setPointerCapture(e.pointerId); root.classList.add('is-drag');
    select(f.i, f.ring, true);
  });
  svg.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var f = fromEvent(e);
    select(f.i, f.ring < 0 ? sel.ring : f.ring, true);
  });
  function end() { dragging = false; root.classList.remove('is-drag'); }
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);

  /* keyboard */
  svg.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowRight') select(sel.i + 1, sel.ring, true);
    else if (k === 'ArrowLeft') select(sel.i - 1, sel.ring, true);
    else if (k === 'ArrowUp') select(sel.i, sel.ring - 1, true);
    else if (k === 'ArrowDown') select(sel.i, sel.ring + 1, true);
    else return;
    e.preventDefault();
  });

  /* plates: split out of register on hover / tap */
  var plates = svg.querySelector('.wheel-plates');
  plates.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') root.classList.add('is-split'); });
  plates.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') root.classList.remove('is-split'); });
  plates.addEventListener('click', function () { root.classList.toggle('is-split'); });

  /* ---------- intro: plates print one by one, then the wheel runs one lap and settles ---------- */
  var hint = root.querySelector('.press-hint');
  if (hint && matchMedia('(hover: none)').matches) hint.textContent = 'Drag to mix · tap the centre to split plates';
  select(sel.i, sel.ring, false);
  if (reduce) { root.classList.add('is-in', 'is-printed'); return; }
  function startIntro() {
    root.classList.add('is-in');
    setTimeout(function () { root.classList.add('is-printed'); }, 1300);
    var home = sel.i, step = 0;
    setTimeout(function lap() {
      if (touched) return;
      step++;
      select(home + step, 0, false);
      if (step < N) setTimeout(lap, 55 + Math.pow(step / N, 3) * 160); // spins up, eases in
    }, 1700);
  }
  if (stage && !stage.classList.contains('is-in')) {
    var mo = new MutationObserver(function () { if (stage.classList.contains('is-in')) { mo.disconnect(); setTimeout(startIntro, 1500); } });
    mo.observe(stage, { attributes: true, attributeFilter: ['class'] });
  } else setTimeout(startIntro, 300);
})();
