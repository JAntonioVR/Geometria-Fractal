import { glsl } from './glsl.js';

const fsSource = glsl`

//
// ─── FRAGMENT SHADER DEL RAY TRACER ─────────────────────────────────────────────
//    

/* Fragment shader that renders Mandelbrot set */
precision mediump float;

/* TODO Poner aqui las variables uniform que se vayan a usar */
/* Point on the complex plane that will be mapped to the center of the screen */
//uniform vec2 u_zoomCenter;

/* Distance between left and right edges of the screen. This essentially specifies
   which points on the plane are mapped to left and right edges of the screen.
  Together, u_zoomCenter and u_zoomSize determine which piece of the complex
   plane is displayed. */
//uniform float u_zoomSize;

/* How many iterations to do before deciding that a point is in the set. */
//uniform int u_maxIterations;

/* Fixed c value in Julia set Equation z^n + c */
//uniform vec2 u_juliaSetConstant;

/* Fixed n value in Julia/Mandelbrot set Equation */
//uniform int u_order;

/* Render Mandelbrot or Julia set */
//uniform int u_fractal; 

struct Ray {
    vec3 orig;
    vec3 dir;
};

vec3 ray_at(Ray r, float t){
    return r.orig + t*r.dir;
}



/*float dot(vec3 u, vec3 v) {
    return u.x*v.x + u.y*v.y + u.z*v.z;
}*/

bool hit_plane(vec4 plane, Ray r){
    vec3 orth = plane.xyz;
    if(dot(r.dir, orth) == 0.0)
        return false;
    else
        return true;
}

bool hit_sphere(vec3 center, float radius, Ray r){
    vec3 oc = r.orig - center;
    float a = dot(r.dir, r.dir);
    float b = 2.0 * dot(oc, r.dir);
    float c = dot(oc, oc) - radius*radius;
    float discriminant = b*b - 4.0*a*c;
    return (discriminant > 0.0);
}


vec3 ray_color(Ray r) {
    if(hit_sphere(vec3(0.0,0.0,-1.0), 0.5, r)){
        return vec3(1.0,0.0,0.0);
    }
    vec3 unit_direction = normalize(r.dir);
    float t = 0.5*(unit_direction.y + 1.0);
    return (1.0-t)*vec3(1.0,1.0,1.0) + t*vec3(0.5,0.7,1.0);
}

void main() {
    // Image
    float aspect_ratio = float(16.0) / float(9.0);
    int image_width = 1280;
    int image_height = int(float(image_width) / aspect_ratio);

    // Camera

    float viewport_height = 2.0;
    float viewport_width = aspect_ratio * viewport_height;
    float focal_length = 1.0;

    vec3 origin = vec3(0.0, 0.0, 0.0);
    vec3 horizontal = vec3(viewport_width, 0.0, 0.0);
    vec3 vertical = vec3(0, viewport_height, 0.0);
    vec3 lower_left_corner = origin - horizontal/float(2.0) - vertical/float(2.0) -vec3(0.0, 0.0, focal_length);

    // Render
    vec2 uv = gl_FragCoord.xy / vec2(image_width, image_height);
    float u = uv.x;
    float v = uv.y;

    Ray r;
    r.orig = origin;
    r.dir = lower_left_corner + u*horizontal + v*vertical - origin;

    // Inicialmente renderizar todo azul
    gl_FragColor = vec4(ray_color(r),1.0);
}

// ────────────────────────────────────────────────────────────────────────────────


`;

export {fsSource}