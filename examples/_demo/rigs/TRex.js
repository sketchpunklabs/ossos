import CharacterRig, { Gltf2 }  from '../lib/CharacterRig.js';

import HipSolver                from '../../../src/ikrig/solvers/HipSolver';
import ZSolver                  from '../../../src/ikrig/solvers/ZSolver';
import SwingTwistSolver         from '../../../src/ikrig/solvers/SwingTwistSolver';
import SwingTwistEndsSolver     from '../../../src/ikrig/solvers/SwingTwistEndsSolver';
import LimbSolver               from '../../../src/ikrig/solvers/LimbSolver';
import EffectorScale            from '../../../src/ikrig/animation/additives/EffectorScale';

class TrexRig extends CharacterRig{
    constructor(){ super(); }

    async loadAsync( config=null ){
        const url  = '../_res/models/trex/';
        const gltf = await Gltf2.fetch( url + 'TRex.gltf' );
        this._parseArm( gltf, true )   // Create Armature
        
        // Last Tail bone is too small in relation to the rest which gives
        // bad results when doing spring effects to it.
        this.arm.getBone( 'tail.04' ).len   = 0.65;
        this.pose.get( 'tail.04' ).len      = 0.65;

        this._bipedRig()
        this._setupRig()
        this._ikAdditives();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~23
        // Legs are too Long for human animatons, Scale down the EffectorScale
        // value to make the leg lengths to match up with the floor.
        const add_leg_scl = new EffectorScale( 0.85 );
        const add_arm_scl = new EffectorScale( 0.85 );
        this.additives.add( 'legL', add_leg_scl );
        this.additives.add( 'legR', add_leg_scl );
        this.additives.add( 'armL', add_arm_scl );
        this.additives.add( 'armR', add_arm_scl );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.boneView ) this._boneView( config );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.mesh != false ){
            let base = 'cyan';
            if( config?.tex != false ) base = await this._texture( url + 'ch_Trex_BaseColor.jpg' );
            this._skinnedMesh( gltf, base, config );
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.springs != false ){
            this._boneSprings();   
            this.springs
                .addRotChain( 'braidr', ['tail.01','tail.02','tail.03','tail.04'], 1.5, 0.5 )
            ;
            this.springs.setRestPose( this.pose ); // Set the resting pose of the springs
        }

        return this;
    }

    _setupRig(){
        const r     = this.rig;
        const arm   = this.arm;
        const pose  = this.pose;
        
        const FWD   = [0,0,1];
        const UP    = [0,1,0];
        const DN    = [0,-1,0];
        const R     = [-1,0,0];
        const L     = [1,0,0];
        const BAK   = [0,0,-1];
        
        r.hip = r.add( arm, 'hip', ['hips'] );
        r.hip.bindAltDirections( pose, FWD, UP );
        r.hip.setSolver( new HipSolver().initData( pose, r.hip ) );

        r.spine = r.add( arm, 'spine', ['spine01', 'spine02', 'spine03'] );
        r.spine.bindAltDirections( pose, UP, FWD );
        r.spine.setSolver( new SwingTwistEndsSolver().initData( pose, r.spine ) );

        r.legL = r.add( arm, 'legL', ['thigh.L', 'shin.L', 'foot.L'] );
        r.legL.bindAltDirections( pose, DN, FWD );
        r.legL.setSolver( new ZSolver().initData( pose, r.legL ) );

        r.legR = r.add( arm, 'legR', ['thigh.R', 'shin.R', 'foot.R'] );
        r.legR.bindAltDirections( pose, DN, FWD );
        r.legR.setSolver( new ZSolver().initData( pose, r.legR ) );
        
        r.footL = r.add( arm, 'footL', ['toe.L'] );
        r.footL.bindAltDirections( pose, FWD, UP );
        r.footL.setSolver( new SwingTwistSolver().initData( pose, r.footL ) );

        r.footR = r.add( arm, 'footR', ['toe.R'] );
        r.footR.bindAltDirections( pose, FWD, UP );
        r.footR.setSolver( new SwingTwistSolver().initData( pose, r.footR ) );

        r.head = r.add( arm, 'head', ['head'] );
        r.head.bindAltDirections( pose, FWD, UP );
        r.head.setSolver( new SwingTwistSolver().initData( pose, r.head ) );

        r.armL = r.add( arm, 'armL', ['upperarm.L', 'forearm.L'] );
        r.armL.bindAltDirections( pose, L, BAK );
        r.armL.setSolver( new LimbSolver().initData( pose, r.armL ) );

        r.armR = r.add( arm, 'armR', ['upperarm.R', 'forearm.R'] );
        r.armR.bindAltDirections( pose, R, BAK );
        r.armR.setSolver( new LimbSolver().initData( pose, r.armR ) );

        r.bindPose( pose ); // Model's BindPose != TPose, so set TPose afterwards.
        
        return this;
    }
}

export default TrexRig;