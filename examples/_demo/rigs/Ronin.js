import CharacterRig, { Gltf2 } from '../lib/CharacterRig.js';

import HipSolver            from '../../../src/ikrig/solvers/HipSolver';
import ZSolver              from '../../../src/ikrig/solvers/ZSolver';
import SwingTwistSolver     from '../../../src/ikrig/solvers/SwingTwistSolver';
import SwingTwistEndsSolver from '../../../src/ikrig/solvers/SwingTwistEndsSolver';
import LimbSolver           from '../../../src/ikrig/solvers/LimbSolver';

import EffectorScale        from '../../../src/ikrig/animation/additives/EffectorScale';

class RoninRig extends CharacterRig{
    constructor(){ super(); }

    async loadAsync( config=null ){
        const url  = '../_res/models/ronin/';
        const gltf = await Gltf2.fetch( url + 'ronin.gltf' );
        this._parseArm( gltf, false );   // Create Armature
        this._bipedRig();
        this._setupRig();
        this._ikAdditives();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~23
        // Legs are too Long for human animatons, Scale down the EffectorScale
        // value to make the leg lengths to match up with the floor.
        const add_leg_scl = new EffectorScale( 0.92 );
        this.additives.add( 'legL', add_leg_scl );
        this.additives.add( 'legR', add_leg_scl );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.boneView ) this._boneView( config, 0.1, 1.5 );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.mesh != false ){
            let base = 'cyan';
            if( config?.tex != false ) base = await this._texture( url + 'WP_albedo.jpg' );
            this._skinnedMesh( gltf, base, config );
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
        
        r.hip = r.add( arm, 'hip', ['def_c_hip'] );
        r.hip.bindAltDirections( pose, FWD, UP );
        r.hip.setSolver( new HipSolver().initData( pose, r.hip ) );

        r.spine = r.add( arm, 'spine', ['def_c_spineA', 'def_c_spineB', 'def_c_spineC'] );
        r.spine.bindAltDirections( pose, UP, FWD );
        r.spine.setSolver( new SwingTwistEndsSolver().initData( pose, r.spine ) );

        r.legL = r.add( arm, 'legL', ['def_l_thigh', 'def_l_thighLow', 'def_l_knee'] );
        r.legL.bindAltDirections( pose, DN, FWD );
        r.legL.setSolver( new ZSolver().initData( pose, r.legL ) );

        r.legR = r.add( arm, 'legR', ['def_r_thigh', 'def_r_thighLow', 'def_r_knee'] );
        r.legR.bindAltDirections( pose, DN, FWD );
        r.legR.setSolver( new ZSolver().initData( pose, r.legR ) );
        
        r.footL = r.add( arm, 'footL', ['def_l_ankle'] );
        r.footL.bindAltDirections( pose, FWD, UP );
        r.footL.setSolver( new SwingTwistSolver().initData( pose, r.footL ) );

        r.footR = r.add( arm, 'footR', ['def_r_ankle'] );
        r.footR.bindAltDirections( pose, FWD, UP );
        r.footR.setSolver( new SwingTwistSolver().initData( pose, r.footR ) );

        r.armL = r.add( arm, 'armL', ['def_l_shoulder', 'def_l_elbow'] );
        r.armL.bindAltDirections( pose, L, BAK );
        r.armL.setSolver( new LimbSolver().initData( pose, r.armL ) );

        r.armR = r.add( arm, 'armR', ['def_r_shoulder', 'def_r_elbow'] );
        r.armR.bindAltDirections( pose, R, BAK );
        r.armR.setSolver( new LimbSolver().initData( pose, r.armR ) );

        r.handL = r.add( arm, 'handL', ['def_l_wrist'] );
        r.handL.bindAltDirections( pose, L, BAK );
        r.handL.setSolver( new SwingTwistSolver().initData( pose, r.handL ) );

        r.handR = r.add( arm, 'handR', ['def_r_wrist'] );
        r.handR.bindAltDirections( pose, R, BAK );
        r.handR.setSolver( new SwingTwistSolver().initData( pose, r.handR ) );

        return this;
       
    }
}

export default RoninRig;