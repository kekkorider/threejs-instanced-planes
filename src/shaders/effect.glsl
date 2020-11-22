precision highp float;

#include './utils.glsl'

float Circle(in vec2 st, in float radius, in float blur){
  return 1. - smoothstep(radius - (radius*blur), radius+(radius*blur), dot(st,st) * 4.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;

  float mask = Circle(uv - 0.5, 0.75, 0.4);

  float n = snoise(vec2(uv.x + iTime*0.2, uv.y*3.0 - iTime*0.2));

  uv += n;

  vec3 color = vec3(uv, 0.5)*mask;

  gl_FragColor = vec4(color*n*mask, n*mask);
}
