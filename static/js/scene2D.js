//
// ──────────────────────────────────────────────────────────── I ──────────
//   :::::: scene2D.js : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────
// Codigo respectivo a la clase Scene2D, que representa una escena
// en la que podemos visualizar fractales en 2D.

// ─── IMPORTS ────────────────────────────────────────────────────────────────────
import {Scene} from './scene.js'

//
// ─── SCENE2D ────────────────────────────────────────────────────────────────────
// Clase Scene2D, una clase que hereda de Scene y que contiene el codigo relativo
// a la creacion, parametros, visualizado y gestion de una escena 2D en la cual
// representaremos fractales 2D en un canvas de WebGL.
class Scene2D extends Scene {

  // ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
  // A partir del codigo fuente del vertex shader y el fragment shader, llama al
  // constructor de la clase 'Scene', el cual inicializa el programa shader y el
  // buffer de posiciones de los vertices que maneja el vertex shader. Ademas,
  // inicializa un objeto con los parametros que maneja la escena:
  // - zoomCenter: Array. Punto en WC que se encuentra en el centro del canvas
  //               (x_0,y_0)
  // - zoomSize: number. Valor que representa cuanto zoom hacemos en la escena (lambda)
  // - maxIterations: number. Numero maximo de iteraciones que se fijan en los
  //                  algoritmos para graficar conjuntos de Julia y Mandelbrot.
  // - delta: number. Incremento que se suma o resta a la hora de desplazarse por la
  //          escena.
  // - juliaSetConstant: Array. Valor complejo 'c' en la ecuacion P(z)=z^m + c
  // - order: number. Exponente 'm' en la ecuacion P(z) = z^m + c
  // - fractal: number. Si este parametro vale 0 se visualizara el conjunto de
  //            Mandelbrot. Si vale 1 se visualizara el conjunto de Julia asociado
  //            al campo juliaSetConstant.
  // Se crea un objeto que almacena informacion relativa al programa:
  // - program: WebGLProgram. Programa Shader ya inicializado.
  // - attribLocations: Object. Localizacion en memoria de las variables 'attribute'.
  // - uniformLocations: Object. Localizacion en memoria de las variables 'uniform'.
  // Por ultimo, se almacenan en un atributo los parametros iniciales de la escena,
  // para asi poder resetear los parametros de la escena a los parametros por defecto.
  // Parametros: ───────────────────────────
  // - vsSource: string. Codigo fuente del vertex shader
  // - fsSource: string. Codigo fuente del fragment shader
  // Devuelve: ─────────────────────────────
  // Un objeto de la clase Scene2D con todos sus atributos inicializados.
  constructor(vsSource, fsSource) {

    super(vsSource, fsSource);
    var that = this;
    var gl = this.context;

    this.programInfo = {
      program: that.shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(that.shaderProgram, 'a_Position')
      },
      uniformLocations: {
        zoomCenter: gl.getUniformLocation(that.shaderProgram, 'u_zoomCenter'),
        zoomSize: gl.getUniformLocation(that.shaderProgram, 'u_zoomSize'),
        maxIterations: gl.getUniformLocation(that.shaderProgram, 'u_maxIterations'),
        juliaSetConstant: gl.getUniformLocation(that.shaderProgram, 'u_juliaSetConstant'),
        order: gl.getUniformLocation(that.shaderProgram, 'u_order'),
        fractal: gl.getUniformLocation(that.shaderProgram, 'u_fractal')
      }
    };

    this.parameters = {
      zoomCenter: [0.0, 0.0],
      zoomSize: 3/4,
      maxIterations: 50,
      delta: 0.1,
      juliaSetConstant: [-0.12, 0.75],
      order: 2,
      fractal: 0
    };

