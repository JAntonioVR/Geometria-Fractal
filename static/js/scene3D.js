//
// ──────────────────────────────────────────────────────────── I ──────────
//   :::::: scene3D.js : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────
// Codigo respectivo a la clase Scene3D, que representa una escena
// en la que podemos visualizar fractales en 3D.

// ─── IMPORTS ────────────────────────────────────────────────────────────────────
import { sphericToCartesian, cartesianToSpheric } from "./utils.js";
import { Scene } from './scene.js';

//
// ─── SCENE2D ────────────────────────────────────────────────────────────────────
// Clase Scene3D, una clase que hereda de Scene y que contiene el codigo relativo
// a la creacion, parametros, visualizado y gestion de una escena 3D en la cual
// representaremos fractales 3D en un canvas de WebGL.
class Scene3D extends Scene{

  // ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
  // A partir del codigo fuente del vertex shader y el fragment shader, llama al
  // constructor de la clase 'Scene', el cual inicializa el programa shader y el
  // buffer de posiciones de los vertices que maneja el vertex shader. Ademas,
  // inicializa un objeto con los parametros que maneja la escena:
  // - lookfrom: Array. Punto en el cual se situa el espectador en WC
  // - lookfromSpheric: Array. Coordenadas esfericas del punto lookfrom.
  // - lookat: Array. Punto hacia el que mira el espectador en WC
  // - ka: Array. Tupla RGBA que representa la reflectividad ambiental de un material.
  // - kd: Array. Tupla RGBA que representa la reflectividad difusa de un material.
  // - ks: Array. Tupla RGBA que representa la reflectividad especular de un material.
  // - sh: number. Exponente de brillo especular del material parametrizable.
  // - lightColor0: Array. Tupla RGBA que será la intensidad de la luz derecha.
  // - lightColor1: Array. Tupla RGBA que será la intensidad de la luz izquierda.
  // - shadows: Array. Tripleta booleana tal que si shadows[i] es true la fuente de
  //            luz i-esima arrojara sombras.
  // - fractal: number. Si este parametro vale 1 se visualizara el conjunto de
  //            Mandelbub. Si vale 2 se visualizara el conjunto de Julia asociado
  //            al campo juliaSetConstant. Si vale 3 se visualizara el conjunto
  //            de Mandelbrot 3D.
  // - juliaSetConstant: Array. Cuaternio 'c' en la ecuacion P(q) = q^2 + c.
  // - epsilon: number. Distancia minima utilizada en ray-marching para decidir
  //            cuando un punto esta en la frontera del fractal.
  // - antiliasing: boolean. Si es true se aplicara antiliasing a la escena. En
  //                caso contrario se lanzara un único rayo por pixel.
  // - nSamples: number. Valor entero que en caso de que antiliasing sea true se
  //              lanzaran nSamples^2 rayos por pixel.
  // - delta: number. Incremento que se suma o se resta a la hora de desplazarse por
  //          la escena.
  // Se crea un objeto que almacena informacion relativa al programa:
  // - program: WebGLProgram. Programa Shader ya inicializado
  // - attribLocations: Object. Localizacion en memoria de las variables 'attribute'
  // - uniformLocations: Object. Localizacion en memoria de las variables 'uniform'
  // Por ultimo, se almacenan en un atributo los parametros iniciales de la escena,
  // para asi poder resetear los parametros de la escena a los parametros por defecto.
  // Parametros: ───────────────────────────
  // - vsSource: string. Codigo fuente del vertex shader
  // - fsSource: string. Codigo fuente del fragment shader
  // Devuelve: ─────────────────────────────
  // Un objeto de la clase Scene3D con todos sus atributos inicializados.
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
        lookfrom: gl.getUniformLocation(that.shaderProgram, 'u_lookfrom'),
        lookat: gl.getUniformLocation(that.shaderProgram, 'u_lookat'),
        ka: gl.getUniformLocation(that.shaderProgram, 'u_ka'),
        kd: gl.getUniformLocation(that.shaderProgram, 'u_kd'),
        ks: gl.getUniformLocation(that.shaderProgram, 'u_ks'),
        sh: gl.getUniformLocation(that.shaderProgram, 'u_sh'),
        lightColor0: gl.getUniformLocation(that.shaderProgram, 'u_lightColor0'),
        lightColor1: gl.getUniformLocation(that.shaderProgram, 'u_lightColor1'),
        shadows: gl.getUniformLocation(that.shaderProgram, 'u_shadows'),
        fractal: gl.getUniformLocation(that.shaderProgram, 'u_fractal'),
        juliaSetConstant: gl.getUniformLocation(that.shaderProgram, 'u_juliaSetConstant'),
        epsilon: gl.getUniformLocation(that.shaderProgram, 'u_epsilon'),
        antiliasing: gl.getUniformLocation(that.shaderProgram, 'u_antiliasing'),
        nSamples: gl.getUniformLocation(that.shaderProgram, 'u_nSamples')
      }
    };

    var initialLookfrom = [1.3, 0.5, -1.0];
    //var initialLookfrom = [0.0,1.5,0.0];

    this.parameters = {
      lookfrom: initialLookfrom,
      lookat: [0.0, 0.0, 0.0],
      lookfromSpheric: cartesianToSpheric(initialLookfrom),
      ke: [0.0, 0.0, 0.0, 1.0],
      ka: [0.0, 0.0, 0.0, 1.0],
      kd: [0.84, 0.25, 0.25, 1.0],
      ks: [0.37, 0.25, 0.57, 1.0],
      sh: 30.0,
      lightColor0: [1.0, 1.0, 1.0, 1.0],
      lightColor1: [1.0, 1.0, 1.0, 1.0],
      shadows: [false, false, false],
      epsilon: 0.001,
      fractal: 1,
      juliaSetConstant: [0.75, 0.0, 0.0, -0.12],
      antiliasing: false,
      nSamples: 1,
      delta: 0.1
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
    let lookfrom = this.parameters.lookfrom,
        lookat = this.parameters.lookat,
        ke = this.parameters.ke,
        ka = this.parameters.ka,
        kd = this.parameters.kd,
        ks = this.parameters.ks,
        sh = this.parameters.sh,
        lightColor0 = this.parameters.lightColor0,
        lightColor1 = this.parameters.lightColor1,
        shadows = this.parameters.shadows,
        fractal = this.parameters.fractal,
        juliaSetConstant = this.parameters.juliaSetConstant,
        antiliasing = this.parameters.antiliasing,
        nSamples = this.parameters.nSamples,
        epsilon = this.parameters.epsilon;
        
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
      this.programInfo.uniformLocations.lightColor0,
      lightColor0[0], lightColor0[1], lightColor0[2], lightColor0[3]);
    gl.uniform4f(
      this.programInfo.uniformLocations.lightColor1,
      lightColor1[0], lightColor1[1], lightColor1[2], lightColor1[3]);
    gl.uniform3i(
      this.programInfo.uniformLocations.shadows,
      shadows[0], shadows[1], shadows[2]
    );
    gl.uniform1i(
      this.programInfo.uniformLocations.fractal,
      fractal);
    gl.uniform4f(
      this.programInfo.uniformLocations.juliaSetConstant,
      juliaSetConstant[0], juliaSetConstant[1], juliaSetConstant[2], juliaSetConstant[3]);
    gl.uniform1i(
      this.programInfo.uniformLocations.antiliasing,
      antiliasing
    );
    gl.uniform1i(
      this.programInfo.uniformLocations.nSamples,
      nSamples
    );
    gl.uniform1f(
      this.programInfo.uniformLocations.epsilon,
      epsilon);
    


    {
      const offset = 0;
      const vertexCount = that.bufferInfo.numVertexes;
      gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
    }

    this.checkGLError();

  }

  // ─── ZOOMIN ─────────────────────────────────────────────────────────────────────
  // Se reduce el modulo del vector que une el origen con el punto lookfrom para
  // acercar la escena
  zoomIn(){
    this.parameters.lookfromSpheric[0] *= 0.9;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfromSpheric);
  }

  // ─── ZOOMOUT ────────────────────────────────────────────────────────────────────
  // Se aumenta el modulo del vector que une el origen con el punto lookfrom para
  // alejar la escena
  zoomOut(){
    this.parameters.lookfromSpheric[0] *= 1.1;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfromSpheric);
  }

  // ─── MOVELEFT ───────────────────────────────────────────────────────────────────
  // Se modifica el angulo phi de las coordenadas esfericas del punto lookfrom para 
  // desplazar la escena a la izquierda
  moveLeft(){
    this.parameters.lookfromSpheric[2] += this.parameters.delta;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfromSpheric);
  }


  // ─── MOVELEFT ───────────────────────────────────────────────────────────────────
  // Se modifica el angulo phi de las coordenadas esfericas del punto lookfrom para 
  // desplazar la escena a la derecha
  moveRight(){
    this.parameters.lookfromSpheric[2] -= this.parameters.delta;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfromSpheric);
  }

  // ─── MOVEX ──────────────────────────────────────────────────────────────────────
  // Dada una cantidad 'desp', desplaza la camara a la derecha o a la izquierda
  // desp unidades.
  // Parametros: ───────────────────────────
  // - desp: number. Numero entero (positivo o negativo) que indica el desplazamiento
  moveX(desp) {
    this.parameters.lookfromSpheric[2] += desp;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfromSpheric);
  }

  // ─── MOVEUP ─────────────────────────────────────────────────────────────────────
  // Se reduce el angulo theta de las coordenadas esfericas del punto lookfrom para 
  // desplazar la escena hacia arriba.
  moveUp(){
    this.parameters.lookfromSpheric[1] -= this.parameters.delta;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfromSpheric);
    this.#rescaleAngles()
  }

  // ─── MOVEDOWN ───────────────────────────────────────────────────────────────────
  // Se modifica el angulo theta de las coordenadas esfericas del punto lookfrom para 
  // desplazar la escena hacia abajo.
  moveDown(){
    this.parameters.lookfromSpheric[1] += this.parameters.delta;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfromSpheric);
    this.#rescaleAngles()
  }

  // ─── MOVEY ──────────────────────────────────────────────────────────────────────
  // Dada una cantidad 'desp', desplaza la camara arriba o hacia abajo desp unidades.
  // Parametros: ───────────────────────────
  // - desp: number. Numero entero (positivo o negativo) que indica el desplazamiento
  moveY(desp) {
    this.parameters.lookfromSpheric[1] += desp;
    this.parameters.lookfrom = sphericToCartesian(this.parameters.lookfromSpheric);
  }

  // ─── CHANGESHADOW ───────────────────────────────────────────────────────────────
  // Si la componente i-esima del parametro shadow esta a false la pone a true
  // y viceversa. Es una forma de activar o desactivar las sombras arrojadas
  // provocadas por una fuente de luz concreta.
  // Parametros: ───────────────────────────
  // - i: number. índice de la luz cuyas sombras queremos activar o desactivar.
  changeShadow(i) {
    this.parameters.shadows[i] = !this.parameters.shadows[i];
    console.log(this.parameters.shadows);
  }

  // ─── CHANGEANTILIASING ──────────────────────────────────────────────────────────
  // Cambia el valor booleano del parametro 'antiliasing'. Es una forma de decirle al
  // programa si queremos que se aplique o no antiliasing a los píxeles.
  changeAntiliasing() {
    this.parameters.antiliasing = !this.parameters.antiliasing;
  }

  //
  // ─── RESCALEANGLES ──────────────────────────────────────────────────────────────
  // Cuando se modifican los angulos de las coordenadas esfericas es posible que se
  // salgan del rango [0, 2Pi]. Esta funcion ajusta esos valores para que siempre se
  // situen en el intervalo correcto.
  // Parametros: ───────────────────────────
  // No acepta.
  // Devuelve: ─────────────────────────────
  // Nada, tan solo modifica parametros
  #rescaleAngles(){
    var theta = this.parameters.lookfromSpheric[1],
        phi   = this.parameters.lookfromSpheric[2];
    if(theta < 0.0 ) theta += 2.0 * Math.PI;
    if(theta > 2.0 * Math.PI) theta -= 2.0 * Math.PI;
    if(phi < 0.0 ) phi += 2.0 * Math.PI;
    if(phi > 2.0 * Math.PI) phi -= 2.0 * Math.PI;

    this.parameters.lookfromSpheric[1] = theta
    this.parameters.lookfromSpheric[2] = phi
  }

  //
  // ─── GETTERS ────────────────────────────────────────────────────────────────────
  //

  // ─── GETANTILIASING ─────────────────────────────────────────────────────────────
  // Getter del parametro 'antiliasing', de tipo booleano.
  getAntiliasing() {
    return this.parameters.antiliasing
  }

  // ─── GETEPSILON ─────────────────────────────────────────────────────────────────
  // Getter del parametro 'epsilon' de tipo number.
  getEpsilon() {
    return this.parameters.epsilon;
  }

  // ─── GETFRACTAL ─────────────────────────────────────────────────────────────────
  // Getter del parametro 'fractal' de tipo number.
  getFractal() {
    return this.parameters.fractal;
  }

  // ─── GETJULIACONSTANT ───────────────────────────────────────────────────────────
  // Getter del parametro 'juliaSetConstant', de tipo Array (cuaternio).
  getJuliaConstant() {
    return this.parameters.juliaSetConstant;
  }

  // ─── GETKA ──────────────────────────────────────────────────────────────────────
  // Getter del parametro 'ka', tipo array (terna RGBA).
  getKa(){
    return this.parameters.ka;
  }

  // ─── GETKD ──────────────────────────────────────────────────────────────────────
  // Getter del parametro 'kd', tipo array (terna RGBA).
  getKd(){
    return this.parameters.kd;
  }

  // ─── GETKS ──────────────────────────────────────────────────────────────────────
  // Getter del parametro 'ks', tipo array (terna RGBA).
  getKs(){
    return this.parameters.ks;
  }

  // ─── GETLIGHTCOLOR ──────────────────────────────────────────────────────────────
  // Getter del parametro 'lightColorX' donde X puede ser 0 o 1 segun el valor del
  // argumento.
  // Parametros: ───────────────────────────
  // - i: number. Si vale 0 se devuelve el parametro 'lightColor0', en cualquier
  //      otro caso se devuelve 'lightColor1'.
  getLightColor(i){
    return i == 0 ? this.parameters.lightColor0 : 
                    this.parameters.lightColor1;
  }

  // ─── GETNSAMPLES ────────────────────────────────────────────────────────────────
  // Getter del parametro 'nSamples', de tipo number.
  getNSamples() {
    return this.parameters.nSamples;
  }


  // ─── GETPOSITION ────────────────────────────────────────────────────────────────
  // Getter del parametro lookfrom, la posicion del observador
  getPosition() {
    return this.parameters.lookfrom; 
  }

  // ─── GETSH──────────────────────────────────────────────────────────────────────
  // Getter del parametro 'sh', tipo array (terna RGBA).
  getSh(){
    return this.parameters.sh;
  }

  //
  // ─── SETTERS ────────────────────────────────────────────────────────────────────
  //

  // ─── SETEPSILON ─────────────────────────────────────────────────────────────────
  // Setter del parametro 'epsilon'.
  setEpsilon(new_epsilon) {
    this.parameters.epsilon = new_epsilon;
  }

  //
  // ─── SETFRACTAL ─────────────────────────────────────────────────────────────────
  // Setter del parametro 'fractal'. 
  setFractal(index) {
    this.parameters.fractal = index;
  }

  // ─── SETINITIALPARAMETERS ───────────────────────────────────────────────────────
  // Metodo que restablece los parametros a los valores por defecto.
  setInitialParameters() {
    this.parameters = JSON.parse(JSON.stringify(this.initialParameters));
  }

  // ─── SETJULIACONSTANT ───────────────────────────────────────────────────────────
  // Setter del parametro 'juliaSetConstant'.
  setJuliaConstant(newJuliaConstant) {
    this.parameters.juliaSetConstant = [
      newJuliaConstant[0], newJuliaConstant[1],
      newJuliaConstant[2], newJuliaConstant[3]
    ];
  }

  // ─── SETKA ──────────────────────────────────────────────────────────────────────
  // Setter del parametro 'ka' (reflectividad ambiental).
  setKa(newKa) {
    this.parameters.ka[0] = newKa[0];
    this.parameters.ka[1] = newKa[1];
    this.parameters.ka[2] = newKa[2];
  }

  // ─── SETKD ──────────────────────────────────────────────────────────────────────
  // Setter del parametro 'kd' (reflectividad difusa).
  setKd(newKd) {
    this.parameters.kd[0] = newKd[0];
    this.parameters.kd[1] = newKd[1];
    this.parameters.kd[2] = newKd[2];
    this.parameters.kd[3] = 1.0
  }

  // ─── SETKS ──────────────────────────────────────────────────────────────────────
  // Setter del parametro 'ks' (reflectividad especular).
  setKs(newKs) {
    this.parameters.ks[0] = newKs[0];
    this.parameters.ks[1] = newKs[1];
    this.parameters.ks[2] = newKs[2];
  }

  // ─── SETLIGHTCOLOR ──────────────────────────────────────────────────────────────
  // Setter del parametro 'lightColorX', donde X depende del valor del argumento i.
  // Parametros: ───────────────────────────
  // - i: number. Si vale 0, se modifica la terna RGB de la luz 0, en otro caso se
  //      modifica la terna de la luz 1.
  setLightColor(i, newLightColor) { 
    if(i==0){
      this.parameters.lightColor0[0] = newLightColor[0];
      this.parameters.lightColor0[1] = newLightColor[1];
      this.parameters.lightColor0[2] = newLightColor[2];
    } else {
      this.parameters.lightColor1[0] = newLightColor[0];
      this.parameters.lightColor1[1] = newLightColor[1];
      this.parameters.lightColor1[2] = newLightColor[2];      
    }
  }

  // ─── SETNSAMPLES ────────────────────────────────────────────────────────────────
  // Setter del parametro 'nSamples'.
  setNSamples(newNSamples) {
    this.parameters.nSamples = newNSamples;
  }

  // ─── SETSH ──────────────────────────────────────────────────────────────────────
  // Setter del parametro 'sh' (exponente de brillo).
  setSh(newSh){
    this.parameters.sh = newSh;
  }

}

// ────────────────────────────────────────────────────────────────────────────────

export {Scene3D} 