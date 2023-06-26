// #region IMPORTS
import type Armature        from '../armature/Armature';
import type Bone            from '../armature/Bone';
import type Pose            from '../armature/Pose';
import type { vec3, quat }  from 'gl-matrix';

import Vec3Ex               from '../maths/Vec3Ex';
import Transform            from '../maths/Transform';
import { quat2 }            from 'gl-matrix';
// #endregion

// TODO Remove dependancy on GLMatrix's DualQuat
export default class DQTSkin{
    // #region MAIN
    bind            !: Array< Transform >;
    world           !: Array< Transform >;

    // Split into 3 Buffers because THREEJS does handle mat4x3 correctly
    // Since using in Shader Uniforms, can skip the 16 byte alignment for scale & store data as Vec3 instead of Vec4.
    // TODO : This may change in the future into a single mat4x3 buffer.
    offsetQBuffer !: Float32Array;  // DualQuat : Quaternion
    offsetPBuffer !: Float32Array;  // DualQuat : Translation
    offsetSBuffer !: Float32Array;  // Scale

    constructor( arm: Armature ){
        const bCnt                          = arm.boneCount;
        const world : Array< Transform >    = new Array( bCnt );    // World space matrices
        const bind  : Array< Transform >    = new Array( bCnt );    // bind pose matrices
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Flat Buffer Space
        // For THREEJS support, Split DQ into Two Vec4 since it doesn't support mat2x4 properly
        this.offsetQBuffer = new Float32Array( 4 * bCnt );
        this.offsetPBuffer = new Float32Array( 4 * bCnt );
        this.offsetSBuffer = new Float32Array( 3 * bCnt );

        // Fill Arrays
        for( let i=0; i < bCnt; i++ ){
            world[ i ] = new Transform();
            bind[ i ]  = new Transform();

            // Fill Buffers with Identity Data
            // Vec4Ex.toBuf( [0,0,0,1], this.offsetQBuffer, i * 4 );        // Init Offsets : Quat Identity
            // Vec4Ex.toBuf( [0,0,0,0], this.offsetPBuffer, i * 4 );        // ...No Translation
            Vec3Ex.toBuf( [1,1,1],   this.offsetSBuffer, i * 3 );        // ...No Scale
        }
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const pose = arm.bindPose;
        let b: Bone;
        for( let i=0; i < bCnt; i++ ){
            b = pose.bones[ i ];

            // Compute Bone's world space transform
            if( b.pindex !== -1 ) world[ i ].fromMul( world[ b.pindex ], b.local );
            else                  world[ i ].copy( b.local );

            // Inverting it to create a Bind Transform
            bind[ i ].fromInvert( world[ i ] );
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Save References
        this.bind   = bind;
        this.world  = world;
    }
    // #endregion

    // #region METHODS

    updateFromPose( pose: Pose ): this{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const bOffset = new Transform();
        const w       = this.world;
        const dq      = [ 0,0,0,1, 0,0,0,0 ];
        let b: Bone;
        let ii = 0;
        let si = 0;

        for( let i=0; i < pose.bones.length; i++ ){
            b = pose.bones[ i ];

            // ----------------------------------------
            // Compute Bone's world space transform
            if( b.pindex !== -1 ) w[ i ].fromMul( w[ b.pindex ], b.local );
            else                  w[ i ].fromMul( pose.offset,   b.local );

            // Compute Offset Transform that will be used for skinning a mesh
            // OffsetTransform = Bone.WorldTransform * Bone.BindTransform
            bOffset.fromMul( w[ i ], this.bind[ i ] );

            // Convert Rotation & Translation to Dual Quaternions
            // For handling weights, it works best when Translation exists in a Dual Quaternion.
            quat2.fromRotationTranslation( dq, (bOffset.rot as any as quat), (bOffset.pos as any as vec3) ); 
            
            // ----------------------------------------
            ii = i * 4;                                         // Vec4 Index
            si = i * 3;                                         // Vec3 Index
            this.offsetQBuffer[ ii + 0 ] = dq[ 0 ];             // Quaternion Half
            this.offsetQBuffer[ ii + 1 ] = dq[ 1 ];
            this.offsetQBuffer[ ii + 2 ] = dq[ 2 ];
            this.offsetQBuffer[ ii + 3 ] = dq[ 3 ];

            this.offsetPBuffer[ ii + 0 ] = dq[ 4 ];             // Translation Half
            this.offsetPBuffer[ ii + 1 ] = dq[ 5 ];
            this.offsetPBuffer[ ii + 2 ] = dq[ 6 ];
            this.offsetPBuffer[ ii + 3 ] = dq[ 7 ];

            this.offsetSBuffer[ si + 0 ] = bOffset.scl[ 0 ];    // Scale
            this.offsetSBuffer[ si + 1 ] = bOffset.scl[ 1 ];
            this.offsetSBuffer[ si + 2 ] = bOffset.scl[ 2 ];
        }

        return this;
    }
    // #endregion
}