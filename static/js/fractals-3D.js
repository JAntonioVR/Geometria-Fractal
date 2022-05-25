//
// ──────────────────────────────────────────────────────────────────── I ──────────
//   :::::: fractals-3D.js : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────
// Fichero javascript que gestiona los eventos y los indicadores HTML del fichero
// '3D-fractals.html'

// ─── IMPORTS ──────────────────────────────────────────────────────────────────── 
// Escena 3D
import { Scene3D } from "./scene3D.js";
// Vertex shader
import { vsSource } from "../glsl/shader-wgl-vertex.js";
// Fragment shader
//import { fsSource } from "../glsl/shader-mandelbub-fragment.js";
import { fsSource } from "../glsl/shader-ray-tracer-fragment.js";
// Utils
import { hexToRgb, rgbToHex } from "./utils.js";

//
// ─── MOUSE STATE ────────────────────────────────────────────────────────────────
// Enumerado para describir el estado del boton izquierdo del raton, pulsado o no
const MouseState = Object.freeze({
  MOUSE_DOWN: 0,
  MOUSE_UP: 1
});

//
// ─── ESCENA 3D ──────────────────────────────────────────────────────────────────
// Variable global que representa la escena 3D en la que se visualizan los fractales
var theScene = new Scene3D(vsSource, fsSource);

//
// ─── MAIN ───────────────────────────────────────────────────────────────────────
// Funcion que se ejecuta al cargar la página y que contiene la inicialización
// de los indicadores, los 'event listeners' y la primera visualización.
function main(){

  // Pulsar una tecla
  document.addEventListener("keydown", (event) => onKeyDown(event), true );

  // Movimiento de camara usando el raton
  const glCanvas = document.querySelector("#glCanvas");
  glCanvas.addEventListener('mousemove', (event) => moveCamera(event), true);
  glCanvas.addEventListener('mousedown', (event) => mouseDown(event), true);
  glCanvas.addEventListener('mouseup', mouseUp, true);

  // Boton de reseteo de parametros
  const botonReset = document.querySelector("#botonReset");
  botonReset.onclick = resetParameters;
  actualizaValorPosicion(theScene.getPosition());

  // Cronometro para saber cuanto tarda en renderizar el frame actual
  const botonContador = document.querySelector("#contador");
  botonContador.onclick = timeRedraw;

  // Color de la componente ambiental del material parametrizable
  const ka_input = document.querySelector("#ka");
  ka_input.value = rgbToHex(theScene.getKa());
  ka_input.addEventListener('input', change_ka, true);

  // Color de la componente difusa del material parametrizable
  const kd_input = document.querySelector("#kd");
  kd_input.value = rgbToHex(theScene.getKd());    
  kd_input.addEventListener('input', change_kd, true);

  // Color de la componente especular del material parametrizable
  const ks_input = document.querySelector("#ks");
  ks_input.value = rgbToHex(theScene.getKs());
  ks_input.addEventListener('input', change_ks, true);

  // Exponente de brillo especular del material parametrizable
  const sh_input = document.querySelector("#sh");
  sh_input.value = theScene.getSh();
  document.querySelector("#valor_sh").innerHTML = theScene.getSh();
  sh_input.addEventListener('input', (event) => change_sh(event), true);

  // Intensidad de la luz izquierda
  const lightColor0_input = document.querySelector("#lightColor0");
  lightColor0_input.value = rgbToHex(theScene.getLightColor(0));
  lightColor0_input.addEventListener('input', change_lightColor0, true);

  // La luz izquierda arroja sombras?
  const shadows_0 = document.querySelector("#shadows_0");
  shadows_0.addEventListener('change', changeShadow_0, true);

  // Intensidad de la luz derecha
  const lightColor1_input = document.querySelector("#lightColor1");
  lightColor1_input.value = rgbToHex(theScene.getLightColor(1));
  lightColor1_input.addEventListener('input', change_lightColor1, true);

  // La luz derecha arroja sombras?
  const shadows_1 = document.querySelector("#shadows_1");
  shadows_1.addEventListener('change', changeShadow_1, true);

  // Fractal que se visualiza
  const fractal = document.querySelector("#fractales");
  fractal.value = theScene.getFractal();
  fractal.addEventListener('change', changeFractal, true);

  // Deslizador con la componente x del elemento c = x + yi + zj + wk del conjunto de Julia
  const juliaX_input = document.querySelector("#juliaX");
  juliaX_input.value = theScene.getJuliaConstant()[0];
  document.querySelector("#valorJuliaX").innerHTML = theScene.getJuliaConstant()[0];
  juliaX_input.addEventListener('input', (event) => change_julia_constant_x(event), true);
  
  // Deslizador con la componente y del elemento c = x + yi + zj + wk del conjunto de Julia
  const juliaY_input = document.querySelector("#juliaY");
  juliaY_input.value = theScene.getJuliaConstant()[1];
  document.querySelector("#valorJuliaY").innerHTML = theScene.getJuliaConstant()[1];
  juliaY_input.addEventListener('input', (event) => change_julia_constant_y(event), true);

  // Deslizador con la componente z del elemento c = x + yi + zj + wk del conjunto de Julia
  const juliaZ_input = document.querySelector("#juliaZ");
  juliaZ_input.value = theScene.getJuliaConstant()[2];
  document.querySelector("#valorJuliaZ").innerHTML = theScene.getJuliaConstant()[2];
  juliaZ_input.addEventListener('input', (event) => change_julia_constant_z(event), true);

  // Deslizador con la componente w del elemento c = x + yi + zj + wk del conjunto de Julia
  const juliaW_input = document.querySelector("#juliaW");
  juliaW_input.value = theScene.getJuliaConstant()[3];
  document.querySelector("#valorJuliaW").innerHTML = theScene.getJuliaConstant()[3];
  juliaW_input.addEventListener('input', (event) => change_julia_constant_w(event), true);

  // No mostrar el menu si no se estan visualizando conjuntos de Julia
  if(theScene.getFractal() != 2)
    document.querySelector("#constanteJulia").style.display = 'none';

  // Activar/desactivar antiliasing
  const antiliasing = document.querySelector("#antiliasing");
  antiliasing.addEventListener('change', changeAntiliasing, true);

  // En caso de activar antiliasing, cuantos rayos por pixel?
  const nSamples_input = document.querySelector("#nSamples");
  nSamples_input.value = theScene.getJuliaConstant()[0];
  document.querySelector("#valorNSamples").innerHTML = theScene.getNSamples()**2;
  nSamples_input.addEventListener('input', (event) => change_nSamples(event), true);
  if(!antiliasing.checked) document.querySelector("#deslizadorNSamples").style.display = 'none';

  // Deslizador para calcular el valor de epsilon usado en ray-marching
  const epsilon_input = document.querySelector("#current_epsilon");
  var epsilon_value = theScene.getEpsilon();
  var exp = Math.log10(epsilon_value);
  epsilon_input.value = -exp;
  document.querySelector("#valor_epsilon").innerHTML = 10**(exp);
  epsilon_input.addEventListener('input', (event) => change_epsilon(event), true);
  
  // First render
  theScene.drawScene();
    
}

