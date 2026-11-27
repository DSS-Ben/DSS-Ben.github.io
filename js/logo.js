(function () {
  /* ---------- Config ---------- */
  var PHRASES = [
    { el: "ba-logo-a", text: "Ben Alvis",      wStart: 560, wEnd: 900 }, // heavy emphasis
    { el: "ba-logo-b", text: "Graphic Design", wStart: 480, wEnd: 720 }  // bold, one step lighter
  ];
  var TRACK_WIDE  = 0.035;   // em, tracking on arrival
  var TRACK_TIGHT = -0.045;  // em, tracking after the snap
  var STAGGER = 0.032;       // s between letters
  var ENTER   = 0.62;        // s per letter rise
  var SNAP_AT = 0.56;        // s after phrase start when the snap fires
  var HOLD_TO = 2.9;         // s after phrase start when exit begins
  var EXIT    = 0.42;        // s per letter exit
  var NEXT    = 0.16;        // s after exit begins that the next phrase enters (overlap)
  var SLOT    = HOLD_TO + NEXT;          // each phrase owns this much of the loop
  var CYCLE   = SLOT * PHRASES.length;   // full loop length
  var HIDE    = 1.4;                     // em, offscreen offset

  var root = document.querySelector(".ba-logo");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Build letters ---------- */
  PHRASES.forEach(function (p, i) {
    p.node = document.getElementById(p.el);
    p.chars = p.text.split("").map(function (c) {
      var s = document.createElement("span");
      s.className = "ba-logo__ch";
      s.textContent = c;
      p.node.appendChild(s);
      return s;
    });
    p.start = i * SLOT;
  });

  /* ---------- Easing ---------- */
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function outExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function inQuart(t) { return t * t * t * t; }
  // stiff, lightly-underdamped spring: 1 → 0 with one crisp overshoot
  function snap(tau) { return tau <= 0 ? 1 : Math.exp(-13 * tau) * Math.cos(28 * tau); }

  /* ---------- Pure render: state is a function of loop time only ---------- */
  function renderPhrase(p, t) {
    // pick the occurrence of this phrase nearest to t (handles wrap-around exit)
    var local = t - p.start;
    if (local < -NEXT * 4) local += CYCLE;
    if (local > CYCLE - NEXT * 4) local -= CYCLE;

    var n = p.chars.length;
    for (var i = 0; i < n; i++) {
      var y;
      if (local < HOLD_TO) {
        var e = clamp((local - i * STAGGER) / ENTER);
        y = (1 - outExpo(e)) * HIDE;
      } else {
        var x = clamp((local - HOLD_TO - i * STAGGER * 0.7) / EXIT);
        y = -inQuart(x) * HIDE;
      }
      p.chars[i].style.transform = "translate3d(0," + y.toFixed(4) + "em,0)";
    }

    // the snap: tracking collapses and weight locks in, with one overshoot
    var v = snap(local - SNAP_AT);
    var track = TRACK_TIGHT + (TRACK_WIDE - TRACK_TIGHT) * v;
    var weight = p.wEnd - (p.wEnd - p.wStart) * Math.max(v, 0);
    p.node.style.letterSpacing = track.toFixed(4) + "em";
    p.node.style.fontWeight = Math.round(weight);
  }

  function render(t) {
    t = ((t % CYCLE) + CYCLE) % CYCLE;
    for (var i = 0; i < PHRASES.length; i++) renderPhrase(PHRASES[i], t);
  }

  /* ---------- Logo size: fixed, small — width locked once so the snap never moves the nav ---------- */
  function fit() {
    var size = window.innerWidth <= 600 ? 15 : 17;
    var probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;left:0;top:0;font-family:\"Archivo\",\"Helvetica Neue\",Arial,sans-serif;font-size:" + size + "px;font-weight:720;letter-spacing:-0.045em;white-space:pre;padding:0.12em;";
    probe.textContent = "Graphic Design";
    document.body.appendChild(probe);
    root.style.width = (probe.getBoundingClientRect().width + 2) + "px";
    document.body.removeChild(probe);
    PHRASES.forEach(function (p) { p.node.style.fontSize = size + "px"; });
  }

  /* ---------- Clock (pauses offscreen / hidden tab, no drift) ---------- */
  var clock = 0, last = null, running = true;
  function frame(now) {
    if (last !== null && running) clock += Math.min((now - last) / 1000, 0.1);
    last = now;
    render(clock);
    requestAnimationFrame(frame);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { running = es[0].isIntersecting; }).observe(root);
  }

  /* ---------- Reduced motion: no travel, gentle swap ---------- */
  function reducedLoop() {
    PHRASES.forEach(function (p) {
      p.chars.forEach(function (c) { c.style.transform = "none"; });
      p.node.style.letterSpacing = TRACK_TIGHT + "em";
      p.node.style.fontWeight = p.wEnd;
      p.node.style.transition = "opacity .5s ease";
      p.node.style.opacity = 0;
    });
    var k = 0;
    PHRASES[0].node.style.opacity = 1;
    setInterval(function () {
      PHRASES[k].node.style.opacity = 0;
      k = (k + 1) % PHRASES.length;
      PHRASES[k].node.style.opacity = 1;
    }, SLOT * 1000);
  }

  function start() {
    fit();
    if (reduce) { reducedLoop(); return; }
    requestAnimationFrame(frame);
  }
  var rT;
  window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(fit, 80); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else window.addEventListener("load", start);

  // optional: window.baLogoSeek(seconds) for frame-exact capture / scrubbing
  window.baLogoSeek = function (s) { running = false; clock = s; render(s); };
})();
