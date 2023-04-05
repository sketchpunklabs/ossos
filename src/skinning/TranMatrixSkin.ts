// #region IMPORTS
import type ISkin           from './ISkin';
import type Pose            from '../armature/Pose';
import type Bone            from '../armature/Bone';

import Transform            from '../maths/Transform';
import Mat4                 from '../maths/Mat4';
// #endregion

export default class TranMatrixSkin implements ISkin{
    // #region MAIN
    bind            !: Array< Transform >;
    world           !: Array< Transform >;
    offsetBuffer    !: Float32Array;

    constructor( bindPose: Pose ){
        const bCnt                          = bindPose.bones.length;
        const mat4Identity                  = new Mat4();        // used to fill in buffer with default data
        const world : Array< Transform >    = new Array( bCnt );    // World space matrices
        const bind  : Array< Transform >    = new Array( bCnt );    // bind pose matrices
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Flat Buffer Space
        this.offsetBuffer  = new Float32Array( 16 * bCnt );

        // Fill Arrays
        for( let i=0; i < bCnt; i++ ){
            world[ i ] = new Transform();
            bind[ i ]  = new Transform();
            
            mat4Identity.toBuf( this.offsetBuffer, i * 16 );  // Fill in Offset with Unmodified matrices
        }
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let b: Bone;
        for( let i=0; i < bCnt; i++ ){
            b = bindPose.bones[ i ];

            // Compute Bone's world space transform
            if( b.pindex !== -1 ) world[ i ].fromMul( world[ b.pindex ], b.local );
            else                  world[ i ].copy( b.local );

            // Inverting it to create a Bind Transform
            bind[ i ].fromInvert( world[ i ] );
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
        const bOffset = new Transform();
        const w       = this.world;
        const m       = new Mat4();
        let b: Bone;

        for( let i=0; i < pose.bones.length; i++ ){
            b = pose.bones[ i ];

            // Compute Bone's world space transform
            if( b.pindex !== -1 ) w[ i ].fromMul( w[ b.pindex ], b.local );
            else                  w[ i ].fromMul( pose.offset,   b.local );

            // Compute Offset Transform that will be used for skinning a mesh
            // OffsetTransform = Bone.WorldTransform * Bone.BindTransform
            bOffset.fromMul( w[ i ], this.bind[ i ] );

            // Convert Transform to a Matrix, then Save to Buffer
            m   .fromQuatTranScale( bOffset.rot, bOffset.pos, bOffset.scl )
                .toBuf( this.offsetBuffer, i * 16 );
        }

        return this;
    }
    // #endregion
}