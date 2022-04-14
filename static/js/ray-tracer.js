
import { Scene3D } from "./scene3D.js";
import { vsSource } from "../glsl/shader-wgl-vertex.js";
import { fsSource } from "../glsl/shader-ray-tracer-fragment.js";
import { hexToRgb } from "./utils.js";


var theScene = new Scene3D(vsSource, fsSource);

function main(){

    document.addEventListener("keydown", (event) => onKeyDown(event), true );

    const botonReset = document.querySelector("#botonReset");
    botonReset.onclick = resetParameters;
    actualizaValorPosicion(theScene.getPosition());

    const ke_input = document.querySelector("#ke");
    ke_input.addEventListener('input', change_ke, true);

    const ka_input = document.querySelector("#ka");
    ka_input.addEventListener('input', change_ka, true);

    const kd_input = document.querySelector("#kd");
    kd_input.addEventListener('input', change_kd, true);

    const ks_input = document.querySelector("#ks");
    ks_input.addEventListener('input', change_ks, true);

    const sh_input = document.querySelector("#sh");
    sh_input.value = theScene.get_sh();
    document.querySelector("#valor_sh").innerHTML = theScene.get_sh();
    sh_input.addEventListener('input', (event) => change_sh(event), true);


    const light_color_input = document.querySelector("#light_color");
    light_color_input.addEventListener('input', change_light_color, true);
    
    theScene.drawScene();
    
}

function change_ke() {
  const value = document.querySelector("#ke").value;
  theScene.set_ke(value);
  theScene.drawScene();
}

function change_ka() {
  const value = document.querySelector("#ka").value;
  theScene.set_ka(value);
  theScene.drawScene();
}
  
function change_kd() {
  const value = document.querySelector("#kd").value;
  theScene.set_kd(value);
  theScene.drawScene();
}

function change_ks() {
  const value = document.querySelector("#ks").value;
  theScene.set_ks(value);
  theScene.drawScene();
}

function change_sh(event) {
  document.querySelector("#valor_sh").innerHTML = event.target.value;
  theScene.set_sh(event.target.value);
  theScene.drawScene();
}

function change_light_color() {
  const value = document.querySelector("#light_color").value;
  theScene.set_light_color(value);
  theScene.drawScene();
}

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

function resetParameters() {
    theScene.setInitialParameters();
    theScene.drawScene()
}

function actualizaValorPosicion(posicion) {
    document.querySelector("#marcador-posicion").innerHTML = 
    "(" + posicion[0].toFixed(2) + ", " + posicion[1].toFixed(2) + ", " + posicion[2].toFixed(2) + ")"

}


window.onload = main;

