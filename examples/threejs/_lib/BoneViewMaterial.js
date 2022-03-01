import * as THREE       from 'three';

function BoneViewMaterial( color='white', useDepthTest=true ){
    let mat = new THREE.RawShaderMaterial({
        //side        : THREE.DoubleSide,
        depthTest   : useDepthTest,
        uniforms    : {
            color   : { type :'vec3', value:new THREE.Color( color ) },
            meshScl : { value: 0.02  },
            dirScl  : { value: 2.0  },
            boneRot : { value: null },
            bonePos : { value: null },
            boneScl : { value: null },
        },

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        vertexShader : `#version 300 es
        in vec3 position;   // Vertex Position
        in vec2 inst;       // Instanced Data : Bone Index, Bone Length

        const int MAXBONE = 100;
        uniform vec4 boneRot[ MAXBONE ];
        uniform vec3 bonePos[ MAXBONE ];
        uniform vec3 boneScl[ MAXBONE ];

        uniform float meshScl;
        uniform float dirScl;

        uniform mat4 modelMatrix;       // Matrices should be filled in by THREE.JS Automatically.
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;

        out vec3 frag_wpos;             // Fragment World Space Position

        ////////////////////////////////////////////////////////////////////////

        vec3 transform( int i, vec3 v ){
            vec4 q  = boneRot[ i ];
            v       *= boneScl[ i ];
            v       += 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
            v       += bonePos[ i ];
            return v;
        }

        ////////////////////////////////////////////////////////////////////////

        void main(){
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            int bIdx        = int( inst.x );        // Get Bone Index this instance is for
            vec3 pos        = position * meshScl;   // Apply Bone Scale
            
            if( gl_VertexID  < 4 ) pos.y  = inst.y; // Move Top Face to Bone's Length in Local Space
            if( gl_VertexID  > 7 ) pos.z *= dirScl; // Scale the Direction Pointer face

            pos = transform( bIdx, pos );           // Apply WorldSpace Transform on the mesh

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            vec4 wpos       = modelMatrix * vec4( pos, 1.0 );
            frag_wpos       = wpos.xyz;
            gl_Position     = projectionMatrix * viewMatrix * wpos;
        }`,
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        fragmentShader	: `#version 300 es
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
            vec3 norm   = normalize( cross( dFdx(frag_wpos), dFdy(frag_wpos) ) ); // Low Poly Normals
            //vec3 norm     = normalize( frag_norm ); // Model's Normals            
            float diffuse = computePointLights( light_pos, norm );
            out_color     = vec4( color * diffuse, 1.0 );
            //out_color     = vec4( 1.0, 0.0, 0.0, 1.0 );
        }`,
    });

    // If not using WebGL2.0 and Want to use dfdx or fwidth, Need to load extension
    mat.extensions = { derivatives : true };
    return mat;
}

export default BoneViewMaterial;