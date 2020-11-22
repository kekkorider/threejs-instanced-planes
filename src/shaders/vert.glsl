varying vec3 vUv;

void main() {
  vec4 mvPosition = vec4(position, 1.0 );
  mvPosition = instanceMatrix * mvPosition;

  // vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  vec4 modelViewPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * modelViewPosition;

  vUv = position;
}