    const initialParameters = JSON.parse(JSON.stringify(this.parameters));
    this.initialParameters = initialParameters;
  }

  // ─── DRAWSCENE ──────────────────────────────────────────────────────────────────
  // A partir de los parametros de la escena, las variables attribute y uniform, se
  // envian estos valores al programa shader y se visualiza la escena.
  // Parametros: ───────────────────────────
  // No acepta, toda la informacion que necesita esta en los atributos.
  // Devuelve: ─────────────────────────────
  // No devuelve nada, visualiza la escena en el canvas.
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
        maxIterations = this.parameters.maxIterations,
        juliaSetConstant = this.parameters.juliaSetConstant,
        order = this.parameters.order,
        fractal = this.parameters.fractal;
    var that = this;
    {
      const numComponents = that.bufferInfo.numFloatsPV;  // pull out 2 values per iteration
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
    gl.uniform2f(
      this.programInfo.uniformLocations.juliaSetConstant,
      juliaSetConstant[0], juliaSetConstant[1]);
    gl.uniform1i(
      this.programInfo.uniformLocations.order,
      order);
    gl.uniform1i(
      this.programInfo.uniformLocations.fractal,
      fractal);

    {
      const offset = 0;
      const vertexCount = that.bufferInfo.numVertexes;
      gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
    }

    this.checkGLError();

  }

  // ─── ZOOMIN ─────────────────────────────────────────────────────────────────────
  // Se reduce el parametro zoomSize para ampliar la escena. Tambien se reduce delta
  // para que los desplazamientos sean menos bruscos.
  zoomIn(){
    this.parameters.zoomSize *= 0.9;
    this.parameters.delta *= 0.9;
  }

  // ─── ZOOMOUT ────────────────────────────────────────────────────────────────────
  // Se aumenta el parametro zoomSize para alejar la escena. Tambien se aumenta delta
  // para que los desplazamientos sean mas notables.
  zoomOut(){
    this.parameters.zoomSize *= 1.1;
    this.parameters.delta *= 1.1
  }

  // ─── MOVELEFT ───────────────────────────────────────────────────────────────────
  // Se reduce la primera coordenada de zoomCenter para desplazar la escena a la
  // izquierda
  moveLeft(){
    this.parameters.zoomCenter[0] -= this.parameters.delta;
  }

  // ─── MOVERIGHT ──────────────────────────────────────────────────────────────────
  // Se aumenta la primera coordenada de zoomCenter para desplazar la escena a la
  // derecha
  moveRight(){
    this.parameters.zoomCenter[0] += this.parameters.delta;
  }

  // ─── MOVEUP ─────────────────────────────────────────────────────────────────────
  // Se aumenta la segunda coordenada de zoomCenter para desplazar la escena hacia
  // arriba
  moveUp(){
    this.parameters.zoomCenter[1] += this.parameters.delta;
  }

  // ─── MOVEDOWN ───────────────────────────────────────────────────────────────────
  // Se reduce la segunda coordenada de zoomCenter para desplazar la escena hacia
  // abajo
  moveDown(){
    this.parameters.zoomCenter[1] -= this.parameters.delta;
  }

  //
  // ─── GETTERS ────────────────────────────────────────────────────────────────────
  //

  // ─── GETFRACTAL ─────────────────────────────────────────────────────────────────
  // Getter del parametro fractal, de tipo number.
  getFractal() {
    return this.parameters.fractal;
  }

  // ─── GETJULIACONSTANTX ──────────────────────────────────────────────────────────
  // Getter de la primera componente del parametro juliaSetConstant, de tipo number
  getJuliaConstantX(){
    return this.parameters.juliaSetConstant[0];
  }


  // ─── GETJULIACONSTANTY ──────────────────────────────────────────────────────────
  // Getter de la segunda componente del parametro juliaSetConstant, de tipo number
  getJuliaConstantY(){
    return this.parameters.juliaSetConstant[1];
  }

  // ─── GETMAXITERATIONS ───────────────────────────────────────────────────────────
  // Getter del parametro maxIterations, de tipo number.
  getMaxIterations(){
    return this.parameters.maxIterations;
  }

  // ─── GETORDER ───────────────────────────────────────────────────────────────────
  // Getter del parametro order, de tipo number.
  getOrder() {
    return this.parameters.order;
  }
  
  //
  // ─── SETTERS ────────────────────────────────────────────────────────────────────
  //

  // ─── SETFRACTAL ─────────────────────────────────────────────────────────────────
  // Setter del parametro fractal
  setFractal(newFractal) {
    if (newFractal == 0) {
      this.parameters.fractal = newFractal;
    } else {
      this.parameters.fractal = 1;
    }
  }

  // ─── SETINITIALPARAMETERS ───────────────────────────────────────────────────────
  // Metodo que restablece los parametros a los valores por defecto.
  setInitialParameters() {
    this.parameters = JSON.parse(JSON.stringify(this.initialParameters));
  }

  // ─── SETJULIACONSTANTX ──────────────────────────────────────────────────────────
  // Setter de la primera componente del parametro juliaSetConstant
  setJuliaConstantX(newX) {
    this.parameters.juliaSetConstant[0] = newX;
  }

  // ─── SETJULIACONSTANTY ──────────────────────────────────────────────────────────
  // Setter de la segunda componente del parametro juliaSetConstant
  setJuliaConstantY(newY) {
    this.parameters.juliaSetConstant[1] = newY;
  }

  // ─── SETMAXITERATIONS ───────────────────────────────────────────────────────────
  // Setter del parametro maxIterations
  setMaxIterations(newValue){
    this.parameters.maxIterations = newValue;
  }

  // ─── SETORDER ───────────────────────────────────────────────────────────────────
  // Setter del parametro order
  setOrder(newOrder) {
    this.parameters.order = newOrder;
  }

  // ────────────────────────────────────────────────────────────────────────────────

}

// ────────────────────────────────────────────────────────────────────────────────

export {Scene2D}