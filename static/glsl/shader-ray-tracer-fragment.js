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

#define ARRAY_TAM 100

struct Ray {
    vec3 orig;
    vec3 dir;
};

vec3 ray_at(Ray r, float t){
    return r.orig + t*r.dir;
}

struct Hit_record {
    vec3 p;         // Intersection point
    vec3 normal;    // Surface's normal at p point
    float t;        // t value where the ray hits the surface
    bool hit;       // True if surface is hit, false otherwise
};

bool hit_plane(vec4 plane, Ray r){
    vec3 orth = plane.xyz;
    if(dot(r.dir, orth) == 0.0)
        return false;
    else
        return true;
}

struct Sphere{
    vec3 center;
    float radius;
};

Hit_record hit_sphere(Sphere S, Ray R, float t_min, float t_max){
    Hit_record result;
    vec3 oc = R.orig - S.center;
    float a = dot(R.dir, R.dir);
    float half_b = dot(oc, R.dir);
    float c = dot(oc, oc) - S.radius*S.radius;
    float discriminant = half_b*half_b - a*c;
    if (discriminant < 0.0){
        result.hit = false;
        return result;
    }
    float sqrtd = sqrt(discriminant);
    float root = (-half_b - sqrt(discriminant))/a; // First root
    if (root < t_min || t_max < root){ // The first root is out of range
        root = (-half_b + sqrt(discriminant))/a;     // The other root
        if(root < t_min || t_max < root){    // Both roots are out of range
            result.hit = false;
            return result;
        }
    } 
    result.hit = true;
    result.t = root;
    result.p = ray_at(R, result.t);
    result.normal = (result.p - S.center) / S.radius;
    return result;
}

Hit_record hit_spheres_list(Sphere spheres[ARRAY_TAM], int size, Ray R, float t_min, float t_max){
    Hit_record result, tmp;
    bool hit_anything = false;
    float closest_t = t_max;
    for(int i = 0; i < ARRAY_TAM; i++){
        tmp = hit_sphere(spheres[i], R, t_min, closest_t);
        if(tmp.hit){
            hit_anything = true;
            closest_t = tmp.t;
            result = tmp;
        }
        if(i == size-1) break;
    }
    return result;
}

vec3 ray_color(Ray r, Sphere world[ARRAY_TAM], int size) {
    Sphere S;
    S.center = vec3(0.0,0.0,-1.0);
    S.radius = 0.5;
    Hit_record hr = hit_spheres_list(world, size, r, 0.0, 100.0);
    if(hr.hit){
        vec3 N = hr.normal;
        return 0.5*vec3(N.x+1.0, N.y+1.0, N.z+1.0);
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

    // World
    int size = 2;
    Sphere world[ARRAY_TAM];
    Sphere S1, S2;
    S1.center = vec3(0.0, 0.0, -1.0); S1.radius = 0.5;
    S2.center = vec3(0.0, -100.5, -1.0); S2.radius = 100.0;
    world[0] = S1; world[1] = S2;

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

    gl_FragColor = vec4(ray_color(r, world, size),1.0);
}

// ────────────────────────────────────────────────────────────────────────────────


`;

export {fsSource}