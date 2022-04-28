
import { Scene3D } from "./scene3D.js";
import { vsSource } from "../glsl/shader-wgl-vertex.js";
import { fsSource } from "../glsl/shader-mandelbub-fragment.js";
import { hexToRgb, rgbToHex } from "./utils.js";


const MouseState = Object.freeze({
  MOUSE_DOWN: 0,
  MOUSE_UP: 1
});

var theScene = new Scene3D(vsSource, fsSource);

function main(){

    document.addEventListener("keydown", (event) => onKeyDown(event), true );

    const glCanvas = document.querySelector("#glCanvas");
    glCanvas.addEventListener('mousemove', (event) => moveCamera(event), true);
    glCanvas.addEventListener('mousedown', (event) => mouseDown(event), true);
    glCanvas.addEventListener('mouseup', mouseUp, true);

    const botonReset = document.querySelector("#botonReset");
    botonReset.onclick = resetParameters;
    actualizaValorPosicion(theScene.getPosition());

    const ke_input = document.querySelector("#ke");
    ke_input.value = rgbToHex(theScene.get_ke());
    ke_input.addEventListener('input', change_ke, true);

    const ka_input = document.querySelector("#ka");
    ka_input.value = rgbToHex(theScene.get_ka());
    ka_input.addEventListener('input', change_ka, true);

    const kd_input = document.querySelector("#kd");
    kd_input.value = rgbToHex(theScene.get_kd());    
    kd_input.addEventListener('input', change_kd, true);

    const ks_input = document.querySelector("#ks");
    ks_input.value = rgbToHex(theScene.get_ks());
    ks_input.addEventListener('input', change_ks, true);

    const sh_input = document.querySelector("#sh");
    sh_input.value = theScene.get_sh();
    document.querySelector("#valor_sh").innerHTML = theScene.get_sh();
    sh_input.addEventListener('input', (event) => change_sh(event), true);


    const light_color_input = document.querySelector("#light_color");
    light_color_input.value = rgbToHex(theScene.get_light_color());
    light_color_input.addEventListener('input', change_light_color, true);
    
    theScene.drawScene();
    
}

var mousePosition = [0,0];
var mouseDownPosition = [0,0];
var mouseState = MouseState.MOUSE_UP; 

function moveCamera(event){
  var x = event.clientX;
  var y = event.clientY;
  mousePosition = [x, y];
  const canvas = document.querySelector("#glCanvas");
  var width = canvas.offsetWidth,
      height = canvas.offsetHeight;
  
  // FIXME Corregir movimiento de la camara a partir del ratón

  if(mouseState == MouseState.MOUSE_DOWN){
    var disp = [
      2.0*Math.PI*(mousePosition[0] - mouseDownPosition[0])/width-Math.PI,
      Math.PI*(mousePosition[1] - mouseDownPosition[1])/height-Math.PI/2.0
    ]
    document.querySelector("#marcador-raton").innerHTML = "(" + disp[0] +", " + disp[1] +")"

    theScene.moveX(disp[0]);
    theScene.moveY(disp[1]);
    theScene.drawScene();
    
  }

}

function mouseDown(event){
  mouseState = MouseState.MOUSE_DOWN;
  mouseDownPosition = [event.clientX, event.clientY];
}

function mouseUp() {
  mouseState = MouseState.MOUSE_UP;
  console.log(document.querySelector("#glCanvas").offsetWidth)
}

function change_ke() {
  const value = hexToRgb(document.querySelector("#ke").value);
  theScene.set_ke(value);
  theScene.drawScene();
}

function change_ka() {
  const value = hexToRgb(document.querySelector("#ka").value);
  theScene.set_ka(value);
  theScene.drawScene();
}
  
function change_kd() {
  const value = hexToRgb(document.querySelector("#kd").value);
  console.log(value)
  theScene.set_kd(value);
  theScene.drawScene();
}

function change_ks() {
  const value = hexToRgb(document.querySelector("#ks").value);
  theScene.set_ks(value);
  theScene.drawScene();
}

function change_sh(event) {
  document.querySelector("#valor_sh").innerHTML = event.target.value;
  theScene.set_sh(event.target.value);
  theScene.drawScene();
}

function change_light_color() {
  const value = hexToRgb(document.querySelector("#light_color").value);
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
    document.querySelector("#ke").value = rgbToHex(theScene.get_ke());
    document.querySelector("#ka").value = rgbToHex(theScene.get_ka());
    document.querySelector("#kd").value = rgbToHex(theScene.get_kd());
    document.querySelector("#ks").value = rgbToHex(theScene.get_ks());
    document.querySelector("#sh").value = theScene.get_sh();
    document.querySelector("#valor_sh").innerHTML = theScene.get_sh();
    document.querySelector("#light_color").value = rgbToHex(theScene.get_light_color());
    theScene.drawScene();
}

function actualizaValorPosicion(posicion) {
    document.querySelector("#marcador-posicion").innerHTML = 
    "(" + posicion[0].toFixed(2) + ", " + posicion[1].toFixed(2) + ", " + posicion[2].toFixed(2) + ")"

}


window.onload = main;

