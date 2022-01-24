import type BipedIKPose from '../BipedIKPose';

export default interface IIKPoseAdditive{
    apply( key: string, src: BipedIKPose): void;
}