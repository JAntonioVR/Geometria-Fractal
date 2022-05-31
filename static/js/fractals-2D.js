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

  // Pulsar una tecla
  document.addEventListener("keydown", (event) => onKeyDown(event), true );

  // Fractal que se visualiza
  const fractal = document.querySelector("#fractales");
  fractal.selectedIndex = 0;
  fractal.addEventListener('change', changeFractal, true);

  // Deslizador con el numero maximo de iteraciones
  const deslizadorNIter = document.querySelector("#nIteraciones");
  deslizadorNIter.value = theScene.getMaxIterations();
  document.querySelector("#valorNIteraciones").innerHTML = theScene.getMaxIterations();
  deslizadorNIter.addEventListener('input', (event) => changeMaxIterations(event), true);

  // Deslizador con la componente x del elemento c = x + iy del conjunto de Julia
  const deslizadorJuliaX = document.querySelector("#juliaX");
  deslizadorJuliaX.value = theScene.getJuliaConstantX();
  document.querySelector("#valorJuliaX").innerHTML = theScene.getJuliaConstantX();
  deslizadorJuliaX.addEventListener('input', (event) => changeJuliaX(event), true);

  // Deslizador con la componente y del elemento c = x + iy del conjunto de Julia
  const deslizadorJuliaY = document.querySelector("#juliaY");
  deslizadorJuliaY.value = theScene.getJuliaConstantY();
  document.querySelector("#valorJuliaY").innerHTML = theScene.getJuliaConstantY();
  deslizadorJuliaY.addEventListener('input', (event) => changeJuliaY(event), true);

  // Deslizador con el exponente m de la funcion P(z) = z^m + c
  const deslizadorExp = document.querySelector("#exponente");
  deslizadorExp.value = theScene.getOrder();
  document.querySelector("#valorExponente").innerHTML = theScene.getOrder();
  deslizadorExp.addEventListener('input', (event) => changeExponente(event), true);

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
  theScene.drawScene();
}

//
// ─── CAMBIAR NUMERO MAXIMO DE ITERACIONES ───────────────────────────────────────
//  
function changeMaxIterations(event){
  document.querySelector("#valorNIteraciones").innerHTML = event.target.value;
  theScene.setMaxIterations(event.target.value);
  theScene.drawScene();
}

//
// ─── CAMBIAR LA CONSTANTE c DEL CONJUNTO DE JULIA ───────────────────────────────
// c = x + iy

function changeJuliaX(event) {
  document.querySelector("#valorJuliaX").innerHTML = event.target.value;
  theScene.setJuliaConstantX(event.target.value);
  theScene.drawScene();
}

function changeJuliaY(event) {
  document.querySelector("#valorJuliaY").innerHTML = event.target.value;
  theScene.setJuliaConstantY(event.target.value);
  theScene.drawScene();
}

//
// ─── CAMBIAR EL EXPONENTE DE P(z) ────────────────────────────────────────────────
//
function changeExponente(event) {
  document.querySelector("#valorExponente").innerHTML = event.target.value;
  theScene.setOrder(event.target.value);
  theScene.drawScene();
}

//
// ─── CAMBIAR EL FRACTAL QUE SE VISUALIZA ────────────────────────────────────────
//  
function changeFractal(){
  const fractales = document.querySelector("#fractales")
  var selected = parseInt(fractales.value);
  theScene.setFractal(selected);
  theScene.drawScene();
}

//
// ─── RESTABLECER PARAMETROS INICIALES ───────────────────────────────────────────
//
function resetParameters(){
  theScene.setInitialParameters();

  document.querySelector("#nIteraciones").value = theScene.getMaxIterations();
  document.querySelector("#valorNIteraciones").innerHTML = theScene.getMaxIterations()
  
  document.querySelector("#juliaX").value = theScene.getJuliaConstantX();
  document.querySelector("#valorJuliaX").innerHTML = theScene.getJuliaConstantX()

  document.querySelector("#juliaY").value = theScene.getJuliaConstantY();
  document.querySelector("#valorJuliaY").innerHTML = theScene.getJuliaConstantY()
  
  document.querySelector("#exponente").value = theScene.getOrder();
  document.querySelector("#valorExponente").innerHTML = theScene.getOrder()
  
  document.querySelector("#fractales").value = theScene.getFractal();
  theScene.drawScene();
}