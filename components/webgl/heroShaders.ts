// OGL fullscreen-triangle passthrough. `position`/`uv` come from OGL's
// default Triangle geometry — no camera/projection matrices needed.
export const heroVertexShader = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Liquid displacement + chromatic aberration + grain + vignette. Keep
// amt/ca low (see lib usage) — this should read as "subtly alive," not
// melting. Reused (with weaker amt/ca) for the Scene 2 rail transitions
// so the whole site shares one visual signature.
export const heroFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform vec2  uMouse;      // lerped mouse, -0.5..0.5
uniform float uTime;
uniform float uHover;      // 0..1, eases in on pointer enter
uniform vec2  uResolution;
uniform vec2  uImageSize;  // for cover-fit
varying vec2 vUv;

// cheap 2D noise
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0,0.0));
  float c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
}

// cover-fit uv so the image fills without stretching. Horizontal cropping
// stays centered; vertical cropping is anchored to the top of the source
// image instead (cropping from the bottom) — hero.jpg is a tall portrait
// with the subject's head and the wordmark's headroom both near the top,
// so on a wide/short viewport (s.y > 1, needs to crop top/bottom) a plain
// center-crop can cut the head clean off. Assumes v=1 is the image's top
// edge (OGL's default flipY:true texture convention). When s.y == 1 (no
// vertical crop needed) this is a no-op, identical to a center-crop.
vec2 coverUv(vec2 uv, vec2 res, vec2 img){
  float rS = res.x/res.y, rI = img.x/img.y;
  vec2 s = (rS < rI) ? vec2(rI/rS, 1.0) : vec2(1.0, rS/rI);
  float x = (uv.x - 0.5) / s.x + 0.5;
  float y = uv.y / s.y + (1.0 - 1.0 / s.y);
  return vec2(x, y);
}

void main() {
  vec2 uv = coverUv(vUv, uResolution, uImageSize);

  // slow ambient flow + mouse-driven displacement
  float n = noise(uv * 3.0 + uTime * 0.05);
  vec2 disp = vec2(n - 0.5);
  disp += uMouse * 0.06 * uHover;          // pointer push
  float amt = 0.012 + 0.02 * uHover;       // stronger on hover
  vec2 duv = uv + disp * amt;

  // chromatic aberration — split RGB along displacement
  float ca = 0.004 + 0.006 * uHover;
  float r = texture2D(uTexture, duv + disp * ca).r;
  float g = texture2D(uTexture, duv).g;
  float b = texture2D(uTexture, duv - disp * ca).b;
  vec3 col = vec3(r, g, b);

  // film grain
  float grain = hash(vUv * uResolution + uTime) * 0.06 - 0.03;
  col += grain;

  // subtle vignette to seat it in the dark bg
  float vig = smoothstep(1.2, 0.3, length(vUv - 0.5));
  col *= mix(0.85, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;
