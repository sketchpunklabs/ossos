//#region IMPORTS
import type { ISkin, TTextureInfo } from './ISkin.js'
import type Armature                from '../Armature'
import type Pose                    from '../Pose';
import type Transform               from '../../maths/Transform';

import { quat2 }                    from 'gl-matrix'
import Vec4Util                     from '../../maths/Vec4Util';
import Bone                         from '../Bone.js';
//#endregion

const COMP_LEN = 8;             // 8 Floats
const BYTE_LEN = COMP_LEN * 4;  // 8 Floats * 4 Bytes Each

class SkinDQ implements ISkin {
    bind          !: quat2[];
    world         !: quat2[];
    offsetQBuffer !: Float32Array;
    offsetPBuffer !: Float32Array;
    //constructor(){}
    
    init( arm: Armature ): this{
        const bCnt              = arm.bones.length;
        const world : quat2[]   = new Array( bCnt );
        const bind  : quat2[]   = new Array( bCnt );

        // For THREEJS support, Split DQ into Two Vec4 since it doesn't support mat2x4 properly
        this.offsetQBuffer   = new Float32Array( 4 * bCnt );   // Create Flat Buffer Space
        this.offsetPBuffer   = new Float32Array( 4 * bCnt );

        // Fill Arrays
        for( let i=0; i < bCnt; i++ ){
            world[ i ]  = quat2.create();
            bind[ i ]   = quat2.create();
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let l : Transform;
        let b : Bone;
        let q : quat2;

        for( let i=0; i < bCnt; i++ ){
            b = arm.bones[ i ];
            l = b.local;
            q = world[ i ];

            quat2.fromRotationTranslation( q, l.rot, l.pos );               // Local Space

            if( b.pidx != -1 ) quat2.mul( q, world[ b.pidx ], q );          // Add Parent if Available
                            
            quat2.invert( bind[ i ], q );                                   // Invert for Bind Pose

            Vec4Util.toBuf( [0,0,0,1], this.offsetQBuffer, i * 4 );         // Init Offsets : Quat Identity
            Vec4Util.toBuf( [0,0,0,0], this.offsetPBuffer, i * 4 );         // ...No Translation
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.bind           = bind;                                         // Save Reference to Vars
        this.world          = world;
        return this;
    }

    updateFromPose( pose: Pose ): this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get Pose Starting Offset
        const offset = quat2.create();
        quat2.fromRotationTranslation(
            offset,
            pose.offset.rot,
            pose.offset.pos,
        );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const bOffset = quat2.create();
        let b   : Bone;
        let q   : quat2;
        let i   : number;
        let ii  : number;

        for( i=0; i < pose.bones.length; i++ ){
            b = pose.bones[ i ];

            //----------------------------------------
            // Compute Worldspace Duak Quaternion for Each Bone
            // Make sure scale is applied in no way to prevent artifacts.
            q = this.world[ i ];
            quat2.fromRotationTranslation( q, b.local.rot,  b.local.pos ); // Local Space Matrix
            if( b.pidx != -1 )  quat2.mul( q, this.world[ b.pidx ], q );   // Add Parent if Available (PMUL)
            else                quat2.mul( q, offset, q );                 // Or use Offset on all root bones (PMUL)

            //----------------------------------------
            // Compute Offset Matrix that will be used for skin a mesh
            // OffsetMatrix = Bone.WorldMatrix * Bone.BindMatrix            
            quat2.mul( bOffset, q, this.bind[ i ] );

            //----------------------------------------
            ii = i * 4;
            this.offsetQBuffer[ ii + 0 ] = bOffset[ 0 ];    // Quaternion Half
            this.offsetQBuffer[ ii + 1 ] = bOffset[ 1 ];
            this.offsetQBuffer[ ii + 2 ] = bOffset[ 2 ];
            this.offsetQBuffer[ ii + 3 ] = bOffset[ 3 ];

            this.offsetPBuffer[ ii + 0 ] = bOffset[ 4 ];    // Translation Half
            this.offsetPBuffer[ ii + 1 ] = bOffset[ 5 ];
            this.offsetPBuffer[ ii + 2 ] = bOffset[ 6 ];
            this.offsetPBuffer[ ii + 3 ] = bOffset[ 7 ];
        }

        return this
    }

    getOffsets(): Array< unknown >{
        return [ this.offsetQBuffer, this.offsetPBuffer ];
    }

    getTextureInfo( frameCount: number ): TTextureInfo{
        const boneCount         = this.bind.length;             // One Bind Per Bone
        const strideByteLength  = BYTE_LEN;                     // n Floats, 4 Bytes Each
        const strideFloatLength = COMP_LEN;                     // How many floats makes up one bone offset
        const pixelsPerStride   = COMP_LEN / 4;                 // n Floats, 4 Floats Per Pixel ( RGBA )
        const floatRowSize      = COMP_LEN * frameCount;        // How many Floats needed to hold all the frame data for 1 bone
        const bufferFloatSize   = floatRowSize * boneCount;     // Size of the Buffer to store all the data.
        const bufferByteSize    = bufferFloatSize * 4;          // Size of buffer in Bytes.
        const pixelWidth        = pixelsPerStride * frameCount; // How Many Pixels needed to hold all the frame data for 1 bone 
        const pixelHeight       = boneCount;                    // Repeat Data, but more user friendly to have 2 names depending on usage.

        const o : TTextureInfo = {
            boneCount,
            strideByteLength,
            strideFloatLength,
            pixelsPerStride,
            floatRowSize,
            bufferFloatSize,
            bufferByteSize,
            pixelWidth,
            pixelHeight,
        };
        return o;
    }

    clone(): SkinDQ{
        const skin          = new SkinDQ();
        skin.offsetQBuffer  = new Float32Array( this.offsetQBuffer );
        skin.offsetPBuffer  = new Float32Array( this.offsetPBuffer );
        skin.bind           = this.bind.map(  v=> quat2.clone( v ) );
        skin.world          = this.world.map( v=> quat2.clone( v ) );
        return skin;
    }
}

export default SkinDQ;