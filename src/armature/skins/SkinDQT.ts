//#region IMPORTS
import type { ISkin, TTextureInfo } from './ISkin.js'
import type Armature                from '../Armature'
import type Pose                    from '../Pose';

import { quat2 }                    from 'gl-matrix'
import Vec4Util                     from '../../maths/Vec4Util';
import Vec3Util                     from '../../maths/Vec3Util';
import Transform                    from '../../maths/Transform';
import Bone                         from '../Bone.js';
//#endregion

const COMP_LEN = 12;            // 12 Floats, Extra Byte for 16 Byte Alignment Requirement in certain buffer types
const BYTE_LEN = COMP_LEN * 4;  // 12 Floats * 4 Bytes Each

class SkinDQT implements ISkin {
    bind          !: Transform[];
    world         !: Transform[];

    // Split into 3 Buffers because THREEJS does handle mat4x3 correctly
    // Since using in Shader Uniforms, can skip the 16 byte alignment for scale & store data as Vec3 instead of Vec4.
    // TODO : This may change in the future into a single mat4x3 buffer.
    offsetQBuffer !: Float32Array;  // DualQuat : Quaternion
    offsetPBuffer !: Float32Array;  // DualQuat : Translation
    offsetSBuffer !: Float32Array;  // Scale
    //constructor(){}
    
    init( arm: Armature ): this{
        const bCnt              = arm.bones.length;
        const world : Transform[]   = new Array( bCnt );
        const bind  : Transform[]   = new Array( bCnt );

        // For THREEJS support, Split DQ into Two Vec4 since it doesn't support mat2x4 properly
        this.offsetQBuffer   = new Float32Array( 4 * bCnt );   // Create Flat Buffer Space
        this.offsetPBuffer   = new Float32Array( 4 * bCnt );
        this.offsetSBuffer   = new Float32Array( 3 * bCnt );

        // Fill Arrays
        for( let i=0; i < bCnt; i++ ){
            world[ i ]  = new Transform();
            bind[ i ]   = new Transform();
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let b : Bone;
        let t : Transform;

        for( let i=0; i < bCnt; i++ ){
            b = arm.bones[ i ];
            t = world[ i ];

            t.copy( b.local );
            if( b.pidx != -1 ) t.pmul( world[ b.pidx ] );                   // Add Parent if Available
            bind[ i ].fromInvert( t );                                      // Invert for Bind Pose

            Vec4Util.toBuf( [0,0,0,1],  this.offsetQBuffer, i * 4 );        // Init Offsets : Quat Identity
            Vec4Util.toBuf( [0,0,0,0],  this.offsetPBuffer, i * 4 );        // ...No Translation
            Vec3Util.toBuf( [1,1,1],    this.offsetSBuffer, i * 3 );        // ...No Scale
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.bind           = bind;                                         // Save Reference to Vars
        this.world          = world;
        return this;
    }

    updateFromPose( pose: Pose ): this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get Pose Starting Offset
        const offset = pose.offset;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const bOffset = new Transform();
        const dq      = quat2.create();
        let b       : Bone;
        let ws      : Transform;
        let i       : number;
        let ii      : number;
        let si      : number;

        for( i=0; i < pose.bones.length; i++ ){
            b   = pose.bones[ i ];
            ws  = this.world[ i ];

            //----------------------------------------
            // Compute Worldspace Transform for Each Bone
            if( b.pidx != -1 )  ws.fromMul( this.world[ b.pidx ], b.local );  // Add Parent if Available
            else                ws.fromMul( offset, b.local );                // Or use pose Offset on all root bones

            //----------------------------------------
            // Compute Offset Transform that will be used for skinning a mesh
            // OffsetTransform = Bone.WorldTransform * Bone.BindTransform
            bOffset.fromMul( ws, this.bind[ i ] );

            // Convert Rotation & Translation to Dual Quaternions
            // For handling weights, it works best when Translation exists in a Dual Quaternion.
            quat2.fromRotationTranslation( dq, bOffset.rot, bOffset.pos );  

            //----------------------------------------
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

        return this
    }

    getOffsets(): Array< unknown >{
        return [ this.offsetQBuffer, this.offsetPBuffer, this.offsetSBuffer ];
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

    clone(): SkinDQT{
        const skin = new SkinDQT();
        skin.offsetQBuffer  = new Float32Array( this.offsetQBuffer );
        skin.offsetPBuffer  = new Float32Array( this.offsetPBuffer );
        skin.offsetSBuffer  = new Float32Array( this.offsetSBuffer );
        skin.bind           = this.bind.map(  v=>v.clone() );
        skin.world          = this.world.map( v=>v.clone() );
        return skin;
    }
}

export default SkinDQT;