import * as BABYLON from 'babylonjs';

export default function SkinMTXMaterial( app, base='#00ffff', poseBuffer=null ){
    const isTex    = ( base instanceof BABYLON.Texture );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Setup a TypeArray the full size of what the shader can handle
    const matSize = 16;                         // Float Count of Mat4
    const boneCnt = 100;                        // Max Bone Limit
    const bufSize = boneCnt * matSize;          // Total Float Size of Buffer
    const buf = new Float32Array( bufSize );
    buf.set( poseBuffer );                      // Copy the pose into type array buffer

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Build the actual UBO on the GPU
    const ubo = new BABYLON.UniformBuffer( app.engine, undefined, true, 'skin' );
    ubo.addUniform( 'pose', matSize, boneCnt );
    ubo.updateArray( 'pose', buf );
    ubo.update();

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Shader
    const mat = new BABYLON.ShaderMaterial( "shader", app.scene, 
        { vertexSource: VERT_SRC, fragmentSource: (!isTex)? FRAG_SRC : FRAG_TEX_SRC },
        { attributes        : [ 'position', 'normal', 'uv', 'matricesIndices', 'matricesWeights' ],
          uniforms          : [ 'world', 'view', 'projection', 'texBase', 'color' ],
          uniformBuffers    : [ 'skin' ] }
    );

    mat.setUniformBuffer( 'skin', ubo );

    if( !isTex ) mat.setColor3( 'color', BABYLON.Color3.FromHexString( base ) );
    else         mat.setTexture( 'texBase', base );

    // Meshes from GTLF have triangles CCW winding, but need to
    // set to CW on the shader to render correctly. A babylonJS thing?
    mat.sideOrientation = BABYLON.Material.ClockWiseSideOrientation;

    mat.updateFromArmature = ( arm )=>{
        buf.set( arm.getSkinOffsets()[0] );
        ubo.updateArray( 'pose', buf );
        ubo.update();
    };
    return mat;
}

const VERT_SRC = `
precision highp float;
in vec3 position;
in vec3 normal;
in vec2 uv;
in vec4 matricesIndices;
in vec4 matricesWeights;

#define MAXBONES 100
layout(std140) uniform skin{
    mat4 pose[ MAXBONES ];
};

// Babylon Matrices
uniform mat4 world;
uniform mat4 view;
uniform mat4 projection;

// Fragment Output
out vec3 frag_wpos;             // Fragment World Space Position
out vec3 frag_norm;             // Fragment Normal
out vec2 frag_uv;               // Fragment Texcoord

////////////////////////////////////////////////////////////////////////

mat4 getBoneMatrix( vec4 idx, vec4 wgt ){
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

void main(void){
    mat4 boneMatrix = getBoneMatrix( matricesIndices, matricesWeights );    // Get the Skinning Matrix
    mat4 mbMatrix   = world * boneMatrix;                                   // Merge Model and Bone Matrices together
    
    vec4 wpos       = mbMatrix * vec4( position, 1.0 );                     // Use new Matrix to Transform Vertices
    frag_wpos       = wpos.xyz;                                             // Save WorldSpace Position for Fragment Shader
    frag_norm       = mat3( transpose( inverse( mbMatrix ) ) ) * normal;    // Transform Normals using bone + model matrix
    frag_uv         = uv;

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

////////////////////////////////////////////////////////////////////////

void main(void) {
    //vec3 norm   = normalize( cross( dFdx(frag_wpos), dFdy(frag_wpos) ) ); // Low Poly Normals
    vec3 norm     = normalize( frag_norm ); // Model's Normals            
    float diffuse = computePointLights( light_pos, norm ) + 0.15;
    glFragColor   = vec4( color * diffuse, 1.0 );

    // glFragColor = vec4( frag_norm, 1.0 );
}`;


const FRAG_TEX_SRC = `
////////////////////////////////////////////////////////////////////////

in      vec2        frag_uv;
uniform sampler2D   texBase;

////////////////////////////////////////////////////////////////////////

void main(void) {
    glFragColor = texture( texBase, frag_uv );
}`;
//#endregion
