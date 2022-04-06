class Buffer {
  constructor(gl, array) {
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array(array),
      gl.STATIC_DRAW);
  }

  getBuffer() {
    return this.buffer;
  }
}

export {Buffer}