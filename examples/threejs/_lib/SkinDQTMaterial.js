import * as THREE from 'three';

function SkinDQTMaterial( color='cyan', poseqBuffer=null, posepBuffer=null, posesBuffer=null ){
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
        uniform vec4 posep[ MAXBONES ];
        uniform vec3 poses[ MAXBONES ];

        uniform mat4 modelMatrix;       // Matrices should be filled in by THREE.JS Automatically.
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;

        out vec3 frag_wpos;             // Fragment World Space Position
        out vec3 frag_norm;             // Fragment Normal

        ////////////////////////////////////////////////////////////////////////

        // DQ * Vev3 - Rotates the Vec3 then Translates it.
        vec3 dq_mul_vec( mat2x4 dq, vec3 v ){
            vec4 Qr 	= dq[0].xyzw; // real (rot)
            vec4 Qd 	= dq[1].xyzw; // dual (trans)
            vec3 pos    = v + cross( 2.0 * Qr.xyz, cross(Qr.xyz, v) + Qr.w * v );	        // Quaternion Rotation of a Vector            
            vec3 tran   = 2.0 * ( Qr.w * Qd.xyz - Qd.w * Qr.xyz + cross( Qr.xyz, Qd.xyz ));	// Pull out Translation from DQ
            return pos + tran;
        }

        // Quat * Vec3 - Rotates Vec3
        vec3 q_mul_vec( vec4 q, vec3 v ){
            //return v + cross( 2.0 * q.xyz, cross( q.xyz, v) + q.w * v );  // Either Seems to Work, not sure which is the correct way to handle transformation
            return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
        } 

        mat2x4 getBoneDualQuatScale( vec4[MAXBONES] poseq, vec4[MAXBONES] posep, vec3[MAXBONES] poses, vec4 idx, vec4 wgt, out vec3 scl ){
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // NORMALIZE BONE WEIGHTS
            // If the Geometery already has this done to the Weights Data, then there is
            // no Need for it here. For example with Blender, you need to explicitly go into bone
            // weights and run a function to normalize all weights, but most people dont realize to do that.
            // If not normalized, you will see artificts in transforming the vertices... sometimes VERY SCARY deformations
            int a = int( idx.x ),
                b = int( idx.y ),
                c = int( idx.z ),
                d = int( idx.w );
            wgt *= 1.0 / ( wgt.x + wgt.y + wgt.z + wgt.w );

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // THREE.JS Can't handle Mat2x4 as uniforms even though WebGL 2.0 supports it.
            // To Limit the amount of wasted space, splitting DQs into two Vec4s then merge them
            mat2x4 qa = mat2x4( poseq[ a ], posep[ a ] );
            mat2x4 qb = mat2x4( poseq[ b ], posep[ b ] );
            mat2x4 qc = mat2x4( poseq[ c ], posep[ c ] );
            mat2x4 qd = mat2x4( poseq[ d ], posep[ d ] );

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Optional Checks and Corrections. Quaternions can cause
            // artifacts multiplying together two on opposite hemispheres.
            // In the year I've used DQ for my animation system I never needed
            // To actually use these sort of checks in Shader Code, but I do these
            // sort of corrections in Javascript when blending poses together. I've
            // actually seen these GLSL corrects cause artifiacts in one model once, so I comment them out
            // Its here just incase I need to test something in the future and for completeness.

            // Antipodality correction
            //if( dot( qa[0], qb[0] ) < 0.0 ) qb *= -1.0;
            //if( dot( qa[0], qc[0] ) < 0.0 ) qc *= -1.0;
            //if( dot( qa[0], qd[0] ) < 0.0 ) qd *= -1.0;

            // Neightborhood all of the weights correctly
            //if( dot( qa[0], qb[0] ) < 0.0 ) wgt.y *= -1.0; 
            //if( dot( qa[0], qc[0] ) < 0.0 ) wgt.z *= -1.0; 
            //if( dot( qa[0], qd[0] ) < 0.0 ) wgt.w *= -1.0;

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Merge DQ by the use of Weights
            mat2x4 dq = qa * wgt.x +  
                        qb * wgt.y + 
                        qc * wgt.z +  
                        qd * wgt.w;

            // Normalize Using the Quaternion Part of the DQ. 
            // VERT IMPORTANT, not doing it can cause artifacts, 
            // Took me a long while to realize this when errors starting showing up
            dq *= 1.0 / length( dq[ 0 ] ); 
  
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Scale is stored in the 3rd row of the matrix
            scl = poses[ a ] * wgt.x +  
                  poses[ b ] * wgt.y +
                  poses[ c ] * wgt.z +
                  poses[ d ] * wgt.w;

            return dq;
        }

        ////////////////////////////////////////////////////////////////////////

        void main() {
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Compute the Bone's Weighted Dual Quaternion & Scale
            vec3   boneScl; // Its the OUT Var for getBoneDualQuat
            mat2x4 boneDQ   = getBoneDualQuatScale( poseq, posep, poses, skinIndex, skinWeight, boneScl );  

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            vec4 wpos       = modelMatrix * vec4( dq_mul_vec( boneDQ, position * boneScl ), 1.0 );
            frag_wpos       = wpos.xyz;                                        // Save WorldSpace Position for Fragment Shader

            frag_norm       = mat3( transpose( inverse( modelMatrix ) ) ) * 
                              q_mul_vec( boneDQ[ 0 ], normal );                // Use the Quaternion Part to Rotate the Normal, Then the ModelMatrix

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

export default SkinDQTMaterial;