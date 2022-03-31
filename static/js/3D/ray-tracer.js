
import { Scene } from "./scene.js";
import { vsSource } from "../../glsl/shader-wgl-vertex.js";
import { fsSource } from "../../glsl/shader-ray-tracer-fragment.js";

var theScene = new Scene(vsSource, fsSource);

function main(){
    
    theScene.drawScene();
    
}

window.onload = main;

