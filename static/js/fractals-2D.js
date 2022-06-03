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
/*
  let LLCXX = document.querySelector("#LLCX");
  $('#LLCX').keydown(function(e) {
    e.stopPropagation();
  })
/*
  $("#LLCX").on("keypress keydown keyup", function(e) {
    e.stopPropagation();
  }); 
*/
  // Pulsar una tecla
  document.addEventListener("keydown", (event) => onKeyDown(event), true );

  // Fractal que se visualiza
  const fractal = document.querySelector("#fractales");
  fractal.selectedIndex = 0;
  hideJuliaSliders();
  fractal.addEventListener('change', changeFractal, true);

  // Deslizador con el numero maximo de iteraciones
  const deslizadorNIter = document.querySelector("#nIteraciones"),
        valorNIter = document.querySelector("#valorNIteraciones");
  deslizadorNIter.value = theScene.getMaxIterations();
  valorNIter.value = theScene.getMaxIterations();
  deslizadorNIter.addEventListener('input', (event) => changeMaxIterations(event), true);
  valorNIter.addEventListener('change', (event) => changeMaxIterations(event), true);

  // Deslizador con la componente x del elemento c = x + iy del conjunto de Julia
  const deslizadorJuliaX = document.querySelector("#juliaX"),
        valorJuliaX = document.querySelector("#valorJuliaX");
  deslizadorJuliaX.value = theScene.getJuliaConstantX();
  valorJuliaX.value = theScene.getJuliaConstantX();
  deslizadorJuliaX.addEventListener('input', (event) => changeJuliaX(event), true);
  valorJuliaX.addEventListener('change', (event) => changeJuliaX(event), true);

  // Deslizador con la componente y del elemento c = x + iy del conjunto de Julia
  const deslizadorJuliaY = document.querySelector("#juliaY"),
        valorJuliaY = document.querySelector("#valorJuliaY");
  deslizadorJuliaY.value = theScene.getJuliaConstantY();
  valorJuliaY.value = theScene.getJuliaConstantY();
  deslizadorJuliaY.addEventListener('input', (event) => changeJuliaY(event), true);
  valorJuliaY.addEventListener('change', (event) => changeJuliaY(event), true);

  // Deslizador con el exponente m de la funcion P(z) = z^m + c
  const deslizadorExp = document.querySelector("#exponente"),
        valorExponente = document.querySelector("#valorExponente");
  deslizadorExp.value = theScene.getOrder();
  valorExponente.value = theScene.getOrder();
  deslizadorExp.addEventListener('input', (event) => changeExponente(event), true);
  valorExponente.addEventListener('change', (event) => changeExponente(event), true);

  const LLCX = document.querySelector("#LLCX"),
        LLCY = document.querySelector("#LLCY"),
        URCX = document.querySelector("#URCX"),
        URCY = document.querySelector("#URCY");
  


  LLCX.value = theScene.getLLC()[0];
  LLCY.value = theScene.getLLC()[1];
  URCX.value = theScene.getURC()[0];
  URCY.value = theScene.getURC()[1];

  LLCX.addEventListener('change', (event) => changeLLCX(event), true);
  LLCY.addEventListener('change', (event) => changeLLCY(event), true);
  URCX.addEventListener('change', (event) => changeURCX(event), true);
  URCY.addEventListener('change', (event) => changeURCY(event), true);

  // Boton de reseteo de parametros
  const botonReset = document.querySelector("#botonReset");
  botonReset.onclick = resetParameters;
  
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
// ─── GESTORA DEL EVENTO PULSAR UNA TECLA ────────────────────────────────────────
//  
function onKeyDown(event) {
  if( document.activeElement === document.querySelector("#nIteraciones") ||
      document.activeElement === document.querySelector("#juliaX") ||
      document.activeElement === document.querySelector("#juliaY") ||
      document.activeElement === document.querySelector("#exponente") ||
      document.activeElement === document.querySelector("#LLCX") ||
      document.activeElement === document.querySelector("#LLCY") ||
      document.activeElement === document.querySelector("#URCX") ||
      document.activeElement === document.querySelector("#URCY")) return;

  let key = event.wich || event.keyCode;
  let LLCX = document.querySelector("#LLCX"),
      LLCY = document.querySelector("#LLCY"),
      URCX = document.querySelector("#URCX"),
      URCY = document.querySelector("#URCY");
  switch (key) {
    case 37:  // Left key
      theScene.moveLeft();
      LLCX.value = theScene.getLLC()[0].toFixed(2);
      URCX.value = theScene.getURC()[0].toFixed(2);
      break;

    case 38:  // Up key
      theScene.moveUp();
      LLCY.value = theScene.getLLC()[1].toFixed(2);
      URCY.value = theScene.getURC()[1].toFixed(2);
      break;

    case 39:  // Right key
      theScene.moveRight();
      LLCX.value = theScene.getLLC()[0].toFixed(2);
      URCX.value = theScene.getURC()[0].toFixed(2);
      break;

    case 40:  // Down key
      theScene.moveDown();
      LLCY.value = theScene.getLLC()[1].toFixed(2);
      URCY.value = theScene.getURC()[1].toFixed(2);
      break;
    
    case 187:  // + key
      theScene.zoomIn();
      LLCX.value = theScene.getLLC()[0].toFixed(2);
      URCX.value = theScene.getURC()[0].toFixed(2);
      LLCY.value = theScene.getLLC()[1].toFixed(2);
      URCY.value = theScene.getURC()[1].toFixed(2);
      break;

    case 189:  // - key
      theScene.zoomOut();
      LLCX.value = theScene.getLLC()[0].toFixed(2);
      URCX.value = theScene.getURC()[0].toFixed(2);
      LLCY.value = theScene.getLLC()[1].toFixed(2);
      URCY.value = theScene.getURC()[1].toFixed(2);
      break;

    default:
      break;
  }


  theScene.drawScene();
}

