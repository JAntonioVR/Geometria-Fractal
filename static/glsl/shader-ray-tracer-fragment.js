import { glsl } from './glsl.js';

const fsSource = glsl`
//
// ────────────────────────────────────────────────────────────────────────────────
//   :::::: F R A G M E N T   S H A D E R : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────
//

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
#define MAX_STEPS 100
#define MAX_DIST 10000.0
#define DIST_SURFACE 0.01
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
// ─── MANDELBUB ──────────────────────────────────────────────────────────────────
//
/*
vec2 hit_sphere_limits( Sphere S, Ray R ){
    vec3 oc = R.orig - S.center;
	float b = dot(oc,R.dir);
	float c = dot(oc,oc) - S.radius*S.radius;
    float h = b*b - c;
    if( h<0.0 ) return vec2(-1.0);
    h = sqrt( h );
    return -b + vec2(-h,h);
}


float mandelbub_map(vec3 p, float dw){
    vec3 w = p;
    float m = dot(w,w);
    // extract polar coordinates
    float wr = sqrt(m);
    float wo = acos(w.y/wr);
    float wi = atan(w.x,w.z);

    // scale and rotate the point
    wr = pow( wr, 8.0 );
    wo = wo * 8.0;
    wi = wi * 8.0;

    // convert back to cartesian coordinates
    w.x = wr * sin(wo)*sin(wi);
    w.y = wr * cos(wo);
    w.z = wr * sin(wo)*cos(wi);

    dw = 8.0*pow(dot(w,w), 3.5)*dw +1.0;

    return 0.25*log(m)*wr/dw;

}

vec3 calculate_normal( vec3 pos, float t, in float px )
{
    vec4 tmp;
    vec2 e = vec2(1.0,-1.0)*0.5773*0.25*px;
    return normalize( e.xyy*mandelbub_map( pos + e.xyy,tmp.x ) + 
					  e.yyx*mandelbub_map( pos + e.yyx,tmp.y ) + 
					  e.yxy*mandelbub_map( pos + e.yxy,tmp.z ) + 
					  e.xxx*mandelbub_map( pos + e.xxx,tmp.w ) );
}

Hit_record hit_mandelbub(Ray R, float t_min, float t_max){
    Hit_record tmp_hr;
    tmp_hr.hit = false;
    Sphere bounding_sphere;
    float dw = 1.0;
    float px = 2.0/(9.0*1.5); // Magic number by iquilez
    bounding_sphere.center = vec3(0.0, 0.0, 0.0); bounding_sphere.radius = 1.25;
    vec2 hits = hit_sphere_limits(bounding_sphere, R);
    if(hits.x < 0.0 && hits.y < 0.0){ // R does not hit bounding Sphere   
        return tmp_hr;  
    }
    else{
        tmp_hr.hit = true;
        tmp_hr.t = hits.x;
        tmp_hr.p = ray_at(R, tmp_hr.t);
        tmp_hr.normal = tmp_hr.p-bounding_sphere.center;
        Material mat;
        mat.ke = vec4(0.0, 1.0, 0.0, 1.0);
        mat.ks = vec4(0.1, 0.1, 0.1, 1.0);
        mat.sh = 100.0;
        tmp_hr.mat = mat;
        return tmp_hr;
    }
    // R hits bounding Sphere
    if(hits.x > t_min) t_min = hits.x;
    if(hits.y < t_max) t_max = hits.y;
    float t = t_min;
    for(int i=0; i<128; i++) {
        vec3 p = ray_at(R, t);
        float h = mandelbub_map(p, dw);
        if(t>t_max || abs(h)<0.01) break;
        t += h;
    }
    if(t < t_max){      // R hits Mandelbub
        tmp_hr.hit = true;
        tmp_hr.t = t;
        tmp_hr.p = ray_at(R, t);
        tmp_hr.normal = calculate_normal(tmp_hr.p, t, px);
        Material mat;
        mat.ke = vec4(0.0, 1.0, 0.0, 1.0);
        mat.ks = vec4(0.1, 0.1, 0.1, 1.0);
        mat.sh = 100.0;
        tmp_hr.mat = mat;
    }
    return tmp_hr;
    
}
*/

float get_dist_sphere(vec3 p, Sphere S){
    return length(S.center - p) - S.radius;
}

vec3 calculate_normal_sphere(vec3 p, Sphere S) {
    return (p - S.center) / S.radius;
}

Hit_record raymarch_sphere(Ray r, Sphere S, float t_min, float t_max) {
    Hit_record hr;
    hr.hit = false;
    float dO = t_min;
    for(int i = 0; i < MAX_STEPS;  i++) {
        vec3 p = ray_at(r, dO);
        float dS = get_dist_sphere(p,S);
        dO += dS;
        if(dO >= t_max || dS < DIST_SURFACE) break;
    }

    if (dO < t_max) { // r hits the Sphere
        hr.hit = true;
        hr.t = dO;
        hr.p = ray_at(r, hr.t);
        hr.normal = calculate_normal_sphere(hr.p, S);
        hr.mat = S.mat;
    }

    return hr;
}


//
// ─── PLANE ──────────────────────────────────────────────────────────────────────
// A plane is defined by an equation Ax + By + Cz = D, where (A, B, C) is the 
// normal vector that defines the plane.
struct Plane{
    vec3 normal;    // Normal vector to the plane
    float D;        // Independent term
    Material mat;   // Material of the plane
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
        result.mat = P.mat;
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

vec4 ray_color(Ray r, Sphere S, Plane ground, Directional_light lights[ARRAY_TAM], int num_lights) {
    
    // r hits the sphere?

    float t_closest = MAX_DIST;

    vec4 tmp_color;
    Hit_record hr = raymarch_sphere(r, S, 0.0, t_closest);

    if(hr.hit){
        tmp_color = evaluateLightingModel(lights, num_lights, hr);
        t_closest = hr.t;
    }
    

    // r hits the ground? 
    hr = hit_plane(ground, r, 0.0, t_closest);
    if(hr.hit) {
        tmp_color = evaluateLightingModel(lights, num_lights, hr);
        t_closest = hr.t;
    }

    /*

    // r hits mandelbub?
    Hit_record hr = hit_mandelbub(r, 0.0, t_closest);
    if(hr.hit){
        t_closest = hr.t;
        vec3 N = hr.normal;
        tmp_color = evaluateLightingModel(lights, num_lights, hr);
    }*/

    if(t_closest < MAX_DIST) return tmp_color;

    // r does not hit the sphere
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
    // Materials
    Material mat0, mat1;

    // Sphere material
    mat0.ke = u_ke;
    mat0.ka = u_ka;
    mat0.kd = u_kd;
    mat0.ks = u_ks;
    mat0.sh = u_sh;

    // Ground material
    mat1.ke = vec4(236.0, 226.0, 198.0, 255.0)/255.0;
    mat1.ka = vec4(0.0, 0.0, 0.0, 1.0);
    mat1.kd = vec4(236.0, 226.0, 198.0, 255.0)/255.0;
    mat1.ks = vec4(0.0, 0.0, 0.0, 1.0);

    // Sphere
    Sphere S;
    S.center = vec3(0.0, 0.0, 0.0); S.radius = 1.0 ; S.mat = mat0;

    // Ground
    Plane ground;
    ground.normal = vec3(0.0, 1.0, 0.0);
    ground.D = -2.0;
    ground.mat = mat1;
    
    // CAMERA
    vec3 vup = vec3(0.0, 1.0, 0.0);
    float vfov = 90.0; // Vertical field of view in degrees
    Camera cam = init_camera(u_lookfrom, u_lookat, vup, vfov, aspect_ratio);

    // LIGHTING
    Directional_light lights[ARRAY_TAM];
    int num_lights = 2;
    Directional_light l1, l2;
    l1.color = u_light_color; l2.color = vec4(1.0, 1.0, 1.0, 1.0);
    l1.dir = vec3(1.0, 1.0, 1.0);
    l2.dir = vec3(-1.0, -1.0, 0.0);
    lights[0] = l1; lights[1] = l2;
    
    // COLOR
    vec2 uv = gl_FragCoord.xy / vec2(image_width, image_height);
    float u = uv.x;
    float v = uv.y;

    Ray r = get_ray(cam, u, v);

    gl_FragColor = ray_color(r, S, ground, lights, num_lights);
}

// ────────────────────────────────────────────────────────────────────────────────


`;

export {fsSource}