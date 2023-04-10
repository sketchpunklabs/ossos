import type { TQuat }       from '../maths/Quat';
import type { ITrack }      from './types';
import type { FrameInfo }   from './PoseAnimator';
import type Pose            from '../armature/Pose';

import Quat from '../maths/Quat';

import { LerpType }         from './types';

type TLerpFn = ( track: TrackQuat, fi: FrameInfo )=>TQuat;

export default class TrackQuat implements ITrack{
    // #region MAIN
    boneIndex : number = -1;            // Bine index in skeleton this track will animate
    timeIndex : number = -1;            // Which timestamp array it uses.
    
    values    : Float32Array | Array<number>;   // Flat data of animation
    fnLerp   !: TLerpFn;                        // Interpolation function to use.
    
    constructor( flatData: Float32Array | Array<number>, lerpType: number=LerpType.Linear ){
        this.values = flatData;
        this.setInterpolation( lerpType );
    }
    // #endregion

    // #region SETTERS
    setInterpolation( lerpType: number ){
        switch( lerpType ){
            case LerpType.Linear : this.fnLerp = lerpQuatLinear; break;
            case LerpType.Cubic  : this.fnLerp = lerpQuatCubic;  break;
            default              : this.fnLerp = lerpQuatStep;   break;
        }
        return this;
    }
    // #endregion

    apply( pose: Pose, fi: FrameInfo ): this{

        const q = this.fnLerp( this, fi );
        pose.setLocalRot( this.boneIndex, q );

        // pose.getBone( this.boneIndex ).name
        
        // const q = TypePool.quat();
        // pose.setLocalRot( this.boneIndex, this.fnLerp( this, fi, q  ) );
        // TypePool.recycle_quat( q );
        return this;
    }
}

// #region Interpolation

function lerpQuatStep( track: TrackQuat, fi: FrameInfo ): TQuat{
    return [0,0,0,1];
}
function lerpQuatLinear( track: TrackQuat, fi: FrameInfo ): TQuat{
//     const v0 = TypePool.quat();
//     const v1 = TypePool.quat();

//     QuatUtil.fromBuf( v0, track.values, fi.k0 * 4 );
//     QuatUtil.fromBuf( v1, track.values, fi.k1 * 4 );
//     QuatUtil.nblend( out, v0, v1, fi.t );   // TODO : Maybe Slerp in the future?

//     TypePool.recycle_quat( v0, v1 );

    const qa = new Quat().fromBuf( track.values, fi.kB * 4 );
    const qb = new Quat().fromBuf( track.values, fi.kC * 4 );
    
    return Quat.nblend( qa, qb, fi.t, qa );

    // return [0,0,0,1];
}
function lerpQuatCubic( track: TrackQuat, fi: FrameInfo ): TQuat{return [0,0,0,1];}


// class QuatBuffer{
//     _buf !: Float32Array | Array<number>;

//     // nBlend( ia: number, ib: number, out:TQuat ): TQuat{

//     //     return out;
//     // }  

// }


// function quat_step( track: ITrack, fi: FrameInfo, out: quat ) : quat{
//     return QuatUtil.fromBuf( out, track.values, fi.k0 * 4 );
// }

// function quat_linear( track: ITrack, fi: FrameInfo, out: quat ) : quat{
//     const v0 = TypePool.quat();
//     const v1 = TypePool.quat();

//     QuatUtil.fromBuf( v0, track.values, fi.k0 * 4 );
//     QuatUtil.fromBuf( v1, track.values, fi.k1 * 4 );
//     QuatUtil.nblend( out, v0, v1, fi.t );   // TODO : Maybe Slerp in the future?

//     TypePool.recycle_quat( v0, v1 );
//     return out;
// }
//#endregion


// https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_007_Animations.md#linear
// interpolationValue = (currentTime - previousTime) / (nextTime - previousTime)

// Point lerp(previousPoint, nextPoint, interpolationValue)
//         return previousPoint + interpolationValue * (nextPoint - previousPoint)

// Quat slerp(previousQuat, nextQuat, interpolationValue)
//         var dotProduct = dot(previousQuat, nextQuat)
        
//         //make sure we take the shortest path in case dot Product is negative
//         if(dotProduct < 0.0)
//             nextQuat = -nextQuat
//             dotProduct = -dotProduct
            
//         //if the two quaternions are too close to each other, just linear interpolate between the 4D vector
//         if(dotProduct > 0.9995)
//             return normalize(previousQuat + interpolationValue(nextQuat - previousQuat))

//         //perform the spherical linear interpolation
//         var theta_0 = acos(dotProduct)
//         var theta = interpolationValue * theta_0
//         var sin_theta = sin(theta)
//         var sin_theta_0 = sin(theta_0)
        
//         var scalePreviousQuat = cos(theta) - dotproduct * sin_theta / sin_theta_0
//         var scaleNextQuat = sin_theta / sin_theta_0
//         return scalePreviousQuat * previousQuat + scaleNextQuat * nextQuat