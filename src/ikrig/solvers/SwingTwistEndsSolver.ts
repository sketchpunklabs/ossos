//#region IMPORTS
import type Bone                    from '../../armature/Bone';
import type Pose                    from '../../armature/Pose';
import type { IKChain, IKLink }     from '../rigs/IKChain';
import type { ISolver }             from './support/ISolver';
import type { IKData }              from '..';

import { vec3, quat }               from 'gl-matrix';
import QuatUtil                     from '../../maths/QuatUtil';
//#endregion

class SwingTwistEndsSolver implements ISolver{
    //#region TARGETTING DATA
    startEffectorDir : vec3 = [ 0, 0, 0 ];
    startPoleDir     : vec3 = [ 0, 0, 0 ];
    endEffectorDir   : vec3 = [ 0, 0, 0 ];
    endPoleDir       : vec3 = [ 0, 0, 0 ];
    //#endregion

    initData( pose?: Pose, chain?: IKChain ): this{
        if( pose && chain ){
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            const pole  : vec3 = [0,0,0]; // = new Vec3();
            const eff   : vec3 = [0,0,0]; // = new Vec3();
            let rot     : quat;
            let lnk     : IKLink;

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // First Direction
            lnk = chain.first();
            rot = pose.bones[ lnk.idx ].world.rot;

            vec3.transformQuat( eff, lnk.effectorDir, rot );
            vec3.transformQuat( pole, lnk.poleDir, rot );

            this.setStartDir( eff, pole );
            
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Second Direction
            lnk = chain.last();
            rot = pose.bones[ lnk.idx ].world.rot;

            vec3.transformQuat( eff, lnk.effectorDir, rot );
            vec3.transformQuat( pole, lnk.poleDir, rot );

            this.setEndDir( eff, pole );
        }
        return this;
    }

    //#region SETTING TARGET DATA
    setStartDir( eff: vec3, pole: vec3 ): this{
        this.startEffectorDir[ 0 ]  = eff[ 0 ];
        this.startEffectorDir[ 1 ]  = eff[ 1 ];
        this.startEffectorDir[ 2 ]  = eff[ 2 ];
        this.startPoleDir[ 0 ]      = pole[ 0 ];
        this.startPoleDir[ 1 ]      = pole[ 1 ];
        this.startPoleDir[ 2 ]      = pole[ 2 ];
        return this;
    }

    setEndDir( eff: vec3, pole: vec3 ): this{
        this.endEffectorDir[ 0 ]  = eff[ 0 ];
        this.endEffectorDir[ 1 ]  = eff[ 1 ];
        this.endEffectorDir[ 2 ]  = eff[ 2 ];
        this.endPoleDir[ 0 ]      = pole[ 0 ];
        this.endPoleDir[ 1 ]      = pole[ 1 ];
        this.endPoleDir[ 2 ]      = pole[ 2 ];
        return this;
    }
    //#endregion

    resolve( chain: IKChain, pose: Pose, debug?:any ): void{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const iEnd          = chain.count - 1;
        const pRot   : quat = [ 0, 0, 0, 1 ];
        const cRot   : quat = [ 0, 0, 0, 1 ];
        const ikEffe : vec3 = [ 0, 0, 0 ];
        const ikPole : vec3 = [ 0, 0, 0 ];
        const dir    : vec3 = [ 0, 0, 0 ];
        const rot    : quat = [ 0, 0, 0, 1 ];
        const tmp    : quat = [ 0, 0, 0, 1 ];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let lnk : IKLink   = chain.first();
        let t   : number;

        // Get Starting Parent WS Rotation
        if( lnk.pidx != -1 )    pose.getWorldRotation( lnk.pidx, pRot );
        else                    quat.copy( pRot, pose.offset.rot ); //pRot.copy( pose.offset.rot );

        /* DEBUG
        const v         = new Vec3();
        const pTran     = new Transform();
        const cTran     = new Transform();
        pose.getWorldTransform( lnk.pidx, pTran );
        */

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( let i=0; i <= iEnd; i++ ){
            //-----------------------
            // PREPARE
            t   = i / iEnd;         // Lerp Value
            lnk = chain.links[ i ]; // Which Bone to act on

            vec3.lerp( ikEffe, this.startEffectorDir, this.endEffectorDir, t ); // Get Current Effector Direction
            vec3.lerp( ikPole, this.startPoleDir, this.endPoleDir, t );         // Get Current Pole Direction

            //-----------------------
            // SWING
            quat.mul( cRot, pRot, lnk.bind.rot );               // Get bone in WS that has yet to have any rotation applied
            vec3.transformQuat( dir, lnk.effectorDir, cRot );   // What is the WS Effector Direction
            quat.rotationTo( rot, dir, ikEffe );                // Create our Swing Rotation
            quat.mul( cRot, rot, cRot );                        // Then Apply to our Bone, so its now swong to match the ik effector dir

            /* DEBUG
            cTran.fromMul( pTran, lnk.bind );
            debug.pnt.add( cTran.pos, 0x00ff00, 1 );
            debug.ln.add( cTran.pos, v.fromScale( dir, 0.1 ).add( cTran.pos ), 0x00ff00 );
            */

            //-----------------------
            // TWIST
            vec3.transformQuat( dir, lnk.poleDir, cRot );   // Get our Current Pole Direction from Our Effector Rotation
            quat.rotationTo( rot, dir, ikPole );            // Create our twist rotation
            quat.mul( cRot, rot, cRot );                    // Apply Twist so now it matches our IK Pole direction
            quat.copy( tmp, cRot );                         // Save as the next Parent Rotation

            /* DEBUG
            debug.ln.add( cTran.pos, v.fromScale( dir, 0.2 ).add( cTran.pos ), 0x00ff00 );
            debug.ln.add( cTran.pos, v.fromScale( ikPole, 0.2 ).add( cTran.pos ), 0xff0000 );
            */

            //-----------------------
            QuatUtil.pmulInvert( cRot, cRot, pRot );    // To Local Space
            pose.setLocalRot( lnk.idx, cRot );          // Save back to pose
            if( i != iEnd ) quat.copy( pRot, tmp );     // Set WS Rotation for Next Bone.

            /* DEBUG
            pTran.mul( cRot, lnk.bind.pos, lnk.bind.scl );
            */
        }
    }

    ikDataFromPose( chain: IKChain, pose: Pose, out: IKData.DirEnds ): void{
        const dir   : vec3 = [0,0,0];
        let lnk     : IKLink;
        let b       : Bone;
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // First Bone
        lnk = chain.first();
        b   = pose.bones[ lnk.idx ];

        vec3.transformQuat( dir, lnk.effectorDir, b.world.rot );
        vec3.normalize( out.startEffectorDir, dir );

        vec3.transformQuat( dir, lnk.poleDir, b.world.rot );
        vec3.normalize( out.startPoleDir, dir );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Last Bone
        lnk = chain.last();
        b   = pose.bones[ lnk.idx ];

        vec3.transformQuat( dir, lnk.effectorDir, b.world.rot );
        vec3.normalize( out.endEffectorDir, dir );

        vec3.transformQuat( dir, lnk.poleDir, b.world.rot );
        vec3.normalize( out.endPoleDir, dir );
    }

}

export default SwingTwistEndsSolver;