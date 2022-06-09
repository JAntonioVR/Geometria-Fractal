//
// ──────────────────────────────────────────────────────────────────── I ──────────
//   :::::: fractals-2D.js : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────
// Fichero javascript que gestiona los eventos y los indicadores HTML del fichero
// '2D-fractals.html'


// ─── IMPORTS ──────────────────────────────────────────────────────────────────── 
// Escena 2D
import { Scene2D } from "./scene2D.js";
// Vertex shader
import { vsSource } from "../glsl/shader-wgl-vertex.js";
// Fragment shader
import { fsSource } from "../glsl/shader-wgl-fragment.js";

//
// ─── ESCENA 2D ──────────────────────────────────────────────────────────────────
// Variable global que representa la escena 2D en la que se visualizan los fractales
var theScene = new Scene2D(vsSource, fsSource);

//
// ─── MAIN ───────────────────────────────────────────────────────────────────────
// Funcion que se ejecuta al cargar la página y que contiene la inicialización
// de los indicadores, los 'event listeners' y la primera visualización.
function main(){

  resizeCanvas();

  // Pulsar una tecla
  $(document).keydown(onKeyDown);

  // Fractal que se visualiza
  const fractal = $("#fractales");
  fractal.prop('selectedIndex', 0);
  $("#constanteJulia").hide();
  fractal.change(changeFractal);

  // Deslizador con el numero maximo de iteraciones
  const deslizadorNIter = $("#nIteraciones"),
        valorNIter = $("#valorNIteraciones");
  deslizadorNIter.val(theScene.getMaxIterations());
  valorNIter.val(theScene.getMaxIterations());
  deslizadorNIter.on('input', changeMaxIterations);
  valorNIter.change(changeMaxIterations);

  // Deslizador con la componente x del elemento c = x + iy del conjunto de Julia
  const deslizadorJuliaX = $("#juliaX"),
        valorJuliaX = $("#valorJuliaX");
  deslizadorJuliaX.val(theScene.getJuliaConstantX());
  valorJuliaX.val(theScene.getJuliaConstantX());
  deslizadorJuliaX.on('input', changeJuliaX);
  valorJuliaX.change(changeJuliaX);

  // Deslizador con la componente y del elemento c = x + iy del conjunto de Julia
  const deslizadorJuliaY = $("#juliaY"),
        valorJuliaY = $("#valorJuliaY");
  deslizadorJuliaY.val(theScene.getJuliaConstantY());
  valorJuliaY.val(theScene.getJuliaConstantY());
  deslizadorJuliaY.on('input', changeJuliaY);
  valorJuliaY.change(changeJuliaY);

  // Deslizador con el exponente m de la funcion P(z) = z^m + c
  const deslizadorExp = $("#exponente"),
        valorExponente = $("#valorExponente");
  deslizadorExp.val(theScene.getOrder());
  valorExponente.val(theScene.getOrder());
  deslizadorExp.on('input', changeExponente);
  valorExponente.change(changeExponente);

  // Activar/desactivar antialiasing
  $("#antialiasing").change(changeAntialiasing);

  // En caso de activar antialiasing, cuantas muestras por pixel?
  const deslizadorNSamples = $("#nSamples"),
        valorNSamples = $("#valorNSamples");
  deslizadorNSamples.val(theScene.getNSamples());
  valorNSamples.html(theScene.getNSamples()**2);
  deslizadorNSamples.change(changeNSamples);
  if(!$("#antialiasing").prop("checked")) $("#deslizadorNSamples").hide();


  const LLCX = $("#LLCX"),
        LLCY = $("#LLCY"),
        URCX = $("#URCX"),
        URCY = $("#URCY");
  


  LLCX.val(theScene.getLLC()[0].toFixed(2));
  LLCY.val(theScene.getLLC()[1].toFixed(2));
  URCX.val(theScene.getURC()[0].toFixed(2));
  URCY.val(theScene.getURC()[1].toFixed(2));

  LLCX.change(changeLLCX);
  LLCY.change(changeLLCY);
  URCX.change(changeURCX);
  URCY.change(changeURCY);

  // Boton de reseteo de parametros
  $("#botonReset").click(resetParameters);
  
  // First render
  theScene.drawScene();
    
}

$(window).ready(main);
$(window).keydown(function(e) {
  if(["ArrowUp","ArrowDown"].indexOf(e.code) > -1) {
      e.preventDefault();
  }
});

