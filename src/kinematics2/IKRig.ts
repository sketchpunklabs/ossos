// #region IMPORTS
import type { TIKSolver, TSolverOptions }   from './consts';
import type Pose            from '../armature/Pose';
import type { TVec3 } from '../maths/Vec3';

import { IK_SOLVERS }   from './consts';
import { IKChain }      from './IKChain';
import IKTarget         from './IKTarget';
import BoneAxes         from './BoneAxes';

// #endregion

type TSetOptions = {
    name            : string,
    bones           : Array<string>,
    solver          : string | TIKSolver,
    solverOptions  ?: TSolverOptions;
    order          ?: number,
    axes           ?: number,  // BoneAxes.UFR,
}

/** A collection set for running ik, consisting of a Target, Solver and Bone Chain */
export class IKSet {
    // #region MAIN
    name     : string           = '';               // Help to identify which limb to access
    order    : number           = 0;                // Order this set should execute in
    target   : IKTarget         = new IKTarget();   // Handles IK Target data solvers will use
    // target2  : IKTarget | null  = null;
    solver  !: TIKSolver;                           // Any IK Solver
    chain   !: IKChain;                             // IK Bone Chain
    solverOptions : TSolverOptions = {};

    constructor( name: string, order=0 ){
        this.name  = name;
        this.order = order;
    }

    /** Set bones using the current TPose to store bind & axes information */
    setBones( bones: Array<string>, tPose: Pose, axes=BoneAxes.UFR ){
        this.chain = new IKChain( tPose.getBones( bones ), axes );
        return this;
    }

    /** set which solver to be executed using the target onto the chain */
    setSolver( s: string | TIKSolver, o ?: TSolverOptions ){
        this.solver = ( typeof s === 'string' )? IK_SOLVERS[ s ] : s;
        if( o ) this.solverOptions = o;
        return this;
    }
    // #endregion

    updatePose( pose: Pose ){ 
        // console.log( 'Solver', this.name );
        this.solver( this.target, this.chain, pose, this.solverOptions );
    }
}

/** Barebones IK Rig, use to extend for specialized rigs */
export class IKRig {
    // #region MAIN
    sets    : Array<IKSet>            = []; // Collection of Chained Bones
    names   : Record<string, number>  = {}; // Names to Index Mapping
    pose   !: Pose;                         // Working Pose

    constructor( tpose: Pose ){
        // Make a copy to use as a starting point for IKSets
        // And to be used as a work space to compute a pose.
        this.pose = tpose.clone();
    }
    // #endregion

    // #region SETUP
    addSet( opt: TSetOptions  ): this{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Setup Defaults
        opt = Object.assign( {
            order           : 0,
            name            : '',
            bones           : [],
            axes            : BoneAxes.UFR,
            solver          : 'look',
            solverOptions   : undefined,
        }, opt );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Validate things
        if( opt.bones.length === 0 ) return this;
        if( !opt.name )              opt.name = 'set' + this.sets.length;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Build IK Set
        const s = new IKSet( opt.name, opt.order )
            .setBones( opt.bones, this.pose, opt.axes )
            .setSolver( opt.solver, opt.solverOptions );

        this.sets.push( s );
        this.#reorder();
        return this;
    }

    /** Sort IKSet collection & update name-index mapping */
    #reorder(): void{
        // Sort IK Sets
        this.sets.sort( ( a:IKSet, b:IKSet )=> ( a.order === b.order )? 0 : ( a.order < b.order )  ? -1 : 1 );

        // Reset names to index mapping
        for( let i=0; i < this.sets.length; i++ ){
            this.names[ this.sets[i].name ] = i;
        }
    }
    // #endregion

    // #region GETTERS / SETTERS
    getSet( name: string ): IKSet{ return this.sets[ this.names[ name ] ]; }

    getEndPosition( name: number ):  TVec3{
        const s = this.sets[ this.names[ name ] ];
        return this.pose.getWorldPosition( s.chain.lastLink.index );
    }

    setTargetPositions( name: string, tarPos: ConstVec3, polPos ?:ConstVec3 ){
        const s = this.sets[ this.names[ name ] ];

        if( s ) s.target.setPositions( tarPos, polPos );
        else    console.log( 'Setting target name not found', name );

        return this;
    }
    // #endregion

    // #region EXECUTION
    runSolvers(){ this.executor( this ); return this; }

    // Default Executor, Will use IKSet.order to determine execution order
    executor = ( _rig: IKRig )=>{
        // Run IK solver for each chain set
        for( const s of this.sets ) s.updatePose( this.pose );

        // Recompute worldspace pose
        // Note: Don't really need to updateWorld when only being
        // used by Armature's Skin, it will recompute world based
        // on the skinning option selected for the armature.
        this.pose.updateWorld();
    };
    // #endregion
}