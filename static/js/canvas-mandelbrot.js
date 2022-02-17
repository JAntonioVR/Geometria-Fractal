//
// start here
//
function main() {
    const canvas = document.querySelector("#glCanvas");
    // Initialize the GL context
    const gl = canvas.getContext("webgl");
  
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

    buffers = initBuffers(gl)
    drawScene(gl, programInfo, buffers)
}

window.onload = main;

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(vertexShader,vsSource);
  gl.shaderSource(fragmentShader,fsSource);
  gl.compileShader(vertexShader);
  console.log(gl.getShaderInfoLog(vertexShader)); 
  gl.compileShader(fragmentShader);
  console.log(gl.getShaderInfoLog(fragmentShader));
  
  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

// Vertex shader program

const vsSource = `
precision highp float;
attribute vec2 a_Position;
void main() {
  gl_Position = vec4(a_Position.x, a_Position.y, 0.0, 1.0);
}
`;

const fsSource = `
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

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  
  /* Decide which point on the complex plane this fragment corresponds to.*/
  vec2 c = u_zoomCenter + (uv * 4.0 - vec2(2.0)) * (u_zoomSize / 4.0);
  
  /* Now iterate the function. */
  vec2 z = vec2(0.0);
  bool escaped = false;
  for (int i = 0; i < 10000; i++) {
    /* Unfortunately, GLES 2 doesn't allow non-constant expressions in loop
       conditions so we have to do this ugly thing instead. */
    if (i > u_maxIterations) break;
    z = f(z, c);
    if (length(z) > 2.0) {
      escaped = true;
      break;
    }
  }
  gl_FragColor = escaped ? vec4(1.0) : vec4(vec3(0.0), 1.0);
}
`;

function initBuffers(gl) {

  // Create a buffer for the square's positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.

  const positions = [
    -1, 1,
     3,-1,
    -1, 3
  ];

  // Now pass the list of positions and colors into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array(positions),
    gl.STATIC_DRAW);

  return {
    position: positionBuffer
  };
}

function drawScene(gl, programInfo, buffers) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const resolution = [960, 720];
  const zoomCenter = [0.0,0.0];
  const zoomSize = 4.0;
  const max_iterations = 500;

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 2;  // pull out 2 values per iteration
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
      max_iterations);

  {
    const offset = 0;
    const vertexCount = 3;
    gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
  }
}



