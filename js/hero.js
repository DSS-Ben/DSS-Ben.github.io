/* Hero — kinetic type on white.
   Sequence: grid + crop marks draw → pen-tool curve draws → name slices in
   (condensed/thin → wide/heavy, on a spring) → selection box snaps around it
   → role rotator + badge. Then the name stays alive: letters near
   the pointer go thin and condensed (a "lens"); without a pointer a slow
   weight wave runs through them. Scrolling compresses the name as it leaves.
   No dependencies. Respects prefers-reduced-motion.                        */
(function () {
  'use strict';
  var stage = document.querySelector('[data-hero]');
  if (!stage) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var h1 = stage.querySelector('.hero-name');
  var lines = [].slice.call(h1.querySelectorAll('.kt-line'));
  var box = stage.querySelector('.select-box');

  /* ---------- stagger indexes for CSS ---------- */
  [].forEach.call(stage.querySelectorAll('.hero-grid i'), function (el, i) {
    el.style.setProperty('--i', i);
  });

  /* ---------- split name into masked letters ---------- */
  var chars = [];
  lines.forEach(function (line, li) {
    var dot = line.querySelector('.kt-dot');
    var text = line.firstChild.nodeValue;
    line.removeChild(line.firstChild);
    text.split('').forEach(function (c, ci) {
      var clip = document.createElement('span'); clip.className = 'kt-clip';
      var ch = document.createElement('span'); ch.className = 'kt-ch'; ch.textContent = c;
      clip.appendChild(ch);
      line.insertBefore(clip, dot || null);
      chars.push({ el: ch, line: li, idx: ci, start: 0.45 + li * 0.2 + ci * 0.055, wd: 62, wg: 100, sw: 100, sg: 800 });
    });
  });

  /* ---------- cache each letter's resting centre, relative to the stage ----------
     offsetLeft/offsetTop ignore transforms, so this stays true while the intro
     and the scroll compression move the letters around. The lens then needs
     one stage measurement per frame instead of one per letter. Re-measured
     in fit() (resize, font load, start). */
  function measureLetters() {
    chars.forEach(function (c) {
      var x = 0, y = 0, n = c.el;
      while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      c.cx = x + c.el.offsetWidth / 2;
      c.cy = y + c.el.offsetHeight / 2;
    });
  }

  /* ---------- fit the name to the stage width ---------- */
  function fit() {
    chars.forEach(function (c) { c.el.style.fontVariationSettings = '"wdth" 100, "wght" 800'; });
    h1.style.setProperty('--name-size', '100px');
    var widest = 0;
    lines.forEach(function (l) { widest = Math.max(widest, l.scrollWidth); });
    var avail = stage.clientWidth - parseFloat(getComputedStyle(stage).paddingLeft) * 2;
    var size = Math.min(100 * (avail * 0.97) / widest, innerHeight * 0.27, 300);
    h1.style.setProperty('--name-size', size.toFixed(1) + 'px');
    if (!reduce) chars.forEach(function (c) { c.el.style.fontVariationSettings = '"wdth" ' + c.wd.toFixed(1) + ', "wght" ' + c.wg.toFixed(0); });
    placeBox();
    measureLetters();
  }

  /* ---------- pen path length ---------- */
  var pen = stage.querySelector('.pen-path');
  if (pen && pen.getTotalLength) pen.style.setProperty('--len', Math.ceil(pen.getTotalLength()));

  /* ---------- meta label scramble ---------- */
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789—·°';
  function scramble(el, delay) {
    var final = el.textContent, t0 = null, dur = 900;
    el.textContent = '';
    setTimeout(function tick(now) {
      requestAnimationFrame(function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur), out = '';
        for (var i = 0; i < final.length; i++) {
          var reveal = p * final.length * 1.2 - i * 0.2;
          out += (final[i] === ' ' || reveal >= 1) ? final[i] : (reveal > 0 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : '');
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(step); else el.textContent = final;
      });
    }, delay);
  }

  /* ---------- selection box around the name ---------- */
  function placeBox() {
    if (!box) return;
    var s = stage.getBoundingClientRect(), r = h1.getBoundingClientRect();
    var pad = 10;
    box.style.left = (r.left - s.left - pad) + 'px';
    box.style.top = (r.top - s.top - pad) + 'px';
    box.style.width = (r.width + pad * 2) + 'px';
    box.style.height = (r.height + pad * 2) + 'px';
    box._w = Math.round(r.width); box._h = Math.round(r.height);
  }
  function showBox() {
    if (!box) return;
    placeBox();
    box.classList.add('on');
    var w = box.querySelector('[data-w]'), h = box.querySelector('[data-h]'), t0 = performance.now();
    (function count(now) {
      var p = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - p, 3);
      w.textContent = Math.round(box._w * e); h.textContent = Math.round(box._h * e);
      if (p < 1) requestAnimationFrame(count);
    })(t0);
    setTimeout(function () { box.classList.add('off'); }, 1900);
  }

  /* ---------- rotator ---------- */
  var rot = stage.querySelector('.rotator');
  var words = rot ? rot.getAttribute('data-words').split('|') : [];
  var wi = 0, current = null;
  function buildWord(word) {
    var rc = document.createElement('span'); rc.className = 'rc';
    word.split('').forEach(function (c, i) {
      var s = document.createElement('span'); s.textContent = c; s.style.setProperty('--i', i); rc.appendChild(s);
    });
    return rc;
  }
  function initRotator() {
    if (!rot) return;
    rot.setAttribute('aria-label', words.join(', '));
    rot.textContent = '';
    current = buildWord(words[0]);
    current.setAttribute('aria-hidden', 'true');
    rot.appendChild(current);
  }
  function nextWord() {
    wi = (wi + 1) % words.length;
    var old = current, next = buildWord(words[wi]);
    next.setAttribute('aria-hidden', 'true');
    if (reduce) { rot.replaceChild(next, old); current = next; return; }
    old.classList.add('leave');
    old.style.position = 'absolute'; old.style.left = '0'; old.style.top = '0';
    next.classList.add('enter');
    rot.appendChild(next);
    rot.style.setProperty('--u', '0');
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      next.classList.remove('enter'); rot.style.setProperty('--u', '1');
    }); });
    setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 900);
    current = next;
  }

  /* ---------- the per-frame engine ---------- */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function outExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function spring(t) { return t <= 0 ? 1 : Math.exp(-6.5 * t) * Math.cos(13 * t); } // 1 → 0, one soft overshoot

  var t0 = null, visible = true, px = -1e4, py = -1e4, pointerIn = false, lensAmt = 0;
  var INTRO_END = 2.4;

  function frame(now) {
    if (t0 === null) t0 = now;
    var t = (now - t0) / 1000;
    var size = parseFloat(h1.style.getPropertyValue('--name-size')) || 100;
    var R = size * 0.85;
    var sh = stage.offsetHeight;
    var scrollP = clamp(scrollY / (sh * 0.9), 0, 1);

    if (scrollP >= 1 && t > INTRO_END + 1) { running = false; return; } // covered by the page: sleep

    lensAmt += ((pointerIn && t > INTRO_END ? 1 : 0) - lensAmt) * 0.08;

    // one layout read per frame: the stage rect, plus the h1's scroll offset
    var stageRect = null, h1ty = 0;
    if (lensAmt > 0.001) {
      stageRect = stage.getBoundingClientRect();
      h1ty = scrollP > 0 ? -scrollP * 60 : 0; // same value the h1 transform gets below
    }

    for (var i = 0; i < chars.length; i++) {
      var c = chars[i];
      var local = t - c.start;

      // intro: slide up through the mask, width + weight spring into place
      var y = (1 - outExpo(clamp(local / 0.75, 0, 1))) * 110;
      var v = spring(local);
      var baseWd = 100 + (62 - 100) * v, baseWg = 800 + (100 - 800) * v;
      if (local < 0) { baseWd = 62; baseWg = 100; }

      // alive state after the intro
      var settle = clamp((t - INTRO_END) / 1.2, 0, 1);
      var wave = 0.5 + 0.5 * Math.sin(t * 1.3 - (c.idx + c.line * 3) * 0.55);
      var waveAmt = (1 - lensAmt) * settle * 0.32 * wave;

      var lens = 0;
      if (stageRect) {
        var dx = (stageRect.left + c.cx) - px, dy = (stageRect.top + c.cy + h1ty) - py;
        lens = Math.exp(-(dx * dx + dy * dy) / (R * R)) * lensAmt;
      }
      var k = Math.max(waveAmt, lens);
      var tWd = Math.min(baseWd, 104) - 34 * k - 26 * scrollP;
      var tWg = baseWg - 640 * k;

      // light smoothing so the lens feels weighted, not twitchy
      c.wd += (tWd - c.wd) * (t < INTRO_END ? 1 : 0.18);
      c.wg += (tWg - c.wg) * (t < INTRO_END ? 1 : 0.18);
      c.el.style.transform = 'translate3d(0,' + y.toFixed(2) + '%,0)';
      c.el.style.fontVariationSettings = '"wdth" ' + clamp(c.wd, 62, 125).toFixed(1) + ', "wght" ' + clamp(c.wg, 100, 900).toFixed(0);
    }
    h1.style.transform = scrollP > 0 ? 'translate3d(0,' + (-scrollP * 60).toFixed(1) + 'px,0)' : '';
    if (visible) requestAnimationFrame(frame); else running = false;
  }
  var running = false;
  function run() { if (!running) { running = true; requestAnimationFrame(frame); } }

  /* ---------- wiring ---------- */
  function start() {
    initRotator();
    if (reduce) {
      chars.forEach(function (c) { c.el.style.transform = 'none'; c.el.style.fontVariationSettings = '"wdth" 100, "wght" 800'; });
      fit();
      chars.forEach(function (c) { c.el.style.fontVariationSettings = '"wdth" 100, "wght" 800'; });
      stage.classList.add('is-in', 'is-settled');
      setInterval(nextWord, 3000);
      return;
    }
    fit();
    requestAnimationFrame(function () {
      stage.classList.add('is-in');
      [].forEach.call(stage.querySelectorAll('[data-scramble]'), function (el, i) { scramble(el, 200 + i * 160); });
      setTimeout(showBox, 1450);
      setTimeout(function () { stage.classList.add('is-settled'); }, 3600);
      setTimeout(function () { nextWord(); setInterval(nextWord, 2400); }, 3200);
      run();
    });
  }

  if (fine && !reduce) {
    stage.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; pointerIn = true; });
    stage.addEventListener('pointerleave', function () { pointerIn = false; });
  }
  if ('IntersectionObserver' in window && !reduce) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && t0 !== null) run(); }).observe(stage);
  }
  addEventListener('scroll', function () { if (t0 !== null && scrollY < stage.offsetHeight * 0.9) run(); }, { passive: true });
  var rz;
  addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(fit, 120); });
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { fit(); });

  var ready = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('800 100px Archivo'), document.fonts.ready]).catch(function () {})
    : Promise.resolve();
  // never hold the hero hostage to a slow font
  Promise.race([ready, new Promise(function (r) { setTimeout(r, 1500); })]).then(start);
})();
