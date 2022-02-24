import {ShaderType, Shader, ShaderProgram} from './shader.js'
import {Buffer} from './buffer.js'

class Scene {
  constructor(vsSource, fsSource) {
    const canvas = document.querySelector("#glCanvas");
    // Initialize the GL context
    const gl = canvas.getContext("webgl2");

    // Only continue if WebGL is available and working
    if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
    }
    this.context = gl;
    
    this.shaderProgram = this.initShaderProgram(vsSource, fsSource);
    this.bufferInfo = this.initBuffers(gl)
    var that = this;

    this.programInfo = {
      program: that.shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(that.shaderProgram, 'a_Position')
      },
      uniformLocations: {
        zoomCenter: gl.getUniformLocation(that.shaderProgram, 'u_zoomCenter'),
        zoomSize: gl.getUniformLocation(that.shaderProgram, 'u_zoomSize'),
        maxIterations: gl.getUniformLocation(that.shaderProgram, 'u_maxIterations'),
      }
    };

    this.parameters = {
      zoomCenter: [0.0, 0.0],
      zoomSize: 3,
      maxIterations: 50,
      delta: 0.1
    };
  }

  initShaderProgram(vsSource, fsSource) {
    let gl = this.context;
    var vertexShader = new Shader(gl, vsSource, ShaderType.vertexShader),
        fragmentShader = new Shader(gl, fsSource, ShaderType.fragmentShader);
  
    var shaderProgram = new ShaderProgram(gl, vertexShader, fragmentShader);
  
    return shaderProgram.getShaderProgram()
  }

  initBuffers() {
    let gl = this.context;

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
      positionBuffer: positionBuffer.getBuffer(),
      num_floats_pv: positions_nfpv,
      num_vertexes: positions_nv
    };
  }

  drawScene(){
    let gl = this.context;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let zoomCenter = this.parameters.zoomCenter,
        zoomSize = this.parameters.zoomSize,
        maxIterations = this.parameters.maxIterations;
    var that = this;
    {
      const numComponents = that.bufferInfo.num_floats_pv;  // pull out 2 values per iteration
      const type = gl.FLOAT;    // the data in the buffer is 32bit floats
      const normalize = false;  // don't normalize
      const stride = 0;         // how many bytes to get from one set of values to the next
                                // 0 = use type and numComponents above
      const offset = 0;         // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, that.bufferInfo.positionBuffer);
      gl.vertexAttribPointer(
          that.programInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          that.programInfo.attribLocations.vertexPosition);
    }
    gl.useProgram(this.programInfo.program);

    gl.uniform2f(
      this.programInfo.uniformLocations.zoomCenter,
      zoomCenter[0], zoomCenter[1]);
    gl.uniform1f(
      this.programInfo.uniformLocations.zoomSize,
      zoomSize);
    gl.uniform1i(
      this.programInfo.uniformLocations.maxIterations,
      maxIterations);

    {
      const offset = 0;
      const vertexCount = that.bufferInfo.num_vertexes;
      gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
    }

    this.checkGLError();

  }

  zoomIn(){
    this.parameters.zoomSize *= 0.9;
    this.parameters.delta *= 0.9;
  }

  zoomOut(){
    this.parameters.zoomSize *= 1.1;
    this.parameters.delta *= 1.1
  }

  moveLeft(){
    this.parameters.zoomCenter[0] -= this.parameters.delta;
  }

  moveRight(){
    this.parameters.zoomCenter[0] += this.parameters.delta;
  }

  moveUp(){
    this.parameters.zoomCenter[1] += this.parameters.delta;
  }

  moveDown(){
    this.parameters.zoomCenter[1] -= this.parameters.delta;
  }

  setMaxIterations(newValue){
    this.parameters.maxIterations = newValue;
  }

  checkGLError(){
    let gl = this.context;
    const err = gl.getError();
    if (err == gl.NO_ERROR) {
      return
    }
    else{
      const msg = `Ha ocurrido un error de OpenGL: [${err}]`;
      throw new Error(msg);
    }
  }

}

export {Scene}