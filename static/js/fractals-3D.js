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
import { fsSource } from "../glsl/shader-mandelbub-fragment.js";
//import { fsSource } from "../glsl/shader-ray-tracer-fragment.js";
// Utils
import { hexToRgb, rgbToHex } from "./utils.js";

//
// ─── MOUSE STATE ────────────────────────────────────────────────────────────────
// Enumerado para describir el estado del boton izquierdo del raton, pulsado o no
const MouseState = Object.freeze({
  MOUSE_DOWN: 0,
  MOUSE_UP: 1
});

const Mode = Object.freeze({
  INTERACTIVE: 0,
  ONDEMAND: 1
});

var mode = Mode.ONDEMAND;

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
  //document.addEventListener("keydown", (event) => onKeyDown(event), true );

  if(window.screen.width <= 480) {
    window.alert("No es posible ejecutar esta página en dispositivos móviles");
    return;
  }

  $(document).keydown(onKeyDown);

  $("#interactivo").change(changeMode);
  $("#a-demanda").change(changeMode);

  // Movimiento de camara usando el raton
  const glCanvas = document.querySelector("#glCanvas");
  glCanvas.addEventListener('mousemove', (event) => moveCamera(event), true);
  glCanvas.addEventListener('mousedown', (event) => mouseDown(event), true);
  glCanvas.addEventListener('mouseup', (event) => mouseUp(event), true);

  // Boton de reseteo de parametros
  const botonReset = document.querySelector("#botonReset");
  botonReset.onclick = resetParameters;
  actualizaValorPosicion(theScene.getPosition());

  // Color de la componente ambiental del material parametrizable
  const ka_input = document.querySelector("#ka");
  ka_input.value = rgbToHex(theScene.getKa());
  ka_input.addEventListener('change', change_ka, true);

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
  document.querySelector("#valor_sh").value = theScene.getSh();
  sh_input.addEventListener('input', (event) => change_sh(event), true);
  $('#valor_sh').change(change_sh);

  // Intensidad de la luz izquierda
  const lightColor0_input = document.querySelector("#lightColor0");
  lightColor0_input.value = rgbToHex(theScene.getLightColor(0));
  lightColor0_input.addEventListener('change', change_lightColor0, true);

  // La luz izquierda arroja sombras?
  const shadows_0 = document.querySelector("#shadows_0");
  shadows_0.addEventListener('change', changeShadow_0, true);

  // Intensidad de la luz derecha
  const lightColor1_input = document.querySelector("#lightColor1");
  lightColor1_input.value = rgbToHex(theScene.getLightColor(1));
  lightColor1_input.addEventListener('change', change_lightColor1, true);

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
  $('#valorJuliaX').val(theScene.getJuliaConstant()[0]);
  juliaX_input.addEventListener('input', (event) => change_julia_constant_x(event), true);
  $('#valorJuliaX').change(change_julia_constant_x);

  // Deslizador con la componente y del elemento c = x + yi + zj + wk del conjunto de Julia
  const juliaY_input = document.querySelector("#juliaY");
  juliaY_input.value = theScene.getJuliaConstant()[1];
  $('#valorJuliaY').val(theScene.getJuliaConstant()[1]);
  juliaY_input.addEventListener('input', (event) => change_julia_constant_y(event), true);
  $('#valorJuliaY').change(change_julia_constant_y);

  // Deslizador con la componente z del elemento c = x + yi + zj + wk del conjunto de Julia
  const juliaZ_input = document.querySelector("#juliaZ");
  juliaZ_input.value = theScene.getJuliaConstant()[2];
  $('#valorJuliaZ').val(theScene.getJuliaConstant()[2]);
  juliaZ_input.addEventListener('input', (event) => change_julia_constant_z(event), true);
  $('#valorJuliaZ').change(change_julia_constant_z);

  // Deslizador con la componente w del elemento c = x + yi + zj + wk del conjunto de Julia
  const juliaW_input = document.querySelector("#juliaW");
  juliaW_input.value = theScene.getJuliaConstant()[3];
  $('#valorJuliaW').val(theScene.getJuliaConstant()[3]);
  juliaW_input.addEventListener('input', (event) => change_julia_constant_w(event), true);
  $('#valorJuliaW').change(change_julia_constant_w);

  // No mostrar el menu si no se estan visualizando conjuntos de Julia
  if(theScene.getFractal() != 2)
    document.querySelector("#constanteJulia").style.display = 'none';

  // Activar/desactivar antialiasing
  const antialiasing = document.querySelector("#antialiasing");
  antialiasing.addEventListener('change', changeAntialiasing, true);

  // En caso de activar antialiasing, cuantos rayos por pixel?
  const nSamples_input = document.querySelector("#nSamples");
  nSamples_input.value = theScene.getNSamples();
  document.querySelector("#valorNSamples").value = theScene.getNSamples()**2;
  nSamples_input.addEventListener('change', (event) => change_nSamples(event), true);
  if(!antialiasing.checked) document.querySelector("#deslizadorNSamples").style.display = 'none';

  // Deslizador para calcular el valor de epsilon usado en ray-marching
  const epsilon_input = document.querySelector("#current_epsilon");
  var epsilon_value = theScene.getEpsilon();
  var exp = Math.log10(epsilon_value);
  epsilon_input.value = -exp;
  document.querySelector("#valor_epsilon").innerHTML = (10**(exp)).toFixed(4);
  epsilon_input.addEventListener('input', (event) => change_epsilon(event), true);
  
  const initialPosition = theScene.getPosition();
  $('#posX').val(initialPosition[0]);
  $('#posX').change(changePosition);

  $('#posY').val(initialPosition[1]);
  $('#posY').change(changePosition);

  $('#posZ').val(initialPosition[2]);
  $('#posZ').change(changePosition);

  $('#redraw').click(redraw);

  // First render
  redraw();
  timeRedraw();

}

