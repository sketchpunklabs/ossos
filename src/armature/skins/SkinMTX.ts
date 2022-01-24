//#region IMPORTS
import type { ISkin, TTextureInfo } from './ISkin.js'
import type Armature                from '../Armature'
import type Pose                    from '../Pose';

import { mat4 }                     from 'gl-matrix'
import Mat4Util                     from '../../maths/Mat4Util';
import Bone                         from '../Bone.js';
//#endregion

const COMP_LEN = 16;            // 16 Floats
const BYTE_LEN = COMP_LEN * 4;  // 16 Floats * 4 Bytes Each

class SkinMTX implements ISkin {
    bind         !: mat4[];
    world        !: mat4[];
    offsetBuffer !: Float32Array;
    //constructor(){}
    
    init( arm: Armature ): this{
        const mat4Identity      = mat4.create();
        const bCnt              = arm.bones.length;
        const world : mat4[]    = new Array( bCnt );
        const bind  : mat4[]    = new Array( bCnt );

        this.offsetBuffer       = new Float32Array( 16 * bCnt );  // Create Flat Buffer Space

        // Fill Arrays
        for( let i=0; i < bCnt; i++ ){
            world[ i ]  = mat4.create();
            bind[ i ]   = mat4.create();
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let b, l, m;
        for( let i=0; i < bCnt; i++ ){
            b = arm.bones[ i ];
            l = b.local;
            m = world[ i ];
            
            //world[ i ].fromQuatTranScale( b.local.rot, b.local.pos, b.local.scl );  
            mat4.fromRotationTranslationScale( m, l.rot, l.pos, l.scl );    // Local Space Matrix

            if( b.pidx != -1 ) mat4.mul( m, world[ b.pidx ], m );           // Add Parent if Available

            //bind[ i ].fromInvert( world[ i ] );                                     
            mat4.invert( bind[ i ], m );                                    // Invert for Bind Pose

            Mat4Util.toBuf( mat4Identity, this.offsetBuffer, i * 16 );      // Fill in Offset with Unmodified matrices
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.bind           = bind;                             // Save Reference to Vars
        this.world          = world;
        return this;
    }

    updateFromPose( pose: Pose ): this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get Pose Starting Offset
        //const offset = new Mat4();
        //offset.fromQuatTranScale( pose.offset.rot, pose.offset.pos, pose.offset.scl );
        const offset = mat4.create();
        mat4.fromRotationTranslationScale(
            offset,
            pose.offset.rot,
            pose.offset.pos,
            pose.offset.scl,
        );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const bOffset = mat4.create();
        let b : Bone;
        let m : mat4;
        let i : number; 

        for( i=0; i < pose.bones.length; i++ ){
            b = pose.bones[ i ];

            //----------------------------------------
            // Compute Worldspace Matrix for Each Bone
            m = this.world[ i ];
            mat4.fromRotationTranslationScale( m, b.local.rot,  b.local.pos, b.local.scl ); // Local Space Matrix
            if( b.pidx != -1 )  mat4.mul( m, this.world[ b.pidx ], m );                     // Add Parent if Available (PMUL)
            else                mat4.mul( m, offset, m );                                   // Or use Offset on all root bones (PMUL)

            //----------------------------------------
            // Compute Offset Matrix that will be used for skin a mesh
            // OffsetMatrix = Bone.WorldMatrix * Bone.BindMatrix 
            //bOffset
            //    .fromMul( this.world[ i ], this.bind[ i ] )
            //    .toBuf( this.offsetBuffer, i * 16 );
            
            mat4.mul( bOffset, m, this.bind[ i ] );
            Mat4Util.toBuf( bOffset, this.offsetBuffer, i * 16 );
        }

        return this
    }

    getOffsets(): Array< unknown >{
        return [ this.offsetBuffer ];
    }

    getTextureInfo( frameCount: number ): TTextureInfo{
        const boneCount         = this.bind.length;             // One Bind Per Bone
        const strideFloatLength = COMP_LEN;                     // How many floats makes up one bone offset
        const strideByteLength  = BYTE_LEN;                     // n Floats, 4 Bytes Each
        const pixelsPerStride   = COMP_LEN / 4;                 // n Floats, 4 Floats Per Pixel ( RGBA )
        const floatRowSize      = COMP_LEN * frameCount;        // How many Floats needed to hold all the frame data for 1 bone
        const bufferFloatSize   = floatRowSize * boneCount;     // Size of the Buffer to store all the data.
        const bufferByteSize    = bufferFloatSize * 4;          // Size of buffer in Bytes.
        const pixelWidth        = pixelsPerStride * frameCount; // How Many Pixels needed to hold all the frame data for 1 bone 
        const pixelHeight       = boneCount;                    // Repeat Data, but more user friendly to have 2 names depending on usage.

        const o : TTextureInfo = {
            boneCount,
            strideFloatLength,
            strideByteLength,
            pixelsPerStride,
            floatRowSize,
            bufferFloatSize,
            bufferByteSize,
            pixelWidth,
            pixelHeight,
        };

        return o;
    }

    clone(): SkinMTX{
        const skin = new SkinMTX();
        skin.offsetBuffer   = new Float32Array( this.offsetBuffer );
        skin.bind           = this.bind.map(  v=> mat4.clone( v ) );
        skin.world          = this.world.map( v=> mat4.clone( v ) );
        return skin;
    }
}

export default SkinMTX;