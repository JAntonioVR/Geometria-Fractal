//
// ────────────────────────────────────────────────────────── I ──────────
//   :::::: shader.js : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────
// Fichero con el código relativo a una abstracción de un shader. Hay
// dos posibles tipos de Shader (ShaderType): Vertex y Fragment (Shader), 
// que juntos forman lo que llamamos Programa Shader (ShaderProgram)

//
// ─── SHADERTYPE ─────────────────────────────────────────────────────────────────
// Enumerado inmutable, de forma que un elemento de la clase Shader solo puede
// un tipo: ShaderType.vertexShader o ShaderType.fragmentShader
const ShaderType = Object.freeze({
  vertexShader: 0,
  fragmentShader: 1
});

//
// ─── SHADER ─────────────────────────────────────────────────────────────────────
// Clase que abstrae un shader de WebGL, entendiendo shader como el programa
// relativo a un vertex shader o a un fragment shader.  
class Shader {
  
  // ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
  // A partir del contexto de WebGL, del código fuente y del tipo de Shader, este 
  // método crea y compila el vertex/fragment shader.
  // Parametros: ───────────────────────────
  // - gl: WebGLContext. Contexto de WebGL
  // - source: string. Código fuente del shader
  // - type: ShaderType. Tipo de Shader, vertex o fragment
  // Devuelve: ─────────────────────────────
  // - Un elemento de la clase Shader inicializado.  
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

  //
  // ─── GETTERS ────────────────────────────────────────────────────────────────────
  //

  // ─── GETPROGRAM ─────────────────────────────────────────────────────────────────
  // Getter del atributo program, de tipo WebGLShader
  getProgram() {
    return this.program;
  }
}

//
// ─── SHADERPROGRAM ──────────────────────────────────────────────────────────────
// Clase que representa una abstracción de un programa shader, formado por el
// enlazado de un vertex shader y un fragment shader  
class ShaderProgram {

  // ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
  // Utiliza el contexto de WebGL y dos instancias de la clase Shader, uno de tipo
  // vertex y otro de tipo fragment para inicializar el programa shader definitivo
  // Parametros: ───────────────────────────
  // - gl: WebGLContext. Contexto de WebGL
  // - vs: Shader. Vertex Shader
  // - fs: Shader. Fragment Shader
  // Devuelve: ─────────────────────────────
  // - Un elemento de la clase ShaderProgram inicializado  
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

  //
  // ─── GETTERS ────────────────────────────────────────────────────────────────────
  //

  // ─── GETSHADERPROGRAM ───────────────────────────────────────────────────────────
  // Getter del atributo program, de la clase WebGLProgram
  getShaderProgram(){
    return this.program;
  }
}

// ────────────────────────────────────────────────────────────────────────────────

export {ShaderType, Shader, ShaderProgram}