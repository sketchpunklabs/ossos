import * as BABYLON from 'babylonjs';

export default function BoneViewMaterial( app ){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Shader
    const mat = new BABYLON.ShaderMaterial( "shader", app.scene, 
        { vertexSource: VERT_SRC, fragmentSource: FRAG_SRC },
        { attributes        : [ 'position', 'inst', 'boneRot', 'bonePos', 'boneScl' ],
          uniforms          : [ 'world', 'view', 'projection', 'meshScl', 'dirScl', 'color' ] }
    );

    mat.setFloat( 'meshScl', 0.02 );
    mat.setFloat( 'dirScl', 1.0 );
    mat.setColor3( 'color', BABYLON.Color3.FromHexString( '#f0f0f0' ) );

    // Meshes from GTLF have triangles CCW winding, but need to
    // set to CW on the shader to render correctly. A babylonJS thing?
    mat.sideOrientation = BABYLON.Material.ClockWiseSideOrientation;
    return mat;
}

const VERT_SRC = `
precision highp float;
in vec3 position;
in vec2 inst;
in vec4 boneRot;
in vec3 bonePos;
in vec3 boneScl;

uniform float meshScl;
uniform float dirScl;

// Babylon Matrices
uniform mat4 world;
uniform mat4 view;
uniform mat4 projection;

// Fragment Output
out vec3 frag_wpos;             // Fragment World Space Position

////////////////////////////////////////////////////////////////////////

vec3 transform( vec3 v ){
    vec4 q  = boneRot;
    v       *= boneScl;
    v       += 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
    v       += bonePos;
    return v;
}

////////////////////////////////////////////////////////////////////////

void main(void){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    vec3 pos        = position * meshScl;   // Apply Bone Scale
    
    if( gl_VertexID  < 4 ) pos.y  = inst.y; // Move Top Face to Bone's Length in Local Space
    if( gl_VertexID  > 7 ) pos.z *= dirScl; // Scale the Direction Pointer face

    pos = transform( pos );                 // Apply WorldSpace Transform on the mesh

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    vec4 wpos       = world * vec4( pos, 1.0 );
    frag_wpos       = wpos.xyz;
    gl_Position     = projection * view * wpos;
}`;

// Babylon Adds 
// -- #version 300 es
// precision highp float;
// out vec3 glFragColor;
const FRAG_SRC = `
////////////////////////////////////////////////////////////////////////

in      vec3 frag_wpos;
in      vec3 frag_norm;

uniform vec3 color;

////////////////////////////////////////////////////////////////////////

#define LITCNT 2
const vec3[] light_pos = vec3[](
    vec3( 0.0, 2.5, -1.5 ),
    vec3( 1.0, 0.0, 1.0 )
);

float computePointLights( vec3[LITCNT] lights, vec3 norm ){
    vec3 light_vec;
    vec3 light_dir;

    float dist;
    float attenuation;
    float diffuse     = 0.25;
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

////////////////////////////////////////////////////////////////////////

void main(void) {
    vec3 norm       = normalize( cross( dFdx(frag_wpos), dFdy(frag_wpos) ) ); // Low Poly Normals  
    float diffuse   = computePointLights( light_pos, norm );
    glFragColor     = vec4( color * diffuse, 1.0 );

    //glFragColor     = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;
//#endregion
