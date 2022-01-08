//#region IMPORTS
import type Pose                    from '../../armature/Pose';
import type { IKChain }             from '../rigs/IKChain';

import QuatUtil                     from '../../maths/QuatUtil';
import Vec3Util                     from '../../maths/Vec3Util';
import { quat }                     from 'gl-matrix';

import SwingTwistBase               from './support/SwingTwistBase';  
//#endregion


// http://www.1728.org/quadtrap.htm
function trapezoid_calculator( lbase: number, sbase: number, lleg: number, rleg: number ): Array< number > | null {
    if( lbase < sbase ){ console.log( "Long Base Must Be Greater Than Short Base"); return null; };

    // h2= (a+b-c+d)(-a+b+c+d)(a-b-c+d)(a+b-c-d)/(4(a-c))^2
	let h2 = ( lbase + lleg + sbase + rleg ) * 
             ( lbase * -1 + lleg + sbase + rleg ) * 
             ( lbase - lleg - sbase + rleg ) *
             ( lbase + lleg - sbase - rleg ) / 
             ( 4 * ( (lbase-sbase) * (lbase-sbase) ) );

    if( h2 < 0 ){ console.log("A Trapezoid With These Dimensions Cannot Exist"); return null; };

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //let perim   = lbase + sbase + lleg + rleg;
	let median  = ( lbase + sbase ) * 0.5;
	let diff    = lbase - sbase;
	let xval    = ( lleg**2 + diff**2 - rleg**2 ) / ( 2 * diff );
	let height  = Math.sqrt( lleg**2 - xval**2 );
    //let area    = height * median;
	let adj     = diff - xval;
    
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    let angA = Math.atan( height / xval );  // Angle of LBase + LLeg
    if( angA < 0 ) angA = angA + Math.PI;

    let angB = Math.PI - angA ;             // Angle of SBase + LLeg
    
    let angD = Math.atan( height / adj );   // Angle of LBase + RLeg
    if( angD < 0 ) angD = angD + Math.PI;
    
    let angC = Math.PI - angD;              // Angle of SBase + RLeg
    
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	//let diag1 = ( lbase-xval ) * ( lbase-xval ) + ( height*height ); // bottom left to top right length
    //diag1 = Math.sqrt( diag1 );    
	//let diag2 = ( sbase + xval ) * ( sbase + xval ) + (height*height); // bottom right to top left length
    //diag2 = Math.sqrt( diag2 );

    return [ angA, angB, angC, angD ];
}


class TrapezoidSolver extends SwingTwistBase{
    bendDir : number = 1;   // Switching to Negative will flip the rotation arc

    invertBend(): this{ this.bendDir = -this.bendDir; return this; }

    resolve( chain: IKChain, pose: Pose, debug?:any ): void{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Start by Using SwingTwist to target the bone toward the EndEffector
        const ST          = this._swingTwist
        const [ rot, pt ] = ST.getWorldRot( chain, pose, debug );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        //       Short Side
        //    b  /---------\ c
        //      /           \
        //   a /_____________\ d
        //        Long Side

        const b0            = chain.links[ 0 ];
        const b1            = chain.links[ 1 ];
        const b2            = chain.links[ 2 ];
        const lft_len       = b0.len;
        const top_len       = b1.len;
        const rit_len       = b2.len;
        const bot_len       = Vec3Util.len( ST.effectorPos, ST.originPos );;
        const qprev : quat  = quat.copy( [0,0,0,1], pt.rot );
        const qnext : quat  = [0,0,0,1];
        let ang     : Array< number > | null;
        
        // NOTE : If bot + top are = calc fails, But if they're qual,
        // then it makes a rect with all angles being 90 Degrees
        // so if it becomes an issue thats a way to fix it. Might also have to
        // check that bone 0 and 2 are equal lengths for the 90 degree fix. 
        // But things do work if legs are not the same length. The shortest bone will 
        // determine how fast the trapezoid collapses not sure how to compute that 
        // yet other then letting the calculator give back null when the dimensions aren't possible.
        if( bot_len >= top_len ){
            ang = trapezoid_calculator( bot_len, top_len, lft_len, rit_len ); // IK distance longer then middle bone
            if( !ang ) return;
        }else{
            ang = trapezoid_calculator( top_len, bot_len, rit_len, lft_len ); // Middle bone is longer then ik distance
            if( !ang ) return;

            // Since we need to do the computation in reverse to make sure the shortest base it top, longest is bottom
            // Changing the top/bottom changes the order that the rotation values come back.
            // Easy to fix by reordering the array to match what it would be if the IK line is the longer one
            ang = [ ang[ 2 ], ang[ 3 ], ang[ 0 ], ang[ 1 ] ]; // abcd -> cdab
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // FIRST BONE
        QuatUtil.pmulAxisAngle( rot, ST.orthoDir, -ang[ 0 ] * this.bendDir, rot );  // Add rotation to SwingTwist
        quat.copy( qnext, rot );                                                    // Save WS for Next Bone
        QuatUtil.pmulInvert( rot, rot, qprev );                                     // To Local

        pose.setLocalRot( b0.idx, rot );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SECOND BONE
        quat.copy( qprev, qnext );                                  // Shift Next to Prev, used for To Local
        quat.mul( rot, qprev, b1.bind.rot );                        // Move Local Bind to WorldSpace
        QuatUtil.pmulAxisAngle( rot, ST.orthoDir, -(Math.PI + ang[ 1 ] * this.bendDir), rot ); // Rotation that needs to be applied to bone.
        quat.copy( qnext, rot );                                    // Save WS for Next Bone
        QuatUtil.pmulInvert( rot, rot, qprev );                     // To Local

        pose.setLocalRot( b1.idx, rot );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // THIRD BONE
        quat.mul( rot, qnext, b2.bind.rot );                        // Move Local Bind to WorldSpace
        QuatUtil.pmulAxisAngle( rot, ST.orthoDir, -(Math.PI + ang[ 2 ] * this.bendDir), rot ); // Rotation that needs to be applied to bone.
        QuatUtil.pmulInvert( rot, rot, qnext );                      // To Local

        pose.setLocalRot( b2.idx, rot );
    }

}

export default TrapezoidSolver;