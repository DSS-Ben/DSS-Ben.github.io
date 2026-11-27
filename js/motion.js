/* Motion layer — Apple-style scroll choreography.
   Everything here is a pure function of scroll position (no timers),
   so it scrubs forwards and backwards smoothly.
   - Hero zooms back and fades as the page slides up over it
   - Pinned statement lights up word by word
   - Cards rise and scale into place; their images drift (parallax)
   - Contact tile grows into place
   - Section titles rise through a mask; numbers count up; buttons are magnetic */
(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('reduced');
    return;
  }
  var canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  var hero = document.querySelector('.hero');
  var heroLayers = hero ? [hero.querySelector('.hero-stage'), hero.querySelector('.ticker')] : [];
  var statement = document.querySelector('.statement');
  var stWords = statement ? [].slice.call(statement.querySelectorAll('.statement-text > span')) : [];
  var stText = statement && statement.querySelector('.statement-text');
  var contact = document.querySelector('.contact-card');

  /* cards: hand them from the reveal system to the scroll system */
  var cards = [].map.call(document.querySelectorAll('#work .card'), function (c) {
    c.removeAttribute('data-reveal'); c.classList.add('is-scroll');
    return { el: c, media: c.querySelector('.card-media img, .card-media video') };
  });
  if (contact) { contact.removeAttribute('data-reveal'); contact.classList.add('is-scroll'); }

  var vh = innerHeight;
  function update() {
    vh = innerHeight;
    var y = scrollY;

    /* 1. hero recedes */
    if (hero) {
      var hp = clamp(y / (hero.offsetHeight * 0.9), 0, 1), e = ease(hp);
      heroLayers.forEach(function (l) {
        if (!l) return;
        l.style.transform = 'translate3d(0,' + (-e * 40).toFixed(1) + 'px,0) scale(' + (1 - e * 0.08).toFixed(4) + ')';
        l.style.opacity = (1 - e * 0.85).toFixed(3);
      });
      hero.style.visibility = hp >= 1 && y > hero.offsetHeight * 1.5 ? 'hidden' : '';
    }

    /* 2. pinned statement */
    if (statement) {
      var r = statement.getBoundingClientRect();
      var sp = clamp(-r.top / (r.height - vh), 0, 1);
      var n = stWords.length, lit = sp * (n + 0.6);
      stWords.forEach(function (w, i) {
        var o = clamp(lit - i, 0, 1);
        w.style.setProperty('--o', (0.1 + o * 0.9).toFixed(3));
        w.style.setProperty('--y', ((1 - ease(o)) * 0.12).toFixed(3) + 'em');
      });
      if (stText) stText.style.transform = 'scale(' + (0.94 + 0.06 * ease(clamp(sp * 2.5, 0, 1))).toFixed(4) + ')';
    }

    /* 3. cards rise + scale, images drift */
    cards.forEach(function (c) {
      var r = c.el.getBoundingClientRect();
      if (r.top > vh + 100 || r.bottom < -100) return;
      var enter = ease(clamp((vh - r.top) / (vh * 0.5), 0, 1));
      c.el.style.transform = 'translate3d(0,' + ((1 - enter) * 80).toFixed(1) + 'px,0) scale(' + (0.9 + enter * 0.1).toFixed(4) + ')';
      c.el.style.opacity = (0.15 + enter * 0.85).toFixed(3);
      if (c.media) {
        var centre = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 across the screen
        c.media.style.setProperty('--py', (centre * -7).toFixed(2) + '%');
      }
    });

    /* 4. contact tile grows in */
    if (contact) {
      var cr = contact.getBoundingClientRect();
      var cp = ease(clamp((vh - cr.top) / (vh * 0.7), 0, 1));
      contact.style.transform = 'scale(' + (0.88 + cp * 0.12).toFixed(4) + ')';
      contact.style.borderRadius = (64 - cp * 36).toFixed(1) + 'px';
    }
  }

  var queued = false;
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; update(); }); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();

  /* 5. titles rise through a mask, numbers count up */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el);
        el.classList.add('in');
        if (el.hasAttribute('data-count')) {
          var to = +el.getAttribute('data-count'), from = +el.getAttribute('data-from') || 0, t0 = performance.now();
          (function tick(now) {
            var p = clamp((now - t0) / 1400, 0, 1);
            el.textContent = Math.round(from + (to - from) * ease(p));
            if (p < 1) requestAnimationFrame(tick);
          })(t0);
        }
      });
    }, { threshold: 0.4 });
    [].forEach.call(document.querySelectorAll('.rise, [data-count]'), function (el) { io.observe(el); });
  } else {
    [].forEach.call(document.querySelectorAll('.rise'), function (el) { el.classList.add('in'); });
  }

  /* 6. magnetic buttons */
  if (canHover) {
    [].forEach.call(document.querySelectorAll('.btn, .header-cv, .hero-cue, .filter'), function (b) {
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      function step() {
        cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
        b.style.translate = cx.toFixed(2) + 'px ' + cy.toFixed(2) + 'px';
        raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(step) : null;
      }
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * 0.25; ty = (e.clientY - r.top - r.height / 2) * 0.35;
        if (!raf) raf = requestAnimationFrame(step);
      });
      b.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(step); });
    });
  }
})();
