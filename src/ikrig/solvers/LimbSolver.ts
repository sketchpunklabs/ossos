//#region IMPORTS
import type Pose                    from '../../armature/Pose';
import type { IKChain }             from '../rigs/IKChain';

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

class LimbSolver extends SwingTwistBase{
    bendDir : number = 1;   // Switching to Negative will flip the rotation arc
    invertBend(): this{ this.bendDir = -this.bendDir; return this; }

    resolve( chain: IKChain, pose: Pose, debug?:any ): void{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Start by Using SwingTwist to target the bone toward the EndEffector
        const ST          = this._swingTwist
        const [ rot, pt ] = ST.getWorldRot( chain, pose, debug );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let b0      = chain.links[ 0 ],
            b1		= chain.links[ 1 ],
            alen	= b0.len,
            blen	= b1.len,
            clen	= Vec3Util.len( ST.effectorPos, ST.originPos ),
            prot    : quat = [0,0,0,0],
            rad     : number;
        
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// FIRST BONE
		rad	= lawcos_sss( alen, clen, blen );                   // Get the Angle between First Bone and Target.

        QuatUtil.pmulAxisAngle( rot, ST.orthoDir, -rad * this.bendDir, rot );  // Use the Axis X to rotate by Radian Angle
        quat.copy( prot, rot );                                 // Save For Next Bone as Starting Point.
        QuatUtil.pmulInvert( rot, rot, pt.rot );                // To Local

		pose.setLocalRot( b0.idx, rot );				        // Save to Pose

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SECOND BONE
		// Need to rotate from Right to Left, So take the angle and subtract it from 180 to rotate from 
		// the other direction. Ex. L->R 70 degrees == R->L 110 degrees
        rad	= Math.PI - lawcos_sss( alen, blen, clen );

        quat.mul( rot, prot, b1.bind.rot );                     // Get the Bind WS Rotation for this bone
        QuatUtil.pmulAxisAngle( rot, ST.orthoDir, rad * this.bendDir, rot );   // Rotation that needs to be applied to bone.
        QuatUtil.pmulInvert( rot, rot, prot );                  // To Local Space

        pose.setLocalRot( b1.idx, rot );                        // Save to Pose
    }

}

export default LimbSolver;