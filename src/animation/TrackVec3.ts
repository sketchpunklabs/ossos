// #region IMPORTS
import type { TQuat }       from '../maths/Quat';
import type { ITrack }      from './types';
import type { FrameInfo }   from './PoseAnimator';
import type Pose            from '../armature/Pose';

import Vec3Buffer           from '../maths/Vec3Buffer';
import { LerpType }         from './types';
// #endregion

type TLerpFn = ( track: TrackVec3, fi: FrameInfo )=>TQuat;

export default class TrackVec3 implements ITrack{
    // #region MAIN
    boneIndex : number = -1;            // Bine index in skeleton this track will animate
    timeIndex : number = -1;            // Which timestamp array it uses.
    lerpType  : number = LerpType.Linear;

    values   !: Float32Array | Array<number>;   // Flat data of animation
    vbuf     !: Vec3Buffer;                     // Vec3 wrapper over flat data
    fnLerp   !: TLerpFn;                        // Interpolation function to use.
    
    constructor(  lerpType: number=LerpType.Linear ){        
        this.lerpType   = lerpType;
    }
    // #endregion

    // #region SETTERS
    setData( data: ArrayLike<number> ): this{
        this.values = new Float32Array( data ); // Clone Data so its not bound to GLTF's BIN
        this.vbuf   = new Vec3Buffer( this.values );
        return this;
    }
    // #endregion

    // #region METHODS
    apply( pose: Pose, fi: FrameInfo ): this{
        switch( this.lerpType ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case LerpType.Step:
                pose.setLocalPos( this.boneIndex, this.vbuf.get( fi.kB ) );
                break;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case LerpType.Linear:
                pose.setLocalPos( this.boneIndex, this.vbuf.lerp( fi.kB, fi.kC, fi.t ) );
                break;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_007_Animations.md#cubic-spline-interpolation
            // case LerpType.Cubic: break;
            default:
                console.log( 'Vec3Track - unknown lerp type', this.lerpType );
                break;
        }
        return this;
    }
    // #endregion
}