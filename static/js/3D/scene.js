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
        /*zoomCenter: gl.getUniformLocation(that.shaderProgram, 'u_zoomCenter'),
        zoomSize: gl.getUniformLocation(that.shaderProgram, 'u_zoomSize'),
        maxIterations: gl.getUniformLocation(that.shaderProgram, 'u_maxIterations'),
        juliaSetConstant: gl.getUniformLocation(that.shaderProgram, 'u_juliaSetConstant'),
        order: gl.getUniformLocation(that.shaderProgram, 'u_order'),
        fractal: gl.getUniformLocation(that.shaderProgram, 'u_fractal')*/
        // TODO Incluir las variables uniform que se vayan a pasar al Fragment Shader
      }
    };

    this.parameters = {
      /*zoomCenter: [0.0, 0.0],
      zoomSize: 3,
      maxIterations: 50,
      delta: 0.1,
      juliaSetConstant: [-0.12, 0.75],
      order: 2,
      fractal: 0*/
      // TODO Incluir los distintos parámetros que vaya a manejar la escena
    };

    const initialParameters = JSON.parse(JSON.stringify(this.parameters));
    this.initialParameters = initialParameters;
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
    /* TODO Llevarte los parametros de la escena a variables 
    let zoomCenter = this.parameters.zoomCenter,
        zoomSize = this.parameters.zoomSize,
        maxIterations = this.parameters.maxIterations,
        juliaSetConstant = this.parameters.juliaSetConstant,
        order = this.parameters.order,
        fractal = this.parameters.fractal;*/
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

    /* TODO Usar las variables de antes y las uniform location para pasarle variables al shader
    gl.uniform2f(
      this.programInfo.uniformLocations.zoomCenter,
      zoomCenter[0], zoomCenter[1]);
    gl.uniform1f(
      this.programInfo.uniformLocations.zoomSize,
      zoomSize);
    gl.uniform1i(
      this.programInfo.uniformLocations.maxIterations,
      maxIterations);
    gl.uniform2f(
      this.programInfo.uniformLocations.juliaSetConstant,
      juliaSetConstant[0], juliaSetConstant[1]);
    gl.uniform1i(
      this.programInfo.uniformLocations.order,
      order);
    gl.uniform1i(
      this.programInfo.uniformLocations.fractal,
      fractal);
*/

    {
      const offset = 0;
      const vertexCount = that.bufferInfo.num_vertexes;
      gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
    }

    this.checkGLError();

  }

  zoomIn(){
    // TODO
  }

  zoomOut(){
    // TODO
  }

  moveLeft(){
    // TODO
  }

  moveRight(){
    // TODO
  }

  moveUp(){
    // TODO
  }

  moveDown(){
    // TODO
  }

  setMaxIterations(newValue){
    // TODO
  }

  setInitialParameters() {
    this.parameters = JSON.parse(JSON.stringify(this.initialParameters));
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