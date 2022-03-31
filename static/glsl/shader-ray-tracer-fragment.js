import { glsl } from './glsl.js';

const fsSource = glsl`

//
// ─── FRAGMENT SHADER DEL RAY TRACER ─────────────────────────────────────────────
//    

/* Fragment shader that renders Mandelbrot set */
precision mediump float;

/* TODO Poner aqui las variables uniform que se vayan a usar */
/* Point on the complex plane that will be mapped to the center of the screen */
//uniform vec2 u_zoomCenter;

/* Distance between left and right edges of the screen. This essentially specifies
   which points on the plane are mapped to left and right edges of the screen.
  Together, u_zoomCenter and u_zoomSize determine which piece of the complex
   plane is displayed. */
//uniform float u_zoomSize;

/* How many iterations to do before deciding that a point is in the set. */
//uniform int u_maxIterations;

/* Fixed c value in Julia set Equation z^n + c */
//uniform vec2 u_juliaSetConstant;

/* Fixed n value in Julia/Mandelbrot set Equation */
//uniform int u_order;

/* Render Mandelbrot or Julia set */
//uniform int u_fractal; 


void main() {
    // Inicialmente renderizar todo azul
    gl_FragColor = vec4(vec3(0.5,0.7,1.0),1.0);
}

// ────────────────────────────────────────────────────────────────────────────────


`;

export {fsSource}