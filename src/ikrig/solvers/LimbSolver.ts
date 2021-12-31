//#region IMPORTS
import type Pose                    from '../../armature/Pose';
import type { IKChain }             from '../rigs/IKChain';
import type { IKData }              from '..';
import type { ISolver }             from './ISolver';

import { QuatUtil }                 from '../../maths';
import { vec3, quat }               from 'gl-matrix';
import Vec3Util                     from '../../maths/Vec3Util';

import SwingTwistSolver             from './SwingTwistSolver';
//#endregion

function lawcos_sss( aLen: number, bLen: number, cLen: number ): number{
    // Law of Cosines - SSS : cos(C) = (a^2 + b^2 - c^2) / 2ab
    // The Angle between A and B with C being the opposite length of the angle.
    let v = ( aLen*aLen + bLen*bLen - cLen*cLen ) / ( 2 * aLen * bLen );
    if( v < -1 )		v = -1;	// Clamp to prevent NaN Errors
    else if( v > 1 )	v = 1;
    return Math.acos( v );
}

class LimbSolver implements ISolver{
    //#region MAIN
    _swingTwist = new SwingTwistSolver();

    initData( pose?: Pose, chain?: IKChain ): this{
        if( pose && chain ){
            this._swingTwist.initData( pose, chain );
        }
        return this;
    }
    //#endregion

    //#region SETTING TARGET DATA
    setTargetDir( e: vec3, pole ?: vec3, effectorScale ?: number ): this{ this._swingTwist.setTargetDir( e, pole, effectorScale ); return this; }
    setTargetPos( v: vec3, pole ?: vec3 ): this{ this._swingTwist.setTargetPos( v, pole ); return this; }
    setTargetPole( v: vec3 ): this{ this._swingTwist.setTargetPole( v ); return this; }
    //#endregion

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

        QuatUtil.pmulAxisAngle( rot, ST.orthoDir, -rad, rot );  // Use the Axis X to rotate by Radian Angle
        quat.copy( prot, rot );                                 // Save For Next Bone as Starting Point.
        QuatUtil.pmulInvert( rot, rot, pt.rot );                // To Local

		pose.setLocalRot( b0.idx, rot );				        // Save to Pose

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SECOND BONE
		// Need to rotate from Right to Left, So take the angle and subtract it from 180 to rotate from 
		// the other direction. Ex. L->R 70 degrees == R->L 110 degrees
        rad	= Math.PI - lawcos_sss( alen, blen, clen );

        quat.mul( rot, prot, b1.bind.rot );                     // Get the Bind WS Rotation for this bone
        QuatUtil.pmulAxisAngle( rot, ST.orthoDir, rad, rot );   // Rotation that needs to be applied to bone.
        QuatUtil.pmulInvert( rot, rot, prot );                  // To Local Space

        pose.setLocalRot( b1.idx, rot );                        // Save to Pose
    }

    ikDataFromPose( chain: IKChain, pose: Pose, out: IKData.DirScale ): void{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Length Scaled & Effector Direction
        const p0  : vec3   = chain.getStartPosition( pose );
        const p1  : vec3   = chain.getTailPosition( pose, true );
        const dir : vec3   = vec3.sub( [0,0,0], p1, p0 );
        
        out.lenScale = vec3.len( dir ) / chain.length;
        vec3.normalize( out.effectorDir, dir );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Pole Direction
        const lnk   = chain.first();            // Chain Link : Pole is based on the first Bone's Rotation
        const bp    = pose.bones[ lnk.idx ];    // Bone ref from Pose 

        vec3.transformQuat( dir, lnk.poleDir, bp.world.rot );   // Get Alt Pole Direction from Pose
        vec3.cross( dir, dir, out.effectorDir );                // Get orthogonal Direction...
        vec3.cross( dir, out.effectorDir, dir );                // to Align Pole to Effector
        vec3.normalize( out.poleDir, dir );
    }
}

export default LimbSolver;