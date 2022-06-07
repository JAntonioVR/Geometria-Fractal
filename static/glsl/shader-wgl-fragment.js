import { glsl } from './glsl.js';

const fsSource = glsl`

//
// ─── CODIGO DEL FRAGMENT SHADER ─────────────────────────────────────────────────
//

/* Fragment shader that renders Mandelbrot set */
precision mediump float;

/* Point on the complex plane that will be mapped to the center of the screen */
uniform vec2 u_zoomCenter;

/* Distance between left and right edges of the screen. This essentially specifies
   which points on the plane are mapped to left and right edges of the screen.
  Together, u_zoomCenter and u_zoomSize determine which piece of the complex
   plane is displayed. */
uniform float u_zoomSize;

/* How many iterations to do before deciding that a point is in the set. */
uniform int u_maxIterations;

/* Fixed c value in Julia set Equation z^n + c */
uniform vec2 u_juliaSetConstant;

/* Fixed n value in Julia/Mandelbrot set Equation */
uniform int u_order;

/* Render Mandelbrot or Julia set */
uniform int u_fractal;

/* Antiliasing */
uniform bool u_antiliasing;
uniform int u_nSamples;

float r = 16.0/9.0; // Ratio r = width/height
int viewportWidth = 1280,   // Canvas width (pixels)
    viewportHeight = 720;   // Canvas height (pixels)

//
// ─── COMPLEX POW ────────────────────────────────────────────────────────────────
//  
vec2 complex_pow(vec2 z, int n) {
  vec2 current_pow = vec2(1.0, 0.0);
  for (int i = 1; i < 100; i++) {
    vec2 z_ant = current_pow;
    current_pow = vec2(z_ant.x*z.x - z_ant.y*z.y, z_ant.x*z.y + z_ant.y*z.x);
    if(i >= n) break;
  }
  return current_pow;
}

//
// ─── P(z) ───────────────────────────────────────────────────────────────────────
// Función que se itera para generar los conjuntos de Julia y Mandelbrot
// Parametros:
//  vec2 z: Variable que toma la función
//  vec2 c: Constante c de la función z^n +c
//  int n:  Exponente al que se eleva la variable
// Devuelve: Una variable vec2 resultado de la operación z^n+c

vec2 P(vec2 z, vec2 c, int n) {
	return complex_pow(z,n) + c;
}

/*vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b*cos( 6.28318*(c*t+d) );
}*/

vec3 palette(float t, vec3 c1, vec3 c2, vec3 c3, vec3 c4) {
  float x = 1.0 / 3.0;
  if (t < x) return mix(c1, c2, t/x);
  else if (t < 2.0 * x) return mix(c2, c3, (t - x)/x);
  else if (t < 3.0 * x) return mix(c3, c4, (t - 2.0*x)/x);
  return c4;
}

// Decide which point on the complex plane this fragment corresponds to.
vec2 get_world_coordinates(int i, int nSamples) {

  float hw = 1.0 / (float(viewportWidth * nSamples)),
        hh = 1.0 / (float(viewportHeight * nSamples));

  float height = 4.0,
        width = float(r)*height;

  int x =  i/nSamples;
  int y =  i - nSamples*x;

  vec2 uv = (gl_FragCoord.xy) / vec2(float(viewportWidth), float(viewportHeight));
  float u = uv.x + float(x) * hw + 0.5 * hw,
        v = uv.y + float(y) * hh + 0.5 * hh;
  return u_zoomCenter + u_zoomSize * vec2(u*width-width/2.0, v*height-height/2.0);
}

vec4 computePixelColor(bool escaped, int iterations) {
    return escaped ? vec4(palette(
      float(iterations)/ float(u_maxIterations),
      vec3(0.109,0.109,0.647), // #1C1CA5
      //vec3(0.5,0.7,1.0),        // azul
      vec3(0.823, 0.411, 0.0), // #D26900
      vec3(0.769, 0.659, 0.0), // #C4A800
      vec3(0.627,0.878,0.043)  // #A0E00B
      ), 
      1.0) : vec4(vec3(0.0,0.0,0.0), 1.0);
}

void iterateJulia(vec2 z0, vec2 c, int n, out bool escaped, out int iterations) {
  vec2 z = z0;
  escaped = false;
  for(int i = 0; i < 10000; i++) {
    if(i == u_maxIterations) break;
    iterations = i;
    z = P(z, c, n);
    if (length(z) > 2.0){
        escaped = true;
        break;
    }
  }
}

vec4 Julia(vec2 c, int n) {
  vec4 sum_colors = vec4(0.0, 0.0, 0.0, 1.0);
  int nSamples = u_antiliasing ? u_nSamples : 1;
  //int nSamples = 3;

  for(int i = 0; i < 10000; i++) {
    if(i == nSamples*nSamples) break;
    vec2 z0 = get_world_coordinates(i, nSamples);
    bool escaped;
    int iterations;
    iterateJulia(z0, c, n, escaped, iterations);
    sum_colors += computePixelColor(escaped, iterations);
  } 
  return sum_colors/float(nSamples*nSamples);
}

void iterateMandelbrot(vec2 c, int n, out bool escaped, out int iterations) {
  vec2 z = vec2(0.0);
  escaped = false;
  for (int i = 0; i < 10000; i++) {
    if (i == u_maxIterations) break;
    iterations = i;
    z = P(z, c, n);
    if (length(z) > 2.0) {
      escaped = true;
      break;
    }
  }
}

vec4 Mandelbrot(int n) {

  vec4 sum_colors = vec4(0.0, 0.0, 0.0, 1.0);
  int nSamples = u_antiliasing ? u_nSamples : 1;

  for(int i = 0; i < 1000; i++) {
      if(i == nSamples*nSamples) break;
      vec2 c = get_world_coordinates(i, nSamples);
      /* Now iterate the function. */
      bool escaped;
      int iterations;
      iterateMandelbrot(c, n, escaped, iterations);
      sum_colors += computePixelColor(escaped, iterations);
  }
    return sum_colors/float(nSamples*nSamples);
}

void main() {
  vec4 color;
  if(u_fractal == 0){
    color = Mandelbrot(u_order);
  }
  else{
    color = Julia(u_juliaSetConstant, u_order);
  }
  gl_FragColor = color;
}

// ────────────────────────────────────────────────────────────────────────────────


`;

export {fsSource}