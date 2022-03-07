
import { Scene } from "./scene.js";

function glsl(strings){
    return strings.raw[0]
  }

const vsSource = glsl`
precision highp float;
attribute vec2 a_Position;
void main() {
  gl_Position = vec4(a_Position.x, a_Position.y, 0.0, 1.0);
}
`;

const fsSource = glsl`
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

vec2 pow(vec2 z, int n) {
  vec2 current_pow = vec2(1,0);
  for (int i = 1; i < 100; i++) {
    vec2 z_ant = vec2(current_pow.x, current_pow.y);
    current_pow = vec2(z_ant.x*z.x - z_ant.y*z.y, z_ant.x*z.y + z_ant.y*z.x);
    if(i >= n) break;
  }
  return current_pow;
}

vec2 f(vec2 x, vec2 c, int n) {
	return pow(x,n) + c;
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

void assignColor(bool escaped, int iterations) {
    gl_FragColor = escaped ? vec4(palette(
      3.0*float(iterations)/ float(u_maxIterations),
      vec3(0.109,0.109,0.647), 
      vec3(0.823, 0.411, 0.0), 
      vec3(0.769, 0.659, 0.0), 
      vec3(0.627,0.878,0.043)
      ), 
      1.0) : vec4(vec3(0.0,0.0,0.0), 1.0);
}

void Julia(vec2 c, int n) {
    vec2 uv = gl_FragCoord.xy / vec2(720.0, 720.0);
    vec2 z0 = u_zoomCenter + (uv * 4.0 - vec2(2.0)) * (u_zoomSize / 4.0);

    int iterations;
    vec2 z = z0;
    bool escaped = false;
    for(int i = 0; i < 10000; i++) {
        if(i > u_maxIterations) break;
        iterations = i;
        z = f(z, c, n);
        if (length(z) > 2.0){
            escaped = true;
            break;
        }
    }

    assignColor(escaped, iterations);
}

void Mandelbrot(int n) {
    vec2 uv = gl_FragCoord.xy / vec2(720.0, 720.0);
  
  /* Decide which point on the complex plane this fragment corresponds to.*/
  vec2 c = u_zoomCenter + (uv * 4.0 - vec2(2.0)) * (u_zoomSize / 4.0);
  
  /* Now iterate the function. */
  int iterations;
  vec2 z = vec2(0.0);
  bool escaped = false;
  for (int i = 0; i < 10000; i++) {
    /* Unfortunately, GLES 2 doesn't allow non-constant expressions in loop
       conditions so we have to do this ugly thing instead. */
    if (i > u_maxIterations) break;
    iterations = i;
    z = f(z, c, n);
    if (length(z) > 2.0) {
      escaped = true;
      break;
    }
  }

  assignColor(escaped, iterations);
  
}

void main() {
  switch (u_fractal) {
    case 0:
      Mandelbrot(u_order);
      break;
  
    case 1:
      Julia(u_juliaSetConstant, u_order);
      break;
  }
}
`;

var theScene = new Scene(vsSource, fsSource);

function main(){

    document.addEventListener("keydown", (event) => onKeyDown(event), true );
    document.addEventListener("wheel", (event) => onWheel(event), true );

    const deslizadorNIter = document.querySelector("#nIteraciones");
    deslizadorNIter.value = theScene.getMaxIterations();
    document.querySelector("#valorNIteraciones").innerHTML = theScene.getMaxIterations();
    deslizadorNIter.addEventListener('input', (event) => changeMaxIterations(event), true);

    const deslizadorJuliaX = document.querySelector("#juliaX");
    deslizadorJuliaX.value = theScene.getJuliaConstantX();
    document.querySelector("#valorJuliaX").innerHTML = theScene.getJuliaConstantX();
    deslizadorJuliaX.addEventListener('input', (event) => changeJuliaX(event), true);

    const deslizadorJuliaY = document.querySelector("#juliaY");
    deslizadorJuliaY.value = theScene.getJuliaConstantY();
    document.querySelector("#valorJuliaY").innerHTML = theScene.getJuliaConstantY();
    deslizadorJuliaY.addEventListener('input', (event) => changeJuliaY(event), true);

    const deslizadorExp = document.querySelector("#exponente");
    deslizadorExp.value = theScene.getOrder();
    document.querySelector("#valorExponente").innerHTML = theScene.getOrder();
    deslizadorExp.addEventListener('input', (event) => changeExponente(event), true);
    
    theScene.drawScene();
    
}

window.onload = main;

function onKeyDown(event) {
    let key = event.wich || event.keyCode;
    switch (key) {
      case 37:  // Left key
        theScene.moveLeft();
        break;
  
      case 38:  // Up key
        theScene.moveUp();
        break;
  
      case 39:  // Right key
        theScene.moveRight();
        break;
  
      case 40:  // Down key
        theScene.moveDown();
        break;
      
      case 187:  // + key
        theScene.zoomIn();
        break;
  
      case 189:  // - key
        theScene.zoomOut();
        break;
  
      default:
        break;
    }
    theScene.drawScene();
}

function onWheel(event) {
    let delta = event.deltaY;
    if (delta > 0) {    // Down -> Zoom Out
      theScene.zoomOut();
    } 
    else {              // Up -> Zoom In
      theScene.zoomIn();
    }
    theScene.drawScene();
  }

function changeMaxIterations(event){
    document.querySelector("#valorNIteraciones").innerHTML = event.target.value;
    theScene.setMaxIterations(event.target.value);
    theScene.drawScene();
}

function changeJuliaX(event) {
  document.querySelector("#valorJuliaX").innerHTML = event.target.value;
  theScene.setJuliaConstantX(event.target.value);
  theScene.drawScene();
}

function changeJuliaY(event) {
  document.querySelector("#valorJuliaY").innerHTML = event.target.value;
  theScene.setJuliaConstantY(event.target.value);
  theScene.drawScene();
}

function changeExponente(event) {
  document.querySelector("#valorExponente").innerHTML = event.target.value;
  theScene.setOrder(event.target.value);
  theScene.drawScene();
}