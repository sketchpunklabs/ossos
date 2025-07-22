

// #region IMPORTS
import type { IKChain }         from '../IKChain';
import type Pose                from '../../armature/Pose';
import type IKTarget            from '../IKTarget';
import type { AsincArcData }    from '../solvers/asincArc';

import lookSolver       from '../solvers/lookSolver';
import { calcAsincArc, calcArcPoints } 
                        from '../solvers/asincArc';
import { iterateForward, iterateBackward, applyPointsToPose } 
                        from '../solvers/fabrik'
import { TSolverOptions } from '../consts';
// #endregion

export default function asincArcCompose( target: IKTarget, chain: IKChain, pose: Pose, opts ?: TSolverOptions ){
    // Resolve the target to the current pose data
    target.resolveTarget( chain, pose );

    // Align the the root bone to the target direction
    lookSolver( target, chain, pose );

    // Compute all the values needed to compute points on an arc 
    // based on 2 bits of input, chord length and arc length
    const o: AsincArcData | null = calcAsincArc( target, chain );
    
    if( target.dist >= chain.len ){
        chain.resetPoseLocal( pose, 1 );
    }else if( o ){
        const points = calcArcPoints( target, chain, o, o.arcAngle < Math.PI, opts ); // Compute initial points on the arc for each bone
        // debugPoints( points );

        iterateForward( target, chain, points );                                // Move all the points torward IK target point
        // debugPoints( points );

        iterateBackward( chain, points );                                       // Move all points toward IK origin point
        // debugPoints( points, 0xff00ff );

        applyPointsToPose( chain, pose, points );                               // Convert point data into rotations that can be applied to bones
    }else{
        console.log( 'AsincArcData is null' );
    }
}

// function debugPoints( pnts: any, c=0x00ff00 ){
//     const d = globalThis.Debug;

//     const step = 1 / pnts.length;
//     for( let i=0; i < pnts.length; i++ ){
//         d.pnt.add( pnts[i], c * (1 - i * step), 4 );
//     }
// }
