//#region IMPORTS
import type Pose                    from '../../armature/Pose';
import type { IKChain, IKLink }             from '../rigs/IKChain';

import QuatUtil                     from '../../maths/QuatUtil';
import Vec3Util                     from '../../maths/Vec3Util';
import { quat }                     from 'gl-matrix';

import SwingTwistBase               from './support/SwingTwistBase';  
//#endregion

function lawcos_sss( aLen: number, bLen: number, cLen: number ): number{
    // Law of Cosines - SSS : cos(C) = (a^2 + b^2 - c^2) / 2ab
    // The Angle between A and B with C being the opposite length of the angle.
    let v = ( aLen*aLen + bLen*bLen - cLen*cLen ) / ( 2 * aLen * bLen );
    if( v < -1 )		v = -1;	// Clamp to prevent NaN Errors
    else if( v > 1 )	v = 1;
    return Math.acos( v );
}

class SpringSolver extends SwingTwistBase{

    resolve( chain: IKChain, pose: Pose, debug?:any ): void{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Start by Using SwingTwist to target the bone toward the EndEffector
        const ST            = this._swingTwist
        const [ rot, pt ]   = ST.getWorldRot( chain, pose, debug );
        const effLen        = Vec3Util.len( ST.effectorPos, ST.originPos );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Going to treat the chain as if each bone is the same length to simplify the solver.
        // The basic Idea is that the line that forms the IK direction will be subdivided by
        // the number of pair bones to form a chain of triangles. So Each A, B is a bone and C
        // will be the sub divided IK line segment.
        //     / \     / \
        //  A /   \ B /   \
        //   /_____\ /_____\      
        //    C ( Base )
        
        const qprev : quat  = quat.copy( [0,0,0,1], pt.rot );                           // Previous Parent WS Rotation
        const qnext : quat  = [0,0,0,1];                                                // Save Child WS Rotation to be the next parent

        let lnk : IKLink    = chain.links[ 0 ];                                         // First bone of the triangle
        const boneLen       = lnk.len;                                                  // Treat each bone as the same length
        const baseLen       = effLen / ( chain.count / 2 );                             // Length of the sub divided IK segment, will be triangle's base len
        
        const rad_a         = lawcos_sss( boneLen, baseLen, boneLen );                  // Angle of AC
        const rad_b         = Math.PI - lawcos_sss( boneLen, boneLen, baseLen );        // Angle 0f AB
        const r_axis_an     = quat.setAxisAngle( [0,0,0,1], ST.orthoDir, -rad_a );      // First Bone Rotation
        const r_axis_b      = quat.setAxisAngle( [0,0,0,1], ST.orthoDir, rad_b );       // Second Bone Rotation

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // The first bone of the Chain starts off with the rotation from the SwingTwistSolver.
        // So from here, just need to apply the first axis rotation, save the WS for next bone's parent
        // then conver it back to local space to be saved back to the pose.
        
        quat.mul( rot, r_axis_an, rot );        // Apply First Rotation to SwingTwist Rot
        quat.copy( qnext, rot );                // Save as Next Parent Rotation
        QuatUtil.pmulInvert( rot, rot, qprev ); // To Local
        
        pose.setLocalRot( lnk.idx, rot );       // Save
        quat.copy( qprev, qnext );              // Move as Prev Parent Rotation
 
        // The last thing we do is fix the first bone rotation. The first bone starts off
        // aligned with the IK line, so we rotate N degrees to the left of the line for it.
        // When we start the loop, every first bone will now be looking down across the IK line
        // at about N amount of the line on the right side. To get it to where we need to go, we 
        // move it N degrees to the left which should align it again to the IK line, THEN we add
        // N degrees more to the left which should have it pointing to the same direction as the
        // first bone of the chain. So we just fix it by going N*-2 degrees on the same rotation axis
        
        quat.setAxisAngle( r_axis_an, ST.orthoDir, rad_a * -2 );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let r_axis : quat;
        for( let i=1; i < chain.count; i++ ){
            lnk     = chain.links[ i ];
            r_axis  = ( ( i&1 ) == 0 )? r_axis_an : r_axis_b;   // Use A for Even Numbers, B for Odd

            quat.mul( rot, qprev, lnk.bind.rot );               // Move Local Bind to WorldSpace
            quat.mul( rot, r_axis, rot );                       // Then apply the AB rotation to get it to point toward the IK Line
            quat.copy( qnext, rot );                            // Save WS rotation for next bone
            QuatUtil.pmulInvert( rot, rot, qprev );             // To local space...

            pose.setLocalRot( lnk.idx, rot );                   // Save to Pose
            quat.copy( qprev, qnext );                          // Move WS to qprev to act as the starting point
        }
    }

}

export default SpringSolver;