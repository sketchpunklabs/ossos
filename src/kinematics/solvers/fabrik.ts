// #region IMPORTS
import type Pose                from '../../armature/Pose';
import type { IKChain, IKLink } from '../IKChain';
import type IKTarget            from '../IKTarget';

import Vec3, { ConstVec3 }   from '../../maths/Vec3';
import Quat              from '../../maths/Quat';
// #endregion

export default class Fabric{

    static solve( tar: IKTarget, chain: IKChain, pose: Pose ): void{

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Initial
        const epsilon  = 0.01;
        const rootPos  = new Vec3();
        chain.updateRootFromPose( pose );               // Get root world transform
        tar.useRootTransform( chain.links[0].world );   // Align Target data to root

        rootPos.copy( chain.links[0].world.pos );       // Save root position for later

        // Debug.pnt.add( rootPos, 0xffff00, 3 );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute all the points from world root & bind links
        const pnts      = this.initPointsFromBindpose( chain );
        const effector  = pnts[ chain.count ];

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Perform Main Solver Steps
        for( let i=0; i < 10; i++ ){
            this.iterateBackward( chain, tar, pnts );
                    
            pnts[0].copy( rootPos ); // Move root back to starting position
            this.iterateForward( chain, pnts ); 

            if( Vec3.dist( tar.pos, effector ) <= epsilon ){
                console.log( 'Done', i );
                break;
            }

            // break;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.updatePoseFromBind( chain, pnts, pose );
    }

    // #region ITERATIONS

    static iterateBackward( chain: IKChain, target: IKTarget, pnts: Array<Vec3> ): void {
        const dir = new Vec3();
        let pTar  = pnts[ chain.count ].copy( target.pos );
        let lnk: IKLink;
    
        for( let i=chain.count-1; i >=0; i-- ){
            lnk = chain.links[ i ]; 
            dir .fromSub( pnts[i], pTar ) // Direction from Target Pos to Bone pos
                .norm()
                .scale( lnk.len );         // Resize to bone's length
            
            pnts[i].fromAdd( dir, pTar ); // Add to target pos for bone's position
            pTar = pnts[i];               // Target Pos for next iteration
        }
    }
    
    static iterateForward( chain: IKChain, pnts: Array<Vec3> ): void {
        // Move all the points back toward root
        const dir = new Vec3();
        let lnk : IKLink;
        let p   : Vec3;
        let c   : Vec3;
    
        for( let i = 1; i <= chain.count; i++ ){
            lnk  = chain.links[ i-1 ];
            c    = pnts[ i ];
            p    = pnts[ i - 1 ];
    
            dir .fromSub( c, p )    // Direction
                .norm()
                .scale( lnk.len );  // Scale to bone length

            c.fromAdd( dir, p );    // Move away from prev pos
        }
    }

    // #endregion

    // #region HELPERS
    static initPointsFromBindpose( chain: IKChain ): Array<Vec3>{
        const pnts = new Array( chain.count + 1 );
        pnts[0] = chain.links[ 0 ].world.pos.clone();   // First link should already been updated
        
        // Compute WS position of each bone using bind pose
        let lnk !: IKLink;
        for( let i=1; i < chain.count; i++ ){
            lnk = chain.links[ i ]
            lnk.world.fromMul( chain.links[ i-1 ].world, lnk.bind );
            pnts[ i ] = lnk.world.pos.clone();
        }

        pnts[chain.count] = new Vec3()
            .fromQuat( lnk.world.rot, Vec3.UP )
            .scale( lnk.len )
            .add( lnk.world.pos );

        return pnts;
    }

    static updatePoseFromBind( chain: IKChain, pnts: Array<Vec3>, pose: Pose ): void{
        const swing = new Quat();    
        const aDir  = new Vec3();
        const bDir  = new Vec3();

        let lnk: IKLink;
        for( let i=0; i < chain.count; i++ ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Compute Worldspace Bind Transform
            lnk = chain.links[ i ];
            lnk.world.fromMul(
                ( i===0 )? chain.pworld : chain.links[ i-1 ].world,
                lnk.bind,
            );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Compute bone rotation
            aDir.fromQuat( lnk.world.rot, Vec3.UP );            // Direction from worldspace bind
            bDir.fromSub( pnts[i+1], lnk.world.pos ).norm();    // Direction from IK Position
            
            swing.fromSwing( aDir, bDir );                      // Swing rotation
            lnk.world.rot.pmul( swing );                        // Apply swing to world bind
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Convert all WorldSpace Rot to LocalSpace
        // Then save results back to pose
        chain.setLocalRotPose( pose );
    }

    static applyTwistLerp( chain: IKChain, startDir: ConstVec3, endDir: ConstVec3 ): void{
        const aim   = new Vec3();
        const twist = new Vec3();
        const pole  = new Vec3();
        const rot   = new Quat();
        const dir   = new Vec3();
        
        let lnk : IKLink;
        let t   : number;
    
        for( let i=0; i < chain.count; i++ ){
            t   = i / ( chain.count - 1 );
            lnk = chain.links[ i ];
    
            dir.fromLerp( startDir, endDir, t );            // Lerp Direction
            // dir.fromSlerp( aDir, bDir, t );
    
            // pole.fromQuat( lnk.world.rot, Vec3.FORWARD );   // Natural Twist Direction
            // aim.fromQuat( lnk.world.rot, Vec3.UP );         // Bone Pointing Direction

            pole.fromQuat( lnk.world.rot, lnk.axes.twist ); // Natural Twist Direction
            aim.fromQuat(  lnk.world.rot, lnk.axes.swing ); // Bone Pointing Direction

            twist.fromCross( aim, dir );                    // Orth Dir
            dir.fromCross( twist, aim ).norm();             // Realign dir to be Orth, new Twist Dir
    
            // Skip rotation if the two vectors are about equal.
            if( Math.abs( Vec3.dot( pole, dir ) ) >= 0.999 ) continue;
    
            rot.fromSwing( pole, dir );                     // Create twist rotation
            lnk.world.rot.pmul( rot );                      // Twist bone to align to lerped direction    
        }
    }

    // #endregion
}



// #region Angle Constraint 

/*
function iterateBackwardCAngle( chain, target, pnts ){
    const minRad = 160 * Math.PI / 180;
    
    const dir   = new Vec3();
    const prev  = new Vec3();
    const start = chain.count - 1;
    let pTar    = pnts[ chain.count ].copy( target.pos );
    let lnk;

    // const t = new Vec3();

    for( let i=start; i >=0; i-- ){
        lnk = chain.links[ i ]; 
        dir .fromSub( pnts[i], pTar ) // Direction from Target Pos to Bone pos
            .norm();
        
        if( i !== start ) angleConstraint( prev, dir, minRad );

        prev.copy( dir ).negate();    // flip direction for angle testing the next dir
        
        dir .scale( lnk.len )         // Resize to bone's length
            .add( pTar )              // Add to target pos for bone's position
            .copyTo( pnts[i] );       // Save results
        
        pTar = pnts[i];               // Target Pos for next iteration
        // Debug.pnt.add( pTar, 0xff00ff, 3 );
    }
}

function angleConstraint( fromDir, toDir, minRad ){
    const rad = Vec3.angle( fromDir, toDir );
    if( rad >= minRad ) return;

    const newRad = minRad - rad;
    const axis   = Vec3.cross( fromDir, toDir ).norm();
    const q      = new Quat().fromAxisAngle( axis, newRad );
    toDir.transformQuat( q );
}

function applyTwist( chain ){
    const aim   = new Vec3();
    const twist = new Vec3();
    const pole  = new Vec3();
    const rot   = new Quat();

    const aDir = new Vec3([-0.5,-0.1,1]).norm();
    // const bDir = new Vec3([-0.314726556119965, -0.8958677034122826, -0.31363713564510953]).norm();
    const bDir = new Vec3([0,-1,0]).norm();
    const dir  = new Vec3();
    let t;

    for( let i=0; i < chain.count; i++ ){
        t = i / ( chain.count - 1 );
        let lnk = chain.links[ i ];

        dir.fromLerp( aDir, bDir, t );                  // Lerp Direction
        // dir.fromSlerp( aDir, bDir, t );

        pole.fromQuat( lnk.world.rot, Vec3.FORWARD );   // Natural Twist Direction
        aim.fromQuat( lnk.world.rot, Vec3.UP );         // Bone Pointing Direction
        twist.fromCross( aim, dir );                    // Orth Dir
        dir.fromCross( twist, aim ).norm();             // Realign dir to be Orth, new Twist Dir

        // Skip rotation if the two vectors are about equal.
        if( Math.abs( Vec3.dot( pole, dir ) ) >= 0.999 ) continue;

        rot.fromSwing( pole, dir );                     // Create twist rotation
        lnk.world.rot.pmul( rot );                      // Twist bone to align to lerped direction

        // Debug.ln.add( lnk.world.pos, new Vec3().fromAdd( aim, lnk.world.pos ), 0xffffff );
        Debug.ln.add( lnk.world.pos, new Vec3().fromScale( dir, 0.4 ).add( lnk.world.pos ), 0xffff00 );
        // Debug.ln.add( lnk.world.pos, new Vec3().fromScale( pole, 0.4 ).add( lnk.world.pos ), 0xff0000 );

    }
}

*/

// #endregion