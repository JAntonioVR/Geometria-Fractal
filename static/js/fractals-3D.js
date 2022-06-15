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
import { vsSource } from "../glsl/vertex-shader.js";
// Fragment shader
import { fsSource } from "../glsl/fragment-shader-3D-fractals.js";
//import { fsSource } from "../glsl/fragment-shader-ray-tracer.js";
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
// ─── MODO DE USO ────────────────────────────────────────────────────────────────
// Enumerado para describir el modo de uso: interactivo o a demanda
const Mode = Object.freeze({
  INTERACTIVE: 0,
  ONDEMAND: 1
});

var mode = Mode.ONDEMAND; // Inicialmente a demanda

//
// ─── ESCENA 3D ──────────────────────────────────────────────────────────────────
// Variable global que representa la escena 3D en la que se visualizan los fractales
var theScene = new Scene3D(vsSource, fsSource);

//
// ─── MAIN ───────────────────────────────────────────────────────────────────────
// Funcion que se ejecuta al cargar la página y que contiene la inicialización
// de los indicadores, los 'event listeners' y la primera visualización.
function main(){

  resizeCanvas();

  // No ejecutar en móviles
  if(window.screen.width <= 480) {
    window.alert("No es posible ejecutar esta página en dispositivos móviles");
    return;
  }

  $(document).keydown(onKeyDown);

  $("#interactivo").change(changeMode);
  $("#a-demanda").change(changeMode);

  // Movimiento de camara usando el raton
  const glCanvas = $("#glCanvas");
  glCanvas.on('mousemove', moveCamera);
  glCanvas.on('mousedown', mouseDown);
  glCanvas.on('mouseup', mouseUp);

  // Boton de reseteo de parametros
  const botonReset = $("#botonReset");
  botonReset.click(resetParameters);
  actualizaValorPosicion(theScene.getPosition());

  // Color de la componente ambiental del material parametrizable
  const ka_input = $("#ka");
  ka_input.val(rgbToHex(theScene.getKa()));
  ka_input.change(change_ka);

  // Color de la componente difusa del material parametrizable
  const kd_input = $("#kd");
  kd_input.val(rgbToHex(theScene.getKd()));
  kd_input.change(change_kd);

  // Color de la componente especular del material parametrizable
  const ks_input = $("#ks");
  ks_input.val(rgbToHex(theScene.getKs()));
  ks_input.change(change_ks);

  // Exponente de brillo especular del material parametrizable
  const sh_input = $("#sh");
  sh_input.val(theScene.getSh());
  $("#valor_sh").val(theScene.getSh());
  sh_input.on('input', change_sh);
  $('#valor_sh').change(change_sh);

  // Intensidad de la luz izquierda
  const lightColor0_input = $("#lightColor0");
  lightColor0_input.val(rgbToHex(theScene.getLightColor(0)));
  lightColor0_input.change(changeLightColor0);

  // La luz izquierda arroja sombras?
  const shadows_0 = $("#shadows_0");
  shadows_0.change(changeShadow0);

  // Intensidad de la luz derecha
  const lightColor1_input = $("#lightColor1");
  lightColor1_input.val(rgbToHex(theScene.getLightColor(1)));
  lightColor1_input.change(changeLightColor1);

  // La luz derecha arroja sombras?
  const shadows_1 = $("#shadows_1");
  shadows_1.change(changeShadow1);

  // Fractal que se visualiza
  const fractal = $("#fractales");
  fractal.val(theScene.getFractal());
  fractal.change(changeFractal);

  // Deslizador con la componente x del elemento c = x + yi + zj + wk del conjunto de Julia
  const juliaX = $("#juliaX");
  juliaX.val(theScene.getJuliaConstant()[0]);
  $('#valorJuliaX').val(theScene.getJuliaConstant()[0]);
  juliaX.on('input', changeJuliaConstantX);
  $('#valorJuliaX').change(changeJuliaConstantX);

  // Deslizador con la componente y del elemento c = x + yi + zj + wk del conjunto de Julia
  const juliaY = $("#juliaY");
  juliaY.val(theScene.getJuliaConstant()[1]);
  $('#valorJuliaY').val(theScene.getJuliaConstant()[1]);
  juliaY.on('input', changeJuliaConstantY);
  $('#valorJuliaY').change(changeJuliaConstantY);

  // Deslizador con la componente z del elemento c = x + yi + zj + wk del conjunto de Julia
  const juliaZ = $("#juliaZ");
  juliaZ.val(theScene.getJuliaConstant()[2]);
  $('#valorJuliaZ').val(theScene.getJuliaConstant()[2]);
  juliaZ.on('input', changeJuliaConstantZ);
  $('#valorJuliaZ').change(changeJuliaConstantZ);

  // Deslizador con la componente w del elemento c = x + yi + zj + wk del conjunto de Julia
  const juliaW = $("#juliaW");
  juliaW.val(theScene.getJuliaConstant()[3]);
  $('#valorJuliaW').val(theScene.getJuliaConstant()[3]);
  juliaW.on('input', changeJuliaConstantW);
  $('#valorJuliaW').change(changeJuliaConstantW);

  // No mostrar el menu si no se estan visualizando conjuntos de Julia
  if(theScene.getFractal() != 2)
    $("#constanteJulia").hide();

  // Activar/desactivar antialiasing
  $("#antialiasing").change(changeAntialiasing);

  // En caso de activar antialiasing, cuantos rayos por pixel?
  const nSamples = $("#nSamples");
  nSamples.val(theScene.getNSamples());
  $("#valorNSamples").html(theScene.getNSamples()**2);
  nSamples.change(changeNSamples);
  if(!$("#antialiasing").prop('checked')) $("#deslizadorNSamples").hide();

  // Deslizador para calcular el valor de epsilon usado en ray-marching
  const epsilon = $("#current_epsilon");
  var epsilonValue = theScene.getEpsilon();
  var exp = Math.log10(epsilonValue);
  epsilon.val(-exp);
  $("#valor_epsilon").html((10**(exp)).toFixed(4));
  epsilon.on('input', changeEpsilon);

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

$(window).ready(main);
$(window).keydown(function(e) {
  if(["ArrowUp","ArrowDown"].indexOf(e.code) > -1) {
      e.preventDefault();
  }
});
$(window).on('resize', resizeCanvas);


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
  const value = hexToRgb($("#ka").val());
  theScene.setKa(value);
  if(mode == Mode.INTERACTIVE)
      redraw();
}

