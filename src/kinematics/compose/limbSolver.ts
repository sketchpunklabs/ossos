// #region IMPORT
import type Pose        from '../../armature/Pose';
import type IKChain     from '../IKChain';
import type IKTarget    from '../IKTarget';

import aimChainSolver   from '../solvers/aimChainSolver';
import twoBoneSolver    from '../solvers/twoBoneSolver';
// #endregion

export default function limbSolver ( target: IKTarget, chain: IKChain, pose: Pose ): void{
    chain.updateRootFromPose( pose );           // Get root world transform
    aimChainSolver( target, chain, pose );      // Aim chain root bone at IK Target

    if( chain.isReachable( target.pos ) ){
        twoBoneSolver( target, chain, pose );   // Bend bones to reach target
    }else{
        chain.resetWorld( 1 );                  // Straighten remaining bones
    }

    chain.setLocalRotPose( pose );              // Convert to local space & save to pose
}