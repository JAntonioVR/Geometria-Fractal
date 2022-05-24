//
// ──────────────────────────────────────────────────────── I ──────────
//   :::::: scene.js : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────
// Codigo de la clase 'Scene', una clase abstracta que representa
// una escena 2D o 3D

// ─── IMPORTS ────────────────────────────────────────────────────────────────────
import {ShaderType, Shader, ShaderProgram} from './shader.js'
import {Buffer} from './buffer.js'

//
// ─── SCENE ──────────────────────────────────────────────────────────────────────
// Clase 'Scene'. Es una clase abstracta que contiene el codigo común de una
// escena 2D y una 3D.
class Scene {

  // ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
  // A partir del código fuente del vertex shader y del fragment shader inicializa
  // el contexto de WebGL, el programa Shader y el buffer de posiciones de los
  // vertices que toma como entrada el vertex shader.
  // Parametros: ───────────────────────────
  // - vsSource: string. Codigo fuente del vertex shader
  // - fsSource: string. Codigo fuente del fragment shader
  // Devuelve: ─────────────────────────────
  // - Nada, realmente este constructor no se puede llamar por si solo, unicamente
  //   tiene el codigo comun a escenas 2D y 3D
  constructor(vsSource, fsSource) {
    if(this.constructor === Scene)
    throw new Error("No es posible crear un objeto de una clase abstracta");
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
  }

  // ─── INITSHADERPROGRAM ──────────────────────────────────────────────────────────
  // Crea y compila el vertex shader y el fragment shader. A partir de estos dos
  // shaders, se crea el programa shader.
  // Parametros: ───────────────────────────
  // - vsSource: string. Codigo fuente del vertex shader
  // - fsSource: string. Codigo fuente del fragment shader
  // Devuelve: ─────────────────────────────
  // - El programa shader ya inicializado, de la clase WebGLProgram
  initShaderProgram(vsSource, fsSource) {
    let gl = this.context;
    var vertexShader = new Shader(gl, vsSource, ShaderType.vertexShader),
        fragmentShader = new Shader(gl, fsSource, ShaderType.fragmentShader);
  
    var shaderProgram = new ShaderProgram(gl, vertexShader, fragmentShader);
  
    return shaderProgram.getShaderProgram()
  }
  
  // ─── INITBUFFERS ────────────────────────────────────────────────────────────────
  // Inicializa los buffer necesarios, en nuestro caso tan solo se trata del buffer
  // de posiciones de los vertices que recibe el vertex shader.
  // Parametros: ───────────────────────────
  // No acepta
  // Devuelve: ─────────────────────────────
  // Un Objeto de JavaScript cuyos campos son:
  // - positionBuffer: WebGLBuffer. Buffer de posiciones
  // - numFloatsPV: number. Numero de valores en coma flotante por cada vertice
  // - numVertexes: number. Numero de vertices que se almacenan en el buffer
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

    let positionsNFPV = 2,   // Number of floats per vertex in 'positions' array
        positionsNV   = positions.length / positionsNFPV    // Number of vertexes in 'positions' array

    let positionBuffer = new Buffer(gl, positions)

    return {
      positionBuffer: positionBuffer.getBuffer(),
      numFloatsPV: positionsNFPV,
      numVertexes: positionsNV
    };
  }

  //
  // ─── DRAWSCENE ──────────────────────────────────────────────────────────────────
  // Metodo abstracto que en las clases que hereden de Scene tomara el shader, los
  // buffer y los parametros de la escena para visualizarla en el canvas
  drawScene() {
    throw new Error("Este método es abstracto, no tiene implementación en la clase Scene");
  }

  // ─── CHECKGLERROR ───────────────────────────────────────────────────────────────
  // Metodo que comprueba si hay algun error de OpenGL, en cuyo caso lanza una
  // excepcion
  // Parametros: ───────────────────────────
  // No acepta.
  // Devuelve: ─────────────────────────────
  // Nada, tan solo lanza la excepcion cuando sea necesario.
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

// ────────────────────────────────────────────────────────────────────────────────

export {Scene}