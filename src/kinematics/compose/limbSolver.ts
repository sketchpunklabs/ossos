// #region IMPORT
import type Pose        from '../../armature/Pose';
import type { IKChain } from '../IKChain';
import type IKTarget    from '../IKTarget';

import aimChainSolver   from '../solvers/aimChainSolver';
import twoBoneSolver    from '../solvers/twoBoneSolver';
// #endregion

export default function limbSolver ( target: IKTarget, chain: IKChain, pose: Pose ): void{
    chain.updateRootFromPose( pose );                   // Get root world transform
    target.useRootTransform( chain.links[0].world );    // 

    aimChainSolver( target, chain, pose );              // Aim chain root bone at IK Target

    if( target.isReachable( chain.len ) ){
        twoBoneSolver( target, chain, pose );           // Bend bones to reach target
    }else{
        chain.resetWorld( 1 );                          // Straighten remaining bones
    }

    chain.setLocalRotPose( pose );                      // Convert to local space & save to pose
}