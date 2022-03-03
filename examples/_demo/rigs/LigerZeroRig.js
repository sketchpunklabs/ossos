import CharacterRig, { Gltf2 }  from '../lib/CharacterRig.js';

import QuadrupedRig             from '../../../src/ikrig/rigs/QuadrupedRig';
import HipSolver                from '../../../src/ikrig/solvers/HipSolver';
import ZSolver                  from '../../../src/ikrig/solvers/ZSolver';
import SwingTwistSolver         from '../../../src/ikrig/solvers/SwingTwistSolver';
import SwingTwistEndsSolver     from '../../../src/ikrig/solvers/SwingTwistEndsSolver';
import LimbSolver               from '../../../src/ikrig/solvers/LimbSolver';
import EffectorScale            from '../../../src/ikrig/animation/additives/EffectorScale';

class LigerZeroRig extends CharacterRig{
    constructor(){ super(); }

    async loadAsync( config=null ){
        const url  = '../_res/models/ligerzero/';
        const gltf = await Gltf2.fetch( url + 'ligerZero.gltf' );

        this._parseArm( gltf, true )   // Create Armature
        this._setupRig();
        this._ikAdditives();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~23
        // Legs are too Long for human animatons, Scale down the EffectorScale
        // value to make the leg lengths to match up with the floor.

        this.ikPose.legL2 = this.ikPose.legL.clone();
        this.ikPose.legR2 = this.ikPose.legR.clone();

        const add_leg_scl = new EffectorScale( 0.85 );
        this.additives.add( 'legL', add_leg_scl );
        this.additives.add( 'legR', add_leg_scl );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.springs != false ){
            this._boneSprings();   
            this.springs
                .addRotChain( 'tail', ['tail01', 'tail02', 'tail03', 'tail04', 'tail05'], 1.5, 0.8 )
                .addRotChain( 'bl', ['booster_l'], 3.0, 0.2 )
                .addRotChain( 'br', ['booster_r'], 3.0, 0.2 )
            ;
            this.springs.setRestPose( this.pose ); // Set the resting pose of the springs
        }
                /*

        let spr = App.ecs.add_com( this.entity.id, "BoneSpring" );
        spr.add_rot( "tail", [ "tail01", "tail02", "tail03", "tail04", "tail05" ], 1.5, 0.8 );
        spr.add_rot( "booster_l", [ "booster_l" ], 4.0, 0.3 );
        spr.add_rot( "booster_r", [ "booster_r" ], 4.0, 0.3 );


      
        */

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.mesh != false ){
            let base = 'cyan';
            if( config?.tex != false ) base = await this._texture( url + 'body_d.jpg' );
            this._skinnedMesh( gltf, base, config );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.boneView ) this._boneView( config );

        return this;
    }

    // #region CUSTOM SETUPS / LOADERS

    _setupRig(){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // QuadrupedRig is a prototype, so no auto rigging
        const r     = this.rig = new QuadrupedRig();
        const arm   = this.arm;
        const pose  = this.pose;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Chains
        r.hip       = r.add( arm, 'hip',      ['hips'] );
        r.tail      = r.add( arm, 'tail',     ['tail01', 'tail02', 'tail03', 'tail04', 'tail05'] );
        r.spine     = r.add( arm, 'spine',    ['spine01', 'spine02'] );
        r.head      = r.add( arm, 'head',     ['head'] );

        r.hindLegL  = r.add( arm, 'hindLegL', ['thigh_l', 'shin_l', 'meta_l'] );
        r.hindLegR  = r.add( arm, 'hindLegR', ['thigh_r', 'shin_r', 'meta_r'] );
        r.foreLegL  = r.add( arm, 'foreLegL', ['upperarm_l', 'forearm_l'] );
        r.foreLegR  = r.add( arm, 'foreLegR', ['upperarm_r', 'forearm_r'] );

        r.tarsalL   = r.add( arm, 'tarsalL',  ['foot_l'] );
        r.tarsalR   = r.add( arm, 'tarsalR',  ['foot_r'] );
        r.carpalL   = r.add( arm, 'carpalL',  ['hand_l'] );
        r.carpalR   = r.add( arm, 'carpalR',  ['hand_r'] );

        r.bindPose( pose );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Set Solvers
        r.hip.setSolver( new HipSolver().initData( pose, r.hip ) );
        r.spine.setSolver( new SwingTwistEndsSolver().initData( pose, r.spine ) );
        r.head.setSolver( new SwingTwistSolver().initData( pose, r.footR ) );

        r.hindLegL.setSolver( new ZSolver().initData( pose, r.hindLegL ) );
        r.hindLegR.setSolver( new ZSolver().initData( pose, r.hindLegR ) );
        r.foreLegL.setSolver( new LimbSolver().initData( pose, r.foreLegL ).invertBend() );
        r.foreLegR.setSolver( new LimbSolver().initData( pose, r.foreLegR ).invertBend() );

        r.tarsalL.setSolver( new SwingTwistSolver().initData( pose, r.tarsalL ) );
        r.tarsalR.setSolver( new SwingTwistSolver().initData( pose, r.tarsalR ) );
        r.carpalL.setSolver( new SwingTwistSolver().initData( pose, r.carpalL ) );
        r.carpalR.setSolver( new SwingTwistSolver().initData( pose, r.carpalR ) );


        return this;
    }

    // #endregion

    // #region OVERRIDES
    
    // CharacterRig.applyIKPose
    applyIKPose( ikPose, dt ){
        // Quadruped don't have their own IKPose object
        // Use a method on the rig that will translate the 
        // Biped IK Pose into something that would kinda work
        // for the quadruped

        if( this.ikPose && this.additives ){
            this.ikPose.copy( ikPose );
            this.ikPose.legL2.copy( ikPose.legL );
            this.ikPose.legR2.copy( ikPose.legR );

            this.additives.apply( this.ikPose );

            this.rig.applyBipedIKPose( this.ikPose );
        }else{
            this.rig.applyBipedIKPose( ikPose );
        }
        
        this.rig.resolveToPose( this.pose );        // Execute Solvers & Store Local Space results to Pose
        this.pose.updateWorld();                    // Update the pose's WorldSpace transform
        this.update( dt );
    }

    // #endregion
}

export default LigerZeroRig;