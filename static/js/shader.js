
const ShaderType = Object.freeze({
  vertexShader: 0,
  fragmentShader: 1
});

class Shader {
  constructor(gl, source, type) {
    this.type = type;
    if(type == ShaderType.vertexShader)
      this.program = gl.createShader(gl.VERTEX_SHADER);
    else if(type == ShaderType.fragmentShader)
      this.program = gl.createShader(gl.FRAGMENT_SHADER);

    this.source = source;
    gl.shaderSource(this.program, this.source);
    gl.compileShader(this.program);
    var msg = gl.getShaderInfoLog(this.program);
    if(msg){
      console.log(msg);
    }
  }

  getProgram() {
    return this.program;
  }
}

class ShaderProgram {
  constructor(gl, vs, fs) {
    this.vertexShader = vs;
    this.fragmentShader = fs;
    this.program = gl.createProgram();
    gl.attachShader(this.program, this.vertexShader.getProgram());
    gl.attachShader(this.program, this.fragmentShader.getProgram());
    gl.linkProgram(this.program);
  
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(this.program));
      return null;
    }
  }

  getShaderProgram(){
    return this.program;
  }
}

export {ShaderType, Shader, ShaderProgram}