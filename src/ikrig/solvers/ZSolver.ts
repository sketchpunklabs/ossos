
//#region IMPORTS
import type Pose                    from '../../armature/Pose';
import type { IKChain }             from '../rigs/IKChain';

import QuatUtil                     from '../../maths/QuatUtil';
import Vec3Util                     from '../../maths/Vec3Util';
import { quat }                     from 'gl-matrix';

import SwingTwistBase               from './support/SwingTwistBase';  
//#endregion

/* [[ NOTES ]]
Get the length of the bones, the calculate the ratio length for the bones based on the chain length
The 3 bones when placed in a zig-zag pattern creates a Parallelogram shape. We can break the shape down into two triangles
By using the ratio of the Target length divided between the 2 triangles, then using the first bone + half of the second bound
to solve for the top 2 joiints, then using the half of the second bone + 3rd bone to solve for the bottom joint.
If all bones are equal length,  then we only need to use half of the target length and only test one triangle and use that for
both triangles, but if bones are uneven, then we need to solve an angle for each triangle which this function does.	
*/

function lawcos_sss( aLen: number, bLen: number, cLen: number ): number{
    // Law of Cosines - SSS : cos(C) = (a^2 + b^2 - c^2) / 2ab
    // The Angle between A and B with C being the opposite length of the angle.
    let v = ( aLen*aLen + bLen*bLen - cLen*cLen ) / ( 2 * aLen * bLen );
    if( v < -1 )		v = -1;	// Clamp to prevent NaN Errors
    else if( v > 1 )	v = 1;
    return Math.acos( v );
}

class ZSolver extends SwingTwistBase{

    resolve( chain: IKChain, pose: Pose, debug?:any ): void{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Start by Using SwingTwist to target the bone toward the EndEffector
        const ST          = this._swingTwist
        const [ rot, pt ] = ST.getWorldRot( chain, pose, debug );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const b0        = chain.links[ 0 ];
        const b1        = chain.links[ 1 ];
        const b2        = chain.links[ 2 ];
        const a_len     = b0.len;				// Length of First 3 Bones of Chain
        const b_len     = b1.len;
        const c_len     = b2.len;
        const mh_len    = b1.len * 0.5;			// Half the length of the middle bone.

        // How much to subdivide the Target length between the two triangles
        const eff_len   = Vec3Util.len( ST.effectorPos, ST.originPos );
        const t_ratio   = ( a_len + mh_len ) / ( a_len + b_len + c_len );	
        const ta_len    = eff_len * t_ratio;	// Long Side Length for 1st Triangle : 0 & 1
        const tb_len    = eff_len - ta_len;	    // Long Side Length for 2nd Triangle : 1 & 2

        const prot  : quat      = [0,0,0,0];
        const prot2 : quat      = [0,0,0,0];
        let   rad   : number;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // 1ST BONE  a_len, ta_len, bh_len
        rad	= lawcos_sss( a_len, ta_len, mh_len );	            // Get the Angle between First Bone and Target.
        QuatUtil.pmulAxisAngle( rot, ST.orthoDir, -rad, rot );  // Use the Axis X to rotate by Radian Angle
        quat.copy( prot, rot );                                 // Save For Next Bone as its WorldSpace Parent
        QuatUtil.pmulInvert( rot, rot, pt.rot );                // To Local
        pose.setLocalRot( b0.idx, rot );				        // Save to Pose
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // 2ND BONE
        rad	= Math.PI - lawcos_sss( a_len, mh_len, ta_len );
        quat.mul( rot, prot, b1.bind.rot );                     // Move local bind rot to World Space
        QuatUtil.pmulAxisAngle( rot, ST.orthoDir, rad, rot );   // Rotation that needs to be applied to bone, same as prev bone
        quat.copy( prot2, rot );                                // Save for next bone
        QuatUtil.pmulInvert( rot, rot, prot );                  // To Local
        pose.setLocalRot( b1.idx, rot );				        // Save to Pose

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // 3RD BONE
        rad	= Math.PI - lawcos_sss( c_len, mh_len, tb_len );
        quat.mul( rot, prot2, b2.bind.rot );                    // Move local bind rot to World Space
        QuatUtil.pmulAxisAngle( rot, ST.orthoDir, -rad, rot );  // Rotation that needs to be applied to bone, same as prev bone
        QuatUtil.pmulInvert( rot, rot, prot2 );                 // To Local
        pose.setLocalRot( b2.idx, rot );				        // Save to Pose
    }

}

export default ZSolver;