window.onload = main;
window.addEventListener("keydown", function(e) {
  if(["ArrowUp","ArrowDown"].indexOf(e.code) > -1) {
      e.preventDefault();
  }
}, false);

window.onresize = resizeCanvas;


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

    theScene.moveX(disp[0]);
    theScene.moveY(disp[1]);
    if(mode == Mode.INTERACTIVE) 
      redraw();
  }
}

// ─── MOUSE DOWN ─────────────────────────────────────────────────────────────────
function mouseDown(event){
  if(event.button == 0) {   // Only left button
    mouseState = MouseState.MOUSE_DOWN;
    mouseDownPosition = [event.clientX, event.clientY];
  }
}

// ─── MOUSE UP ───────────────────────────────────────────────────────────────────
function mouseUp(event) {
  if(event.button == 0)   // Only left button
    mouseState = MouseState.MOUSE_UP;
}

// ────────────────────────────────────────────────────────────────────────────────

//
// ─── CAMBIO DE LA COMPONENTE AMBIENTAL ──────────────────────────────────────────
//  
function change_ka() {
  const value = hexToRgb(document.querySelector("#ka").value);
  theScene.setKa(value);
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

//
// ─── CAMBIO DE LA COMPONENTE DIFUSA ─────────────────────────────────────────────
//  
function change_kd() {
  const value = hexToRgb(document.querySelector("#kd").value);
  console.log(value)
  theScene.setKd(value);
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

//
// ─── CAMBIO DE LA COMPONENTE ESPECULAR ──────────────────────────────────────────
//  
function change_ks() {
  const value = hexToRgb(document.querySelector("#ks").value);
  theScene.setKs(value);
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

//
// ─── CAMBIO DEL EXPONENTE DE BRILLO ─────────────────────────────────────────────
//  
function change_sh(event) {
  let new_value = verifySH(event.target.value);
  $("#valor_sh").val(new_value);
  $('#sh').val(new_value);
  theScene.setSh(new_value);
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

function verifySH(number) {
  return parseInt(Math.min(Math.max(10, number), 1000));
}

//
// ─── CAMBIO DE LA INTENSIDAD DE LA LUZ 0 ────────────────────────────────────────
//  
function change_lightColor0() {
  const value = hexToRgb(document.querySelector("#lightColor0").value);
  theScene.setLightColor(0, value);
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

//
// ─── ACTIVAR O DESACTIVAR SOMBRAS DE LA LUZ 0 ───────────────────────────────────
//
function changeShadow_0(){
  theScene.changeShadow(0);
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

//
// ─── CAMBIO DE LA INTENSIDAD DE LA LUZ 1 ────────────────────────────────────────
//
function change_lightColor1() {
  const value = hexToRgb(document.querySelector("#lightColor1").value);
  console.log("#lightColor1")
  theScene.setLightColor(1, value);
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

//
// ─── ACTIVAR O DESACTIVAR SOMBRAS DE LA LUZ 1 ───────────────────────────────────
//
function changeShadow_1(){
  theScene.changeShadow(1);
  if(mode == Mode.INTERACTIVE) 
      redraw();
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
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

//
// ─── CAMBIAR LA CONSTANTE c DEL CONJUNTO DE JULIA ───────────────────────────────
// c = x + yi + zj + wk

function change_julia_constant_x(event) {
  let new_value = verifyInputJulia(event.target.value);
  $("#juliaX").val(new_value);
  $("#valorJuliaX").val(new_value);
  let C = theScene.getJuliaConstant();
  C[0] = new_value;
  theScene.setJuliaConstant(C);
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

function change_julia_constant_y(event) {
  let new_value = verifyInputJulia(event.target.value);
  $("#juliaY").val(new_value);
  $("#valorJuliaY").val(new_value);
  let C = theScene.getJuliaConstant();
  C[1] = event.target.value;
  theScene.setJuliaConstant(C);
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

function change_julia_constant_z(event) {
  let new_value = verifyInputJulia(event.target.value);
  $("#juliaZ").val(new_value);
  $("#valorJuliaZ").val(new_value);
  let C = theScene.getJuliaConstant();
  C[2] = event.target.value;
  theScene.setJuliaConstant(C);
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

function change_julia_constant_w(event) {
  let new_value = verifyInputJulia(event.target.value);
  $("#juliaW").val(new_value);
  $("#valorJuliaW").val(new_value);
  let C = theScene.getJuliaConstant();
  C[3] = event.target.value;
  theScene.setJuliaConstant(C);
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

function verifyInputJulia(number) {
  return Math.min(Math.max(-2.0, number), 2.0);
}

//
// ─── ACTIVAR O DESACTIVAR ANTILIASING ───────────────────────────────────────────
//
function changeAntialiasing(){
  theScene.changeAntialiasing();
  if(theScene.getAntialiasing())
    document.querySelector("#deslizadorNSamples").style.display = 'flex';
  else
    document.querySelector("#deslizadorNSamples").style.display = 'none';   
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

//
// ─── CAMBIAR NUMERO DE RAYOS POR PIXEL ──────────────────────────────────────────
// Solo se aplica si el antialiasing esta activado
function change_nSamples(event) {
  document.querySelector("#valorNSamples").innerHTML = event.target.value**2;
  theScene.setNSamples(event.target.value);
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

//
// ─── CAMBIAR EPSILON ────────────────────────────────────────────────────────────
//  
function change_epsilon(event) {
  document.querySelector("#valor_epsilon").innerHTML = (10**(-event.target.value)).toFixed(4);
  theScene.setEpsilon(10**(-event.target.value));
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

//
// ─── CAMBIAR POSICION ───────────────────────────────────────────────────────────
//
function changePosition() {
  let newPosition = [
    $('#posX').val(),
    $('#posY').val(),
    $('#posZ').val(),
  ];
  theScene.setPosition(newPosition);
  if(mode == Mode.INTERACTIVE) 
      redraw();
}

//
// ─── CAMBIAR MODO INTERACTIVO/DEMANDA ─────────────────────────────────────────
//
function changeMode() {
  if($("#interactivo")[0].checked)
    mode = Mode.INTERACTIVE;
  else
    mode = Mode.ONDEMAND;
  redraw();
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
  if(mode == Mode.INTERACTIVE) 
      redraw();
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

  document.querySelector("#antialiasing").checked = false;
  document.querySelector("#nSamples").value = theScene.getNSamples();
  document.querySelector("#valorNSamples").innerHTML = theScene.getNSamples()**2;
  if(!theScene.getAntialiasing()) 
    document.querySelector("#deslizadorNSamples").style.display = 'none';

  document.querySelector("#current_epsilon").value = -Math.log10(theScene.getEpsilon());
  document.querySelector("#valor_epsilon").innerHTML = theScene.getEpsilon();


  redraw();
}

//
// ─── CRONOMETRO: ¿CUANTO TARDA EN PROCESARSE EL FRAME ACTUAL? ───────────────────
//

var timer;

function timeRedraw() {
  document.querySelector("#contador-valor").innerHTML = "<b>Tiempo de procesado: </b>" + timer.toFixed(5);
}

//
// ─── REDIBUJAR ──────────────────────────────────────────────────────────────────
//
function redraw() {
  var start = performance.now();
  theScene.drawScene();
  var end = performance.now();
  timer = end-start;
  timeRedraw();
}
  

//
// ─── ACTUALIZA LA POSICION ACTUAL ───────────────────────────────────────────────
//  
function actualizaValorPosicion(posicion) {
    $('#posX').val(posicion[0].toFixed(2));
    $('#posY').val(posicion[1].toFixed(2));
    $('#posZ').val(posicion[2].toFixed(2));
}

function resizeCanvas () {
  if(window.innerWidth < 992) {
    document.querySelector("#glCanvas").style.width = "100%";
  }
}



// ────────────────────────────────────────────────────────────────────────────────
