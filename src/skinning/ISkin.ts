import type Pose from '../armature/Pose';

export type AnySkin = any;

export default interface ISkin{
    // new( bindPose: Pose ):ISkin;
    updateFromPose( pose: Pose ): this;
    // updateFromPose: ( pose: Pose )=>this;
}