//
// ────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: G E S T O R E S   D E   E V E N T O S : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────────────
// Las funciones gestoras de eventos modifican los parametros de la escena, actualizan
// si es necesario el HTML del documento y redibujan la escena.

//
// ─── GESTORA DEL EVENTO PULSAR UNA TECLA ────────────────────────────────────────
//  
function onKeyDown(event) {
  if( $("#nIteraciones").is(':focus') ||
      $("#juliaX").is(':focus') ||
      $("#juliaY").is(':focus') ||
      $("#exponente").is(':focus') ||
      $("#LLCX").is(':focus') ||
      $("#LLCY").is(':focus') ||
      $("#URCX").is(':focus') ||
      $("#URCY").is(':focus')) return;

  let key = event.wich || event.keyCode;
  let LLCX = $("#LLCX"),
      LLCY = $("#LLCY"),
      URCX = $("#URCX"),
      URCY = $("#URCY");
  switch (key) {
    case 37:  // Left key
      theScene.moveLeft();
      LLCX.val(theScene.getLLC()[0].toFixed(2));
      URCX.val(theScene.getURC()[0].toFixed(2));
      break;

    case 38:  // Up key
      theScene.moveUp();
      LLCY.val(theScene.getLLC()[1].toFixed(2));
      URCY.val(theScene.getURC()[1].toFixed(2));
      break;

    case 39:  // Right key
      theScene.moveRight();
      LLCX.val(theScene.getLLC()[0].toFixed(2));
      URCX.val(theScene.getURC()[0].toFixed(2));
      break;

    case 40:  // Down key
      theScene.moveDown();
      LLCY.val(theScene.getLLC()[1].toFixed(2));
      URCY.val(theScene.getURC()[1].toFixed(2));
      break;
    
    case 187:  // + key
      theScene.zoomIn();
      LLCX.val(theScene.getLLC()[0].toFixed(2));
      URCX.val(theScene.getURC()[0].toFixed(2));
      LLCY.val(theScene.getLLC()[1].toFixed(2));
      URCY.val(theScene.getURC()[1].toFixed(2));
      break;

    case 189:  // - key
      theScene.zoomOut();
      LLCX.val(theScene.getLLC()[0].toFixed(2));
      URCX.val(theScene.getURC()[0].toFixed(2));
      LLCY.val(theScene.getLLC()[1].toFixed(2));
      URCY.val(theScene.getURC()[1].toFixed(2));
      break;

    default:
      break;
  }
  theScene.drawScene();
}


//
// ─── ACTIVAR O DESACTIVAR ANTIALIASING ───────────────────────────────────────────
//
function changeAntialiasing(){
  theScene.changeAntialiasing();
  if(theScene.getAntialiasing())
    $("#deslizadorNSamples").show();
  else
    $("#deslizadorNSamples").hide();   
  theScene.drawScene();
}

//
// ─── CAMBIAR NUMERO DE RAYOS POR PIXEL ──────────────────────────────────────────
// Solo se aplica si el antialiasing esta activado
function changeNSamples(event) {
  $("#valorNSamples").html(event.target.value**2);
  theScene.setNSamples(event.target.value);
  theScene.drawScene();
}

//
// ─── CAMBIAR NUMERO MAXIMO DE ITERACIONES ───────────────────────────────────────
//  
function changeMaxIterations(event){
  let new_value = verifyMaxIterations(event.target.value);
  $("#valorNIteraciones").val(new_value);
  $("#nIteraciones").val(new_value);
  theScene.setMaxIterations(new_value);
  theScene.drawScene();
}

function verifyMaxIterations(number) {
  return parseInt(Math.min(Math.max(10, number), 1000));
}

//
// ─── CAMBIAR LA CONSTANTE c DEL CONJUNTO DE JULIA ───────────────────────────────
// c = x + iy

function changeJuliaX(event) {
  let new_value = verifyInputJulia(event.target.value);
  $("#valorJuliaX").val(new_value);
  $("#juliaX").val(new_value);
  theScene.setJuliaConstantX(new_value);
  theScene.drawScene();
}

function changeJuliaY(event) {
  let new_value = verifyInputJulia(event.target.value);
  $("#valorJuliaY").val(new_value);
  $("#juliaY").val(new_value);
  theScene.setJuliaConstantY(new_value);
  theScene.drawScene();
}

function verifyInputJulia(number) {
  return Math.min(Math.max(-2.0, number), 2.0);
}

