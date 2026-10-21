/* NASTY hero — WebGL bloom shader. Vanilla, no dependencies. */
(function () {
const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `precision highp float;
uniform vec2 u_res; uniform float u_time; uniform float u_grain; uniform float u_dpr;
uniform float u_crestBase; uniform float u_peakCap; uniform float u_oct; uniform vec2 u_mouse;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), u.x),
             mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 4; k++) { if (float(k) >= u_oct) break; v += a * vnoise(p); p = p * 2.03 + 17.3; a *= 0.5; }
  return v;
}
// fbm is tightly centred on ~0.462; remap so a term genuinely spans [-1, 1]
float snz(vec2 p){ return clamp((fbm(p) - 0.471) / 0.125, -1.0, 1.0); }

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  uv.y = 1.0 - uv.y;
  float t = u_time;

  // cursor lean: offsets the noise lookup only — never the contour height or the ramp
  vec2 nuv = uv + (u_mouse - 0.5) * 0.06;

  float x = uv.x;
  float nx = nuv.x;

  // ---- four travelling lobes of differing height and width (one notably tallest)
  float pulse = 1.0 + 0.10 * sin(t * 0.571);          // ~11s vertical amplitude modulation
  float phase2 = sin(t * 0.370);                      // ~17s secondary octave phase

  // two broad soft lobes; a smooth (p-norm) max rounds the trough between them
  // instead of the V-shaped crease a hard max() produces
  float c1 = 0.28 + 0.050 * sin(t * 0.0402);
  float c2 = 0.78 + 0.055 * sin(t * 0.0247 + 3.1);
  float g1 = 0.190 * exp(-pow((x - c1) / 0.330, 2.0));
  float g2 = 0.205 * exp(-pow((x - c2) / 0.310, 2.0));
  float rise = pow(pow(g1, 4.0) + pow(g2, 4.0), 0.25);

  // irregular scalloping so the contour never reads as periodic
  float scallop = 0.050 * snz(vec2(nx * 2.9 + t * 0.088, t * 0.052))
                + 0.028 * snz(vec2(nx * 6.1 - t * 0.061, 4.3 + phase2))
                + 0.018 * snz(vec2(nx * 1.1 + t * 0.024, 8.9));

  float riseN = clamp(rise / 0.205, 0.0, 1.0);
  float crest = u_crestBase - (rise * pulse) - scallop * 0.30;
  crest = clamp(crest, u_peakCap, u_crestBase + 0.04);

  // single smooth rise below the contour — no edge highlight, no bright tracing line
  float v = smoothstep(crest, min(crest + 0.52, 1.16), uv.y);
  v = pow(v, 1.5);
  v *= 0.80 + 0.24 * riseN;

  // hold the hottest values through the very bottom edge so nothing dies before y = 1.0
  v = max(v, smoothstep(0.84, 1.0, uv.y) * (0.62 + 0.30 * riseN));

  // lateral breathing of intensity
  float lat = 0.78 + 0.38 * fbm(vec2(nx * 2.3 - t * 0.067, 13.7 + t * 0.039));
  v *= clamp(lat, 0.0, 1.22);
  v = clamp(v, 0.0, 1.0);

  float rv = pow(v, 1.6);
  vec3 c = vec3(0.020, 0.020, 0.020);                                  // #050505
  c = mix(c, vec3(0.165, 0.020, 0.012), smoothstep(0.00, 0.28, rv));   // #2A0503
  c = mix(c, vec3(0.478, 0.031, 0.024), smoothstep(0.12, 0.52, rv));   // #7A0806
  c = mix(c, vec3(0.831, 0.071, 0.043), smoothstep(0.36, 0.74, rv));   // #D4120B
  c = mix(c, vec3(1.000, 0.180, 0.039), smoothstep(0.58, 0.90, rv));   // #FF2E0A
  c = mix(c, vec3(1.000, 0.416, 0.078), smoothstep(0.78, 0.97, rv));   // #FF6A14
  c = mix(c, vec3(1.000, 0.651, 0.122), smoothstep(0.92, 1.00, rv));   // #FFA61F

  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  float ramp = smoothstep(0.015, 0.17, v) * (1.0 - smoothstep(0.55, 0.92, v));
  c += (dither - 0.5) * u_grain * (0.40 + 2.10 * ramp);

  gl_FragColor = vec4(max(c, 0.0), 1.0);
}`;

  function boot(root) {
    if (root.__nastyBooted) return;
    root.__nastyBooted = true;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cvs = root.querySelector('[data-bloom-canvas]');
    if (!cvs) return;

    /* CSS masks need a same-origin data URI in some browsers; inline both marks. */
    function inlineMask(url, targets) {
      if (!url || !targets.length) return;
      fetch(url).then(function (r) { return r.text(); }).then(function (txt) {
        var svg = txt
          .replace(/<metadata>[\s\S]*?<\/metadata>/, '')
          .replace(/class="st0"/g, 'fill="#ffffff"')
          .replace(/<style>[\s\S]*?<\/style>/g, '');
        if (!/\swidth=/.test(svg)) {
          var vb = svg.match(/viewBox="([\d.\-\s]+)"/);
          var w = 360, h = 360;
          if (vb) { var n = vb[1].trim().split(/\s+/).map(Number); if (n.length === 4) { w = n[2]; h = n[3]; } }
          svg = svg.replace('<svg ', '<svg width="' + w + '" height="' + h + '" ');
        }
        var u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        targets.forEach(function (el) {
          el.style.webkitMaskImage = 'url("' + u + '")';
          el.style.maskImage = 'url("' + u + '")';
          el.style.webkitMaskRepeat = 'no-repeat';
          el.style.maskRepeat = 'no-repeat';
          el.style.webkitMaskPosition = '50%';
          el.style.maskPosition = '50%';
          el.style.webkitMaskSize = 'contain';
          el.style.maskSize = 'contain';
        });
      }).catch(function () {});
    }
    inlineMask(root.getAttribute('data-wordmark'), Array.prototype.slice.call(root.querySelectorAll('[data-anim="mark"] > div')));
    inlineMask(root.getAttribute('data-mark'), Array.prototype.slice.call(root.querySelectorAll('[data-smallmark] > div')));

    var gl = cvs.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power' })
          || cvs.getContext('experimental-webgl');
    if (!gl) return fallback();

    function fallback() {
      cvs.style.display = 'none';
      var a = root.querySelector('[data-bloom-fallback]');
      if (a) a.style.display = 'block';
    }

    function mk(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    var vs = mk(gl.VERTEX_SHADER, VERT), fs = mk(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return fallback();
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fallback();
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {
      res: gl.getUniformLocation(prog, 'u_res'),
      time: gl.getUniformLocation(prog, 'u_time'),
      grain: gl.getUniformLocation(prog, 'u_grain'),
      dpr: gl.getUniformLocation(prog, 'u_dpr'),
      crest: gl.getUniformLocation(prog, 'u_crestBase'),
      peak: gl.getUniformLocation(prog, 'u_peakCap'),
      oct: gl.getUniformLocation(prog, 'u_oct'),
      mouse: gl.getUniformLocation(prog, 'u_mouse')
    };

    var grain = parseFloat(root.getAttribute('data-dither') || '0.012');
    var speed = parseFloat(root.getAttribute('data-flow-speed') || '1');
    var env = {};
    function readEnv() {
      var w = window.innerWidth;
      env.mobile = w <= 809;
      env.tablet = w > 809 && w < 1280;
      env.dpr = Math.min(window.devicePixelRatio || 1, env.mobile ? 1.5 : 2);
      env.oct = env.mobile ? 2.0 : 4.0;
      if (env.mobile) { env.crestBase = 0.450; env.peakCap = 0.220; }
      else if (env.tablet) { env.crestBase = 0.430; env.peakCap = 0.200; }
      else { env.crestBase = 0.420; env.peakCap = 0.190; }
    }
    readEnv();

    function resize() {
      var r = root.getBoundingClientRect();
      var cw = cvs.clientWidth || r.width, ch = cvs.clientHeight || r.height;
      if (r.width && Math.abs(cw - r.width) > 1) cw = r.width;
      if (r.height && Math.abs(ch - r.height) > 1) ch = r.height;
      if (!cw || !ch) return;
      var w = Math.round(cw * env.dpr), h = Math.round(ch * env.dpr);
      if (cvs.width !== w || cvs.height !== h) { cvs.width = w; cvs.height = h; gl.viewport(0, 0, w, h); }
    }

    var mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (fine && !reduced) {
      root.addEventListener('mousemove', function (e) {
        var r = root.getBoundingClientRect();
        if (!r.width || !r.height) return;
        tmx = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
        tmy = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
      }, { passive: true });
    }

    var t0 = performance.now();
    function frame() {
      resize();
      if (!cvs.width || !cvs.height) return;
      var t = reduced ? 42.0 : ((performance.now() - t0) / 1000) * speed;
      mx += (tmx - mx) * 0.04;
      my += (tmy - my) * 0.04;
      gl.uniform2f(U.res, cvs.width, cvs.height);
      gl.uniform1f(U.time, t);
      gl.uniform1f(U.grain, grain);
      gl.uniform1f(U.dpr, env.dpr);
      gl.uniform1f(U.crest, env.crestBase);
      gl.uniform1f(U.peak, env.peakCap);
      gl.uniform1f(U.oct, env.oct);
      gl.uniform2f(U.mouse, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    if (window.ResizeObserver) { new ResizeObserver(resize).observe(cvs); }
    var onEnv = function () { readEnv(); resize(); };
    window.addEventListener('resize', onEnv);
    window.addEventListener('orientationchange', onEnv);

    resize();
    frame();
    setTimeout(resize, 0);

    if (!reduced) {
      /* rAF is throttled when the tab/section is not visible; a timer keeps the
         first paint correct and the watchdog re-arms it if frames stop landing. */
      var last = Date.now();
      var tick = setInterval(function () {
        if (!cvs.isConnected) { clearInterval(tick); return; }
        frame(); last = Date.now();
      }, 1000 / 30);
      setInterval(function () {
        if (cvs.isConnected && Date.now() - last > 400) frame();
      }, 500);
    }
  }

  function init() {
    document.querySelectorAll('[data-nasty-hero]').forEach(boot);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  /* Shopify theme editor: re-init when the section is reloaded */
  document.addEventListener('shopify:section:load', function (e) {
    var el = e.target.querySelector ? e.target.querySelector('[data-nasty-hero]') : null;
    if (el) { el.__nastyBooted = false; boot(el); }
  });
})();
