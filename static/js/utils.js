//
// ──────────────────────────────────────────────────────── I ──────────
//   :::::: utils.js : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────
// Fichero que contiene algunas funciones útiles en el desarrollo


// ─── CARTESIANTOSPHERIC ─────────────────────────────────────────────────────────
// A partir de un array de tres componentes que representa un punto de R^3 
// (x,y,z), calcula su equivalente en coordenadas esféricas.
// Parametros: ───────────────────────────
// - point: Array. Tripleta que representa un punto del espacio en coordenadas
//                 cartesianas.
// Devuelve: ─────────────────────────────
// Una tripleta [rho, theta, phi] que forman las coordenadas esféricas del punto
// [x,y,z] inicial. 
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

// ─── SPHERICTOCARTESIAN ─────────────────────────────────────────────────────────
// A partir de un array de tres componentes que representan las coordenadas
// esféricas de un punto de R^3, (rho, theta, phi), calcula su equivalente
// en coordenadas cartesianas.
// Parametros: ───────────────────────────
// - point: Array. Tripleta que representa un punto del espacio en coordenadas
//                 esféricas.
// Devuelve: ─────────────────────────────
// Una tripleta [x,y,z] que forman las coordenadas cartesianas del punto
// [rho,theta,phi] inicial. 
function sphericToCartesian(point) {
  let r = point[0],
      theta = point[1],
      phi = point[2];
    
  let x = r * Math.sin(theta) * Math.cos(phi),
      y = r * Math.cos(theta),
      z = r * Math.sin(theta) * Math.sin(phi);

  return [x, y, z]
}

// ─── HEXTORGB ───────────────────────────────────────────────────────────────────
// Dada una cadena "#XXXXXX" que simboliza un color en hexadecimal, calcula las
// coordenadas RGB normalizadas de dicho color.
// Parametros: ───────────────────────────
// - hex: string. Cadena de caracteres que representa un color en hexadecimal
// Devuelve: ─────────────────────────────
// Una tripleta RGB normalizada en [0,1], la equivalente al color hexadecimal dado
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16)/256.0,
    parseInt(result[2], 16)/256.0,
    parseInt(result[3], 16)/256.0
  ] : null;
}

// ─── COMPONENTTOHEX ─────────────────────────────────────────────────────────────
// Transforma un numero entero entre 0 y 255 en una cadena igual a su equivalente
// en hexadecimal
// Parametros: ───────────────────────────
// c: number. Número entero que representa una componente de una tripleta RGB
// Devuelve: ─────────────────────────────
// Una cadena de caracteres de longitud 2: la representación hexadecimal de 'c'
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

// ─── RGBTOHEX ───────────────────────────────────────────────────────────────────
// A partir de una tripleta RGB normalizada en [0,1], calcula una cadena de
// caracteres igual a su representacion hexadecimal
// Parametros: ───────────────────────────
// rgb: Array. Vector de JavaScript de tres componentes que representa una terna RGB
// Devuelve: ─────────────────────────────
// Una cadena en formato "#XXXXXX", la equivalente al color de 'rgb' en hexadecimal  
function rgbToHex(rgb) {
  let r = rgb[0],
      g = rgb[1],
      b = rgb[2]
  return "#" + componentToHex(parseInt(r*255,10)) + 
               componentToHex(parseInt(g*255,10)) + 
               componentToHex(parseInt(b*255,10));
}

// ────────────────────────────────────────────────────────────────────────────────

export {cartesianToSpheric, sphericToCartesian, hexToRgb, rgbToHex}