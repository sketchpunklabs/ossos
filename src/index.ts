// #region ARMATURE
import Armature     from './armature/Armature';
import Bone         from './armature/Bone';
import Pose         from './armature/Pose';
export { Armature, Bone, Pose };
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
import Transform    from './maths/Transform';
import Vec3         from './maths/Vec3';
import Quat         from './maths/Quat';
export { Transform, Vec3, Quat };
// #endregion