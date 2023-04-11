import * as THREE from 'three';

export default function MatrixSkinPbrMaterial( val='cyan', skin ){
    const isTex    = ( val instanceof THREE.Texture );
    const uniforms = {
        pose : { value: skin?.offsetBuffer },
    };

    if( !isTex ){
        let color;
        switch( typeof val ){
            case 'string':
            case 'number': color = new THREE.Color( val ); break;
            case 'object': if( Array.isArray( val ) ) color = new THREE.Color( val[0], val[1], val[2] ); break;
            default: color = new THREE.Color( 'red' ); break;
        }
        
        uniforms.baseColor = { type: 'vec3', value: color };
    }else{
        uniforms.texBase   = { type: 'sampler2D', value: val };
    }

    const matConfig = {
        side            : THREE.DoubleSide,
        uniforms        : uniforms,
        vertexShader    : VERT_SRC,
        fragmentShader	: ( !isTex )? FRAG_COL : FRAG_TEX,
    }

    const mat       = new THREE.RawShaderMaterial( matConfig );
    mat.extensions  = { derivatives : true }; // If not using WebGL2.0 and Want to use dfdx or fwidth, Need to load extension

    return mat;
}

// #region SHADER CODE

// HANDLE SKINNING
const VERT_SRC = `#version 300 es
in vec3 position;   // Vertex Position
in vec3 normal;     // Vertex Normal
in vec2 uv;         // Vertex Texcoord
in vec4 skinWeight; // Bone Weights
in vec4 skinIndex;  // Bone Indices

#define MAXBONES 100             // Arrays can not be dynamic, so must set a size
uniform mat4 pose[ MAXBONES ];

uniform mat4 modelMatrix;       // Matrices should be filled in by THREE.JS Automatically.
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec3 fragWPos;             // Fragment World Space Position
out vec3 fragNorm;             // Fragment Normal
// out vec2 fragUv;               // Fragment Texcoord

////////////////////////////////////////////////////////////////////////

mat4 getBoneMatrix( mat4[ MAXBONES ] pose, vec4 idx, vec4 wgt ){
    /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    NORMALIZE BONE WEIGHT VECTOR - INCASE MODEL WASN'T PREPARED LIKE THAT
    If Weights are not normalized, Merging the Bone Offsets will create artifacts */
    int a = int( idx.x ),
        b = int( idx.y ),
        c = int( idx.z ),
        d = int( idx.w );
    
    wgt *= 1.0 / ( wgt.x + wgt.y + wgt.z + wgt.w );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // MERGE THE BONE OFFSETS BASED ON WEIGHT
    mat4 bone_wgt =
        pose[ a ] * wgt.x +  
        pose[ b ] * wgt.y +
        pose[ c ] * wgt.z +
        pose[ d ] * wgt.w;

    return bone_wgt;
}

////////////////////////////////////////////////////////////////////////

void main() {
    mat4 boneMatrix = getBoneMatrix( pose, skinIndex, skinWeight );         // Get the Skinning Matrix
    mat4 mbMatrix   = modelMatrix * boneMatrix;                             // Merge Model and Bone Matrices together

    vec4 wpos       = mbMatrix * vec4( position, 1.0 );                     // Use new Matrix to Transform Vertices
    vec4 vpos       = viewMatrix * wpos;                                    // View space position
    fragWPos        = wpos.xyz;                                             // Save WorldSpace Position for Fragment Shader
    fragNorm        = mat3( transpose( inverse( mbMatrix ) ) ) * normal;    // Transform Normals using bone + model matrix
    // fragUv        = uv;

    gl_Position     = projectionMatrix * vpos;
    //gl_Position     = projectionMatrix * viewMatrix * vec4( position, 1.0 );
}`;

