// #region IMPORTS
import type { TQuat }       from '../maths/Quat';
import type { ITrack }      from './types';
import type { FrameInfo }   from './PoseAnimator';
import type Pose            from '../armature/Pose';

import QuatBuffer           from '../maths/QuatBuffer';
import { LerpType }         from './types';
// #endregion


type TLerpFn = ( track: TrackQuat, fi: FrameInfo )=>TQuat;


export default class TrackQuat implements ITrack{
    // #region MAIN
    boneIndex : number = -1;            // Bine index in skeleton this track will animate
    timeIndex : number = -1;            // Which timestamp array it uses.
    lerpType  : number = LerpType.Linear;

    values   !: Float32Array | Array<number>;   // Flat data of animation
    vbuf     !: QuatBuffer;                     // Quat wrapper over flat data
    fnLerp   !: TLerpFn;                        // Interpolation function to use.
    
    constructor(  lerpType: number=LerpType.Linear ){        
        this.lerpType   = lerpType;
    }
    // #endregion

    // #region SETTERS
    setData( data: ArrayLike<number> ): this{
        this.values = new Float32Array( data ); // Clone Data so its not bound to GLTF's BIN
        this.vbuf   = new QuatBuffer( this.values );
        return this;
    }
    // #endregion

    // #region METHODS
    apply( pose: Pose, fi: FrameInfo ): this{
        switch( this.lerpType ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case LerpType.Step:
                pose.setLocalRot( this.boneIndex, this.vbuf.get( fi.kB*4 ) );
                break;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case LerpType.Linear:
                this.vbuf.nblend( fi.kB*4, fi.kC*4, fi.t );
                // this.vbuf.slerp( fi.kB*4, fi.kC*4, fi.t );
                pose.setLocalRot( this.boneIndex, this.vbuf.result );
                break;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_007_Animations.md#cubic-spline-interpolation
            // case LerpType.Cubic: break;
            default:
                console.log( 'QuatTrack - unknown lerp type' );
                break;
        }
        return this;
    }
    // #endregion
}