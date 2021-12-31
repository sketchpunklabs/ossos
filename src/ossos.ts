//#region IMPORTS
import { Animator, Clip, Retarget }                         from './animation/index';

import { Armature, Bone, Pose, SkinMTX, SkinDQ, SkinDQT }   from './armature/index';
import type { ISkin, TTextureInfo }                         from './armature/index';

import BoneSpring                                           from './bonespring/index';
import type { ISpringType }                                 from './bonespring/index';

import {
    Maths, Transform, 
    DualQuatUtil, Mat4Util, QuatUtil, Vec3Util, Vec4Util,
}                                                           from './maths/index';

import Gltf2, { Accessor }                                  from './parsers/gltf2/index';

import {
    IKData, BipedIKPose, IKRig, BipedRig, IKChain, IKLink, 
    SwingTwistEndsSolver, SwingTwistSolver, LimbSolver, HipSolver,
}                                                           from './ikrig/index';

//#endregion

//#region EXPORTS
export {
    Animator, Clip, Retarget,
    Armature, Bone, Pose, SkinMTX, SkinDQ, SkinDQT,
    BoneSpring,
    Maths, Transform, DualQuatUtil, Mat4Util, QuatUtil, Vec3Util, Vec4Util,
    Gltf2, Accessor,
    IKData, BipedIKPose,  IKRig, BipedRig, IKChain, IKLink,
    SwingTwistEndsSolver, SwingTwistSolver, LimbSolver, HipSolver,
};

export type{
    ISkin, TTextureInfo,
    ISpringType,
};
//#endregion