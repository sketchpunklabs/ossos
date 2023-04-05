// #region IMPORTS
import type ISkin       from './ISkin';
import type Bone        from '../armature/Bone';
import type Pose        from '../armature/Pose';
import type Transform   from '../maths/Transform';

import Mat4             from '../maths/Mat4';
// #endregion

const COMP_LEN = 16;            // 16 Floats
// const BYTE_LEN = COMP_LEN * 4;  // 16 Floats * 4 Bytes Each

export default class MatrixSkin implements ISkin{
    // #region MAIN
    bind            !: Array< Mat4 >;
    world           !: Array< Mat4 >;
    offsetBuffer    !: Float32Array;

    constructor( bindPose: Pose ){
        const bCnt                  = bindPose.bones.length;
        const mat4Identity          = new Mat4();           // used to fill in buffer with default data
        const world: Array< Mat4 >  = new Array( bCnt );    // World space matrices
        const bind : Array< Mat4 >  = new Array( bCnt );    // bind pose matrices
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Flat Buffer Space
        this.offsetBuffer       = new Float32Array( COMP_LEN * bCnt );

        // Fill Arrays
        for( let i=0; i < bCnt; i++ ){
            world[ i ]  = new Mat4(); //mat4.create();
            bind[ i ]   = new Mat4(); //mat4.create();

            // Fill in Offset with Unmodified matrices
            mat4Identity.toBuf( this.offsetBuffer, i * COMP_LEN );
        }
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let b: Bone;
        let l: Transform;
        let m: Mat4 = new Mat4();
        for( let i=0; i < bCnt; i++ ){
            b = bindPose.bones[ i ];
            l = b.local;
            m = world[ i ];
            
            m.fromQuatTranScale( l.rot, l.pos, l.scl );         // Local Space Matrix
            if( b.pindex !== -1 ) m.pmul( world[ b.pindex ] );  // Add Parent if Available
                                 
            bind[ i ].fromInvert( m );                          // Invert for Bind Pose
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Save References
        this.bind   = bind;
        this.world  = world;
    }
    // #endregion

    // #region METHODS
    updateFromPose( pose: Pose ): this{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get Pose Starting Offset
        const offset = new Mat4().fromQuatTranScale( 
            pose.offset.rot, 
            pose.offset.pos, 
            pose.offset.scl
        );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const bOffset = new Mat4();
        const w: Array< Mat4 > = this.world;
        let b : Bone;
        let m : Mat4;
        let i : number;

        for( i=0; i < pose.bones.length; i++ ){
            b = pose.bones[ i ];

            // ----------------------------------------
            // Compute Worldspace Matrix for Each Bone
            m = w[ i ];
            m.fromQuatTranScale( b.local.rot,  b.local.pos, b.local.scl ); // Local Space Matrix

            if( b.pindex !== -1 ) m.pmul( w[ b.pindex ] );  // Add Parent if Available (PMUL)
            else                  m.pmul( offset );         // Or use Offset on all root bones (PMUL)

            // ----------------------------------------
            // Compute Offset Matrix that will be used for skin a mesh
            // OffsetMatrix = Bone.WorldMatrix * Bone.BindMatrix 
            bOffset
                .fromMul( m, this.bind[ i ] )
                .toBuf( this.offsetBuffer, i * COMP_LEN );
        }

        return this;
    }
    // #endregion
}