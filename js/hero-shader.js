// =============================================
//  SKAPPA – Hero Aurora Shader (WebGL)
//  Effetto aurora/onde animato sopra l'hero bg
// =============================================
(function () {
  'use strict';

  // Rispetta prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.getElementById('heroShader');
  if (!canvas) return;

  var gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    powerPreference: 'low-power'
  });
  if (!gl) return; // fallback CSS gradient

  // ---- Vertex shader ----
  var VS = [
    'attribute vec2 a_pos;',
    'void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  // ---- Fragment shader: FBM aurora ----
  var FS = [
    'precision mediump float;',
    'uniform float uTime;',
    'uniform vec2 uRes;',

    // Hash 2D→1D
    'float h21(vec2 p) {',
    '  p = fract(p * vec2(127.1, 311.7));',
    '  p += dot(p, p + 74.31);',
    '  return fract(p.x * p.y);',
    '}',

    // Smooth value noise
    'float sn(vec2 p) {',
    '  vec2 i = floor(p), f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  return mix(',
    '    mix(h21(i), h21(i + vec2(1.0,0.0)), f.x),',
    '    mix(h21(i + vec2(0.0,1.0)), h21(i + vec2(1.0,1.0)), f.x),',
    '    f.y);',
    '}',

    // FBM – 5 ottave
    'float fbm(vec2 p) {',
    '  float v = 0.0, a = 0.5;',
    '  for (int i = 0; i < 5; i++) { v += a * sn(p); p *= 2.1; a *= 0.5; }',
    '  return v;',
    '}',

    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / uRes;',
    '  float t = uTime * 0.065;',

    // Due livelli di warp per effetto fluido organico
    '  vec2 q = vec2(fbm(uv * 2.2 + t), fbm(uv * 2.2 + vec2(1.7, 9.2) + t * 0.75));',
    '  vec2 r = vec2(',
    '    fbm(uv * 2.0 + 2.2 * q + vec2(1.7, 9.2) + 0.13 * t),',
    '    fbm(uv * 2.0 + 2.2 * q + vec2(8.3, 2.8) + 0.11 * t)',
    '  );',
    '  float f = fbm(uv + 3.2 * r);',

    // Banda aurora: concentrata nella parte medio-alta
    '  float band = smoothstep(0.0, 0.65, uv.y) * smoothstep(1.0, 0.32, uv.y);',

    // Palette SKAPPA
    '  vec3 navy = vec3(0.012, 0.063, 0.188);',   // #031030
    '  vec3 teal = vec3(0.157, 0.525, 0.600);',   // #288699
    '  vec3 gold = vec3(0.996, 0.745, 0.255);',   // #febd41

    '  vec3 col = mix(navy, teal, clamp(f * 2.4, 0.0, 1.0));',
    '  col = mix(col, gold, clamp((f - 0.42) * 1.9, 0.0, 1.0) * 0.55);',

    '  float alpha = clamp((f * 0.88 + 0.06) * band, 0.0, 0.52);',
    '  gl_FragColor = vec4(col, alpha);',
    '}'
  ].join('\n');

  // ---- Compile shader ----
  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[SKAPPA shader]', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VS);
  var fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[SKAPPA shader] link failed');
    return;
  }

  // ---- Geometry: fullscreen quad ----
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  gl.useProgram(prog);
  var posLoc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // ---- Blending (alpha compositing) ----
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  var uTime = gl.getUniformLocation(prog, 'uTime');
  var uRes  = gl.getUniformLocation(prog, 'uRes');
  var W = 1, H = 1;

  function resize() {
    var hero = canvas.parentElement;
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
    gl.viewport(0, 0, W, H);
  }

  var t0 = performance.now();
  var frameCount = 0;

  function render() {
    // Riduci FPS a ~30 per risparmiare batteria (frame skip)
    frameCount++;
    if (frameCount % 2 !== 0) { requestAnimationFrame(render); return; }

    if (document.visibilityState !== 'hidden') {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.uniform2f(uRes, W, H);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  render();
})();
