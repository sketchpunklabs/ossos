import type { FrameInfo }   from './PoseAnimator';
import type Pose            from '../armature/Pose';

export const LerpType = {
    Step    : 0,
    Linear  : 1,
    Cubic   : 2,
} as const; 

export interface ITrack{
    timeIndex       : number;
    values          : Float32Array | Array<number>;
    boneIndex       : number;

    setData( data:ArrayLike<number> ): this;
    apply( pose: Pose, fi: FrameInfo ): this;
}