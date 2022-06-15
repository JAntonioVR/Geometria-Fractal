import { glsl } from './glsl.js';

const fsSource = glsl`
//
// ──────────────────────────────────────────────────────────────────────────────────────────────────────
//   :::::: F R A G M E N T   S H A D E R   R A Y   T R A C E R : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────────────────────────────
//

// ─── PRECISION ──────────────────────────────────────────────────────────────────
    
precision mediump float;

//
// ─── VARIABLES UNIFORM ──────────────────────────────────────────────────────────
//

// Posicion del observador
uniform vec3 u_lookfrom;
// Punto hacia el que mira el observador
uniform vec3 u_lookat;

// Componente ambiental del material parametrizable
uniform vec4 u_ka;
// Componente difusa del material parametrizable
uniform vec4 u_kd;
// Componente especular del material parametrizable
uniform vec4 u_ks;
// Exponente de brillo del material parametrizable
uniform float u_sh;

// Intensidad (color) de la luz izquierda
uniform vec4 u_lightColor0;
// Intensidad (color) de la luz derecha
uniform vec4 u_lightColor1;
// Sombras arrojadas activadas/desactivadas
uniform bvec3 u_shadows;
// SSAA activado/desactivado
uniform bool u_antialiasing;
// Numero de rayos por pixel si u_antialiasing == true
uniform int u_nSamples;

// ─── MACROS ─────────────────────────────────────────────────────────────────────
#define ARRAY_TAM 100
#define PI 3.14159265359
#define MAX_DIST 100.0

// ─── UTILS ──────────────────────────────────────────────────────────────────────

// ─── DEGREES TO RADIANS ─────────────────────────────────────────────────────────
// Transforma una medida de un angulo de grados a radianes

float degrees_to_radians(float degrees){
    return PI*degrees/float(180.0);
}

//
// ─── RAY ────────────────────────────────────────────────────────────────────────
// Estructura que representa un rayo dado por su 'origen' y su 'direccion'
struct Ray {
    vec3 orig;      // Ray's origin
    vec3 dir;       // Ray's direction
};

// ─── AT ─────────────────────────────────────────────────────────────────────────
// Dado un rayo, devuelve el punto situado en r.orig + t*r.dir   
vec3 ray_at(Ray r, float t){
    return r.orig + t*r.dir;
}
// ────────────────────────────────────────────────────────────────────────────────

//
// ─── MATERIAL ───────────────────────────────────────────────────────────────────
// Estructura definida por las componentes RGBA de un material y su exponente de 
// brillo.
struct Material {
    vec4 ka;    // Ambient component
    vec4 kd;    // Diffuse component
    vec4 ks;    // Specular component
    float sh;   // Shiness
};

// Material del suelo
Material ground_material;

//
// ─── HIT RECORD ─────────────────────────────────────────────────────────────────
// Almacena informacion sobre el impacto rayo-superficie

struct Hit_record {
    vec3 p;         // Intersection point
    vec3 normal;    // Surface's normal at p point
    float t;        // t value where the ray hits the surface
    bool hit;       // True if surface is hit, false otherwise
    Material mat;   // Material of the hit surface
};

//
// ─── DIRECTIONAL LIGHT ──────────────────────────────────────────────────────────
// Estructura que define una fuente de luz direccional

struct Directional_light{
    vec3 dir;   // Light direction
    vec4 color; // Light RGB color
};

// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────────── I ──────────
//   :::::: O B J E T O S : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────
//

//
// ──────────────────────────────────────────────────── II ──────────
//   :::::: E S F E R A : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────
//

//
// ─── SPHERE ─────────────────────────────────────────────────────────────────────
// Representa una esfera, definida por su centro, su radio y su material.
struct Sphere{
    vec3 center;
    float radius;
    Material mat;
};

//
// ─── HIT SPHERE ─────────────────────────────────────────────────────────────────
// Calcula analiticamente la posible interseccion entre un rayo y una esfera y
// almacena la informacion del impacto en una estructura 'Hit_record'
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
// Dada una lista de esferas, calcula la posible interseccion entre un rayo y el
// conjunto de esferas. Si el rayo golpea alguna esfera o varias, se almacena la
// informacion del impacto mas cercano en una estructura Hit_record
Hit_record hit_spheres_list(Sphere spheres[ARRAY_TAM], int size, Ray R, float t_min, float t_max){
    Hit_record result, tmp;
    float closest_t = t_max;
    for(int i = 0; i < ARRAY_TAM; i++){
        if(i == size) break;
        tmp = hit_sphere(spheres[i], R, t_min, closest_t);
        if(tmp.hit){
            closest_t = tmp.t;
            result = tmp;
        }
    }
    return result;
}
// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────── II ──────────
//   :::::: P L A N O : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────
//

//
// ─── PLANE ──────────────────────────────────────────────────────────────────────
// Un plano se define con una ecuacion Ax + By + Cz = D, donde (A, B, C) es el 
// vector normal que define su direccion.
struct Plane{
    vec3 normal;    // Normal vector to the plane
    float D;        // Independent term
    Material mat;   // Plane material
};

//
// ─── HIT PLANE ──────────────────────────────────────────────────────────────────
// Calcula analiticamente la posible interseccion entre un rayo y un plano y
// almacena la informacion del impacto en una estructura 'Hit_record'
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
// ──────────────────────────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: M O D E L O   D E   I L U M I N A C I O N   D E   P H O N G : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
//

//
// ─── CONSTANTE DE VISIBILIDAD ───────────────────────────────────────────────────
// Dada una fuente de luz, calcula si la luz incide o no sobre el punto p.    
float light_is_visible(Directional_light light, vec3 p, Sphere world[ARRAY_TAM], int size) {
    Ray R;
    R.dir = normalize(light.dir);
    R.orig = p;
    float t = 0.01;
    float h;

    return hit_spheres_list(world, size, R, t, MAX_DIST).hit ? 0.0 : 1.0; 
}

//
// ─── EVALUACION DEL MODELO DE ILUMINACION ───────────────────────────────────────
//   
vec4 evaluate_lighting_model( Directional_light lights[ARRAY_TAM], int num_lights, Hit_record hr,
    Sphere world[ARRAY_TAM], int size ) {
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
            else visibility = light_is_visible(light, hr.p, world, size);

            light_dir = normalize(light.dir);
            float cos_theta = max(0.0, dot(normal, light_dir));
            
            // Only if light is visible from surface point
            if(cos_theta > 0.0) {
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
// ──────────────────────────────────────────────────── I ──────────
//   :::::: C A M A R A : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────
//

//
// ─── CAMERA ─────────────────────────────────────────────────────────────────────
// Almacena informacion en coordenadas de mundo sobre la camara y el frame que
// se visualiza.
struct Camera{
    vec3 origin;                // Where the observer is located
    vec3 horizontal;            // Viewport width in WC
    vec3 vertical;              // Viewport height in WC
    vec3 lower_left_corner;     // Point in WC that is in the corner of the screen
};

//
// ─── INIT CAMERA ────────────────────────────────────────────────────────────────
// Inicializa y devuelve una camara a partir de ciertos parametros
Camera init_camera (vec3 lookfrom, vec3 lookat, vec3 vup, float vfov, float aspect_ratio){
    Camera cam;
    float focal_length = 1.0;
    float theta = degrees_to_radians(vfov); // Vertical FOV
    float h = tan(theta/2.0);
    float viewport_height = 2.0*h*focal_length;
    float viewport_width = aspect_ratio * viewport_height;


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
// ────────────────────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: C R E A C I O N   D E   R A Y O S   P R I M A R I O S : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────────────────────────────
//

//
// ─── GET RAY ────────────────────────────────────────────────────────────────────
// Crea un rayo 'Ray' donde el origen es la posicion del observador y la el destino
// viene dado por las coordenadas de dispositivo normalizadas [0,1] (s y t).
Ray get_ray(Camera cam, float s, float t){
    Ray R;
    R.orig = cam.origin;
    R.dir = cam.lower_left_corner + s*cam.horizontal + t*cam.vertical - cam.origin;
    return R;
}


// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: C A L C U L O   D E   I N T E R S E C C I O N E S : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────────────────────────
//


//
// ─── RAY COLOR ──────────────────────────────────────────────────────────────────
// Dado un rayo, los objetos que componen la escena y las fuentes de luz, calcula
// la posible interseccion rayo-superficie y devuelve el color que se asignara a un
// pixel.
vec4 ray_color(Ray r, Sphere world[ARRAY_TAM], int size, Plane P, Directional_light lights[ARRAY_TAM], int num_lights) {
    // r hits any sphere?
    float t_closest = MAX_DIST;
    vec4 tmp_color;
    Hit_record hr = hit_spheres_list(world, size, r, 0.0, t_closest);
    if(hr.hit){
        t_closest = hr.t;
        vec3 N = hr.normal;
        tmp_color = evaluate_lighting_model(lights, num_lights, hr, world, size);
        //tmp_color = vec4(normalize(hr.normal), 1.0);
    }
    // r hits the plane? 
    hr = hit_plane(P, r, 0.0, t_closest);
    if(hr.hit){
        t_closest = hr.t;
        vec3 p = hr.p;
        int x_int = int(floor(p.x)), z_int = int(floor(p.z)), sum = x_int + z_int;
        int modulus = sum - (2*int(sum/2));
        if(modulus == 0){
            hr.mat.kd = vec4(0.5, 0.5, 0.5, 1.0);
            hr.mat.ks = vec4(0.5, 0.5, 0.5, 1.0);
            hr.mat.sh = 10.0;
        }
        else
            hr.mat.kd = vec4(0.0,0.0,0.0, 1.0);
        tmp_color = evaluate_lighting_model(lights, num_lights, hr, world, size);
    }
    // If r hits any surface
    if(t_closest < MAX_DIST) return tmp_color;

    // r does not hit any surface
    vec3 unit_direction = normalize(r.dir);
    float t = 0.5*(unit_direction.y + 1.0);
    return vec4((1.0-t)*vec3(1.0,1.0,1.0) + t*vec3(0.5,0.7,1.0), 1.0);
}

// ────────────────────────────────────────────────────────────────────────────────

//
// ──────────────────────────────────────────────── I ──────────
//   :::::: M A I N : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────
//
void main() {
    // IMAGE
    float aspect_ratio = 16.0/9.0;
    int image_width = 1280;
    int image_height = int(float(image_width) / aspect_ratio);

    // WORLD
    // Material de las esferas
    Material mat;
    mat.ka = u_ka;
    mat.kd = u_kd;
    mat.ks = u_ks;
    mat.sh = u_sh;

    // Material del suelo
    ground_material.ka = vec4(0.0, 0.0, 0.0, 1.0);
    ground_material.ks = vec4(0.0, 0.0, 0.0, 1.0);
    ground_material.sh = 1.0;

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
    Plane ground;
    ground.normal = vec3(0.0, 1.0, 0.0);
    ground.D = -2.0;
    ground.mat = ground_material;

    // CAMERA
    vec3 vup = vec3(0.0, 1.0, 0.0);
    float vfov = 90.0; // Vertical field of view in degrees
    vec3 lookfrom = vec3(0.0, 0.0, 0.0), lookat = vec3(0.0, 0.0, -1.0);
    Camera cam = init_camera(u_lookfrom, u_lookat, vup, vfov, aspect_ratio);
    
    // LIGHTS
    Directional_light lights[ARRAY_TAM];
    int num_lights = 2;
    Directional_light l0, l1;
    l0.color = u_lightColor0; l1.color = u_lightColor1;
    l0.dir = vec3(-1.0, 1.0, 0.0);
    l1.dir = vec3(1.0, 1.0, 0.0);

    lights[0] = l0; lights[1] = l1; 
    
     
    // COLOR
    if(u_antialiasing) {
        // Antialiasing

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
        // No antialiasing
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