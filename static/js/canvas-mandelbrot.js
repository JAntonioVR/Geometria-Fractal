
import { Scene } from "./scene.js";
import { vsSource } from "../glsl/shader-wgl-vertex.js";
import { fsSource } from "../glsl/shader-wgl-fragment.js";

var theScene = new Scene(vsSource, fsSource);

function main(){

    document.addEventListener("keydown", (event) => onKeyDown(event), true );

    const fractal = document.querySelector("#fractales");
    fractal.selectedIndex = 0;
    fractal.addEventListener('change', changeFractal, true);

    const deslizadorNIter = document.querySelector("#nIteraciones");
    deslizadorNIter.value = theScene.getMaxIterations();
    document.querySelector("#valorNIteraciones").innerHTML = theScene.getMaxIterations();
    deslizadorNIter.addEventListener('input', (event) => changeMaxIterations(event), true);

    const deslizadorJuliaX = document.querySelector("#juliaX");
    deslizadorJuliaX.value = theScene.getJuliaConstantX();
    document.querySelector("#valorJuliaX").innerHTML = theScene.getJuliaConstantX();
    deslizadorJuliaX.addEventListener('input', (event) => changeJuliaX(event), true);

    const deslizadorJuliaY = document.querySelector("#juliaY");
    deslizadorJuliaY.value = theScene.getJuliaConstantY();
    document.querySelector("#valorJuliaY").innerHTML = theScene.getJuliaConstantY();
    deslizadorJuliaY.addEventListener('input', (event) => changeJuliaY(event), true);

    const deslizadorExp = document.querySelector("#exponente");
    deslizadorExp.value = theScene.getOrder();
    document.querySelector("#valorExponente").innerHTML = theScene.getOrder();
    deslizadorExp.addEventListener('input', (event) => changeExponente(event), true);

    const botonReset = document.querySelector("#botonReset");
    botonReset.onclick = resetParameters;
    
    theScene.drawScene();
    
}

window.onload = main;

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

function changeMaxIterations(event){
    document.querySelector("#valorNIteraciones").innerHTML = event.target.value;
    theScene.setMaxIterations(event.target.value);
    theScene.drawScene();
}

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

function changeExponente(event) {
  document.querySelector("#valorExponente").innerHTML = event.target.value;
  theScene.setOrder(event.target.value);
  theScene.drawScene();
}

function changeFractal(){
  const fractales = document.querySelector("#fractales")
  var selected = parseInt(fractales.value);
  theScene.setFractal(selected);
  theScene.drawScene();
}

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