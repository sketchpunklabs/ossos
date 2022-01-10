//#region IMPORTS
import type Bone                    from '../armature/Bone';
import type Pose                    from '../armature/Pose';
import type { ISpringType }         from './index'
import type SpringChain             from './SpringChain';

import { vec3, quat }               from 'gl-matrix';
import Transform                    from '../maths/Transform';
import SpringItem                   from './SpringItem';
import QuatUtil from '../maths/QuatUtil';
//#endregion

class SpringRot implements ISpringType{

    setRestPose( chain: SpringChain, pose: Pose ): void{
        let si   : SpringItem;
        let b    : Bone;
        let tail = vec3.create();

        for( si of chain.items ){
            b = pose.bones[ si.index ];     // Get Pose Bone

            vec3.set( tail, 0, b.len, 0 );  // Tail's LocalSpace Position.
            b.world.transformVec3( tail );  // Move Tail to WorldSpace

            si.spring.reset( tail );        // Set Spring to Start at this Position.
            si.bind.copy( b.local );        // Copy LS Transform as this will be the Actual Rest Pose of the bone.
        }
    }

    updatePose( chain: SpringChain, pose: Pose, dt: number ): void{
        let si      : SpringItem;
        let b       : Bone;
        let tail    = vec3.create();
        let pTran   = new Transform();
        let cTran   = new Transform();
        let va      = vec3.create();
        let vb      = vec3.create();
        let rot     = quat.create();

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
            // Compute the Tail's Position as if this bone had never rotated
            // The idea is to find its resting location which will be our spring target.
            
            cTran.fromMul( pTran, si.bind );    // Compute the Bone's Resting WS Transform
            vec3.set( tail, 0, b.len, 0 );      // Tail's LocalSpace Position.
            cTran.transformVec3( tail );        // Move Tail to WorldSpace

            si.spring
                .setTarget( tail )              // Set new Target
                .update( dt );                  // Update Spring with new Target & DeltaTime

            //----------------------------------------------
            // Compute the rotation based on two direction, one is our bone's position toward
            // its resting tail position with the other toward our spring tail position.

            /* OITO
            va.fromSub( tail, cTran.pos ).norm();           // Resting Ray
            vb.fromSub( si.spring.val, cTran.pos ).norm();  // Spring Ray

            rot .fromUnitVecs( va, vb )                     // Resting to Spring
                .dotNegate( cTran.rot )                     // Prevent any Artificates
                .mul( cTran.rot )                           // Apply spring rotation to our resting rotation
                .pmulInvert( pTran.rot );                   // Use parent to convert to Local Space
            */

            vec3.sub( va, tail, cTran.pos );            // Resting Ray
            vec3.normalize( va, va );

            vec3.sub( vb, si.spring.val, cTran.pos );   // Spring Ray
            vec3.normalize( vb, vb );

            quat.rotationTo( rot, va, vb );             // Resting to Spring
            QuatUtil.dotNegate( rot, rot, cTran.rot );  // Prevent any Artifacts
            quat.mul( rot, rot, cTran.rot );            // Apply spring rotation to our resting rotation
            QuatUtil.pmulInvert( rot, rot, pTran.rot ); // Use parent to convert to Local Space
            // TODO : Normalize as a possible fix if artifacts creeping up

            //----------------------------------------------
            quat.copy( b.local.rot, rot )               // Save Result back to pose bone
            pTran.mul( rot, si.bind.pos, si.bind.scl ); // Using new Rotation, Move Parent WS Transform for the next item
        }
    }
}

export default SpringRot;