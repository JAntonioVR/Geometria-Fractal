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
  // Devuelve: ─────────────────────────────
  // - Un elemento de la clase Buffer inicializado.
  constructor(gl, array) {
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
}

// ────────────────────────────────────────────────────────────────────────────────

export {Buffer}