window.onload = main;

//
// ────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: G E S T O R E S   D E   E V E N T O S : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────────────
// Las funciones gestoras de eventos modifican los parametros de la escena, actualizan
// si es necesario el HTML del documento y redibujan la escena.

//
// ─── MOVIMIENTO DE CAMARA CON EL RATON ──────────────────────────────────────────
//  

// Variables auxiliares para el movimiento de la camara con el raton
var mousePosition = [0,0];
var mouseDownPosition = [0,0];
var mouseState = MouseState.MOUSE_UP; 

//
// ─── MOVER CAMARA ───────────────────────────────────────────────────────────────
// Al pulsar el boton izquierdo del raton sobre el canvas, mover su posicion y
// dejar de pulsarlo, se almacena en 'disp' el desplazamiento en pixeles
// y se mueve la posicion del observador en la escena proporcionalmente a dicho
// desplazamiento
function moveCamera(event){
  var x = event.clientX;
  var y = event.clientY;
  mousePosition = [x, y];
  const canvas = document.querySelector("#glCanvas");
  var width = canvas.offsetWidth,
      height = canvas.offsetHeight;

  if(mouseState == MouseState.MOUSE_DOWN){
    var disp = [
      (mousePosition[0] - mouseDownPosition[0])/width,
      (mousePosition[1] - mouseDownPosition[1])/height
    ]

    document.querySelector("#marcador-raton").innerHTML = "(" + disp[0] +", " + disp[1] +")";

    theScene.moveX(disp[0]);
    theScene.moveY(disp[1]);
    theScene.drawScene();
  }
}

// ─── MOUSE DOWN ─────────────────────────────────────────────────────────────────
function mouseDown(event){
  mouseState = MouseState.MOUSE_DOWN;
  mouseDownPosition = [event.clientX, event.clientY];
}

