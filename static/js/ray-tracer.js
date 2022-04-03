
import { Scene3D } from "./scene3D.js";
import { vsSource } from "../glsl/shader-wgl-vertex.js";
import { fsSource } from "../glsl/shader-ray-tracer-fragment.js";


var theScene = new Scene3D(vsSource, fsSource);

function main(){

    document.addEventListener("keydown", (event) => onKeyDown(event), true );
    
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
    theScene.drawScene();
}


window.onload = main;

