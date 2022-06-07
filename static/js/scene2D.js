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
    var gl = this.context;

    var WGLShader = this.shaderProgram.getShaderProgram();

    this.programInfo = {
      program: WGLShader,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(WGLShader, 'a_Position')
      },
      uniformLocations: {
        zoomCenter: gl.getUniformLocation(WGLShader, 'u_zoomCenter'),
        zoomSize: gl.getUniformLocation(WGLShader, 'u_zoomSize'),
        maxIterations: gl.getUniformLocation(WGLShader, 'u_maxIterations'),
        juliaSetConstant: gl.getUniformLocation(WGLShader, 'u_juliaSetConstant'),
        order: gl.getUniformLocation(WGLShader, 'u_order'),
        fractal: gl.getUniformLocation(WGLShader, 'u_fractal'),
        antialiasing: gl.getUniformLocation(WGLShader, 'u_antialiasing'),
        nSamples: gl.getUniformLocation(WGLShader, 'u_nSamples')
      }
    };

    this.ratio = 16.0/9.0;
    var initialHeight = 4.0,
        initialWidth = initialHeight*this.ratio;
    


    this.parameters = {
      zoomCenter: [0.0, 0.0],
      zoomSize: 3.0/4.0,
      LLC: [
        0.75*(-initialWidth/2.0),
        0.75*(-initialHeight/2.0)
      ],
      URC: [
        0.75*(initialWidth/2.0),
        0.75*(initialHeight/2.0)
      ],
      maxIterations: 50,
      delta: 0.1,
      juliaSetConstant: [-0.12, 0.75],
      order: 2,
      fractal: 0,
      antialiasing: false,
      nSamples: 1,
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
        fractal = this.parameters.fractal,
        antialiasing = this.parameters.antialiasing,
        nSamples = this.parameters.nSamples;
    var that = this;
    {
      const numComponents = that.buffer.getNumberOfValuesPerElement();  // pull out 2 values per iteration
      const type = gl.FLOAT;    // the data in the buffer is 32bit floats
      const normalize = false;  // don't normalize
      const stride = 0;         // how many bytes to get from one set of values to the next
                                // 0 = use type and numComponents above
      const offset = 0;         // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, that.buffer.getBuffer());
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
    gl.uniform1i(
      this.programInfo.uniformLocations.antialiasing,
      antialiasing);
    gl.uniform1i(
      this.programInfo.uniformLocations.nSamples,
      nSamples);

    {
      const offset = 0;
      const vertexCount = that.buffer.getNumberOfElements();
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
    this.parameters.LLC[0] *= 0.9;
    this.parameters.LLC[1] *= 0.9;
    this.parameters.URC[0] *= 0.9;
    this.parameters.URC[1] *= 0.9;
  }

  // ─── ZOOMOUT ────────────────────────────────────────────────────────────────────
  // Se aumenta el parametro zoomSize para alejar la escena. Tambien se aumenta delta
  // para que los desplazamientos sean mas notables.
  zoomOut(){
    this.parameters.zoomSize *= 1.1;
    this.parameters.delta *= 1.1;
    this.parameters.LLC[0] *= 1.1;
    this.parameters.LLC[1] *= 1.1;
    this.parameters.URC[0] *= 1.1;
    this.parameters.URC[1] *= 1.1;
  }

  // ─── MOVELEFT ───────────────────────────────────────────────────────────────────
  // Se reduce la primera coordenada de zoomCenter para desplazar la escena a la
  // izquierda
  moveLeft(){
    this.parameters.zoomCenter[0] -= this.parameters.delta;
    this.parameters.LLC[0] -= this.parameters.delta;
    this.parameters.URC[0] -= this.parameters.delta;
  }

  // ─── MOVERIGHT ──────────────────────────────────────────────────────────────────
  // Se aumenta la primera coordenada de zoomCenter para desplazar la escena a la
  // derecha
  moveRight(){
    this.parameters.zoomCenter[0] += this.parameters.delta;
    this.parameters.LLC[0] += this.parameters.delta;
    this.parameters.URC[0] += this.parameters.delta;
  }

  // ─── MOVEUP ─────────────────────────────────────────────────────────────────────
  // Se aumenta la segunda coordenada de zoomCenter para desplazar la escena hacia
  // arriba
  moveUp(){
    this.parameters.zoomCenter[1] += this.parameters.delta;
    this.parameters.LLC[1] += this.parameters.delta;
    this.parameters.URC[1] += this.parameters.delta;
  }

  // ─── MOVEDOWN ───────────────────────────────────────────────────────────────────
  // Se reduce la segunda coordenada de zoomCenter para desplazar la escena hacia
  // abajo
  moveDown(){
    this.parameters.zoomCenter[1] -= this.parameters.delta;
    this.parameters.LLC[1] -= this.parameters.delta;
    this.parameters.URC[1] -= this.parameters.delta;
  }

  // ─── CHANGEANTILIASING ──────────────────────────────────────────────────────────
  // Cambia el valor booleano del parametro 'antialiasing'. Es una forma de decirle al
  // programa si queremos que se aplique o no antialiasing a los píxeles.
  changeAntialiasing() {
    this.parameters.antialiasing = !this.parameters.antialiasing;
  }

  //
  // ─── GETTERS ────────────────────────────────────────────────────────────────────
  //

  // ─── GETANTILIASING ─────────────────────────────────────────────────────────────
  // Getter del parametro 'antialiasing', de tipo booleano.
  getAntialiasing() {
    return this.parameters.antialiasing
  }

  //
  // ─── GETDELTA ───────────────────────────────────────────────────────────────────
  // Getter del parametro 'delta', de tipo number
  getDelta() {
    return this.parameters.delta;
  }


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


  //
  // ─── GETLLC ─────────────────────────────────────────────────────────────────────
  // Getter del parametro LLC, de tipo Array
  getLLC() {
    return this.parameters.LLC;
  }

  // ─── GETMAXITERATIONS ───────────────────────────────────────────────────────────
  // Getter del parametro maxIterations, de tipo number.
  getMaxIterations(){
    return this.parameters.maxIterations;
  }

  // ─── GETNSAMPLES ────────────────────────────────────────────────────────────────
  // Getter del parametro 'nSamples', de tipo number.
  getNSamples() {
    return this.parameters.nSamples;
  }

  // ─── GETORDER ───────────────────────────────────────────────────────────────────
  // Getter del parametro order, de tipo number.
  getOrder() {
    return this.parameters.order;
  }

  //
  // ─── GETURC ─────────────────────────────────────────────────────────────────────
  // Getter del parametro URC, de tipo Array
  getURC() {
    return this.parameters.URC;
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

  //
  // ─── SETLLCX ────────────────────────────────────────────────────────────────────
  // Setter de la primera componente del parametro LLC
  // Parametros: ───────────────────────────
  // - x: number. Nuevo valor que se le asignará a LLC[0].
  // - URCFixed: boolean. Simboliza si el usuario ha decidido que la esquina superior 
  //   derecha quede fija, en cuyo caso también habría que modificar el valor de 
  //   LLC[1] para mantener la proporcion 16:9.
  setLLCX(x, URCFixed) {
    let desp = this.parameters.URC[0] - this.parameters.LLC[0];
    this.parameters.LLC[0] = x;
    if(URCFixed) {
      desp = this.parameters.URC[0] - this.parameters.LLC[0];
      this.parameters.LLC[1] = this.parameters.URC[1] - desp/this.ratio;
    }
    else
      this.parameters.URC[0] = x + desp;
    this.calculateZoom();
  }

  //
  // ─── SETLLCY ────────────────────────────────────────────────────────────────────
  // Setter de la segunda componente del parametro LLC
  // Parametros: ───────────────────────────
  // - y: number. Nuevo valor que se le asignará a LLC[1].
  // - URCFixed: boolean. Simboliza si el usuario ha decidido que la esquina superior 
  //   derecha quede fija, en cuyo caso también habría que modificar el valor de 
  //   LLC[0] para mantener la proporcion 16:9.
  setLLCY(y, URCFixed) {
    let desp = this.parameters.URC[1] - this.parameters.LLC[1];
    this.parameters.LLC[1] = y;
    if(URCFixed) {
      desp = this.parameters.URC[1] - this.parameters.LLC[1];
      this.parameters.LLC[0] = this.parameters.URC[0]- desp*this.ratio;
    }
    else
      this.parameters.URC[1] = y + desp;  
    this.calculateZoom();
  }

  // ─── SETMAXITERATIONS ───────────────────────────────────────────────────────────
  // Setter del parametro maxIterations
  setMaxIterations(newValue){
    this.parameters.maxIterations = newValue;
  }

  // ─── SETNSAMPLES ────────────────────────────────────────────────────────────────
  // Setter del parametro 'nSamples'.
  setNSamples(newNSamples) {
    this.parameters.nSamples = newNSamples;
  }

  // ─── SETORDER ───────────────────────────────────────────────────────────────────
  // Setter del parametro order
  setOrder(newOrder) {
    this.parameters.order = newOrder;
  }

  //
  // ─── SETURCX ────────────────────────────────────────────────────────────────────
  // Setter de la primera componente del parametro URC
  // Parametros: ───────────────────────────
  // - x: number. Nuevo valor que se le asignará a URC[0].
  // - LLCFixed: boolean. Simboliza si el usuario ha decidido que la esquina inferior
  //   izquierda quede fija, en cuyo caso también habría que modificar el valor de 
  //   URC[1] para mantener la proporcion 16:9.
  setURCX(x, LLCFixed) {
    let desp = this.parameters.URC[0] - this.parameters.LLC[0];
    this.parameters.URC[0] = x;
    if(LLCFixed) {
      desp = this.parameters.URC[0] - this.parameters.LLC[0];
      this.parameters.URC[1] = this.parameters.LLC[1] + desp/this.ratio;
    }
    else {
      this.parameters.LLC[0] = x - desp;
    }
    this.calculateZoom();
  }

  //
  // ─── SETURCY ────────────────────────────────────────────────────────────────────
  // Setter de la segunda componente del parametro URC
  // Parametros: ───────────────────────────
  // - y: number. Nuevo valor que se le asignará a URC[1].
  // - LLCFixed: boolean. Simboliza si el usuario ha decidido que la esquina inferior
  //   izquierda quede fija, en cuyo caso también habría que modificar el valor de 
  //   URC[0] para mantener la proporcion 16:9.
  setURCY(y, LLCFixed) {
    let desp = this.parameters.URC[1] - this.parameters.LLC[1];
    this.parameters.URC[1] = y; 
    if(LLCFixed) {
      desp = this.parameters.URC[1] - this.parameters.LLC[1];
      this.parameters.URC[0] = this.parameters.LLC[0] + desp*this.ratio;
    }
    else {
      this.parameters.LLC[1] = y - desp;
    }
    this.calculateZoom();
  }


  //
  // ─── CALCULATEZOOM ──────────────────────────────────────────────────────────────
  // Recalcula los parametros zoomCenter y zoomSize ante posibles cambios en los
  // parametros LLC y URC.
  calculateZoom() {
    this.parameters.zoomCenter[0] = (this.parameters.LLC[0] + this.parameters.URC[0])/2.0;
    this.parameters.zoomCenter[1] = (this.parameters.LLC[1] + this.parameters.URC[1])/2.0;
    this.parameters.zoomSize = (this.parameters.URC[1]-this.parameters.LLC[1])/4.0;
  }
  // ────────────────────────────────────────────────────────────────────────────────

}

// ────────────────────────────────────────────────────────────────────────────────

export {Scene2D}