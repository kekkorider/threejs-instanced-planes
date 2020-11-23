precision highp float;

varying vec3 vUv;
uniform float u_Time;
uniform float u_colorsSpeed;
uniform float u_Radius;
uniform float u_Blur;
uniform vec3 u_Color1;
uniform vec3 u_Color2;

float Circle(in vec2 st, in float radius, in float blur){
  return 1. - smoothstep(radius - (radius*blur), radius+(radius*blur), dot(st,st) * 4.0);
}

// Simplex 2D noise
//
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec3 uv = vUv;

  float mask = Circle(uv.xy, u_Radius, u_Blur);

  float time = u_Time*u_colorsSpeed;

  float n0 = snoise(vec2(uv.x*1.6+time*0.23, uv.y*3.0 - time*0.12));
  float n1 = snoise(vec2(uv.x*3.3 + time*0.3, uv.y*2.6 - time*0.2));

  uv += n0;

  vec3 color = mix(u_Color1, u_Color2, n1)*mask;

  gl_FragColor = vec4(color*n0*mask, n0*mask);
}
