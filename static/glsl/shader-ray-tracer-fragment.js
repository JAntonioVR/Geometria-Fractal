import { glsl } from './glsl.js';

const fsSource = glsl`
//
// ────────────────────────────────────────────────────────────────────────────────
//   :::::: F R A G M E N T   S H A D E R : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────
//

#define MAX_DIST 100.0

// ─── PRECISION ──────────────────────────────────────────────────────────────────
    
precision mediump float;

// ─── UNIFORM VARIABLES ──────────────────────────────────────────────────────────

uniform vec3 u_lookfrom;
uniform vec3 u_lookat;

uniform vec4 u_ke;
uniform vec4 u_ka;
uniform vec4 u_kd;
uniform vec4 u_ks;
uniform float u_sh;

uniform vec4 u_light_color;

// ─── MACROS ─────────────────────────────────────────────────────────────────────

#define ARRAY_TAM 100
#define PI 3.14159265359

// ─── UTILS ──────────────────────────────────────────────────────────────────────

// ─── DEGREES TO RADIANS ─────────────────────────────────────────────────────────
// Transform an angle measure from degrees to radians

float degrees_to_radians(float degrees){
    return PI*degrees/float(180.0);
}

//
// ─── RAY ────────────────────────────────────────────────────────────────────────
// Struct that represents a Ray, defined by a point 'origin' and a vector 
// 'direction'

struct Ray {
    vec3 orig;      // Ray's origin
    vec3 dir;       // Ray's direction
};

// ─── AT ─────────────────────────────────────────────────────────────────────────
// Given a Ray, it returns the point given by origin + t * direction.    
vec3 ray_at(Ray r, float t){
    return r.orig + t*r.dir;
}

// ────────────────────────────────────────────────────────────────────────────────

//
// ─── PHONG LIGHTING MODEL ───────────────────────────────────────────────────────
// 

//
// ─── MATERIAL ───────────────────────────────────────────────────────────────────
// Struct that defines a material RGB components.

struct Material {
    vec4 ke;    // Emissive component
    vec4 ka;    // Ambient component
    vec4 kd;    // Diffuse component
    vec4 ks;    // Specular component
    float sh;   // Shiness
};

//
// ─── HIT RECORD ─────────────────────────────────────────────────────────────────
// Stores information about an intersection between a ray and a surface.

struct Hit_record {
    vec3 p;         // Intersection point
    vec3 normal;    // Surface's normal at p point
    float t;        // t value where the ray hits the surface
    bool hit;       // True if surface is hit, false otherwise
    Material mat;   // Material of the hit surface
};

//
// ─── DIRECTIONAL LIGHT ──────────────────────────────────────────────────────────
// Struct that defines a directional light source.

struct Directional_light{
    vec3 dir;   // Light direction
    vec4 color; // Light RGB color
};

vec4 evaluateLightingModel( Directional_light lights[ARRAY_TAM], int num_lights, Hit_record hr ){

    vec4 color_average = vec4(0.0, 0.0, 0.0, 1.0);
    Material mat = hr.mat;
    Directional_light light;
    vec3 light_dir;
    vec3 view_dir = normalize(u_lookfrom - hr.p);
    vec3 normal = normalize(hr.normal);
    vec4 emissive, ambient, diffuse, specular;
    emissive = vec4(0.0, 0.0, 0.0, 1.0);
    ambient = vec4(0.0, 0.0, 0.0, 1.0);
    diffuse = vec4(0.0, 0.0, 0.0, 1.0);
    specular = vec4(0.0, 0.0, 0.0, 1.0);
    if(num_lights > 0){
        for(int i = 0; i < ARRAY_TAM; i++){
            if(i == num_lights) break;
            light = lights[i];
            color_average += light.color;
            light_dir = normalize(light.dir);
            float cos_theta = max(0.0, dot(normal, light_dir));
            
            // Only if light is visible from surface point
            if(cos_theta > 0.0) {
                // Reflection direction
                vec3 reflection_dir = reflect(-light_dir, normal);

                diffuse += mat.kd * light.color * cos_theta;
                specular += mat.ks * light.color * pow( max(0.0, dot(reflection_dir, view_dir)), mat.sh);
            }
        }
        color_average /= float(num_lights);
        emissive = mat.ke * color_average;
        ambient = mat.ka * color_average;
    }

    return emissive + ambient + diffuse + specular;
    
}

// ────────────────────────────────────────────────────────────────────────────────

//
// ─── SPHERE ─────────────────────────────────────────────────────────────────────
// Represents a sphere, defined by the center and the radius

struct Sphere{
    vec3 center;
    float radius;
    Material mat;
};

//
// ─── HIT SPHERE ─────────────────────────────────────────────────────────────────
// Calculates the intersection between a Ray and a Sphere and stores the hit
// information in a Hit_record struct.

Hit_record hit_sphere(Sphere S, Ray R, float t_min, float t_max){
    Hit_record result;
    vec3 oc = R.orig - S.center;
    float a = dot(R.dir, R.dir);
    float b = 2.0 * dot(oc, R.dir);
    float c = dot(oc, oc) - S.radius*S.radius;
    float discriminant = b*b - 4.0*a*c;
    if (discriminant < 0.0){
        result.hit = false;
        return result;
    }
    float sqrtd = sqrt(discriminant);
    float root = (-b - sqrt(discriminant))/(2.0*a); // First root
    if (root < t_min || t_max < root){ // The first root is out of range
        root = (-b + sqrt(discriminant))/(2.0*a);     // The other root
        if(root < t_min || t_max < root){    // Both roots are out of range
            result.hit = false;
            return result;
        }
    } 
    result.hit = true;
    result.t = root;
    result.p = ray_at(R, result.t);
    result.normal = (result.p - S.center) / S.radius;
    result.mat = S.mat;
    return result;
}

//
// ─── HIT SPHERES LIST ───────────────────────────────────────────────────────────
// Given a list of spheres, calculates the possible intersection between a Ray and
// and the spheres list. If any sphere is hit, stores the hit information in a
// hit_record struct.

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

// ────────────────────────────────────────────────────────────────────────────────


//
// ─── PLANE ──────────────────────────────────────────────────────────────────────
// A plane is defined by an equation Ax + By + Cz = D, where (A, B, C) is the 
// normal vector that defines the plane.

struct Plane{
    vec3 normal;    // Normal vector to the plane
    float D;        // Independent term
};

//
// ─── HIT PLANE ──────────────────────────────────────────────────────────────────
// Calculates the possible intersection between a ray and a plane and stores the
// information in a Hit_record struct.
    
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
        result.normal = normalize(P.normal);
    }
    return result;
}

// ────────────────────────────────────────────────────────────────────────────────

//
// ─── CAMERA ─────────────────────────────────────────────────────────────────────
// Stores information about the camera and the rendered frame. 

struct Camera{
    vec3 origin;                // Where the observer is located
    vec3 horizontal;            // Viewport width in WC
    vec3 vertical;              // Viewport height in WC
    vec3 lower_left_corner;     // Point in WC that is in the corner of the screen
};

//
// ─── INIT CAMERA ────────────────────────────────────────────────────────────────
// Initializes and returns a Camera given its parameters

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

//
// ─── GET RAY ────────────────────────────────────────────────────────────────────
// Creates and returns a Ray where the origin is the observer's position and
// the direction is a point of the rendered frame.
    
Ray get_ray(Camera cam, float s, float t){
    Ray R;
    R.orig = cam.origin;
    R.dir = cam.lower_left_corner + s*cam.horizontal + t*cam.vertical - cam.origin;
    return R;
}

// ────────────────────────────────────────────────────────────────────────────────

//
// ─── RAY COLOR ──────────────────────────────────────────────────────────────────
// Given a ray and the full scene, calculates pixel's color.

vec4 ray_color(Ray r, Sphere world[ARRAY_TAM], int size, Plane P, Directional_light lights[ARRAY_TAM], int num_lights) {

    // r hits any sphere?
    float t_closest = MAX_DIST;
    vec4 tmp_color;
    Hit_record hr = hit_spheres_list(world, size, r, 0.0, t_closest);
    if(hr.hit){
        t_closest = hr.t;
        vec3 N = hr.normal;
        //tmp_color = evaluateLightingModel(lights, num_lights, hr);
        return vec4(normalize(hr.normal), 1.0);
    }

 /*   // r hits the plane? 
    hr = hit_plane(P, r, 0.0, t_closest);
    if(hr.hit){
        t_closest = hr.t;
        vec3 p = hr.p;
        int x_int = int(p.x), z_int = int(p.z), sum = x_int + z_int;
        int modulus = sum - (2*int(sum/2));
        if(modulus == 0)
            tmp_color = vec4(1.0, 1.0, 1.0, 1.0);
        else
            tmp_color = vec4(0.0,0.0,0.0, 1.0);
    }
*/
    // If r hits any surface
    //if(t_closest < 10000.0) return tmp_color;

    // r does not hit any surface
    vec3 unit_direction = normalize(r.dir);
    float t = 0.5*(unit_direction.y + 1.0);
    return vec4((1.0-t)*vec3(1.0,1.0,1.0) + t*vec3(0.5,0.7,1.0), 1.0);
}

// ────────────────────────────────────────────────────────────────────────────────

//
// ─── MAIN ───────────────────────────────────────────────────────────────────────
//

void main() {
    // IMAGE
    float aspect_ratio = float(16.0) / float(9.0);
    int image_width = 1280;
    int image_height = int(float(image_width) / aspect_ratio);

    // WORLD
    // Material
    Material mat;
    mat.ke = u_ke;
    mat.ka = u_ka;
    mat.kd = u_kd;
    mat.ks = u_ks;
    mat.sh = u_sh;

    // Spheres
    int num_spheres = 4;
    Sphere world[ARRAY_TAM];
    Sphere S1, S2, S3, S4;
    S1.center = vec3(0.0, 0.0, -1.0); S1.radius = 0.5; S1.mat = mat;
    S2.center = vec3(-5, 0.5, -3.0); S2.radius = 4.0; S2.mat = mat;
    S3.center = vec3(2.0, -3, -4.0); S3.radius = 1.5; S3.mat = mat;
    S4.center = vec3(20.0, 10, -20.0); S4.radius = 3.0; S4.mat = mat;


    world[0] = S1; world[1] = S2; world[2] = S3; world[3] = S4;

    // Plane
    Plane P;
    P.normal = vec3(0.0, 1.0, 0.0);
    P.D = -0.5;

    // CAMERA
    vec3 vup = vec3(0.0, 1.0, 0.0);
    float vfov = 90.0; // Vertical field of view in degrees
    // Camera cam = init_camera(u_lookfrom, u_lookat, vup, vfov, aspect_ratio);
    // TODO DESCOMENTAR
    Camera cam = init_camera(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, -1.0), vup, vfov, aspect_ratio);
    // LIGHTING
    Directional_light lights[ARRAY_TAM];
    int num_lights = 2;
    Directional_light l1, l2;
    l1.color = u_light_color; l2.color = vec4(0.0, 0.0, 1.0, 1.0);
    l1.dir = vec3(1.0, 1.0, 1.0);
    l2.dir = vec3(-1.0, -1.0, 0.0);
    lights[0] = l1; lights[1] = l2;
    
    // COLOR
    vec2 uv = gl_FragCoord.xy / vec2(image_width, image_height);
    float u = uv.x;
    float v = uv.y;

    Ray r = get_ray(cam, u, v);

    gl_FragColor = ray_color(r, world, num_spheres, P, lights, num_lights);
}

// ────────────────────────────────────────────────────────────────────────────────


`;

export {fsSource}