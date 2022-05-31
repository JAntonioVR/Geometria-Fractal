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

uniform vec4 u_ka;
uniform vec4 u_kd;
uniform vec4 u_ks;
uniform float u_sh;

uniform vec4 u_lightColor0;
uniform vec4 u_lightColor1;
uniform bvec3 u_shadows;

uniform float u_epsilon;

uniform int u_fractal;
uniform vec4 u_juliaSetConstant;
uniform bool u_antiliasing;
uniform int u_nSamples;

// ─── MACROS ─────────────────────────────────────────────────────────────────────

#define ARRAY_TAM 100
#define MAX_STEPS 300
#define MAX_DIST 100.0
#define PI 3.14159265359

#define NORMAL 0

// ─── UTILS ──────────────────────────────────────────────────────────────────────

// ─── DEGREES TO RADIANS ─────────────────────────────────────────────────────────
// Transform an angle measure from degrees to radians

float degrees_to_radians(float degrees){
    return PI*degrees/float(180.0);
}

//
// ─── QUATERNION ─────────────────────────────────────────────────────────────────
// Quaternion are represented by a 4-dimensional vector

vec4 quat_mult(vec4 q1, vec4 q2) {
    vec3 xyz = cross(q1.xyz, q2.xyz) + q1.w*q2.xyz + q2.w*q1.xyz;
    float w = q1.w*q2.w - dot(q1.xyz,q2.xyz);
    return vec4(xyz, w);
}

