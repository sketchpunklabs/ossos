import * as THREE from 'three';

export default function SkinRTS_MTXMaterial( color='cyan', poseqBuffer=null, posepBuffer=null, posesBuffer=null ){
    let mat = new THREE.RawShaderMaterial({
        //side     : THREE.DoubleSide,
        uniforms : {
            color   : { type :'vec3', value:new THREE.Color( color ) },
            poseq    : { value: poseqBuffer },
            posep    : { value: posepBuffer },
            poses    : { value: posesBuffer },
        },

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        vertexShader : `#version 300 es
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

        mat4 fromRotationTranslationScale( vec4 q, vec3 v, vec3 s){
            // Quaternion math
            float x = q[0];
            float y = q[1];
            float z = q[2];
            float w = q[3];

            float x2 = x + x;
            float y2 = y + y;
            float z2 = z + z;
            float xx = x * x2;
            float xy = x * y2;
            float xz = x * z2;
            float yy = y * y2;
            float yz = y * z2;
            float zz = z * z2;
            float wx = w * x2;
            float wy = w * y2;
            float wz = w * z2;
            float sx = s[0];
            float sy = s[1];
            float sz = s[2];

            return mat4(
            (1.0 - (yy + zz)) * sx,
            (xy + wz) * sx,
            (xz - wy) * sx,
            0.0,
            (xy - wz) * sy,
            (1.0 - (xx + zz)) * sy,
            (yz + wx) * sy,
            0.0,
            (xz + wy) * sz,
            (yz - wx) * sz,
            (1.0 - (xx + yy)) * sz,
            0.0,
            v[0],
            v[1],
            v[2],
            1.0
            );
          }


        // Quat * Vec3 - Rotates Vec3
        vec3 q_mul_vec( vec4 q, vec3 v ){
            //return v + cross( 2.0 * q.xyz, cross( q.xyz, v) + q.w * v );  // Either Seems to Work, not sure which is the correct way to handle transformation
            return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
        } 

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
                fromRotationTranslationScale( poseq[a], posep[a], poses[a] ) * wgt.x +  
                fromRotationTranslationScale( poseq[b], posep[b], poses[b] ) * wgt.y +
                fromRotationTranslationScale( poseq[c], posep[c], poses[c] ) * wgt.z +
                fromRotationTranslationScale( poseq[d], posep[d], poses[d] ) * wgt.w;
        
            return bone_wgt;
        }

        ////////////////////////////////////////////////////////////////////////

        void main() {
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            mat4 mbMatrix = getBoneMatrix( skinIndex, skinWeight );
            vec3 bpos = ( mbMatrix * vec4( position, 1.0 ) ).xyz;

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            vec4 wpos       = modelMatrix * vec4( bpos, 1.0 );
            frag_wpos       = wpos.xyz;                                        // Save WorldSpace Position for Fragment Shader

            frag_norm       = mat3( transpose( inverse( modelMatrix ) ) ) * normal; //* q_mul_vec( tRot, normal );

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
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
            //vec3 norm   = normalize( cross( dFdx(frag_wpos), dFdy(frag_wpos) ) ); // Low Poly Normals
            vec3 norm     = normalize( frag_norm ); // Model's Normals            
            float diffuse = computePointLights( light_pos, norm );
            out_color     = vec4( color * diffuse, 1.0 );
        }`,
    });

    // If not using WebGL2.0 and Want to use dfdx or fwidth, Need to load extension
    mat.extensions = { derivatives : true };

    return mat;
}