// #region IMPORT
import type Pose        from '../../armature/Pose';
import type { IKChain } from '../IKChain';
import type IKTarget    from '../IKTarget';

import Fabrik           from '../solvers/fabrik';

import Vec3, { TVec3 }  from '../../maths/Vec3';   
// #endregion

type fabrikProps = {
    startTwistDir ?: TVec3,
    endTwistDir   ?: TVec3,
    epsilon        : number,
};

export default function fabrikSolver ( target: IKTarget, chain: IKChain, pose: Pose, props ?: fabrikProps ): void{
    const pp: fabrikProps = Object.assign( { 
        epsilon : 0.001,
    }, props );


    // if( target.isReachable( chain.len ) ){
    //     twoBoneSolver( target, chain, pose );           // Bend bones to reach target
    // }else{
    //     chain.resetWorld( 1 );                          // Straighten remaining bones
    // }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Initial
    chain.updateRootFromPose( pose );                           // Get root world transform
    target.useRootTransform( chain.links[0].world );            // Align target data to root

    const pnts      = Fabrik.initPointsFromBindpose( chain );   // Convert chain link to points
    const effector  = pnts[ chain.count ];                      // Point that will reach the target
    const anchor    = chain.links[0].world.pos.clone();         // Reset root to this position

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Perform Main Solver Steps
    for( let i=0; i < 10; i++ ){
        Fabrik.iterateBackward( chain, target, pnts );
                
        pnts[0].copy( anchor ); // Move root back to starting position
        Fabrik.iterateForward( chain, pnts ); 

        if( Vec3.dist( target.pos, effector ) <= pp.epsilon ){
            console.log( 'Done', i );
            break;
        }
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Apply twisting to chain
    if( pp.startTwistDir && pp.endTwistDir ){
        Fabrik.applyTwistLerp( chain, pp.startTwistDir, pp.endTwistDir );
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Finalize
    Fabrik.updatePoseFromBind( chain, pnts, pose ); // Convert to local space & save to pose
}