// #region IMPORTS
import type Armature        from '../armature/Armature';
import type Bone            from '../armature/Bone';
import type ISkeleton       from '../armature/ISkeleton';
import Vec4               from '../maths/Vec4';
import { quat2 }            from 'gl-matrix';
// #endregion

export default class DQTSkin{
    // #region MAIN
    bind            !: Array< quat2 >;
    world           !: Array< quat2 >;

    // Split into 2 Buffers because THREEJS does handle mat4x2 correctly
    offsetQBuffer !: Float32Array;  // DualQuat : Quaternion
    offsetPBuffer !: Float32Array;  // DualQuat : Translation

    constructor( arm: Armature ){
        const bCnt                      = arm.bones.length;
        const world : Array< quat2 >    = new Array( bCnt );    // World space matrices
        const bind  : Array< quat2 >    = new Array( bCnt );    // bind pose matrices
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Flat Buffer Space
        // For THREEJS support, Split DQ into Two Vec4 since it doesn't support mat2x4 properly
        this.offsetQBuffer = new Float32Array( 4 * bCnt );
        this.offsetPBuffer = new Float32Array( 4 * bCnt );

        // Fill Arrays
        for( let i=0; i < bCnt; i++ ){
            world[ i ] = [ 0,0,0,1, 0,0,0,0 ];
            bind[ i ]  = [ 0,0,0,1, 0,0,0,0 ];

            // Fill Buffers with Identity Data
            Vec4Ex.toBuf( [0,0,0,1], this.offsetQBuffer, i * 4 );        // Init Offsets : Quat Identity
            Vec4Ex.toBuf( [0,0,0,0], this.offsetPBuffer, i * 4 );        // ...No Translation
        }
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let b  : Bone;
        for( let i=0; i < bCnt; i++ ){
            b = arm.bones[ i ];

            // Compute Bone's world space dual quaternion
            quat2.fromRotationTranslation( world[ i ], b.local.rot, b.local.pos );          // Local Space
            if( b.pindex !== -1 ) quat2.mul( world[ i ], world[ b.pindex ], world[ i ] );   // Add Parent if available

            // Inverting it to create a Bind Dual Quaternion
            quat2.invert( bind[ i ], world[ i ] );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Save References
        this.bind  = bind;
        this.world = world;
    }
    // #endregion

    // #region METHODS

    updateFromPose( pose: ISkeleton ): this{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const offset    = quat2.fromRotationTranslation( [ 0,0,0,1, 0,0,0,0 ], pose.offset.rot, pose.offset.pos ); 
        const dq: quat2 = [ 0,0,0,1, 0,0,0,0 ];
        const w         = this.world;
        let b: Bone;
        let ii = 0;

        for( let i=0; i < pose.bones.length; i++ ){
            b = pose.bones[ i ];

            // ----------------------------------------
            // Compute Bone's world space DQ
            quat2.fromRotationTranslation( dq, b.local.rot, b.local.pos ); 

            if( b.pindex !== -1 ) quat2.mul( w[ i ], w[ b.pindex ], dq );
            else                  quat2.mul( w[ i ], offset,        dq );

            // Compute Offset DQ that will be used for skinning a mesh
            // OffsetDQ = Bone.WorldDQ * Bone.BindDQ
            quat2.mul( dq, w[ i ], this.bind[ i ] );
            
            // ----------------------------------------
            ii = i * 4;                                         // Vec4 Index
            this.offsetQBuffer[ ii + 0 ] = dq[ 0 ];             // Quaternion Half
            this.offsetQBuffer[ ii + 1 ] = dq[ 1 ];
            this.offsetQBuffer[ ii + 2 ] = dq[ 2 ];
            this.offsetQBuffer[ ii + 3 ] = dq[ 3 ];

            this.offsetPBuffer[ ii + 0 ] = dq[ 4 ];             // Translation Half
            this.offsetPBuffer[ ii + 1 ] = dq[ 5 ];
            this.offsetPBuffer[ ii + 2 ] = dq[ 6 ];
            this.offsetPBuffer[ ii + 3 ] = dq[ 7 ];
        }

        return this;
    }
    // #endregion
}