// #region ARMATURE
import Armature     from './armature/Armature';
import Bone         from './armature/Bone';
import Pose         from './armature/Pose';
import BoneBindings from './armature/BoneBindings';
import BoneSockets  from './armature/BoneSockets';
export { Armature, Bone, Pose, BoneBindings, BoneSockets };
// #endregion

// #region SKINNING
import MatrixSkin       from './skinning/MatrixSkin';
import DQTSkin          from './skinning/DQTSkin';
import TranMatrixSkin   from './skinning/TranMatrixSkin';
import DualQuatSkin     from './skinning/DualQuatSkin';
export { MatrixSkin, DQTSkin, TranMatrixSkin, DualQuatSkin };
// #endregion

// #region KINEMATICS
import IKTarget         from './kinematics/IKTarget';
import IKChain          from './kinematics/IKChain';
// import AimSolver       from './kinematics/solvers/AimSolver';
export { IKTarget, IKChain };
// #endregion

// #region MATHS
import Maths        from './maths/Maths';
import Transform    from './maths/Transform';
import Vec3         from './maths/Vec3';
import Quat         from './maths/Quat';
export { Maths, Transform, Vec3, Quat };
// #endregion

// #region ANIMATION
import AnimationQueue    from './animation/AnimationQueue';
import Easing            from './animation/Easing';

import { LerpType }      from './animation/types';
import TrackQuat         from './animation/TrackQuat';
import TrackVec3         from './animation/TrackVec3';
import Clip              from './animation/Clip';
import RootMotion        from './animation/RootMotion';
import PoseAnimator      from './animation/PoseAnimator';

export { 
    AnimationQueue, Easing, 
    PoseAnimator, Clip, RootMotion, LerpType, TrackQuat, TrackVec3,
};
// #endregion