//
// ─── CAMBIAR NUMERO MAXIMO DE ITERACIONES ───────────────────────────────────────
//  
function changeMaxIterations(event){
  let new_value = verifyMaxIterations(event.target.value);
  document.querySelector("#valorNIteraciones").value = new_value;
  document.querySelector("#nIteraciones").value = new_value;
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
  console.log(new_value);
  document.querySelector("#valorJuliaX").value = new_value;
  document.querySelector("#juliaX").value = new_value;
  theScene.setJuliaConstantX(new_value);
  theScene.drawScene();
}

function changeJuliaY(event) {
  let new_value = verifyInputJulia(event.target.value);
  console.log(new_value);
  document.querySelector("#valorJuliaY").value = new_value;
  document.querySelector("#juliaY").value = new_value;
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
  document.querySelector("#valorExponente").value = new_value;
  document.querySelector("#exponente").value = new_value;
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
  if(!document.querySelector("#LLCFixed").checked){
    let new_value = verifyLLCX(event.target.value),
        URCFixed = document.querySelector("#URCFixed").checked;
    theScene.setLLCX(new_value, URCFixed);
    theScene.drawScene();
  }
  reloadPositionInput();
}

function changeLLCY(event) {
  if(!document.querySelector("#LLCFixed").checked){
    let new_value = verifyLLCY(event.target.value),
      URCFixed = document.querySelector("#URCFixed").checked;
  theScene.setLLCY(new_value, URCFixed);
  theScene.drawScene();
  }
  reloadPositionInput();
}

function verifyLLCX(number) {
  let URCX = document.querySelector("#URCX").value
  return Math.min(Math.max(-10.0, parseFloat(number)), parseFloat(URCX)-0.1);
}


function verifyLLCY(number) {
  let URCY = document.querySelector("#URCY").value
  return Math.min(Math.max(-10.0, parseFloat(number)), parseFloat(URCY)-0.1);
}

function changeURCX(event) {
  if(!document.querySelector("#URCFixed").checked) {
    let new_value = verifyURCX(event.target.value),
        LLCFixed = document.querySelector("#LLCFixed").checked;
    theScene.setURCX(new_value, LLCFixed);
    theScene.drawScene();
  }
  reloadPositionInput()
}

function changeURCY(event) {
  if(!document.querySelector("#URCFixed").checked) {
    let new_value = verifyURCY(event.target.value),
        LLCFixed = document.querySelector("#LLCFixed").checked;
    theScene.setURCY(new_value, LLCFixed);
    theScene.drawScene();
  }
  reloadPositionInput();
}

function verifyURCX(number) {
  let LLCX = document.querySelector("#LLCX").value;
  return Math.min(Math.max(parseFloat(LLCX)+0.1, parseFloat(number)), 10.0);
}

function verifyURCY(number) {
  let LLCY = document.querySelector("#LLCY").value
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
  const fractales = document.querySelector("#fractales")
  var selected = parseInt(fractales.value);
  if(selected != 1) 
    hideJuliaSliders();
  else
    showJuliaSliders();
  theScene.setFractal(selected);
  theScene.drawScene();
}

function hideJuliaSliders() {
  document.querySelector("#constanteJulia").style.display = 'none';
}

function showJuliaSliders() {
  document.querySelector("#constanteJulia").style.display = 'block'
}

//
// ─── RESTABLECER PARAMETROS INICIALES ───────────────────────────────────────────
//
function resetParameters(){
  theScene.setInitialParameters();

  document.querySelector("#nIteraciones").value = theScene.getMaxIterations();
  document.querySelector("#valorNIteraciones").value = theScene.getMaxIterations()
  
  document.querySelector("#juliaX").value = theScene.getJuliaConstantX();
  document.querySelector("#valorJuliaX").value = theScene.getJuliaConstantX()

  document.querySelector("#juliaY").value = theScene.getJuliaConstantY();
  document.querySelector("#valorJuliaY").value = theScene.getJuliaConstantY()
  
  document.querySelector("#exponente").value = theScene.getOrder();
  document.querySelector("#valorExponente").value = theScene.getOrder()
  
  document.querySelector("#fractales").value = theScene.getFractal();
  theScene.getFractal() == 1 ? showJuliaSliders() : hideJuliaSliders();

  reloadPositionInput();

  theScene.drawScene();
}

function resizeCanvas() {
  let canvas = document.querySelector("#glCanvas"),
      defaultHeight = canvas.height; 

  if(window.innerWidth < 992) {
    //canvas.style.width = (window.innerWidth-30).toString() + "px";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  }
  else {
    if(window.innerHeight < defaultHeight) {
      canvas.style.height = (window.innerHeight-120).toString() + "px";
      canvas.style.width = (window.innerHeight-120).toString() + "px";
    }
    else if (window.innerHeight > 1200 ) {//defaultHeight + 120) {
        canvas.style.height = defaultHeight.toString() + "px";
        canvas.style.width = defaultHeight.toString() + "px";
    }
    else {
      canvas.style.height = "600px";
      canvas.style.width = "600px";
    }
  }
  
}

window.onresize = resizeCanvas;