//
// ─── CAMBIO DE LA COMPONENTE DIFUSA ─────────────────────────────────────────────
//
function change_kd() {
  const value = hexToRgb($("#kd").val());
  console.log(value)
  theScene.setKd(value);
  if(mode == Mode.INTERACTIVE)
      redraw();
}

//
// ─── CAMBIO DE LA COMPONENTE ESPECULAR ──────────────────────────────────────────
//
function change_ks() {
  const value = hexToRgb($("#ks").val());
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
  return parseInt(Math.min(Math.max(1, number), 1000));
}

//
// ─── CAMBIO DE LA INTENSIDAD DE LA LUZ 0 ────────────────────────────────────────
//
function changeLightColor0() {
  const value = hexToRgb($("#lightColor0").val());
  theScene.setLightColor(0, value);
  if(mode == Mode.INTERACTIVE)
      redraw();
}

//
// ─── ACTIVAR O DESACTIVAR SOMBRAS DE LA LUZ 0 ───────────────────────────────────
//
function changeShadow0(){
  theScene.changeShadow(0);
  if(mode == Mode.INTERACTIVE)
      redraw();
}

//
// ─── CAMBIO DE LA INTENSIDAD DE LA LUZ 1 ────────────────────────────────────────
//
function changeLightColor1() {
  const value = hexToRgb($("#lightColor1").val());
  theScene.setLightColor(1, value);
  if(mode == Mode.INTERACTIVE)
      redraw();
}

//
// ─── ACTIVAR O DESACTIVAR SOMBRAS DE LA LUZ 1 ───────────────────────────────────
//
function changeShadow1(){
  theScene.changeShadow(1);
  if(mode == Mode.INTERACTIVE)
      redraw();
}

//
// ─── CAMBIAR EL FRACTAL QUE SE VISUALIZA ────────────────────────────────────────
//
function changeFractal() {
  const fractales = $("#fractales")
  var selected = parseInt(fractales.val());
  if(selected != 2)
    $("#constanteJulia").hide()
  else
    $("#constanteJulia").show();
  theScene.setFractal(selected);
  if(mode == Mode.INTERACTIVE)
    redraw();
}

//
// ─── CAMBIAR LA CONSTANTE c DEL CONJUNTO DE JULIA ───────────────────────────────
// c = x + yi + zj + wk

function changeJuliaConstantX(event) {
  let new_value = verifyInputJulia(event.target.value);
  $("#juliaX").val(new_value);
  $("#valorJuliaX").val(new_value);
  let C = theScene.getJuliaConstant();
  C[0] = new_value;
  theScene.setJuliaConstant(C);
  if(mode == Mode.INTERACTIVE)
      redraw();
}

