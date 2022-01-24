//#region IMPORTS
import type Bone                    from '../armature/Bone';
import type Pose                    from '../armature/Pose';
import type { ISpringType }         from './index'
import type SpringChain             from './SpringChain';

import Transform                    from '../maths/Transform';
import SpringItem                   from './SpringItem';
//#endregion

class SpringPos implements ISpringType{

    setRestPose( chain: SpringChain, pose: Pose, resetSpring=true, debug ?: any ): void{
        let si   : SpringItem;
        let b    : Bone;

        for( si of chain.items ){
            b = pose.bones[ si.index ];     // Get Pose Bone
            si.spring.reset( b.world.pos ); // Set Spring to Start at this Position.
            si.bind.copy( b.local );        // Copy LS Transform as this will be the Actual Rest Pose of the bone.
        }
    }

    updatePose( chain: SpringChain, pose: Pose, dt: number, debug ?: any ): void{
        let si      : SpringItem;
        let b       : Bone;
        let pTran   = new Transform();
        let cTran   = new Transform();
        let iTran   = new Transform();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Find the Starting WorldSpace Transform
        si = chain.items[ 0 ];                                          // First Chain Link
        b  = pose.bones[ si.index ];                                    // Its Pose Bone
        if( b.pidx != -1 )  pTran.copy( pose.bones[ b.pidx ].world );   // Use Parent's WS Transform
        else                pTran.copy( pose.offset );                  // Use Pose's Offset if there is no parent.

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Start Processing Chain
        for( si of chain.items ){
            b = pose.bones[ si.index ];     // Get Pose Bone

            //----------------------------------------------            
            cTran.fromMul( pTran, si.bind );    // Compute the Bone's Resting WS Transform
            si.spring.setTarget( cTran.pos )    // Set new Target
                
            // If no spring movement, save WS transform and move to next item
            if( !si.spring.update( dt ) ){
                pTran.copy( cTran );
                continue;
            }

            //----------------------------------------------
            iTran
                .fromInvert( pTran )                            // Need Parent WS Transform inverted...   
                .transformVec3( si.spring.val, b.local.pos );   // to move spring position to Local Space,

            pTran.mul( si.bind.rot, b.local.pos, si.bind.scl ); // Using new Position, Move Parent WS Transform for the next item
        }
    }

}

export default SpringPos;