// FRAGMENT THAT HANDLES BASE COLOR & LIGHTING
const FRAG_COL = `#version 300 es
precision mediump float;

////////////////////////////////////////////////////////////////////////

out     vec4 out_color;
in      vec3 fragWPos;
in      vec3 fragNorm;

uniform vec3 baseColor;
uniform vec3 cameraPosition;

////////////////////////////////////////////////////////////////////////

struct PBRMaterial {
    vec3  baseColor;
    float metallic;
    float specular;
    float roughness;
    float alphaRoughness; // This is roughness^2
};

// #region DIFFUSE
const float M_PI = 3.141592653589793;

vec3 F_Schlick( vec3 f0, vec3 f90, float VdotH ){
    return f0 + (f90 - f0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}


// https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/master/source/Renderer/shaders/brdf.glsl#L152
vec3 BRDF_lambertian( vec3 f0, vec3 f90, vec3 diffuseColor, float specularWeight, float VdotH ){
    // see https://seblagarde.wordpress.com/2012/01/08/pi-or-not-to-pi-in-game-lighting-equation/
    return ( 1.0 - specularWeight * F_Schlick( f0, f90, VdotH ) ) * ( diffuseColor / M_PI );
}
// #endregion

// #region SPECULAR
// https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/master/source/Renderer/shaders/brdf.glsl#L74
float V_SmithGGXCorrelated( float NdotL, float NdotV, float alphaRoughness ){
    float roughSq   = alphaRoughness * alphaRoughness;
    float GGXV      = NdotL * sqrt( NdotV * NdotV * ( 1.0 - roughSq ) + roughSq );
    float GGXL      = NdotV * sqrt( NdotL * NdotL * ( 1.0 - roughSq ) + roughSq );
    float GGX       = GGXV + GGXL;
    return ( GGX > 0.0 )? 0.5 / GGX : 0.0;
}

// https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/master/source/Renderer/shaders/brdf.glsl#L93
// D_GGX
float DistributionGGX( float NdotH, float alphaRoughness ){
    float roughSq   = alphaRoughness * alphaRoughness;
    float f         = ( NdotH * NdotH ) * ( roughSq - 1.0 ) + 1.0;
    return roughSq / ( M_PI * f * f );
}

// https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/master/source/Renderer/shaders/brdf.glsl#L179
vec3 BRDF_specularGGX(vec3 f0, vec3 f90, float alphaRoughness, float specularWeight, float VdotH, float NdotL, float NdotV, float NdotH){
    float Vis = V_SmithGGXCorrelated( NdotL, NdotV, alphaRoughness );
    vec3 F    = F_Schlick( f0, f90, VdotH );
    float D   = DistributionGGX(NdotH, alphaRoughness);
    return specularWeight * F * Vis * D;
}
// #endregion

vec3 linear_SRGB( vec3 v ){ 
    return vec3(
        ( v.r <= 0.0031308 )? v.r * 12.92 : 1.055 * pow( v.r, 1.0/2.4) - 0.055,
        ( v.g <= 0.0031308 )? v.g * 12.92 : 1.055 * pow( v.g, 1.0/2.4) - 0.055,
        ( v.b <= 0.0031308 )? v.b * 12.92 : 1.055 * pow( v.b, 1.0/2.4) - 0.055
    );
}

////////////////////////////////////////////////////////////////////////

#define LITCNT 2

const vec4[] Lights = vec4[](
    vec4( 10.0, 10.0, 10.0, 0.0 ),
    vec4( -1.0, -5.0, 1.0, 1.0 )
);

const vec3[] LightColor = vec3[](
    vec3( 1.0 ),
    vec3( 0.5 )
);

const float u_ior                   = 1.5;
const float u_metallic              = 0.0;
const float u_roughness             = 0.5;
const float u_specular              = 1.0; // For specular to work, there needs to be some roughness

void main(){
    //vec3 norm   = normalize( cross( dFdx(frag_wpos), dFdy(frag_wpos) ) ); // Low Poly Normals
    
    PBRMaterial mat = PBRMaterial(
        baseColor,
        u_metallic,
        u_specular,
        u_roughness,
        u_roughness * u_roughness
    );

    vec3 f_diffuse  = vec3( 0.0 );
    vec3 f_specular = vec3( 0.0 );
    
    vec3 f90       = vec3( 1.0 );
    vec3 f0        = vec3( pow( ( u_ior - 1.0 ) / ( u_ior + 1.0 ), 2.0 ) ); // vec3( 0.04 );
    vec3 diffColor = mix( mat.baseColor, vec3( 0 ), mat.metallic ); // diffuseColor
    
    vec3 N = normalize( fragNorm );
    vec3 V = normalize( cameraPosition - fragWPos );    // View direction, from Fragment to Camera
    vec3 H;                                             // Halfway Vector between L & V
    vec3 L;                                             // Light Unit Direction
    
    float NdL;
    float NdV;
    float NdH;
    float VdH;
    vec4  lit;
    for( int i=0; i < LITCNT; i++ ){
        lit = Lights[ i ];
        if( int( lit.w ) == 0 ) L = normalize( lit.xyz );               // to Direction Light
        else                    L = normalize( lit.xyz - fragWPos );    // to Point Light
        
        H    = normalize( L + V );
        VdH  = clamp( dot( V, H ), 0.0, 1.0 );
        NdL  = clamp( dot( N, L ), 0.0, 1.0 );
        NdV  = clamp( dot( N, V ), 0.0, 1.0 );
        NdH  = clamp( dot( N, H ), 0.0, 1.0 );

        // f_diffuse += LightColor[ i ] * NdL * BRDF_lambertian( f0, f90, diffColor, mat.specular, VdH );
        f_diffuse   += diffColor * NdL * LightColor[ i ] * ( 1.0 - mat.metallic );
        f_specular  += NdL * LightColor[ i ] * BRDF_specularGGX( f0, f90, mat.alphaRoughness, mat.specular, VdH, NdL, NdV, NdH );
    }

    vec3 ambient = mat.baseColor * 0.3;
    out_color = vec4( ambient + f_diffuse + f_specular, 1.0 );
    // out_color.rgb = linear_SRGB( out_color.rgb );
}`;

// FRAGMENT THAT ONLY RENDERS TEXTURE
const FRAG_TEX = `#version 300 es
precision mediump float;

////////////////////////////////////////////////////////////////////////

out     vec4 out_color;
in      vec2 frag_uv;

uniform sampler2D texBase;

////////////////////////////////////////////////////////////////////////

void main(){
    out_color = texture( texBase, frag_uv );
}`;

// #endregion