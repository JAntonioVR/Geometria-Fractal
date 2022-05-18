
import { Scene3D } from "./scene3D.js";
import { vsSource } from "../glsl/shader-wgl-vertex.js";
import { fsSource } from "../glsl/shader-mandelbub-fragment.js";
//import { fsSource } from "../glsl/shader-ray-tracer-fragment.js";
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

    const botonContador = document.querySelector("#contador");
    botonContador.onclick = timeRedraw;

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


    const light_color_0_input = document.querySelector("#light_color_0");
    light_color_0_input.value = rgbToHex(theScene.get_light_color(0));
    light_color_0_input.addEventListener('input', change_light_color_0, true);

    const shadows_0 = document.querySelector("#shadows_0");
    shadows_0.addEventListener('change', change_shadow_0, true);

    const light_color_1_input = document.querySelector("#light_color_1");
    light_color_1_input.value = rgbToHex(theScene.get_light_color(1));
    light_color_1_input.addEventListener('input', change_light_color_1, true);

    const shadows_1 = document.querySelector("#shadows_1");
    shadows_1.addEventListener('change', change_shadow_1, true);

    const fractal = document.querySelector("#fractales");
    fractal.value = theScene.getFractal();
    fractal.addEventListener('change', changeFractal, true);

    const juliaX_input = document.querySelector("#juliaX");
    juliaX_input.value = theScene.get_julia_constant()[0];
    document.querySelector("#valorJuliaX").innerHTML = theScene.get_julia_constant()[0];
    juliaX_input.addEventListener('input', (event) => change_julia_constant_x(event), true);
    
    const juliaY_input = document.querySelector("#juliaY");
    juliaY_input.value = theScene.get_julia_constant()[1];
    document.querySelector("#valorJuliaY").innerHTML = theScene.get_julia_constant()[1];
    juliaY_input.addEventListener('input', (event) => change_julia_constant_y(event), true);
    
    const juliaZ_input = document.querySelector("#juliaZ");
    juliaZ_input.value = theScene.get_julia_constant()[2];
    document.querySelector("#valorJuliaZ").innerHTML = theScene.get_julia_constant()[2];
    juliaZ_input.addEventListener('input', (event) => change_julia_constant_z(event), true);
    
    const juliaW_input = document.querySelector("#juliaW");
    juliaW_input.value = theScene.get_julia_constant()[3];
    document.querySelector("#valorJuliaW").innerHTML = theScene.get_julia_constant()[3];
    juliaW_input.addEventListener('input', (event) => change_julia_constant_w(event), true);

    if(theScene.getFractal() != 2)
      document.querySelector("#constanteJulia").style.display = 'none';

    const antiliasing = document.querySelector("#antiliasing");
    antiliasing.addEventListener('change', change_antiliasing, true);

    
    const nSamples_input = document.querySelector("#nSamples");
    nSamples_input.value = theScene.get_julia_constant()[0];
    document.querySelector("#valorNSamples").innerHTML = theScene.get_n_samples()**2;
    nSamples_input.addEventListener('input', (event) => change_n_samples(event), true);
    if(!antiliasing.checked) document.querySelector("#deslizadorNSamples").style.display = 'none';

    const epsilon_input = document.querySelector("#current_epsilon");
    var epsilon_value = theScene.get_epsilon();
    var exp = Math.log10(epsilon_value);
    epsilon_input.value = -exp;
    document.querySelector("#valor_epsilon").innerHTML = 10**(exp);
    epsilon_input.addEventListener('input', (event) => change_epsilon(event), true);
    
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

  if(mouseState == MouseState.MOUSE_DOWN){
    var disp = [
      (mousePosition[0] - mouseDownPosition[0])/width,
      (mousePosition[1] - mouseDownPosition[1])/height
    ]

    document.querySelector("#marcador-raton").innerHTML = "(" + disp[0] +", " + disp[1] +")"

    console.log(disp);

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

function change_light_color_0() {
  const value = hexToRgb(document.querySelector("#light_color_0").value);
  theScene.set_light_color(0, value);
  theScene.drawScene();
}

function change_shadow_0(){
  theScene.change_shadow(0);
  theScene.drawScene();
}

function change_light_color_1() {
  const value = hexToRgb(document.querySelector("#light_color_1").value);
  console.log("#light_color_1")
  theScene.set_light_color(1, value);
  theScene.drawScene();
}

function change_shadow_1(){
  theScene.change_shadow(1);
  theScene.drawScene();
}

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

function change_julia_constant_x(event) {
  document.querySelector("#valorJuliaX").innerHTML = event.target.value;
  let C = theScene.get_julia_constant();
  C[0] = event.target.value;
  theScene.set_julia_constant(C);
  theScene.drawScene();
}

function change_julia_constant_y(event) {
  document.querySelector("#valorJuliaY").innerHTML = event.target.value;
  let C = theScene.get_julia_constant();
  C[1] = event.target.value;
  theScene.set_julia_constant(C);
  theScene.drawScene();
}

function change_julia_constant_z(event) {
  document.querySelector("#valorJuliaZ").innerHTML = event.target.value;
  let C = theScene.get_julia_constant();
  C[2] = event.target.value;
  theScene.set_julia_constant(C);
  theScene.drawScene();
}

function change_julia_constant_w(event) {
  document.querySelector("#valorJuliaW").innerHTML = event.target.value;
  let C = theScene.get_julia_constant();
  C[3] = event.target.value;
  theScene.set_julia_constant(C);
  theScene.drawScene();
}

function change_antiliasing(){
  theScene.change_antiliasing();
  if(theScene.get_antiliasing())
    document.querySelector("#deslizadorNSamples").style.display = 'flex';
  else
    document.querySelector("#deslizadorNSamples").style.display = 'none';   
  theScene.drawScene();
}

function change_n_samples(event) {
  document.querySelector("#valorNSamples").innerHTML = event.target.value**2;
  theScene.set_n_samples(event.target.value);
  theScene.drawScene();
}

function change_epsilon(event) {
  document.querySelector("#valor_epsilon").innerHTML = 10**(-event.target.value);
  theScene.set_epsilon(10**(-event.target.value));
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
    console.log(theScene.get_kd());
    document.querySelector("#kd").value = rgbToHex(theScene.get_kd());
    document.querySelector("#ks").value = rgbToHex(theScene.get_ks());
    document.querySelector("#sh").value = theScene.get_sh();
    document.querySelector("#valor_sh").innerHTML = theScene.get_sh();
    document.querySelector("#light_color_0").value = rgbToHex(theScene.get_light_color(0));
    document.querySelector("#shadows_0").checked = false;
    document.querySelector("#light_color_1").value = rgbToHex(theScene.get_light_color(1));
    document.querySelector("#shadows_1").checked = false;

    document.querySelector("#juliaX").value = theScene.get_julia_constant()[0];
    document.querySelector("#valorJuliaX").innerHTML = theScene.get_julia_constant()[0];
    document.querySelector("#juliaY").value = theScene.get_julia_constant()[1];
    document.querySelector("#valorJuliaY").innerHTML = theScene.get_julia_constant()[1];
    document.querySelector("#juliaZ").value = theScene.get_julia_constant()[2];
    document.querySelector("#valorJuliaZ").innerHTML = theScene.get_julia_constant()[2];
    document.querySelector("#juliaW").value = theScene.get_julia_constant()[3];
    document.querySelector("#valorJuliaW").innerHTML = theScene.get_julia_constant()[3];
    if(theScene.getFractal() != 2)
      document.querySelector("#constanteJulia").style.display = 'none';

    document.querySelector("#antiliasing").checked = false;
    document.querySelector("#nSamples").value = theScene.get_n_samples();
    document.querySelector("#valorNSamples").innerHTML = theScene.get_n_samples()**2;
    if(!theScene.get_antiliasing()) 
      document.querySelector("#deslizadorNSamples").style.display = 'none';

    document.querySelector("#current_epsilon").value = -Math.log10(theScene.get_epsilon());
    document.querySelector("#valor_epsilon").innerHTML = theScene.get_epsilon();


    theScene.drawScene();
}

function timeRedraw() {
  var start = performance.now();
  theScene.drawScene();
  var end = performance.now();
  document.querySelector("#contador-valor").innerHTML = end-start;
}

function actualizaValorPosicion(posicion) {
    document.querySelector("#marcador-posicion").innerHTML = 
    "(" + posicion[0].toFixed(2) + ", " + posicion[1].toFixed(2) + ", " + posicion[2].toFixed(2) + ")"

}


window.onload = main;

