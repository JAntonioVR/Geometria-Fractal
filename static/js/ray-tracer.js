
import { Scene3D } from "./scene3D.js";
import { vsSource } from "../glsl/shader-wgl-vertex.js";
import { fsSource } from "../glsl/shader-ray-tracer-fragment.js";

var theScene = new Scene3D(vsSource, fsSource);

function main(){
    
    theScene.drawScene();
    
}

window.onload = main;