vec4 quat_square(vec4 q){
    vec3 xyz = 2.0*q.w*q.xyz;
    float w = q.w*q.w - dot(q.xyz, q.xyz);
    return vec4(xyz, w);
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
// ─── MATERIAL ───────────────────────────────────────────────────────────────────
// Struct that defines a material RGB components.

struct Material {
    vec4 ka;    // Ambient component
    vec4 kd;    // Diffuse component
    vec4 ks;    // Specular component
    float sh;   // Shiness
};

// Ground material
Material ground_material, fractal_material;

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


// ────────────────────────────────────────────────────────────────────────────────

//
// ─── SPHERE ─────────────────────────────────────────────────────────────────────
// Represents a sphere, defined by the center and the radius

struct Sphere{
    vec3 center;
    float radius;
    Material mat;
};


float get_dist_sphere(vec3 p, Sphere S){
    return length(S.center - p) - S.radius;
}

vec3 calculate_normal_sphere(vec3 p, Sphere S) {
    return (p - S.center) / S.radius;
}

bool hit_sphere_limits( Sphere S, Ray R ){
    vec3 oc = R.orig - S.center;
    float a = dot(R.dir,R.dir);
    float b = 2.0 * dot(oc, R.dir);
	float c = dot(oc,oc) - S.radius*S.radius;
    float discriminant = b*b - 4.0*a*c;
    return discriminant >= 0.0;
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

float get_dist_plane (vec3 p, Plane P) {
    float t_interseccion = (P.D - dot(P.normal,p))/dot(P.normal, P.normal);
    vec3 closest_point = p + t_interseccion * P.normal;
    return length(p-closest_point);
}


//
// ─── JULIA ──────────────────────────────────────────────────────────────────────
//


void iterate_julia(inout vec4 q, inout float dq, vec4 c) {

    for(int i = 0; i < 50; i++) {
        dq = 2.0 * length(q) * dq; 
        q = quat_square(q) + c;
        if(dot(q, q) > 64.0) break;
    }

}

// ANCHOR dist julia
float get_dist_julia(vec3 p, vec4 c) {
    vec4 q = vec4(p.y, p.z, 0.0, p.x);
    float dq = 1.0;
    iterate_julia(q, dq, c);
    float length_q = length(q);
    return 0.5*length_q * log(length_q) / dq;
}


vec3 calculate_normal_julia(vec3 p, vec4 c) {
    vec3 N;
    float h = u_epsilon;

    #if NORMAL == 0
    // Gradiente de la SDF
    vec4 qp = vec4(p.y, p.z, 0.0, p.x);
    float gradX, gradY, gradZ;
    vec3 gx1 = (qp - vec4( 0.0, 0.0, 0.0, h )).wxy;
    vec3 gx2 = (qp + vec4( 0.0, 0.0, 0.0, h )).wxy;
    vec3 gy1 = (qp - vec4( h, 0.0, 0.0, 0.0 )).wxy;
    vec3 gy2 = (qp + vec4( h, 0.0, 0.0, 0.0 )).wxy;
    vec3 gz1 = (qp - vec4( 0.0, h, 0.0, 0.0 )).wxy;
    vec3 gz2 = (qp + vec4( 0.0, h, 0.0, 0.0 )).wxy;
    
    gradX = (get_dist_julia(gx2,c) - get_dist_julia(gx1,c))/(2.0*h);
    gradY = (get_dist_julia(gy2,c) - get_dist_julia(gy1,c))/(2.0*h);
    gradZ = (get_dist_julia(gz2,c) - get_dist_julia(gz1,c))/(2.0*h);
    N = normalize(vec3( gradX, gradY, gradZ ));

    #else
    // Método del tetraedro
    const vec2 k = vec2(1,-1);
    N = normalize( k.xyy*get_dist_julia( p + k.xyy*h, c ) + 
                   k.yyx*get_dist_julia( p + k.yyx*h, c ) + 
                   k.yxy*get_dist_julia( p + k.yxy*h, c ) + 
                   k.xxx*get_dist_julia( p + k.xxx*h, c ) );

    #endif
    return N;
}

//
// ─── MANDELBROT ─────────────────────────────────────────────────────────────────
//

void iterate_mandelbrot(inout vec4 q, inout float dq) {

    vec4 c = q;
    q = vec4(0.0);

    for(int i = 0; i < 50; i++) {
        dq = 2.0 * length(q) * dq + 1.0; 
        q = quat_square(q) + c;
        if(dot(q, q) > 64.0) break;
    }

}

float get_dist_mandelbrot(vec3 p) {
    vec4 q = vec4(p.y, p.z, 0.0, p.x);
    float dq = 0.0;
    iterate_mandelbrot(q, dq);
    float length_q = length(q);
    return 0.5*length_q * log(length_q) / dq;
}

vec3 calculate_normal_mandelbrot(vec3 p) {
    vec3 N;
    float h = u_epsilon;

    #if NORMAL == 0

    vec4 qp = vec4(p.y, p.z, 0.0, p.x);
    float gradX, gradY, gradZ;
    vec3 gx1 = (qp - vec4( 0.0, 0.0, 0.0, h )).wxy;
    vec3 gx2 = (qp + vec4( 0.0, 0.0, 0.0, h )).wxy;
    vec3 gy1 = (qp - vec4( h, 0.0, 0.0, 0.0 )).wxy;
    vec3 gy2 = (qp + vec4( h, 0.0, 0.0, 0.0 )).wxy;
    vec3 gz1 = (qp - vec4( 0.0, h, 0.0, 0.0 )).wxy;
    vec3 gz2 = (qp + vec4( 0.0, h, 0.0, 0.0 )).wxy;
    
    gradX = get_dist_mandelbrot(gx2) - get_dist_mandelbrot(gx1);
    gradY = get_dist_mandelbrot(gy2) - get_dist_mandelbrot(gy1);
    gradZ = get_dist_mandelbrot(gz2) - get_dist_mandelbrot(gz1);
    N = normalize(vec3( gradX, gradY, gradZ ));

    #else

    const vec2 k = vec2(1,-1);
    N = normalize( k.xyy*get_dist_mandelbrot( p + k.xyy*h) + 
                   k.yyx*get_dist_mandelbrot( p + k.yyx*h) + 
                   k.yxy*get_dist_mandelbrot( p + k.yxy*h) + 
                   k.xxx*get_dist_mandelbrot( p + k.xxx*h) );

    #endif

    return N;
}

//
// ─── MANDELBUB ──────────────────────────────────────────────────────────────────
//

vec3 f_Mandelbub(vec3 w, vec3 c) {

    // extract polar coordinates
    float wr = sqrt(dot(w,w));      // r
    float wo = acos(w.y/wr);        // phi
    float wi = atan(w.x,w.z);       // theta

    // scale and rotate the point
    wr = pow( wr, 8.0 );
    wo = wo * 8.0;
    wi = wi * 8.0;

    // convert back to cartesian coordinates
    w.x = wr * sin(wo)*sin(wi);
    w.y = wr * cos(wo);
    w.z = wr * sin(wo)*cos(wi);

    return c + w;
}

void iterate_mandelbub(inout vec3 w, inout float dw){

    float m;
    vec3 c = w;

    for(int i = 0; i < 10; i++) {
        m = length(w);      // |z|
        dw = 8.0*m*m*m*m*m*m*m*dw + 1.0; // 8*|z|^7*z' + 1.0
        w = f_Mandelbub(w,c);   // w_n^8 + w_0
        if(m > 2.0) break;     // |z| > 2
    }
}

float get_dist_mandelbub(vec3 p) {
    vec3 w = p;
    float dw = 1.0;
    iterate_mandelbub(w,dw);    // Iteramos w y dw
    float length_w = length(w);        // |w|
    return 0.5*length_w * log(length_w) / dw;
}

vec3 calculate_normal_mandelbub(vec3 p) {

    vec3 N;
    float h = u_epsilon;
    #if NORMAL == 0

    vec4 qp = vec4(p.y, p.z, 0.0, p.x);
    float gradX, gradY, gradZ;
    vec3 gx1 = (qp - vec4( 0.0, 0.0, 0.0, h )).wxy;
    vec3 gx2 = (qp + vec4( 0.0, 0.0, 0.0, h )).wxy;
    vec3 gy1 = (qp - vec4( h, 0.0, 0.0, 0.0 )).wxy;
    vec3 gy2 = (qp + vec4( h, 0.0, 0.0, 0.0 )).wxy;
    vec3 gz1 = (qp - vec4( 0.0, h, 0.0, 0.0 )).wxy;
    vec3 gz2 = (qp + vec4( 0.0, h, 0.0, 0.0 )).wxy;
    
    gradX = get_dist_mandelbub(gx2) - get_dist_mandelbub(gx1);
    gradY = get_dist_mandelbub(gy2) - get_dist_mandelbub(gy1);
    gradZ = get_dist_mandelbub(gz2) - get_dist_mandelbub(gz1);
    N = normalize(vec3( gradX, gradY, gradZ ));
    
    #else

    const vec2 k = vec2(1,-1);
    N= normalize( k.xyy*get_dist_mandelbub( p + k.xyy*h ) + 
                  k.yyx*get_dist_mandelbub( p + k.yyx*h ) + 
                  k.yxy*get_dist_mandelbub( p + k.yxy*h ) + 
                  k.xxx*get_dist_mandelbub( p + k.xxx*h ) );    
                  
    #endif

    return N;
}

//
// ─── BOUNDING SPHERE ────────────────────────────────────────────────────────────
//    
Sphere bounding_sphere;

//
// ─── PHONG LIGHTING MODEL ───────────────────────────────────────────────────────
// 

bool point_in_sphere(vec3 p, Sphere S) {
    return abs(dot(p-S.center, p-S.center) - S.radius*S.radius) < u_epsilon;
}

float light_is_visible(Directional_light light, vec3 p) {
    Ray R;
    R.dir = normalize(light.dir);
    R.orig = p;
    float res = 1.0;
    float t = u_epsilon * 2.0;
    float dist;
    float h = MAX_DIST;

    
    if(!hit_sphere_limits(bounding_sphere, R))
        return 1.0;

    for(int i = 0; i < MAX_STEPS; i++ ) {
        h = MAX_DIST;
        dist = MAX_DIST;
        if(u_fractal == 1)
            h = get_dist_mandelbub(ray_at(R, t));
        if(u_fractal == 2)
            h = get_dist_julia(ray_at(R, t), u_juliaSetConstant);
        if(u_fractal == 3)
            h = get_dist_mandelbrot(ray_at(R,t));

        /*
        for(int i = 0; i < ARRAY_TAM; i++) {
            if(i == num_spheres) break;
            dist = get_dist_sphere(ray_at(R, t), world[i]);
            if(dist < h) {
                h = dist;
            }
        }*/

        if(h < u_epsilon)
            return 0.0;

        res = min(res, 16.0*h/t);
        t += h;
        if(t >= MAX_DIST) break;
    }
    return res;
}

vec4 evaluate_lighting_model( Directional_light lights[ARRAY_TAM], int num_lights, Hit_record hr ) {
    Material mat = hr.mat;
    Directional_light light;
    vec3 light_dir;
    vec3 view_dir = normalize(u_lookfrom - hr.p);
    vec3 normal = normalize(hr.normal);
    vec4 ambient, diffuse, specular;
    float visibility;
    vec4 L_in = vec4(0.0, 0.0, 0.0, 1.0);
    if(num_lights > 0){
        for(int i = 0; i < ARRAY_TAM; i++){
            if(i == num_lights) break;
            ambient = vec4(0.0, 0.0, 0.0, 1.0);
            diffuse = vec4(0.0, 0.0, 0.0, 1.0);
            specular = vec4(0.0, 0.0, 0.0, 1.0);

            light = lights[i];
            ambient += mat.ka*light.color;
            if(!u_shadows[i]) visibility = 1.0;
            else visibility = light_is_visible(light, hr.p);

            light_dir = normalize(light.dir);
            float cos_theta = max(0.0, dot(normal, light_dir));
            
            // Only if light is visible from surface point
            if(cos_theta > 0.0 && visibility > 0.0) {
                // Reflection direction
                vec3 reflection_dir = reflect(-light_dir, normal);
                diffuse = mat.kd * cos_theta;
                specular = mat.ks * pow( max(0.0, dot(reflection_dir, view_dir)), mat.sh);
            }
            L_in += visibility * light.color * (diffuse + specular);

        }
    }
    L_in += ambient/float(num_lights);
    return vec4(L_in.xyz, 1.0);
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

Ray create_ray_origin_destiny(vec3 origin, vec3 destiny) {
    Ray R;
    R.orig = origin;
    R.dir = normalize(destiny-origin);
    return R;
}

//
// ─── GET RAY ────────────────────────────────────────────────────────────────────
// Creates and returns a Ray where the origin is the observer's position and
// the direction is a point of the rendered frame.
    
Ray get_ray(Camera cam, float s, float t){
    vec3 destiny = cam.lower_left_corner + s*cam.horizontal + t*cam.vertical;
    return create_ray_origin_destiny(cam.origin, destiny);
}

// ────────────────────────────────────────────────────────────────────────────────

//
// ─── RAY COLOR ──────────────────────────────────────────────────────────────────
// Given a ray and the full scene, calculates pixel's color.

vec4 ray_color(Ray r, Sphere world[ARRAY_TAM], int num_spheres, Plane ground, Directional_light lights[ARRAY_TAM], int num_lights) {

    Hit_record hr; hr.hit = false;
    float dist = MAX_DIST;
    vec3 p = r.orig;
    float closest_dist = MAX_DIST;
    float current_t = 0.0;
    vec4 tmp_color;
    Sphere S_hit;
    int object_index; // 0: Ground, 1: Julia, 2: Mandelbub, 3: Mandelbrot

    bool hits_bounding_sphere = hit_sphere_limits(bounding_sphere, r);
    
    // Sphere Tracing
    for(int i = 0; i < MAX_STEPS; i++) {

        closest_dist = MAX_DIST;
/*
        for(int i = 0; i < ARRAY_TAM; i++) {
            if(i == num_spheres) break;
            dist = get_dist_sphere(p, world[i]);
            if(dist < closest_dist) {
                closest_dist = dist;
                object_index = i+1;
                S_hit = world[i];
            }
        }
*/
        dist = get_dist_plane(p, ground);
        if(dist < closest_dist) {
            closest_dist = dist;
            object_index = 0;
        }

        if(hits_bounding_sphere) {

            if(u_fractal == 1)      // Render Mandelbub
                dist = get_dist_mandelbub(p);
                //dist = MAX_DIST;
            if(u_fractal == 2)      // Render Julia
                dist = get_dist_julia(p , u_juliaSetConstant);
            if(u_fractal == 3)      // Render Mandelbrot
                dist = get_dist_mandelbrot(p);

            if(dist < closest_dist){
                closest_dist = dist;
                object_index = u_fractal;
            }
            
        }

        

        if(closest_dist < u_epsilon){   // Hay interseccion

            hr.hit = true;
            hr.t = current_t;
            hr.p = ray_at(r, hr.t);

            if(object_index == 0){      // r hits the ground
                hr.normal = normalize(ground.normal);

                int x_int = int(floor(p.x)), z_int = int(floor(p.z)), sum = x_int + z_int;
                int modulus = sum - (2*int(sum/2));
                if(modulus == 0){
                    ground_material.kd = vec4(0.5, 0.5, 0.5, 1.0);
                    ground_material.ks = vec4(0.5, 0.5, 0.5, 1.0);
                    ground_material.sh = 10.0;
                }
                    
                else
                    ground_material.kd = vec4(0.0, 0.0, 0.0, 1.0);

                hr.mat = ground_material;

                return evaluate_lighting_model(lights, num_lights, hr);

            }
/*
            else {      // r hits a sphere
                hr.normal = calculate_normal_sphere(hr.p, S_hit);
                hr.mat = fractal_material;
                return evaluate_lighting_model(lights, num_lights, hr, world, num_spheres);
            }*/

           hr.mat = fractal_material; // TODO Crear un material

            if(object_index == 1)     // r hits Mandelbub
                hr.normal = calculate_normal_mandelbub(hr.p);

            if(object_index == 2)     // r hits Julia
                hr.normal = calculate_normal_julia(hr.p, u_juliaSetConstant);

            if(object_index == 3)     // r hits Mandelbrot
                hr.normal = calculate_normal_mandelbrot(hr.p);

            return evaluate_lighting_model(lights, num_lights, hr);
        }

        current_t += closest_dist;
        p = ray_at(r, current_t);

        if(current_t >= MAX_DIST) break;
    }
    
    // r does not hit nothing
    vec3 unit_direction = normalize(r.dir);
    float t = 0.5*(unit_direction.y + 1.0);
    tmp_color = vec4((1.0-t)*vec3(1.0,1.0,1.0) + t*vec3(0.5,0.7,1.0), 1.0);
    
    
    return tmp_color;


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

    // Fractal material
    fractal_material.ka = u_ka;
    fractal_material.kd = u_kd;
    fractal_material.ks = u_ks;
    fractal_material.sh = u_sh;

    // Ground material
    ground_material.ka = vec4(0.0, 0.0, 0.0, 1.0);
    ground_material.kd = vec4(0.0, 0.0, 0.0, 1.0);
    ground_material.sh = 1.0;

    // Spheres
    int num_spheres = 4;
    Sphere world[ARRAY_TAM];
    Sphere S1, S2, S3, S4;
    S1.center = vec3(0.0, 0.0, -1.0); S1.radius = 0.5; S1.mat = fractal_material;
    S2.center = vec3(-5, 0.5, -3.0); S2.radius = 4.0; S2.mat = fractal_material;
    S3.center = vec3(2.0, -3, -4.0); S3.radius = 1.5; S3.mat = fractal_material;
    S4.center = vec3(20.0, 10, -20.0); S4.radius = 3.0; S4.mat = fractal_material;


    world[0] = S1; world[1] = S2; world[2] = S3; world[3] = S4;

    // Bounding Sphere
    bounding_sphere.center = vec3(0.0, 0.0, 0.0);
    bounding_sphere.radius = u_fractal == 1 ? 1.5 : (u_fractal == 2 ? 2.5 : 2.0);


    // Ground
    Plane ground;
    ground.normal = vec3(0.0, 1.0, 0.0);
    ground.D = -2.0;
    ground.mat = ground_material;
    
    // CAMERA
    vec3 vup = vec3(0.0, 1.0, 0.0);
    float vfov = 90.0; // Vertical field of view in degrees
    vec3 lookfrom = vec3(0.0,0.0, 2.0);
    Camera cam = init_camera(u_lookfrom, u_lookat, vup, vfov, aspect_ratio);


    Directional_light lights[ARRAY_TAM];
    int num_lights = 3;
    Directional_light l0, l1, l2;
    l0.color = u_lightColor0; l1.color = u_lightColor1;
    l2.color = vec4(1.0, 1.0, 1.0, 1.0);

    l0.dir = vec3(-0.5, 0.5, 0.0);
    l1.dir = vec3(0.5, 0.5, 0.0);
    l2.dir = vec3(0.0, -1.0, 0.0);

    lights[0] = l0; lights[1] = l1; lights[2] = l2;
    
    // COLOR
    
    if(u_antiliasing) {
        // Antiliasing

        vec2 uv = (gl_FragCoord.xy) / vec2(image_width, image_height);
        float u = uv.x;
        float v = uv.y;

        int nSamples = u_nSamples;
        float hw = 1.0 / (float(image_width * nSamples)),
            hh = 1.0 / (float(image_height * nSamples));
        Ray r;
        vec4 sum_colors = vec4(0.0, 0.0, 0.0, 1.0);

        for(int i = 0; i < ARRAY_TAM; i++) {
            if(i == nSamples*nSamples) break;
            int x =  i/nSamples;
            int y =  i - nSamples*x;
            u = uv.x + float(x) * hw + 0.5 * hw;
            v = uv.y + float(y) * hh + 0.5 * hh;
            r = get_ray(cam, u, v);
            sum_colors += ray_color(r, world, num_spheres, ground, lights, num_lights);
        }

        gl_FragColor = sum_colors / float(nSamples*nSamples);
    }
    else {
        // No antiliasing
        vec2 uv = (gl_FragCoord.xy + vec2(0.5)) / vec2(image_width, image_height);
        float u = uv.x;
        float v = uv.y;
        Ray r = get_ray(cam, u, v);
        gl_FragColor = ray_color(r, world, num_spheres, ground, lights, num_lights);
    }
}

// ────────────────────────────────────────────────────────────────────────────────


`;

export {fsSource}