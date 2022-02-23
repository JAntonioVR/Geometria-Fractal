//
// start here
//

import {ShaderType, Shader, ShaderProgram} from './shader.js'
import {Buffer} from './buffer.js'


function main() {
    draw(parameters)
    document.addEventListener("keydown", (event)=>onKeyDown(event), true );
    document.addEventListener("wheel", (event)=>onWheel(event), true );

    const deslizador = document.querySelector("#numIteraciones");

    deslizador.addEventListener('change', (event) => {
      document.querySelector("#numero").innerHTML = event.target.value;
      parameters.maxIterations = event.target.value;
      draw(parameters)
    });
    

}

function draw(parameters){
  const canvas = document.querySelector("#glCanvas");
    // Initialize the GL context
    const gl = canvas.getContext("webgl2");
  
    // Only continue if WebGL is available and working
    if (gl === null) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.");
      return;
    }
  
    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'a_Position')
      },
      uniformLocations: {
        resolution: gl.getUniformLocation(shaderProgram, 'u_resolution'),
        zoomCenter: gl.getUniformLocation(shaderProgram, 'u_zoomCenter'),
        zoomSize: gl.getUniformLocation(shaderProgram, 'u_zoomSize'),
        maxIterations: gl.getUniformLocation(shaderProgram, 'u_maxIterations'),
      },
    };

    var buffers = initBuffers(gl)
    drawScene(gl, programInfo, buffers, parameters)
    compruebaErrorGL(gl)
}

let parameters = {
    zoomCenter: [-0.75, 0.0],
    zoomSize: 3,
    maxIterations: 500,
    delta: 0.1
  };

window.onload = main;

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  
  var vertexShader = new Shader(gl, vsSource, ShaderType.vertexShader),
      fragmentShader = new Shader(gl, fsSource, ShaderType.fragmentShader);

  var shaderProgram = new ShaderProgram(gl, vertexShader, fragmentShader);

  return shaderProgram.getShaderProgram()
}

function glsl(strings){
  return strings.raw[0]
}

// Vertex shader program

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

/* Width and height of screen in pixels */ 
uniform vec2 u_resolution;

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

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  
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
`;

function initBuffers(gl) {

  let x0 = -1.0,
      x1 =  1.0,
      y0 = -1.0,
      y1 =  1.0
  const positions = [
    x0, y0, x1, y0, x1, y1,
    x0, y0, x1, y1, x0, y1
  ];

  let positions_nfpv = 2,   // Number of floats per vertex in 'positions' array
      positions_nv   = positions.length / positions_nfpv    // Number of vertexes in 'positions' array

  let positionBuffer = new Buffer(gl, positions)

  return {
    position: positionBuffer.getBuffer(),
    num_floats_pv: positions_nfpv,
    num_vertexes: positions_nv
  };
}

function drawScene(gl, programInfo, buffers, parameters) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const resolution = [720, 720];
  const zoomCenter = parameters.zoomCenter   // Parámetros a cambiar 
  const zoomSize = parameters.zoomSize;
  const maxIterations = parameters.maxIterations;

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = buffers.num_floats_pv;  // pull out 2 values per iteration
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
                              // 0 = use type and numComponents above
    const offset = 0;         // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniform2f(
      programInfo.uniformLocations.resolution,
      resolution[0],resolution[1]);
  gl.uniform2f(
      programInfo.uniformLocations.zoomCenter,
      zoomCenter[0], zoomCenter[1]);
  gl.uniform1f(
      programInfo.uniformLocations.zoomSize,
      zoomSize);
  gl.uniform1i(
      programInfo.uniformLocations.maxIterations,
      maxIterations);

  {
    const offset = 0;
    const vertexCount = buffers.num_vertexes;
    gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
  }
}

function compruebaErrorGL(gl) {
  const err = gl.getError();
  if (err == gl.NO_ERROR) {
    console.log("No hay ningun error de OpenGL");
    return
  }
  else{
    const msg = `Ha ocurrido un error de OpenGL: [${err}]`;
    throw new Error(msg);
  }
}

function onKeyDown(event) {
  let key = event.wich || event.keyCode;
  switch (key) {
    case 37:  // Left key
      parameters.zoomCenter[0] -= parameters.delta;
      break;

    case 38:  // Up key
      parameters.zoomCenter[1] += parameters.delta;
      break;

    case 39:  // Right key
      parameters.zoomCenter[0] += parameters.delta;
      break;

    case 40:  // Down key
      parameters.zoomCenter[1] -= parameters.delta;
      break;
    
    case 187:  // + key
      parameters.zoomSize *= 0.9;
      parameters.delta *= 0.9;
      break;

    case 189:  // - key
      parameters.zoomSize *= 1.1;
      parameters.delta *= 1.1;
      break;

    default:
      break;
  }
  draw(parameters);
}

function onWheel(event) {
  let delta = event.deltaY;
  if (delta > 0) {    // Down -> Increment zoomSize
    parameters.zoomSize *= 1.1;
    parameters.delta *= 1.1;
  } 
  else {              // Up -> Decrement zoomSize
    parameters.zoomSize *= 0.9;
    parameters.delta *= 0.9;
  }
  draw(parameters);
}