function changeJuliaConstantY(event) {
  let new_value = verifyInputJulia(event.target.value);
  $("#juliaY").val(new_value);
  $("#valorJuliaY").val(new_value);
  let C = theScene.getJuliaConstant();
  C[1] = event.target.value;
  theScene.setJuliaConstant(C);
  if(mode == Mode.INTERACTIVE)
      redraw();
}

function changeJuliaConstantZ(event) {
  let new_value = verifyInputJulia(event.target.value);
  $("#juliaZ").val(new_value);
  $("#valorJuliaZ").val(new_value);
  let C = theScene.getJuliaConstant();
  C[2] = event.target.value;
  theScene.setJuliaConstant(C);
  if(mode == Mode.INTERACTIVE)
      redraw();
}

function changeJuliaConstantW(event) {
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
    $("#deslizadorNSamples").show();
  else
    $("#deslizadorNSamples").hide();
  if(mode == Mode.INTERACTIVE)
      redraw();
}

//
// ─── CAMBIAR NUMERO DE RAYOS POR PIXEL ──────────────────────────────────────────
// Solo se aplica si el antialiasing esta activado
function changeNSamples(event) {
  $("#valorNSamples").html(event.target.value**2);
  theScene.setNSamples(event.target.value);
  if(mode == Mode.INTERACTIVE)
      redraw();
}

//
// ─── CAMBIAR EPSILON ────────────────────────────────────────────────────────────
//
function changeEpsilon(event) {
  $("#valor_epsilon").html((10**(-event.target.value)).toFixed(4));
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
  if( $("#valor_sh").is(':focus') ||
      $("#valorJuliaX").is(':focus') ||
      $("#valorJuliaY").is(':focus') ||
      $("#valorJuliaZ").is(':focus') ||
      $("#valorJuliaW").is(':focus') ||
      $("#posX").is(':focus') ||
      $("#posY").is(':focus') ||
      $("#posZ").is(':focus') ) return;
      
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
      if (!event.ctrlKey) {
        theScene.zoomIn();
        break;
      }

    case 189:  // - key
      if (!event.ctrlKey) {
        theScene.zoomOut();
        break;
      }

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
  mode = Mode.ONDEMAND;
  $("#interactivo").prop("checked", false);
  $("#a-demanda").prop("checked", true);

  $("#ka").val(rgbToHex(theScene.getKa()));
  $("#kd").val(rgbToHex(theScene.getKd()));
  $("#ks").val(rgbToHex(theScene.getKs()));
  $("#sh").val(theScene.getSh());
  $("#valor_sh").html(theScene.getSh());
  $("#lightColor0").val(rgbToHex(theScene.getLightColor(0)));
  $("#shadows_0").prop('checked', false);
  $("#lightColor1").val(rgbToHex(theScene.getLightColor(1)));
  $("#shadows_1").prop('checked', false);

  $("#juliaX").val(theScene.getJuliaConstant()[0]);
  $("#valorJuliaX").html(theScene.getJuliaConstant()[0]);
  $("#juliaY").val(theScene.getJuliaConstant()[1]);
  $("#valorJuliaY").html(theScene.getJuliaConstant()[1]);
  $("#juliaZ").val(theScene.getJuliaConstant()[2]);
  $("#valorJuliaZ").html(theScene.getJuliaConstant()[2]);
  $("#juliaW").val(theScene.getJuliaConstant()[3]);
  $("#valorJuliaW").html(theScene.getJuliaConstant()[3]);
  if(theScene.getFractal() != 2)
    $("#constanteJulia").hide();

  $("#antialiasing").prop('checked', false);
  $("#nSamples").val(theScene.getNSamples());
  $("#valorNSamples").html(theScene.getNSamples()**2);
  if(!theScene.getAntialiasing())
    $("#deslizadorNSamples").hide();

  $("#current_epsilon").val(-Math.log10(theScene.getEpsilon()));
  $("#valor_epsilon").innerHTML = theScene.getEpsilon();

  $("#posX").val(theScene.getPosition()[0]);
  $("#posY").val(theScene.getPosition()[1]);
  $("#posZ").val(theScene.getPosition()[2]);

  redraw();
}

//
// ─── CRONOMETRO: ¿CUANTO TARDA EN PROCESARSE EL FRAME ACTUAL? ───────────────────
//

var timer;

function timeRedraw() {
  $("#contador-valor").html("<b>Tiempo de procesado: </b>" + timer.toFixed(5));
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

window.onresize = resizeCanvas;

// ────────────────────────────────────────────────────────────────────────────────
