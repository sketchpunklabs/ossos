//#region IMPORTS
import type Pose                    from '../../armature/Pose';
import type { IKChain, IKLink }     from '../rigs/IKChain';

import QuatUtil                     from '../../maths/QuatUtil';
import Vec3Util                     from '../../maths/Vec3Util';

import { quat,vec3 }                     from 'gl-matrix';

import SwingTwistBase               from './support/SwingTwistBase';  
import { Transform } from '../../maths';
//#endregion


// #region ARC OFFSET RATIO CURVE
// if Scale <= 0.3 or >= 1, Offset is zero
// 20 Samples between 0 to 1 of PI*2.
const PI_2                     = Math.PI * 2;
const OFFSETS: Array< number > = [
    0, 0.025, 0.07, 0.12808739578845105, 0.19558255045541925, 0.2707476090618156, 0.35128160042581186,
    0.43488355336557927, 0.5192524966992895, 0.6051554208208854, 0.6887573737606529, 0.7692913651246491, 0.8444564237310455,
    0.9119515783980137, 0.9694758579437253, 1.0124273200045233, 1.034670041428865, 1.026233147095494, 0.966407896367954,
    0.8053399136399616, 0 ];
    
function getOffset( t: number ): number{
    if( t <= 0.03 || t >= 1 ) return 0;

    const i     = 20 * t;		
    const idx   = Math.floor( i );
    const fract = i - idx;

    const a     = OFFSETS[ idx ];
    const b     = OFFSETS[ idx+1 ];
    return a * ( 1 - fract ) + b * fract;
}
// #endregion


class ArcSinSolver extends SwingTwistBase{
    bendDir : number = 1;   // Switching to Negative will flip the rotation arc

    resolve( chain: IKChain, pose: Pose, debug?:any ): void{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Start by Using SwingTwist to target the bone toward the EndEffector
        const ST            = this._swingTwist
        const [ rot, pt ]   = ST.getWorldRot( chain, pose, debug );
        const eff_len       = Vec3Util.len( ST.effectorPos, ST.originPos );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // If Distance to the end effector is at or over the chain length,
        // Just Apply SwingTwist to Root Bone.
        let len_scl = eff_len / chain.length;   // Normalize IK Length from Chain Length
        if( len_scl >= 0.999 ){
            QuatUtil.pmulInvert( rot, rot, pt.rot );        // To Local
            pose.setLocalRot( chain.links[ 0 ].idx, rot );  // Save
            return;
        }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Split the IK target into Two.
		// The idea is place the first half of the bones to the mid point of our IK Target
		// Then do the same thing for the second half but invert the angle of rotation.

        const midPos    : vec3      = vec3.lerp( [0,0,0], ST.originPos, ST.effectorPos, 0.5 );
		const midIdx    : number    = Math.floor( chain.count / 2 ) - 1;	// The end index of First Arc
        const ws        : Transform = pt.clone();
        
        // 1st Arc
        this._resolveSlice( chain, pose, 0, midIdx, ST.originPos, midPos, this.bendDir, ws, rot, debug );

        // Compute the new Parent WS Transform as a starting point for the 2nd Arc
        ws.copy( pt );
        for( let i=0; i <= midIdx; i++ ) ws.mul( pose.bones[ chain.links[i].idx ].local );

        // 2nd Arc
        this._resolveSlice( chain, pose, midIdx+1, chain.count-1 , midPos, ST.effectorPos, -this.bendDir, ws, undefined, debug );
    }

    /** Apply ArcSolver to a slice of the chain  */
    _resolveSlice( chain: IKChain, pose: Pose, aIdx: number, bIdx: number, startPos: vec3, endPos: vec3, dir: number, pt: Transform, initRot ?: quat, debug?:any ){
        const ST                    = this._swingTwist
        const rot      : quat       = [0,0,0,1];
        const root_rot : quat       = [0,0,0,1];
        let   sliceLen : number     = 0;
        let   i        : number;
        let lnk        : IKLink;
        
        // Compute Length of this slice
		for( i=aIdx; i <= bIdx; i++ ) sliceLen += chain.links[ i ].len;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Use the IK Length Scale to get the Arc angle out of 360 Degrees
        // The Angle isn't perfect, but adding a curved offset fixes things up.

        const len_scl   = Vec3Util.len( startPos, endPos ) / sliceLen;			                // Normalize Distance
        const arc_ang   = PI_2 * (1 - len_scl) + getOffset( len_scl );                          // Total Arc Angle
        const arc_inc   = arc_ang / ( bIdx - aIdx + 1 );                                            // angle Per Bone
        const q_inc     : quat = quat.setAxisAngle( [0,0,0,1], ST.orthoDir, arc_inc * dir );    // axis rotation per bone
        const final_inv : quat = quat.invert( [0,0,0,1], pt.rot );                              // Use to LocalSpace the first bone after ReAlignment

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Apply Rotation Increment to each bone after the first one
        for( i=aIdx; i <= bIdx; i++ ){
            lnk = chain.links[ i ];

            if( i == aIdx && initRot ) quat.copy( rot, initRot );               // Use Init Rotation instead
            else                       quat.mul( rot, pt.rot, lnk.bind.rot );   // Move Bind to WorldSpace

            quat.mul( rot, q_inc, rot );                                        // Add Increment
            if( i == aIdx ) quat.copy( root_rot, rot );                         // Save as Root WS Rotation for Realignment

            QuatUtil.pmulInvert( rot, rot, pt.rot );                            // To Local
            pose.setLocalRot( lnk.idx, rot );                                   // Save to Pose

            pt.mul( rot, lnk.bind.pos, lnk.bind.scl );                          // WS Transform for next bone
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get the end position of the arc, use that to figure out the
        // the rotation need to make that position align to the effector pos
        lnk = chain.links[ bIdx ];
        const tail_pos : vec3 = pt.transformVec3( [0, lnk.len, 0 ] );           // WS Position of the Chain's tail
        const tail_dir : vec3 = vec3.sub( [0,0,0], tail_pos, startPos );        // Direction from IK Origin Pos to chain's tail pos

        vec3.normalize( tail_dir, tail_dir );                                   // Needed for rotationTo				

        quat.rotationTo( rot, tail_dir, ST.effectorDir );                       // Rotation For Alignment
        quat.mul( rot, rot, root_rot );                                         // Apply to the first Bone's initial rotation
        quat.mul( rot, final_inv, rot );                                        // Move it to Root's Local Space

        pose.setLocalRot( chain.links[ aIdx ].idx, rot );		                // Save to Pose
    }

}

export default ArcSinSolver;