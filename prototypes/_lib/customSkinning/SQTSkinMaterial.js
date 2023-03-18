import * as THREE from 'three';

export default function SQTSkinMaterial( val='cyan', skin ){
    const uniforms = {
        color   : { type :'vec3', value:new THREE.Color( val ) },
        poseq   : { value: skin.offsetQBuffer },
        posep   : { value: skin.offsetPBuffer },
        poses   : { value: skin.offsetSBuffer },
    };

    const matConfig = {
        side            : THREE.DoubleSide,
        uniforms        : uniforms,
        vertexShader    : VERT_SRC,
        fragmentShader	: FRAG_COL,
    }

    const mat       = new THREE.RawShaderMaterial( matConfig );
    mat.extensions  = { derivatives : true }; // If not using WebGL2.0 and Want to use dfdx or fwidth, Need to load extension
    return mat;
}

// #region SHADER CODE

// HANDLE SKINNING
const VERT_SRC = `#version 300 es
in vec3 position;   // Vertex Position
in vec3 normal;     // Vertex Position
in vec4 skinWeight; // Bone Weights
in vec4 skinIndex;  // Bone Indices

#define MAXBONES 90             // Arrays can not be dynamic, so must set a size
uniform vec4 poseq[ MAXBONES ]; // Splitting DQs because of THREEJS's lack of support for mat2x4
uniform vec3 posep[ MAXBONES ];
uniform vec3 poses[ MAXBONES ];

uniform mat4 modelMatrix;       // Matrices should be filled in by THREE.JS Automatically.
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec3 frag_wpos;             // Fragment World Space Position
out vec3 frag_norm;             // Fragment Normal

////////////////////////////////////////////////////////////////////////

// Quat * Vec3 - Rotates Vec3
vec3 q_mul_vec( vec4 q, vec3 v ){
    //return v + cross( 2.0 * q.xyz, cross( q.xyz, v) + q.w * v );  // Either Seems to Work, not sure which is the correct way to handle transformation
    return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
} 

vec3 getSQTTransform( vec4[MAXBONES] poseq, vec3[MAXBONES] posep, vec3[MAXBONES] poses, vec4 joint, vec4 weight, vec3 vertex ){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // NORMALIZE BONE WEIGHTS
    // If the Geometery already has this done to the Weights Data, then there is
    // no Need for it here. For example with Blender, you need to explicitly go into bone
    // weights and run a function to normalize all weights, but most people dont realize to do that.
    // If not normalized, you will see artificts in transforming the vertices... sometimes VERY SCARY deformations
    weight *= 1.0 / ( weight.x + weight.y + weight.z + weight.w );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // The secret sauce is to apply the Transform on the vertex for each available joint
    // then scale it by the weight & sum up the total position. As long as the weight
    // is normalized there should be no oddities.
    vec3 final = vec3( 0.0 );
    vec3 pos;
    int idx;

    for( int i=0; i < 4; i++ ){
        // Get joint INT index
        idx     = int( joint[ i ] );

        // Applying Transform : rotation * ( scale * vertexPosition ) + translation
        pos     = q_mul_vec( poseq[ idx ], poses[ idx ] * vertex ) + posep[ idx ]; 
        
        // Weight the transformed position & add it up
        final  += pos * weight[ i ];
    }

    return final;
}

////////////////////////////////////////////////////////////////////////

void main(){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    vec3 bPos       = getSQTTransform( poseq, posep, poses, skinIndex, skinWeight, position );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    vec4 wpos       = modelMatrix * vec4( bPos, 1.0 );
    frag_wpos       = wpos.xyz;                                        // Save WorldSpace Position for Fragment Shader

    frag_norm       = mat3( transpose( inverse( modelMatrix ) ) ) * normal;
                      //q_mul_vec( boneDQ[ 0 ], normal );              // Use the Quaternion Part to Rotate the Normal, Then the ModelMatrix

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    gl_Position     = projectionMatrix * viewMatrix * wpos; 
}`;

// FRAGMENT THAT HANDLES BASE COLOR & LIGHTING
const FRAG_COL = `#version 300 es
precision mediump float;

////////////////////////////////////////////////////////////////////////

out     vec4 out_color;
in      vec3 frag_wpos;
in      vec3 frag_norm;

uniform vec3 color;

////////////////////////////////////////////////////////////////////////

#define LITCNT 2
const vec3[] light_pos = vec3[](
    vec3( 0.0, 2.5, 1.0 ),
    vec3( -1.0, 0.0, 1.0 )
);

float computePointLights( vec3[LITCNT] lights, vec3 norm ){
    vec3 light_vec;
    vec3 light_dir;

    float dist;
    float attenuation;
    float diffuse     = 0.0;
    float constant    = 0.5;
    float linear      = 0.5;
    float quadratic   = 0.5;
    
    for( int i=0; i < LITCNT; i++ ){
        light_vec       = lights[i].xyz - frag_wpos;
        light_dir       = normalize( light_vec );
        dist            = length( light_vec );
        attenuation     = 1.0 / ( constant + linear * dist + quadratic * (dist * dist) );
        diffuse        += max( dot( norm, light_dir ), 0.0 ) * attenuation;
    }

    return diffuse;
}

void main(){
    //vec3 norm   = normalize( cross( dFdx(frag_wpos), dFdy(frag_wpos) ) ); // Low Poly Normals
    vec3 norm     = normalize( frag_norm ); // Model's Normals            
    float diffuse = computePointLights( light_pos, norm );
    out_color     = vec4( color * diffuse, 1.0 );
}`;

// #endregion