//
// ─── CAMBIAR EL EXPONENTE DE P(z) ────────────────────────────────────────────────
//
function changeExponente(event) {
  let new_value = verifyExponent(event.target.value);
  $("#valorExponente").val(new_value);
  $("#exponente").val(new_value);
  theScene.setOrder(new_value);
  theScene.drawScene();
}

function verifyExponent(number) {
  return parseInt(Math.min(Math.max(1, number), 10));
}

//
// ─── CAMBIAR EL CUADRO VISUALIZADO ──────────────────────────────────────────────
//  
function changeLLCX(event) {
  if(!$("#LLCFixed").prop('checked')){
    let new_value = verifyLLCX(event.target.value),
        URCFixed = $("#URCFixed").prop('checked');
    theScene.setLLCX(new_value, URCFixed);
    theScene.drawScene();
  }
  reloadPositionInput();
}

function changeLLCY(event) {
  if(!$("#LLCFixed").prop('checked')){
    let new_value = verifyLLCY(event.target.value),
      URCFixed = $("#URCFixed").prop('checked');
  theScene.setLLCY(new_value, URCFixed);
  theScene.drawScene();
  }
  reloadPositionInput();
}

function verifyLLCX(number) {
  let URCX = $("#URCX").val();
  return Math.min(Math.max(-10.0, parseFloat(number)), parseFloat(URCX)-0.1);
}


function verifyLLCY(number) {
  let URCY = $("#URCY").val();
  return Math.min(Math.max(-10.0, parseFloat(number)), parseFloat(URCY)-0.1);
}

function changeURCX(event) {
  if(!$("#URCFixed").prop('checked')) {
    let new_value = verifyURCX(event.target.value),
        LLCFixed = $("#LLCFixed").prop('checked');
    theScene.setURCX(new_value, LLCFixed);
    theScene.drawScene();
  }
  reloadPositionInput()
}

function changeURCY(event) {
  if(!$("#URCFixed").prop('checked')) {
    let new_value = verifyURCY(event.target.value),
        LLCFixed = $("#LLCFixed").prop('checked');
    theScene.setURCY(new_value, LLCFixed);
    theScene.drawScene();
  }
  reloadPositionInput();
}

function verifyURCX(number) {
  let LLCX = $("#LLCX").val();
  return Math.min(Math.max(parseFloat(LLCX)+0.1, parseFloat(number)), 10.0);
}

function verifyURCY(number) {
  let LLCY = $("#LLCY").val();
  return Math.min(Math.max(parseFloat(LLCY)+0.1, parseFloat(number)), 10.0);
}

function reloadPositionInput() {
  $("#LLCX").val(theScene.getLLC()[0].toFixed(2));
  $("#LLCY").val(theScene.getLLC()[1].toFixed(2));
  $("#URCX").val(theScene.getURC()[0].toFixed(2));
  $("#URCY").val(theScene.getURC()[1].toFixed(2));
}

//
// ─── CAMBIAR EL FRACTAL QUE SE VISUALIZA ────────────────────────────────────────
//  
function changeFractal(){
  const fractales = $("#fractales");
  var selected = parseInt(fractales.val());
  if(selected != 1) 
    $("#constanteJulia").hide();
  else
    $("#constanteJulia").show();
  theScene.setFractal(selected);
  theScene.drawScene();
}



//
// ─── RESTABLECER PARAMETROS INICIALES ───────────────────────────────────────────
//
function resetParameters(){
  theScene.setInitialParameters();

  $("#nIteraciones").val(theScene.getMaxIterations());
  $("#valorNIteraciones").val(theScene.getMaxIterations());
  $("#juliaX").val(theScene.getJuliaConstantX());
  $("#valorJuliaX").val(theScene.getJuliaConstantX());
  $("#juliaY").val(theScene.getJuliaConstantY());
  $("#valorJuliaY").val(theScene.getJuliaConstantY());
  $("#exponente").val(theScene.getOrder());
  $("#valorExponente").val(theScene.getOrder());
  $("#fractales").val(theScene.getFractal());
  theScene.getFractal() == 1 ? $("#constanteJulia").show() : $("#constanteJulia").hide();

  $("#antialiasing").prop('checked', false);
  if(theScene.getAntialiasing()) theScene.changeAntialiasing();
  $("#nSamples").val(1);
  $("#valorNSamples").text("1");
  $("#deslizadorNSamples").hide();
  reloadPositionInput();

  theScene.drawScene();
}

function resizeCanvas () {
  if(window.innerWidth < 992) {
    $("#glCanvas").width("100%");
  }
}


$(window).on('resize', resizeCanvas);