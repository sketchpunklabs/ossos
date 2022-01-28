//#region IMPORTS
import  { vec3 }                    from 'gl-matrix';
import { BipedIKPose } from '..';
import type Pose                        from '../../armature/Pose';
//import type Armature                    from '../../armature/Armature';
//import BoneMap, { BoneChain, BoneInfo } from '../../armature/BoneMap';
//import HipSolver                        from '../solvers/HipSolver';
//import LimbSolver                       from '../solvers/LimbSolver';
//import SwingTwistSolver                 from '../solvers/SwingTwistSolver';
//import SwingTwistEndsSolver             from '../solvers/SwingTwistEndsSolver';

import { IKChain }                      from './IKChain';
import IKRig                            from './IKRig';

//#endregion

// https://www.schoolofmotion.com/blog/how-to-rig-quadrupeds-animation

class QuadrupedRig extends IKRig{
    //#region MAIN
    hip         ?: IKChain = undefined;
    tail        ?: IKChain = undefined;
    spine       ?: IKChain = undefined;
    neck        ?: IKChain = undefined;
    head        ?: IKChain = undefined;

    hindLegL    ?: IKChain = undefined; // Rear Leg
    hindLegR    ?: IKChain = undefined;
    foreLegL    ?: IKChain = undefined; // Front Leg
    foreLegR    ?: IKChain = undefined;

    tarsalL     ?: IKChain = undefined; // Foot / Rear Paw
    tarsalR     ?: IKChain = undefined;
    carpalL     ?: IKChain = undefined; // Hand / Front Paw
    carpalR     ?: IKChain = undefined;

    constructor(){
        super();
    }
    //#endregion

    /** Setup Chain Data & Sets Alt Directions */
    bindPose( pose: Pose ): this{
        super.bindPose( pose );         // Copy the Local Space Transform of starting Pose to All Chained Bones
        this._setAltDirection( pose );  // Set Alt Direction from starting pose
        return this;
    }

    _setAltDirection( pose: any ): void{
        const FWD : vec3 = [0,0,1];
        const UP  : vec3 = [0,1,0];
        const DN  : vec3 = [0,-1,0];
        const R   : vec3 = [-1,0,0];
        const L   : vec3 = [1,0,0];
        const BAK : vec3 = [0,0,-1];

        if( this.hip )      this.hip.bindAltDirections( pose, FWD, UP );
        if( this.spine )    this.spine.bindAltDirections( pose, UP, FWD );
        if( this.neck )     this.neck.bindAltDirections( pose, FWD, UP );
        if( this.head )     this.head.bindAltDirections( pose, FWD, UP );
        if( this.tail )     this.tail.bindAltDirections( pose, BAK, UP );
        
        if( this.hindLegL ) this.hindLegL.bindAltDirections( pose, DN, FWD );
        if( this.hindLegR ) this.hindLegR.bindAltDirections( pose, DN, FWD );
        if( this.tarsalL )  this.tarsalL.bindAltDirections( pose, FWD, UP );
        if( this.tarsalR )  this.tarsalR.bindAltDirections( pose, FWD, UP );

        if( this.foreLegL ) this.foreLegL.bindAltDirections( pose, DN, FWD );
        if( this.foreLegR ) this.foreLegR.bindAltDirections( pose, DN, FWD );
        if( this.carpalL )  this.carpalL.bindAltDirections( pose, FWD, UP );
        if( this.carpalR )  this.carpalR.bindAltDirections( pose, FWD, UP );
    }

    resolveToPose( pose: any, debug ?: any ){
        let ch: IKChain;
        //console.time( 'resolveToPose' );
        for( ch of this.items.values() ){
            if( ch.solver ) ch.resolveToPose( pose, debug );
        }
        //console.timeEnd( 'resolveToPose' );
    }

    applyBipedIKPose( p: any ): void{ //BipedIKPose
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Use Biped Legs for the HindLegs, Then Flip R>L for ForeLegs
        // Animals don't really walk like that, there is more of a delay between the Hind & Fore
        // But without running the animation of the legs twice with the second on a slight delay
        // there is no other solution.

        this.hindLegL?.solver.setTargetDir( p.legL.effectorDir, p.legL.poleDir, p.legL.lenScale );
        this.hindLegR?.solver.setTargetDir( p.legR.effectorDir, p.legR.poleDir, p.legR.lenScale );

        //this.foreLegL?.solver.setTargetDir( p.legR.effectorDir, p.legR.poleDir, p.legR.lenScale );
        //this.foreLegR?.solver.setTargetDir( p.legL.effectorDir, p.legL.poleDir, p.legL.lenScale );

        // FIRST IDEA: Try to blend the arm direction with the hindLegs
        // OTHER IDEAS: Maybe Try to lerp between the two hindlegs to create a delay for forelegs??
        let a = vec3.lerp( [0,0,0], p.armL.effectorDir, p.legR.effectorDir, 0.4 );
        let b = vec3.lerp( [0,0,0], p.armR.effectorDir, p.legL.effectorDir, 0.4 );
        vec3.normalize( a, a );
        vec3.normalize( b, b );
        this.foreLegL?.solver.setTargetDir( a, p.legR.poleDir, p.legR2.lenScale );
        this.foreLegR?.solver.setTargetDir( b, p.legL.poleDir, p.legL2.lenScale );

        this.tarsalL?.solver.setTargetDir( p.footL.effectorDir, p.footL.poleDir );
        this.tarsalR?.solver.setTargetDir( p.footR.effectorDir, p.footR.poleDir );

        this.carpalL?.solver.setTargetDir( p.footR.effectorDir, p.footR.poleDir );
        this.carpalR?.solver.setTargetDir( p.footL.effectorDir, p.footL.poleDir );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.head?.solver.setTargetDir( p.head.effectorDir, p.head.poleDir );

        this.hip?.solver
            .setTargetDir( p.hip.effectorDir, p.hip.poleDir )
            .setMovePos( p.hip.pos, p.hip.isAbsolute, p.hip.bindHeight );

        this.spine?.solver
            .setStartDir( p.spine.startEffectorDir, p.spine.startPoleDir )
            .setEndDir( p.spine.endEffectorDir, p.spine.endPoleDir );
    }
}

export default QuadrupedRig;