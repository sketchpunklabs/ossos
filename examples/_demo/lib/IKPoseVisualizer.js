//#region IMPORTS
import { vec3 }         from 'gl-matrix'
import Transform        from '../../../src/maths/Transform';
//#endregion IMPORT

const V0 = vec3.create();
const V1 = vec3.create();
const T0 = new Transform();

let debug = null;

class IKPoseVisualizer{
    static show( debug, rig, pose, ikpose ){
        debug.pnt.reset();
        debug.ln.reset();

        this.limb( debug, rig.legL, pose, ikpose.legL );
        this.limb( debug, rig.legR, pose, ikpose.legR );
        this.limb( debug, rig.armR, pose, ikpose.armR );
        this.limb( debug, rig.armL, pose, ikpose.armL );

        this.swingTwist( debug, rig.footL, pose, ikpose.footL );
        this.swingTwist( debug, rig.footR, pose, ikpose.footR );
        this.swingTwist( debug, rig.handR, pose, ikpose.handR );
        this.swingTwist( debug, rig.handL, pose, ikpose.handL );
        this.swingTwist( debug, rig.head, pose, ikpose.head );

        this.swingTwistEnds( debug, rig.spine, pose, ikpose.spine );     
        
        this.hip( debug, rig.hip, pose, ikpose.hip );
    }

    static limb( debug, chain, pose, ik ){
        const p0 = chain.getStartPosition( pose );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Effector
        vec3.scaleAndAdd( V0, p0, ik.effectorDir, ik.lenScale * chain.length );

        debug.pnt.add( p0, 0x00ff00, 1.3 );
        debug.pnt.add( V0, 0x00ffff, 1.3 );
        debug.ln.add( p0, V0, 0x00ff00, 0x00ffff, true );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Pole
        vec3.scaleAndAdd( V0, p0, ik.poleDir, 0.2 );
        debug.ln.add( p0, V0, 0x00ff00 );
    }

    static swingTwist( debug, chain, pose, ik ){
        const p0 = chain.getStartPosition( pose );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Effector
        vec3.scaleAndAdd( V0, p0, ik.effectorDir, 0.2 );
        debug.ln.add( p0, V0, 0x00ffff );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Pole
        vec3.scaleAndAdd( V0, p0, ik.poleDir, 0.2 );
        debug.ln.add( p0, V0, 0x00ff00 );
    }

    static swingTwistEnds( debug, chain, pose, ik ){
        const p0 = chain.getStartPosition( pose );
        const p1 = chain.getLastPosition( pose );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        vec3.scaleAndAdd( V0, p0, ik.startEffectorDir, 0.12 );  // Effector
        debug.ln.add( p0, V0, 0x00ffff );

        vec3.scaleAndAdd( V0, p0, ik.startPoleDir, 0.12 );      // Pole
        debug.ln.add( p0, V0, 0x00ff00 );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        vec3.scaleAndAdd( V0, p1, ik.endEffectorDir, 0.12 ); // Effector
        debug.ln.add( p1, V0, 0x00ffff );

        vec3.scaleAndAdd( V0, p1, ik.endPoleDir, 0.12 );      // Pole
        debug.ln.add( p1, V0, 0x00ff00 );
    }

    static hip( debug, chain, pose, ik ){
        const lnk   = chain.first();
        const b     = pose.bones[ lnk.idx ];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Position Offset
        if( b.pidx == -1 )   T0.fromMul( pose.offset, lnk.bind );                     // Use Offset if there is no parent
        else                 pose.getWorldTransform( lnk.pidx, T0 ).mul( lnk.bind );  // Compute Parent's WorldSpace transform, then add local bind pose to it.

        vec3.scaleAndAdd( V0, T0.pos, ik.pos, ik.bindHeight / T0.pos[ 1 ]  );

        debug.pnt.add( T0.pos, 0x00ff00, 0.5 );           // Bind Position
        debug.pnt.add( b.world.pos, 0x00ffff, 0.5 );      // Pose Position
        debug.pnt.add( V0, 0x000000, 0.3 );               // Scaled Offset plus Bind Position
        debug.ln.add( T0.pos, V0, 0x00ff00, 0x000000 );   // Original to Animated Position

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // IK Direction
        vec3.scaleAndAdd( V1, V0, ik.effectorDir, 0.1 );
        debug.ln.add( V0, V1, 0x00ffff );

        vec3.scaleAndAdd( V1, V0, ik.poleDir, 0.1 );
        debug.ln.add( V0, V1, 0x00ff00 );
    }

}

export default IKPoseVisualizer;