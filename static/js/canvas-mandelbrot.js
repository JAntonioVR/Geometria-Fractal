
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

vec2 f(vec2 x, vec2 c) {
	return mat2(x,-x.y,x.x)*x + c;
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b*cos( 6.28318*(c*t+d) );
}


void Julia(vec2 c) {
    vec2 uv = gl_FragCoord.xy / vec2(720.0, 720.0);
    vec2 z0 = u_zoomCenter + (uv * 4.0 - vec2(2.0)) * (u_zoomSize / 4.0);

    int iterations;
    vec2 z = z0;
    bool escaped = false;
    for(int i = 0; i < 10000; i++) {
        if(i > u_maxIterations) break;
        iterations = i;
        z = f(z, c);
        if (length(z) > 2.0){
            escaped = true;
            break;
        }
    }
    gl_FragColor = escaped ? vec4(palette(
        3.0*float(iterations)/ float(u_maxIterations),
        vec3(0.02, 0.02, 0.03), 
        vec3(0.1, 0.2, 0.3), 
        vec3(0.0, 0.3, 0.2), 
        vec3(0.0, 0.5, 0.8)
        
        ), 
        1.0) : vec4(vec3(0.3, 0.5, 0.8), 1.0);
}

void Mandelbrot(){
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
    z = f(z, c);
    if (length(z) > 2.0) {
      escaped = true;
      break;
    }
  }
  gl_FragColor = escaped ? vec4(palette(
    3.0*float(iterations)/ float(u_maxIterations),
    vec3(0.02, 0.02, 0.03), 
    vec3(0.1, 0.2, 0.3), 
    vec3(0.0, 0.3, 0.2), 
    vec3(0.0, 0.5, 0.8)
    
    ), 
    1.0) : vec4(vec3(0.3, 0.5, 0.8), 1.0);
}

void main() {
  //Mandelbrot();
  Julia(vec2(-0.125, 0.65));
}
`;

var theScene = new Scene(vsSource, fsSource);

function main(){

    document.addEventListener("keydown", (event) => onKeyDown(event), true );
    document.addEventListener("wheel", (event) => onWheel(event), true );

    const deslizador = document.querySelector("#numIteraciones");

    deslizador.addEventListener('change', (event) => changeMaxIterations(event), true);

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
    document.querySelector("#numero").innerHTML = event.target.value;
    theScene.setMaxIterations(event.target.value);
    theScene.drawScene();
}