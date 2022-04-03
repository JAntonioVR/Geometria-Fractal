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
#define PI 3.14159265359

float degrees_to_radians(float degrees){
    return PI*degrees/float(180.0);
}


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
        if(i == size) break;
        tmp = hit_sphere(spheres[i], R, t_min, closest_t);
        if(tmp.hit){
            hit_anything = true;
            closest_t = tmp.t;
            result = tmp;
        }
    }
    return result;
}

// A plane is defined by an equation Ax + By + Cz = D, where (A, B, C) is the normal vector
// that defines the plane.

struct Plane{
    vec3 normal;    // Normal vector to the plane
    float D;        // Independent term
};

Hit_record hit_plane(Plane P, Ray R, float t_min, float t_max) {
    Hit_record result;
    float oc = dot(P.normal, R.dir);
    if(oc == 0.0){
        result.hit = false;
        return result;
    }
    float t = (P.D - dot(P.normal, R.orig))/oc;
    if (t < t_min || t > t_max)
        result.hit = false;
    else{
        result.hit = true;
        result.t = t;
        result.p = ray_at(R, result.t);
        result.normal = P.normal;
    }
    return result;
}

struct Camera{
    vec3 origin;
    vec3 horizontal;
    vec3 vertical;
    vec3 lower_left_corner;
};

Ray get_ray(Camera cam, float s, float t){
    Ray R;
    R.orig = cam.origin;
    R.dir = cam.lower_left_corner + s*cam.horizontal + t*cam.vertical - cam.origin;
    return R;
}

Camera init_camera (vec3 lookfrom, vec3 lookat, vec3 vup, float vfov, float aspect_ratio){
    Camera cam;
    float theta = degrees_to_radians(vfov);
    float h = tan(theta/2.0);
    float viewport_height = 2.0*h;
    float viewport_width = aspect_ratio * viewport_height;
    float focal_length = 1.0;

    vec3 w = normalize(lookfrom - lookat);
    vec3 u = normalize(cross(vup,w));
    vec3 v = cross(w,u);

    cam.origin = lookfrom;
    cam.horizontal = viewport_width * u;
    cam.vertical = viewport_height * v;
    cam.lower_left_corner = cam.origin - cam.horizontal/float(2.0) - cam.vertical/float(2.0) - w;
    return cam;
}

vec3 ray_color(Ray r, Sphere world[ARRAY_TAM], int size, Plane P) {
    Sphere S;
    S.center = vec3(0.0,0.0,-1.0);
    S.radius = 0.5;
    float t_closest = 100000.0;
    vec3 tmp_color;
    Hit_record hr = hit_spheres_list(world, size, r, 0.0, t_closest);
    if(hr.hit){
        t_closest = hr.t;
        vec3 N = hr.normal;
        tmp_color = 0.5*vec3(N.x+1.0, N.y+1.0, N.z+1.0);
    }
    hr = hit_plane(P, r, 0.0, t_closest);
    if(hr.hit){
        t_closest = hr.t;
        vec3 p = hr.p;
        int x_int = int(p.x), z_int = int(p.z), sum = x_int + z_int;
        int modulus = sum - (2*int(sum/2));
        if(modulus == 0)
            tmp_color = vec3(1.0, 1.0, 1.0);
        else
            tmp_color = vec3(0.0,0.0,0.0);
    }

    if(t_closest < 10000.0) return tmp_color;

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
    int size = 1;
    Sphere world[ARRAY_TAM];
    Sphere S1, S2;
    S1.center = vec3(0.0, 0.0, -1.0); S1.radius = 0.5;
    S2.center = vec3(0.0, -100.5, -1.0); S2.radius = 100.0;
    world[0] = S1; world[1] = S2;

    Plane P;
    P.normal = vec3(0.0, 1.0, 0.0);
    P.D = -1.0;

    // Camera
    vec3 lookfrom = vec3(-1.0, 1.0, 1.0);
    vec3 lookat = vec3(0.0, 0.0, -1.0);
    vec3 vup = vec3(0.0, 1.0, 0.0);
    float vfov = 90.0; // Vertical field of view in degrees

    Camera cam = init_camera(lookfrom, lookat, vup, vfov, aspect_ratio);


    
    // Render
    vec2 uv = gl_FragCoord.xy / vec2(image_width, image_height);
    float u = uv.x;
    float v = uv.y;

    Ray r = get_ray(cam, u, v);

    gl_FragColor = vec4(ray_color(r, world, size, P), 1.0);
}

// ────────────────────────────────────────────────────────────────────────────────


`;

export {fsSource}