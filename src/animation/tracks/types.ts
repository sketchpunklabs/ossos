import type { FrameInfo }   from '../Animator';
import type Pose            from '../../armature/Pose';

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export type Lerp = typeof ELerp[ keyof typeof ELerp ];
export const ELerp = {
    Step    : 0,
    Linear  : 1,
    Cubic   : 2,
} as const;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export interface ITrack{
    name            : string;
    timeStampIndex  : number;
    values          : Float32Array;
    boneIndex       : number;
    fnLerp          : fnInterp<any>

    apply( pose: Pose, fi: FrameInfo ): this;

    setInterpolation( i: Lerp ): this;
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export type fnInterp<T> = ( track: ITrack, fi: FrameInfo, out: T ) => T;