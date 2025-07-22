// #region ARMATURE
import Armature     from './armature/Armature';
import Bone         from './armature/Bone';
import Pose         from './armature/Pose';
import BoneBindings from './armature/BoneBindings';
import BoneSockets  from './armature/BoneSockets';
import BoneMap      from './armature/BoneMap';
export { Armature, Bone, Pose, BoneBindings, BoneSockets, BoneMap };
// #endregion

// #region SKINNING
import MatrixSkin       from './skinning/MatrixSkin';
import DQTSkin          from './skinning/DQTSkin';
import TranMatrixSkin   from './skinning/TranMatrixSkin';
import DualQuatSkin     from './skinning/DualQuatSkin';
import SQTSkin          from './skinning/SQTSkin';
export { MatrixSkin, DQTSkin, TranMatrixSkin, DualQuatSkin, SQTSkin };
// #endregion

// #region KINEMATICS

// IK OBJECTS
import BoneAxes                 from './kinematics2/BoneAxes';
import IKTarget                 from './kinematics2/IKTarget';
import { IKChain, IKLink }      from './kinematics2/IKChain';
import { IKRig }                from './kinematics2/IKRig';

import { IK_SOLVERS }           from './kinematics2/consts';

// RAW SOLVERS
import lookSolver               from './kinematics2/solvers/lookSolver';
import twoBoneSolver            from './kinematics2/solvers/twoBoneSolver';
import swingTwistChainSolver    from './kinematics2/solvers/swingTwistChainSolver';
import deltaMoveSolver          from './kinematics2/solvers/deltaMoveSolver';
import trapezoidSolver          from './kinematics2/solvers/trapezoidSolver';
import zSolver                  from './kinematics2/solvers/zSolver';
import splineSolver             from './kinematics2/solvers/splineSolver';

// COMPOSED SOLVERS
import rootCompose              from './kinematics2/compose/rootCompose';
import lookCompose              from './kinematics2/compose/lookCompose';
import limbCompose              from './kinematics2/compose/limbCompose';
import zCompose                 from './kinematics2/compose/zCompose';
import trapezoidCompose         from './kinematics2/compose/trapezoidCompose';
import asincArcCompose          from './kinematics2/compose/asincArcCompose';

// EXPORT
export {
    IKRig, IKTarget, IKChain, IKLink, BoneAxes, IK_SOLVERS,
    lookSolver, twoBoneSolver, swingTwistChainSolver, deltaMoveSolver, trapezoidSolver, zSolver, splineSolver,
    rootCompose, lookCompose, limbCompose, zCompose, trapezoidCompose, asincArcCompose
};
// #endregion

// #region MATHS
import Maths        from './maths/Maths';
import Transform    from './maths/Transform';
import Vec3         from './maths/Vec3';
import Quat         from './maths/Quat';
import Mat4         from './maths/Mat4';
export { Maths, Transform, Vec3, Quat, Mat4 };
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
import Retarget          from './animation/Retarget';

export {
    AnimationQueue, Easing,
    PoseAnimator, Clip, RootMotion, LerpType, TrackQuat, TrackVec3,
    Retarget,
};
// #endregion