// ─── MOUSE UP ───────────────────────────────────────────────────────────────────
function mouseUp() {
  mouseState = MouseState.MOUSE_UP;
}

// ────────────────────────────────────────────────────────────────────────────────

//
// ─── CAMBIO DE LA COMPONENTE AMBIENTAL ──────────────────────────────────────────
//  
function change_ka() {
  const value = hexToRgb(document.querySelector("#ka").value);
  theScene.setKa(value);
  theScene.drawScene();
}

//
// ─── CAMBIO DE LA COMPONENTE DIFUSA ─────────────────────────────────────────────
//  
function change_kd() {
  const value = hexToRgb(document.querySelector("#kd").value);
  console.log(value)
  theScene.setKd(value);
  theScene.drawScene();
}

//
// ─── CAMBIO DE LA COMPONENTE ESPECULAR ──────────────────────────────────────────
//  
function change_ks() {
  const value = hexToRgb(document.querySelector("#ks").value);
  theScene.setKs(value);
  theScene.drawScene();
}

//
// ─── CAMBIO DEL EXPONENTE DE BRILLO ─────────────────────────────────────────────
//  
function change_sh(event) {
  document.querySelector("#valor_sh").innerHTML = event.target.value;
  theScene.setSh(event.target.value);
  theScene.drawScene();
}

//
// ─── CAMBIO DE LA INTENSIDAD DE LA LUZ 0 ────────────────────────────────────────
//  
function change_lightColor0() {
  const value = hexToRgb(document.querySelector("#lightColor0").value);
  theScene.setLightColor(0, value);
  theScene.drawScene();
}

//
// ─── ACTIVAR O DESACTIVAR SOMBRAS DE LA LUZ 0 ───────────────────────────────────
//
function changeShadow_0(){
  theScene.changeShadow(0);
  theScene.drawScene();
}

//
// ─── CAMBIO DE LA INTENSIDAD DE LA LUZ 1 ────────────────────────────────────────
//
function change_lightColor1() {
  const value = hexToRgb(document.querySelector("#lightColor1").value);
  console.log("#lightColor1")
  theScene.setLightColor(1, value);
  theScene.drawScene();
}

//
// ─── ACTIVAR O DESACTIVAR SOMBRAS DE LA LUZ 1 ───────────────────────────────────
//
function changeShadow_1(){
  theScene.changeShadow(1);
  theScene.drawScene();
}

//
// ─── CAMBIAR EL FRACTAL QUE SE VISUALIZA ────────────────────────────────────────
//  
function changeFractal() {
  const fractales = document.querySelector("#fractales")
  var selected = parseInt(fractales.value);
  if(selected != 2) 
    document.querySelector("#constanteJulia").style.display = 'none';
  else
    document.querySelector("#constanteJulia").style.display = 'block'
  theScene.setFractal(selected);
  theScene.drawScene();
}

//
// ─── CAMBIAR LA CONSTANTE c DEL CONJUNTO DE JULIA ───────────────────────────────
// c = x + yi + zj + wk

function change_julia_constant_x(event) {
  document.querySelector("#valorJuliaX").innerHTML = event.target.value;
  let C = theScene.getJuliaConstant();
  C[0] = event.target.value;
  theScene.setJuliaConstant(C);
  theScene.drawScene();
}

function change_julia_constant_y(event) {
  document.querySelector("#valorJuliaY").innerHTML = event.target.value;
  let C = theScene.getJuliaConstant();
  C[1] = event.target.value;
  theScene.setJuliaConstant(C);
  theScene.drawScene();
}

function change_julia_constant_z(event) {
  document.querySelector("#valorJuliaZ").innerHTML = event.target.value;
  let C = theScene.getJuliaConstant();
  C[2] = event.target.value;
  theScene.setJuliaConstant(C);
  theScene.drawScene();
}

function change_julia_constant_w(event) {
  document.querySelector("#valorJuliaW").innerHTML = event.target.value;
  let C = theScene.getJuliaConstant();
  C[3] = event.target.value;
  theScene.setJuliaConstant(C);
  theScene.drawScene();
}

//
// ─── ACTIVAR O DESACTIVAR ANTILIASING ───────────────────────────────────────────
//
function changeAntiliasing(){
  theScene.changeAntiliasing();
  if(theScene.getAntiliasing())
    document.querySelector("#deslizadorNSamples").style.display = 'flex';
  else
    document.querySelector("#deslizadorNSamples").style.display = 'none';   
  theScene.drawScene();
}

