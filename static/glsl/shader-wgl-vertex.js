import { glsl } from './glsl.js';

const vsSource = glsl`
//
// ─── CODIGO DEL VERTEX SHADER ───────────────────────────────────────────────────
//    

precision highp float;
attribute vec2 a_Position;
void main() {
  gl_Position = vec4(a_Position.x, a_Position.y, 0.0, 1.0);
}

// ────────────────────────────────────────────────────────────────────────────────


`;

export {vsSource}
