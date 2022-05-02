import {ShaderType, Shader, ShaderProgram} from './shader.js'
import {Buffer} from './buffer.js'
import { sphericToCartesian, cartesianToSpheric } from "./utils.js";

class Scene3D {
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
        lookfrom: gl.getUniformLocation(that.shaderProgram, 'u_lookfrom'),
        lookat: gl.getUniformLocation(that.shaderProgram, 'u_lookat'),
        ke: gl.getUniformLocation(that.shaderProgram, 'u_ke'),
        ka: gl.getUniformLocation(that.shaderProgram, 'u_ka'),
        kd: gl.getUniformLocation(that.shaderProgram, 'u_kd'),
        ks: gl.getUniformLocation(that.shaderProgram, 'u_ks'),
        sh: gl.getUniformLocation(that.shaderProgram, 'u_sh'),
        light_color: gl.getUniformLocation(that.shaderProgram, 'u_light_color'),
        epsilon: gl.getUniformLocation(that.shaderProgram, 'u_epsilon')
      }
    };

    var initialLookfrom = [2.0, 2.0, 2.0];

    this.parameters = {
      lookfrom: initialLookfrom,
      lookat: [0.0, 0.0, 0.0],
      lookfrom_spheric: cartesianToSpheric(initialLookfrom),
      ke: [0.0, 0.0, 0.0, 1.0],
      ka: [0.0, 0.0, 0.0, 1.0],
      kd: [0.0, 0.0, 1.0, 1.0],
      ks: [0.0, 0.0, 0.0, 1.0],
      sh: 30.0,
      light_color: [1.0, 1.0, 1.0, 1.0],
      epsilon: 0.005,
      
      delta: 0.1
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
    let lookfrom = this.parameters.lookfrom,
        lookat = this.parameters.lookat,
        ke = this.parameters.ke,
        ka = this.parameters.ka,
        kd = this.parameters.kd,
        ks = this.parameters.ks,
        sh = this.parameters.sh,
        light_color = this.parameters.light_color,
        epsilon = this.parameters.epsilon;
        
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

    gl.uniform3f(
      this.programInfo.uniformLocations.lookfrom,
      lookfrom[0], lookfrom[1], lookfrom[2]);
    gl.uniform3f(
        this.programInfo.uniformLocations.lookat,
        lookat[0], lookat[1], lookat[2]);

    gl.uniform4f(
      this.programInfo.uniformLocations.ke,
      ke[0], ke[1], ke[2], ke[3]);
    gl.uniform4f(
      this.programInfo.uniformLocations.ka,
      ka[0], ka[1], ka[2], ka[3]);
    gl.uniform4f(
      this.programInfo.uniformLocations.kd,
      kd[0], kd[1], kd[2], kd[3]);
    gl.uniform4f(
      this.programInfo.uniformLocations.ks,
      ks[0], ks[1], ks[2], ks[3]);
    gl.uniform1f(
      this.programInfo.uniformLocations.sh,
      sh);
    gl.uniform4f(
      this.programInfo.uniformLocations.light_color,
      light_color[0], light_color[1], light_color[2], light_color[3]);
    gl.uniform1f(
      this.programInfo.uniformLocations.epsilon,
      epsilon);


    {
      const offset = 0;
      const vertexCount = that.bufferInfo.num_vertexes;
      gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
    }

    this.checkGLError();

  }

  zoomIn(){
    this.parameters.lookfrom_spheric[0] *= 0.9;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfrom_spheric);
  }

  zoomOut(){
    this.parameters.lookfrom_spheric[0] *= 1.1;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfrom_spheric);
  }

  moveLeft(){
    this.parameters.lookfrom_spheric[2] += this.parameters.delta;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfrom_spheric);
  }

  moveRight(){
    this.parameters.lookfrom_spheric[2] -= this.parameters.delta;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfrom_spheric);
  }

  moveX(desp) {
    this.parameters.lookfrom_spheric[2] += desp;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfrom_spheric);
  }

  moveUp(){
    this.parameters.lookfrom_spheric[1] -= this.parameters.delta;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfrom_spheric);
    this.rescaleAngles()
  }

  moveDown(){
    this.parameters.lookfrom_spheric[1] += this.parameters.delta;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfrom_spheric);
    this.rescaleAngles()
  }


  moveY(desp) {
    this.parameters.lookfrom_spheric[1] += desp;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfrom_spheric);
  }


  getPosition() {
    return this.parameters.lookfrom; 
  }

  set_ke(new_ke) {
    this.parameters.ke[0] = new_ke[0];
    this.parameters.ke[1] = new_ke[1];
    this.parameters.ke[2] = new_ke[2];
  }

  get_ke() {
    return this.parameters.ke;
  }

  set_ka(new_ka) {
    this.parameters.ka[0] = new_ka[0];
    this.parameters.ka[1] = new_ka[1];
    this.parameters.ka[2] = new_ka[2];
  }

  get_ka(){
    return this.parameters.ka;
  }

  set_kd(new_kd) {
    this.parameters.kd[0] = new_kd[0];
    this.parameters.kd[1] = new_kd[1];
    this.parameters.kd[2] = new_kd[2];
    this.parameters.kd[3] = 1.0
  }

  get_kd(){
    return this.parameters.kd;
  }

  set_ks(new_ks) {
    this.parameters.ks[0] = new_ks[0];
    this.parameters.ks[1] = new_ks[1];
    this.parameters.ks[2] = new_ks[2];
  }

  get_ks(){
    return this.parameters.ks;
  }

  set_sh(new_sh){
    this.parameters.sh = new_sh;
  }

  get_sh(){
    return this.parameters.sh;
  }

  set_light_color(new_light_color) {
    this.parameters.light_color[0] = new_light_color[0];
    this.parameters.light_color[1] = new_light_color[1];
    this.parameters.light_color[2] = new_light_color[2];
  }

  get_light_color(){
    return this.parameters.light_color;
  }

  set_epsilon(new_epsilon) {
    this.parameters.epsilon = new_epsilon;
  }

  get_epsilon() {
    return this.parameters.epsilon;
  }
  
  rescaleAngles(){
    var theta = this.parameters.lookfrom_spheric[1],
        phi   = this.parameters.lookfrom_spheric[2];
    if(theta < 0.0 ) theta += 2.0 * Math.PI;
    if(theta > 2.0 * Math.PI) theta -= 2.0 * Math.PI;
    if(phi < 0.0 ) phi += 2.0 * Math.PI;
    if(phi > 2.0 * Math.PI) phi -= 2.0 * Math.PI;

    this.parameters.lookfrom_spheric[1] = theta
    this.parameters.lookfrom_spheric[2] = phi
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

export {Scene3D} 