
function cartesianToSpheric(point) {
    let x = point[0],
        y = point[1],
        z = point[2];
    
    let r = Math.sqrt(x*x + y*y + z*z);
    let theta, phi;
    if (y > 0.0)
        theta = Math.atan(Math.sqrt(x*x+z*z)/y);
    else if(y < 0.0)
        theta = Math.PI + Math.atan(Math.sqrt(x*x+z*z)/y);
    else
        theta = Math.PI / 2.0;
    
    if(x > 0.0 && z > 0.0)
        phi = Math.atan(z/x);
    else if(x > 0.0 && z < 0.0)
        phi = 2.0*Math.PI + Math.atan(z/x);
    else if(x < 0.0)
        phi = Math.PI + Math.atan(z/x);
    else
        phi = Math.PI/2.0*Math.sign(z);

    return [r, theta, phi]
}

function sphericToCartesian(point) {
    let r = point[0],
        theta = point[1],
        phi = point[2];
    
    let x = r * Math.sin(theta) * Math.cos(phi),
        y = r * Math.cos(theta),
        z = r * Math.sin(theta) * Math.sin(phi);

    return [x, y, z]
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16)/256.0,
      parseInt(result[2], 16)/256.0,
      parseInt(result[3], 16)/256.0
     ] : null;
}

export {cartesianToSpheric, sphericToCartesian, hexToRgb}