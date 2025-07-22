// #region IMPORTS
import type Bone                from '../../armature/Bone';
import type Pose                from '../../armature/Pose';
import type IKSplineTarget      from '../IKSplineTarget';
import type { IKChain, IKLink } from '../IKChain';
import type { TSolverOptions }  from '../consts';
import type SplineSample        from '../../maths/curves/util/SplineSample';
import type { Spline }          from '../../maths/curves/Spline';

import Vec3             from '../../maths/Vec3';
import Quat             from '../../maths/Quat';
import Transform        from '../../maths/Transform';
import Rmf              from '../../maths/curves/util/Rmf';
import SplineSampler    from '../../maths/curves/util/SplineSampler';

// #endregion

export default function splineSolver( tar: IKSplineTarget, chain: IKChain, pose: Pose, opts: TSolverOptions = {} ): [SplineSampler, Array<SplineSample>]{
    // if( tar.dist >= chain.len ) console.log( 'Target is out of reach')
    const Debug = globalThis.Debug;
    const vv = new Vec3();

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Sample Spline
    const sampler = new SplineSampler()
        .fromSpline( ( tar.spline as unknown as Spline ), chain.links.length * 2 );

    // -----------------------------
    // Transport the twist direction across samples
    const v = new Vec3();
    v.fromQuat( tar.rworld.rot, chain.links[0].axes.twist ); 
    
    Rmf.transportNormal( sampler.items, v );


    // for( const x of sampler.items ){
    //     Debug.pnt.add( x.pos, 0xff00ff, 2 );

    //     vv.fromScale( x.tangent, 0.4 ).add( x.pos );
    //     Debug.ln.add( x.pos, vv, 0xffffff );

    //     vv.fromScale( x.normal, 0.4 ).add( x.pos );
    //     Debug.ln.add( x.pos, vv, 0xff00ff );
    // }

    // -----------------------------
    // Apply additional twisting to samples if available
    if( tar.twistRadA !== 0 || tar.twistRadB !== 0 ){
        // Rmf.applyLinearTwist( sampler.items, tar.twistRadA, tar.twistRadB );
        Rmf.applySmoothTwist( sampler.items, tar.twistRadA, tar.twistRadB );
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Get sample for each link
    const points    = new Array();
    let travel      = 0;
    let overSample !: SplineSample;
    
    // -------------------------------
    // Create samples for each joint in the change
    for( const lnk of chain.links ){
        if( travel > sampler.arcLength ){

            // UseCase: Handle when curve is shorter then chain
            if( !overSample ){              
                // Clone last sample, set its position to the end
                // of the curve then adjust tangent & fix normal  
                const prev = points.at(-1);
                overSample = prev.clone();

                v.copy( overSample.tangent ); // Save old tangent

                // @ts-ignore ts(2532) :: at(-1) is ok
                overSample.pos.copy( sampler.items.at(-1).pos );
                overSample.tangent
                    .fromSub( overSample.pos, prev.pos )
                    .norm();

                // Swing normal in the same direction as tangent to limit orientation flipping
                const q = new Quat().fromSwing( v, overSample.tangent );
                overSample.normal.transformQuat( q );

                // Rmf.fixOrthogonal( overSample );
                points.push( overSample );

            }else{
                // More joints outside the curve, clone the overshoot
                // sample. Then shift its position by its tangent.
                // All joints after first overshoot will have the same
                // orientation.
                const next = overSample.clone();
                v.fromScale( overSample.tangent, lnk.len );
                next.pos.add( v );
                points.push( next );
            }
        }else{
            points.push( sampler.atDist( travel ) );
        }

        travel += lnk.len;
    }

    // for( const x of points ){
    //     Debug.pnt.add( x.pos, 0xff00ff, 2 );

    //     vv.fromScale( x.tangent, 0.4 ).add( x.pos );
    //     Debug.ln.add( x.pos, vv, 0xffffff );

    //     vv.fromScale( x.normal, 0.4 ).add( x.pos );
    //     Debug.ln.add( x.pos, vv, 0xff00ff );
    // }

    // -------------------------------
    // UseCase: When chain is shorter then spline
    if( travel <= sampler.arcLength ){
        if( opts.useLastLook ){
            // Project the world position of the last joint
            const al = chain.links.at( -3 ) as IKLink;
            const a  = points.at( -3 ) as SplineSample;
            const b  = points.at( -2 ) as SplineSample;
            
            b.pos.fromSub( b.pos, a.pos )
                .norm()
                .scale( al.len )
                .add( a.pos );

            // Last point should point to end of curve
            // This will make the last joint aim toward
            // the target pos after realigning all tangents
            const e = points.at( -1 );  // End Point
            // e.pos.copy( tar.endPos );
            e.pos.copy( tar.spline.targetPos );
        }
        
        // Extra, Apply a single iteration of FABRIK to add a bit of reach
        if( opts.useReach ){
            iterateForward( tar, chain, points );
            iterateBackward( chain, points );
        }
    }

    // -------------------------------
    // Do a pass to apply corrections to tangents
    // since lerping by distance creates discontinuity
    Rmf.realignTangentsFromPoints( points );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    applySamplesToPose( chain, pose, points );

    // const Debug = globalThis.Debug;
    // v.copy( points[0].pos );
    // for( const p of sampler.items ){
    //     Debug.ln.add( v, p.pos, 0xffa000 );
    //     v.copy( p.pos );
    // }
    // for( const p of points ){
    //     Debug.pnt.add( p.pos, 0xffa000, 1 );
    //     Debug.ln.add( p.pos, v.fromScaleThenAdd( 0.15, p.normal, p.pos), 0xffa000 );
    // }

    // Returning generated data to visual debugging
    return [ sampler, points ];
}

// #region FABRIK-LIKE

// Move points torward the target point
function iterateForward( tar: IKSplineTarget, chain: IKChain, pnts: Array<SplineSample> ){
    const v = new Vec3();
    pnts.at( -1 )?.pos.copy( tar.spline.targetPos );      // Move last point to target position

    for( let i = chain.links.length-1; i > 1; i-- ){
        v   .fromSub( pnts[i-1].pos, pnts[i].pos )  // Direction to parent point
            .norm()
            .scale( chain.links[ i-1 ].len )        // Resize to bone's length
            .add( pnts[i].pos )                     // Move away from child
            .copyTo( pnts[i-1].pos );               // Save result back as parent position
    }
}

// Move points toward the origin point
function iterateBackward( chain: IKChain, pnts: Array<SplineSample> ){
    const v = new Vec3();
    for( let i = 0; i < chain.links.length-1; i++ ){
        v   .fromSub( pnts[i+1].pos, pnts[i].pos )  // Direction to child point
            .norm()
            .scale( chain.links[ i ].len )          // Resize to bone's length
            .add( pnts[i].pos )                     // Move away from parent
            .copyTo( pnts[i+1].pos );               // Save result back as child position
    }
}

// #endregion

// #region HELPERS
function applySamplesToPose( chain: IKChain, pose: Pose, pnts: Array<SplineSample> ){
    const parent  = new Transform();
    const fromDir = new Vec3();
    const sRot    = new Quat();
    let lnk       : IKLink;
    let joint     : Bone;
    
    // const Debug = globalThis.Debug;
    // const v = new Vec3();
    
    for( let i=0; i < chain.links.length; i++ ){
        lnk   = chain.links[ i ];
        joint = pose.getBone( lnk.index ) as Bone;
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Joints unchanged ws transform
        pose.getWorldTransform( joint.pindex, parent );
        joint.world.fromMul( parent, lnk.bind );

        // Debug.pnt.add( joint.world.pos, 0xffffff, 1.6 );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SWING
        // Direction bone is pointing toward
        fromDir.fromQuat( joint.world.rot, lnk.axes.swing ).norm();

        // v.fromScale( fromDir, 1 ).add( joint.world.pos );
        // Debug.ln.add( joint.world.pos, v, 0xff00ff );

        // v.fromScale( pnts[i].tangent, 1 ).add( joint.world.pos );
        // Debug.ln.add( joint.world.pos, v, 0xffffff );
        
        // Direction toward target point
        sRot
            .fromSwing( fromDir, pnts[i].tangent )          // Rotation FROM > TO
            .mul( joint.world.rot )                         // Apply to WS Rotation of bone

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // TWIST + Finalize
        fromDir.fromQuat( sRot, lnk.axes.twist ).norm();    // Twist direction

        joint.local.rot
            .fromSwing( fromDir, pnts[i].normal ) // Create Twist
            .mul( sRot )                          // Apply Swing
            .pmulInvert( parent.rot )             // To Local Space
            .norm();                              // To unit quaternion
    }
}
// #endregion