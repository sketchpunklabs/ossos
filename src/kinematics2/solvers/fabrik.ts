// #region IMPORTS
import type { IKChain, IKLink } from '../IKChain';
import type Pose        from '../../armature/Pose';
import type Bone        from '../../armature/Bone';
import type IKTarget    from '../IKTarget';

import Vec3             from '../../maths/Vec3';
import Transform        from '../../maths/Transform';
// #endregion


// Move points torward the target point
export function iterateForward( tar: IKTarget, chain: IKChain, pnts: Array<Vec3> ){
    const v = new Vec3();
    pnts.at( -1 )?.copy( tar.endPos );          // Move last point to target position

    for( let i = chain.links.length-1; i > 1; i-- ){
        v   .fromSub( pnts[i-1], pnts[i] )      // Direction to parent point
            .norm()
            .scale( chain.links[ i-1 ].len )    // Resize to bone's length
            .add( pnts[i] )                     // Move away from child
            .copyTo( pnts[i-1] );               // Save result back as parent position
    }
}

// Move points toward the origin point
export function iterateBackward( chain: IKChain, pnts: Array<Vec3> ){
    const v = new Vec3();
    for( let i = 0; i < chain.links.length-1; i++ ){
        v   .fromSub( pnts[i+1], pnts[i] )    // Direction to child point
            .norm()
            .scale( chain.links[ i ].len )    // Resize to bone's length
            .add( pnts[i] )                   // Move away from parent
            .copyTo( pnts[i+1] );             // Save result back as child position
    }
}

// Turn point data into rotations & apply to bones
export function applyPointsToPose( chain: IKChain, pose: Pose, pnts: Array<Vec3> ){
    const fromDir = new Vec3();
    const toDir   = new Vec3();
    const parent  = new Transform();
    let lnk  : IKLink;
    let bone : Bone;

    for( let i=0; i < chain.links.length-1; i++ ){
        lnk  = chain.links[ i ];
        bone = pose.getBone( lnk.index ) as Bone;
    
        // Compute the bone's tail current position in worldspace
        pose.getWorldTransform( bone.pindex, parent );
        bone.world.fromMul( parent, bone.local );

        // Direction bone is pointing toward
        fromDir.fromQuat( bone.world.rot, lnk.axes.swing ).norm();
        
        // Direction toward target point
        toDir.fromSub( pnts[i+1], bone.world.pos ).norm();

        bone.local.rot
            .fromSwing( fromDir, toDir )    // Rotation FROM > TO
            .mul( bone.world.rot )          // Apply to WS Rotation of bone
            .pmulInvert( parent.rot )       // To Local Space
            .norm();                        // Normalize
    }
}
