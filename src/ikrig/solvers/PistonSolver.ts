//#region IMPORTS
import type Pose                    from '../../armature/Pose';
import type { IKChain, IKLink }     from '../rigs/IKChain';

import QuatUtil                     from '../../maths/QuatUtil';
import Vec3Util                     from '../../maths/Vec3Util';
import { vec3 }                     from 'gl-matrix';

import SwingTwistBase               from './support/SwingTwistBase';  
//#endregion

class PistonSolver extends SwingTwistBase{

    resolve( chain: IKChain, pose: Pose, debug?:any ): void{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Start by Using SwingTwist to target the bone toward the EndEffector
        const ST            = this._swingTwist
        const [ rot, pt ]   = ST.getWorldRot( chain, pose, debug );
        const effLen        = Vec3Util.len( ST.effectorPos, ST.originPos );
        const v : vec3      = [0,0,0];
        let lnk : IKLink    = chain.first();
        let i   : number;

        // Apply SwingTwist Rotation
        QuatUtil.pmulInvert( rot, rot, pt.rot );
        pose.setLocalRot( lnk.idx, rot );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Check if target length is less then any bone, then compress all bones down to zero
        for( lnk of chain.links ){
            if( lnk.len >= effLen ){
                for( i=1; i < chain.count; i++ )
                    pose.setLocalPos( chain.links[ i ].idx, [0,0,0] );
                return;
            }
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Bones can only shift into their parent bone. So the final bone's length in the chain isn't needed.
        // So we get the acount of space we need to retract, then divide it evenly based on the ratio of bone
        // lengths. So if Bone0 = 2 and Bone1 = 8, that means Bone0 only needs to travel 20% of the total retraction 
        // length where bone1 does 80%. 
        // Keep in mind, we travel based on parent length BUT apply change to child.

        const endIdx    = chain.count - 1;
        const deltaLen  = chain.length - effLen;                            // How Much distance needing to move
        const incInv    = 1 / ( chain.length - chain.links[ endIdx ].len ); // Get Total Available Space of Movement, Inverted to remove division later

        for( i=0; i < endIdx; i++ ){
            lnk     = chain.links[ i ];

            // Normalize Bone Length In relation to Total, Use that as a scale of total delta movement
            // then subtract from the bone's length, apply that length to the next bone's Position.
            v[ 1 ]  = lnk.len - deltaLen * ( lnk.len * incInv );
            
            pose.setLocalPos( chain.links[ i+1 ].idx, v );
        }
      
    }

}

export default PistonSolver;