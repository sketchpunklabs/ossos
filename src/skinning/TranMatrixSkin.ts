// #region IMPORTS
import type Armature        from '../armature/Armature';
import type Bone            from '../armature/Bone';
import type ISkeleton       from '../armature/ISkeleton';
import Mat4Ex               from '../maths/Mat4Ex';
import { Transform, transform } from '../maths/transform';
import { mat4 }             from 'gl-matrix';
// #endregion


export default class TranMatrixSkin{
    // #region MAIN
    bind            !: Array< Transform >;
    world           !: Array< Transform >;
    offsetBuffer    !: Float32Array;

    constructor( arm: Armature ){
        const bCnt                          = arm.bones.length;
        const mat4Identity                  = mat4.create();        // used to fill in buffer with default data
        const world : Array< Transform >    = new Array( bCnt );    // World space matrices
        const bind  : Array< Transform >    = new Array( bCnt );    // bind pose matrices
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Flat Buffer Space
        this.offsetBuffer  = new Float32Array( 16 * bCnt );

        // Fill Arrays
        for( let i=0; i < bCnt; i++ ){
            world[ i ] = new Transform();
            bind[ i ]  = new Transform();
            
            Mat4Ex.toBuf( mat4Identity, this.offsetBuffer, i * 16 );  // Fill in Offset with Unmodified matrices
        }
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let b: Bone;
        for( let i=0; i < bCnt; i++ ){
            b = arm.bones[ i ];

            // Compute Bone's world space transform
            if( b.pindex !== -1 ) transform.mul(  world[ i ], world[ b.pindex ], b.local );
            else                  transform.copy( world[ i ], b.local );

            // Inverting it to create a Bind Transform
            transform.invert( bind[ i ], world[ i ] );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Save References
        this.bind   = bind;
        this.world  = world;
    }
    // #endregion

    // #region METHODS
    updateFromPose( pose: ISkeleton ): this{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const bOffset = new Transform();
        const w       = this.world;
        const m       = mat4.create();
        let b: Bone;

        for( let i=0; i < pose.bones.length; i++ ){
            b = pose.bones[ i ];

            // ----------------------------------------
            // Compute Bone's world space transform
            if( b.pindex !== -1 ) transform.mul( w[ i ], w[ b.pindex ], b.local );
            else                  transform.mul( w[ i ], pose.offset,   b.local );

            // Compute Offset Transform that will be used for skinning a mesh
            // OffsetTransform = Bone.WorldTransform * Bone.BindTransform
            transform.mul( bOffset, w[ i ], this.bind[ i ] );

            // Convert Transform to a Matrix
            mat4.fromRotationTranslationScale( m, bOffset.rot,  bOffset.pos, bOffset.scl );

            // Save to Buffer
            Mat4Ex.toBuf( m, this.offsetBuffer, i * 16 );
        }

        return this;
    }
    // #endregion
}