//
// ─── CAMBIAR NUMERO DE RAYOS POR PIXEL ──────────────────────────────────────────
// Solo se aplica si el antiliasing esta activado
function change_nSamples(event) {
  document.querySelector("#valorNSamples").innerHTML = event.target.value**2;
  theScene.setNSamples(event.target.value);
  theScene.drawScene();
}

//
// ─── CAMBIAR EPSILON ────────────────────────────────────────────────────────────
//  
function change_epsilon(event) {
  document.querySelector("#valor_epsilon").innerHTML = 10**(-event.target.value);
  theScene.setEpsilon(10**(-event.target.value));
  theScene.drawScene();
}

//
// ─── GESTORA DEL EVENTO PULSAR UNA TECLA ────────────────────────────────────────
//  
function onKeyDown(event) {
  let key = event.wich || event.keyCode;
  switch (key) {
    case 37:  // Left key
      theScene.moveLeft();
      break;

    case 38:  // Up key
      theScene.moveUp();
      break;

    case 39:  // Right key
      theScene.moveRight();
      break;

    case 40:  // Down key
      theScene.moveDown();
      break;
    
    case 187:  // + key
      theScene.zoomIn();
      break;

    case 189:  // - key
      theScene.zoomOut();
      break;

    default:
      break;
  }
  actualizaValorPosicion(theScene.getPosition());
  theScene.drawScene();
}

//
// ─── RESTABLECER PARAMETROS INICIALES ───────────────────────────────────────────
//
function resetParameters() {
  theScene.setInitialParameters();
  document.querySelector("#ka").value = rgbToHex(theScene.getKa());
  console.log(theScene.getKd());
  document.querySelector("#kd").value = rgbToHex(theScene.getKd());
  document.querySelector("#ks").value = rgbToHex(theScene.getKs());
  document.querySelector("#sh").value = theScene.getSh();
  document.querySelector("#valor_sh").innerHTML = theScene.getSh();
  document.querySelector("#lightColor0").value = rgbToHex(theScene.getLightColor(0));
  document.querySelector("#shadows_0").checked = false;
  document.querySelector("#lightColor1").value = rgbToHex(theScene.getLightColor(1));
  document.querySelector("#shadows_1").checked = false;

  document.querySelector("#juliaX").value = theScene.getJuliaConstant()[0];
  document.querySelector("#valorJuliaX").innerHTML = theScene.getJuliaConstant()[0];
  document.querySelector("#juliaY").value = theScene.getJuliaConstant()[1];
  document.querySelector("#valorJuliaY").innerHTML = theScene.getJuliaConstant()[1];
  document.querySelector("#juliaZ").value = theScene.getJuliaConstant()[2];
  document.querySelector("#valorJuliaZ").innerHTML = theScene.getJuliaConstant()[2];
  document.querySelector("#juliaW").value = theScene.getJuliaConstant()[3];
  document.querySelector("#valorJuliaW").innerHTML = theScene.getJuliaConstant()[3];
  if(theScene.getFractal() != 2)
    document.querySelector("#constanteJulia").style.display = 'none';

  document.querySelector("#antiliasing").checked = false;
  document.querySelector("#nSamples").value = theScene.getNSamples();
  document.querySelector("#valorNSamples").innerHTML = theScene.getNSamples()**2;
  if(!theScene.getAntiliasing()) 
    document.querySelector("#deslizadorNSamples").style.display = 'none';

  document.querySelector("#current_epsilon").value = -Math.log10(theScene.getEpsilon());
  document.querySelector("#valor_epsilon").innerHTML = theScene.getEpsilon();


  theScene.drawScene();
}

//
// ─── CRONOMETRO: ¿CUANTO TARDA EN PROCESARSE EL FRAME ACTUAL? ───────────────────
//
function timeRedraw() {
  var start = performance.now();
  theScene.drawScene();
  var end = performance.now();
  document.querySelector("#contador-valor").innerHTML = end-start;
}

//
// ─── ACTUALIZA LA POSICION ACTUAL ───────────────────────────────────────────────
//  
function actualizaValorPosicion(posicion) {
    document.querySelector("#marcador-posicion").innerHTML = 
    "(" + posicion[0].toFixed(2) + ", " + posicion[1].toFixed(2) + ", " + posicion[2].toFixed(2) + ")"

}

// ────────────────────────────────────────────────────────────────────────────────
