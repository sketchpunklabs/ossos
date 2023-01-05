// #region IMPORTS
import type Armature        from '../armature/Armature';
import type Bone            from '../armature/Bone';
import type { Transform }   from '../maths/transform';
import type ISkeleton       from '../armature/ISkeleton';
import Mat4Ex               from '../maths/Mat4Ex';
import { mat4 }             from 'gl-matrix';
// #endregion

const COMP_LEN = 16;            // 16 Floats
// const BYTE_LEN = COMP_LEN * 4;  // 16 Floats * 4 Bytes Each

export default class MatrixSkin{
    // #region MAIN
    bind            !: Array< mat4 >;
    world           !: Array< mat4 >;
    offsetBuffer    !: Float32Array;

    constructor( arm: Armature ){
        const bCnt                  = arm.bones.length;
        const mat4Identity          = mat4.create();        // used to fill in buffer with default data
        const world: Array< mat4 >  = new Array( bCnt );    // World space matrices
        const bind : Array< mat4 >  = new Array( bCnt );    // bind pose matrices
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Flat Buffer Space
        this.offsetBuffer       = new Float32Array( COMP_LEN * bCnt );

        // Fill Arrays
        for( let i=0; i < bCnt; i++ ){
            world[ i ]  = mat4.create();
            bind[ i ]   = mat4.create();

            Mat4Ex.toBuf( mat4Identity, this.offsetBuffer, i * COMP_LEN );  // Fill in Offset with Unmodified matrices
        }
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let b: Bone;
        let l: Transform;
        let m: mat4;
        for( let i=0; i < bCnt; i++ ){
            b = arm.bones[ i ];
            l = b.local;
            m = world[ i ];
            
            mat4.fromRotationTranslationScale( m, l.rot, l.pos, l.scl );    // Local Space Matrix
            if( b.pindex !== -1 ) mat4.mul( m, world[ b.pindex ], m );      // Add Parent if Available
                                 
            mat4.invert( bind[ i ], m );                                    // Invert for Bind Pose
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
        // Get Pose Starting Offset
        const offset = mat4.create();
        mat4.fromRotationTranslationScale(
            offset,
            pose.offset.rot,
            pose.offset.pos,
            pose.offset.scl,
        );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const bOffset = mat4.create();
        const w       = this.world;
        let b : Bone;
        let m : mat4;
        let i : number;

        for( i=0; i < pose.bones.length; i++ ){
            b = pose.bones[ i ];

            // ----------------------------------------
            // Compute Worldspace Matrix for Each Bone
            m = w[ i ];
            mat4.fromRotationTranslationScale( m, b.local.rot,  b.local.pos, b.local.scl ); // Local Space Matrix

            if( b.pindex !== -1 ) mat4.mul( m, w[ b.pindex ], m );                          // Add Parent if Available (PMUL)
            else                  mat4.mul( m, offset, m );                                 // Or use Offset on all root bones (PMUL)

            // ----------------------------------------
            // Compute Offset Matrix that will be used for skin a mesh
            // OffsetMatrix = Bone.WorldMatrix * Bone.BindMatrix 
            mat4.mul( bOffset, m, this.bind[ i ] );
            Mat4Ex.toBuf( bOffset, this.offsetBuffer, i * COMP_LEN );
        }

        return this;
    }
    // #endregion
}