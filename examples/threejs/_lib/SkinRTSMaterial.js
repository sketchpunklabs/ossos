import * as THREE from 'three';

function SkinRTSMaterial( color='cyan', poseqBuffer=null, posepBuffer=null, posesBuffer=null ){
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


        // Only compute the Dual part of the Dual Quaternion 
        vec4 dualfromQuatTran( vec4 q, vec3 t ){
            float ax = t.x * 0.5, ay = t.y * 0.5, az = t.z * 0.5,
                  bx = q.x,       by = q.y,       bz = q.z,       bw = q.w;
            return vec4( 
                ax * bw + ay * bz - az * by,
                ay * bw + az * bx - ax * bz,
                az * bw + ax * by - ay * bx,
               -ax * bx - ay * by - az * bz
            );
        }

        // Using a Quaternion and Dual then Convert the Dual back into a Position
        vec3 dualToPos( vec4 q, vec4 t ){
            float ax =  t.x, ay =  t.y, az =  t.z, aw = t.w,
                  bx = -q.x, by = -q.y, bz = -q.z, bw = q.w;

            return vec3(
                ( ax * bw + aw * bx + ay * bz - az * by ) * 2.0,
                ( ay * bw + aw * by + az * bx - ax * bz ) * 2.0,
                ( az * bw + aw * bz + ax * by - ay * bx ) * 2.0
            );
        }

        // Quat * Vec3 - Rotates Vec3
        vec3 q_mul_vec( vec4 q, vec3 v ){
            //return v + cross( 2.0 * q.xyz, cross( q.xyz, v) + q.w * v );  // Either Seems to Work, not sure which is the correct way to handle transformation
            return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
        } 

        void getBoneTransform( vec4 idx, vec4 wgt, out vec4 rot, out vec3 pos, out vec3 scl ){
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
            // Scale is stored in the 3rd row of the matrix
            scl = poses[ a ] * wgt.x +  
                  poses[ b ] * wgt.y +
                  poses[ c ] * wgt.z +
                  poses[ d ] * wgt.w;

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // WEIGHT QUATERNION
    
            vec4 qa = poseq[ a ];
            vec4 qb = poseq[ b ];
            vec4 qc = poseq[ c ];
            vec4 qd = poseq[ d ];

            // Neightborhood all of the weights correctly
            /*
            if( dot( qa, qb ) < 0.0 ) wgt.y *= -1.0;
	        if( dot( qa, qc ) < 0.0 ) wgt.z *= -1.0;
        	if( dot( qa, qd ) < 0.0 ) wgt.w *= -1.0;
            */
            
            // Antipodality correction
            /* 
            if( dot( qa, qb ) < 0.0 ) qb *= -1.0;
            if( dot( qa, qc ) < 0.0 ) qc *= -1.0;
            if( dot( qa, qd ) < 0.0 ) qd *= -1.0;
            */

            rot = qa * wgt.x +  
                  qb * wgt.y +
                  qc * wgt.z +
                  qd * wgt.w;

            // rot = normalize( rot );

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // POSITION WEIGHTING -- No Working
            // pos = posep[ a ] * wgt.x +  
            //       posep[ b ] * wgt.y +
            //       posep[ c ] * wgt.z +
            //       posep[ d ] * wgt.w;

            // vec4 ppos = vec4( posep[ a ], 1.0 ) * wgt.x +  
            //             vec4( posep[ b ], 1.0 ) * wgt.y +
            //             vec4( posep[ c ], 1.0 ) * wgt.z +
            //             vec4( posep[ d ], 1.0 ) * wgt.w;
            // //pos = ppos.xyz;
            // pos = ppos.xyz / ppos.w;

            // rot = normalize( rot );

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // POSITION WEIGHTING THAT WORKS
            // Using the Quat of the transfrom to turn Position into the Dual 
            // Part of a Dual Quaternion. Applying weight to it, then using
            // the weighted Quaternion as its other half to convert it back
            // into position is the secret to getting this to work right.
            // Honestly, I didn't expect this to work... Im shocked
            vec4 pa = dualfromQuatTran( qa, posep[ a ] ); 
            vec4 pb = dualfromQuatTran( qb, posep[ b ] );
            vec4 pc = dualfromQuatTran( qc, posep[ c ] );
            vec4 pd = dualfromQuatTran( qd, posep[ d ] );

            float norm = 1.0 / length( rot );
            vec4 dual  = pa * wgt.x +  
                         pb * wgt.y +
                         pc * wgt.z +
                         pd * wgt.w;

            dual *= norm; // NORMALIZE OUR DUAL AND QUAT
            
            // rot   = normalize( rot ); // both works, save a SQRT & div by * norm 
            rot  *= norm;
            
            pos   = dualToPos( rot, dual ); // Convert to Position
        }
        ////////////////////////////////////////////////////////////////////////

        void main() {
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Compute the Bone's Weighted Transform 
            vec4 tRot;
            vec3 tPos;
            vec3 tScl;
            
            getBoneTransform( skinIndex, skinWeight, tRot, tPos, tScl );
            vec3 bpos = q_mul_vec( tRot, position * tScl ) + tPos;

            // // Try converting weighted transform to a matrix, NO work, same deformation
            // mat4 m4Bone = fromRotationTranslationScale( tRot, tPos, tScl );
            // vec3 bpos = ( m4Bone * vec4( position, 1.0 ) ).xyz;

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            vec4 wpos       = modelMatrix * vec4( bpos, 1.0 );
            frag_wpos       = wpos.xyz;                                        // Save WorldSpace Position for Fragment Shader

            frag_norm       = mat3( transpose( inverse( modelMatrix ) ) ) * 
                              q_mul_vec( tRot, normal );

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

export default SkinRTSMaterial;