//
// ────────────────────────────────────────────────────────── I ──────────
//   :::::: buffer.js : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────
// Fichero que contiene una abstraccion de un buffer de datos de WebGL

//
// ─── BUFFER ─────────────────────────────────────────────────────────────────────
// Clase que contiene un atributo del tipo WebGLBuffer y encapsula el
// comportamiento relativo a la inicializacion de un buffer. 
class Buffer {
  
  // CONSTRUCTOR ──────────────────────────────────────────────────────────────────
  // A partir del contexto de WebGL y de un array de JavaScript, construye 
  // y almacena en un atributo un elemento de la clase WebGLBuffer.
  // Parametros: ───────────────────────────
  // - gl: WebGLContext. Contexto de WebGL
  // - array: Array. Array de JavaScript a partir del cual se crea el buffer
  // - nElements: number. Número de elementos (como pueden ser vértices, colores, 
  //   coordenadas de textura...) almacenadas en el buffer.
  // - nValuesPE: number. Numero de valores por elemento. Número de valores 
  //   consecutivos que representan a cada elemento
  // Devuelve: ─────────────────────────────
  // - Un elemento de la clase Buffer inicializado.
  constructor(gl, array, nElements, nValuesPE) {

    // Number of elements (vertexes, colors, texture coordinates...) stored in the buffer
    this.nElements = nElements;
    // Number of values per element. For example, 2 values per 2D vertex, 3 per color, etc.
    this.nValuesPE = nValuesPE;

    // The WebGLBuffer
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array(array),
      gl.STATIC_DRAW);
  }

  //
  // ─── GETTERS ────────────────────────────────────────────────────────────────────
  //

  // ─── GETBUFFER ──────────────────────────────────────────────────────────────────
  // Getter del atributo buffer, de tipo WebGLBuffer  
  getBuffer() {
    return this.buffer;
  }

  //
  // ─── GETNUMBEROFELEMENTS ────────────────────────────────────────────────────────
  // Getter del atributo nElements, de tipo number
  getNumberOfElements() {
    return this.nElements;
  }
  //
  // ─── GETNUMBEROFVALUESPERELEMENT ────────────────────────────────────────────────
  // Getter del atributo nValuesPE, de tipo number
  getNumberOfValuesPerElement() {
    return this.nValuesPE;
  }
}

// ────────────────────────────────────────────────────────────────────────────────

export {Buffer}