//#region IMPORTS
import type { Armature, Bone, Pose }    from '../../armature/index';
import { Transform }                    from '../../maths';
import { vec3, quat }                   from 'gl-matrix';
import Vec3Util                         from '../../maths/Vec3Util';
//#endregion

class IKLink{
    //#region MAIN
    idx     : number;                       // Bone Index
    pidx    : number;                       // Bone Parent Index
    len     : number;                       // Bone Length
    bind    : Transform = new Transform();  // LocalSpace BindPose ( TPose ) Transform

    effectorDir : vec3 = [0,1,0];           // WorldSpace Target Alt Direction ( May be created from Inverted Worldspace Rotation of bone ) 
    poleDir     : vec3 = [0,0,1];           // WorldSpace Bend   Alt Direction ...

	constructor( idx: number, len: number ){
		this.idx    = idx;
        this.pidx   = -1;
		this.len    = len;
	}
    //#endregion

    //#region STATICS
    static fromBone( b: Bone ): IKLink{
        const l = new IKLink( b.idx, b.len );
        l.bind.copy( b.local );
        l.pidx = b.pidx;
        return l;
    }
    //#endregion
}

class IKChain{
    //#region MAIN
    links   : IKLink[]  = [];
    solver  : any       = null;
    /** How many bones in the chain */
    count   : number    = 0;
    /** Total Length of the Chain */
    length  : number    = 0;

    constructor( bName?: string[], arm ?:Armature ){
        if( bName && arm ) this.setBones( bName, arm );
    }
    //#endregion

    //#region SETTERS
    addBone( b: Bone ): this{
        this.length += b.len;
        this.links.push( IKLink.fromBone( b ) );
        this.count++;
        return this;
    }

    setBones( bNames: string[], arm: Armature ): this{
        let b: Bone | null;
        let n: string;

        this.length = 0;    // Reset Chain Length

        for( n of bNames ){
            b = arm.getBone( n );
            if( b ){
                this.length += b.len;
                this.links.push( IKLink.fromBone( b ) );
            }else console.log( 'Chain.setBones - Bone Not Found:', n );
        }        

        this.count = this.links.length;
        return this;
    }

    setSolver( s: any ): this{ this.solver = s; return this; }

    // Change the Bind Transform
    // Mostly used for late binding a TPose when armature isn't naturally in a TPose
    bindToPose( pose: Pose ): this{
        let lnk : IKLink;
        for( lnk of this.links ){
            lnk.bind.copy( pose.bones[ lnk.idx ].local );
        }
        return this;
    }

    //#region METHIDS

    /** For usecase when bone lengths have been recomputed for a pose which differs from the initial armature */
    resetLengths( pose: Pose ): void{
        let lnk: IKLink;
        let len: number;

        this.length = 0;
        for( lnk of this.links ){
            len         = pose.bones[ lnk.idx ].len;    // Get Current Length in Pose
            lnk.len     = len;                          // Save it to Link
            this.length += len;                         // Accumulate the total chain length
        }
    }
    //#endregion

    //#endregion

    //#region GETTERS
    first() : IKLink{ return this.links[ 0 ]; }
    last()  : IKLink{ return this.links[ this.count-1 ]; }
    //#endregion

    //#region GET POSITIONS
    getEndPositions( pose: Pose ): Array< vec3 >{
        let rtn: Array< vec3 > = [];

        if( this.count != 0 ) rtn.push( Vec3Util.toArray( pose.bones[ this.links[ 0 ].idx ].world.pos ) as vec3 );

        if( this.count > 1 ){
            const lnk = this.last();
            const v   = vec3.fromValues( 0, lnk.len, 0 );
            pose.bones[ lnk.idx ].world.transformVec3( v );

            rtn.push( Vec3Util.toArray( v ) as vec3 );
        }

        return rtn;
    }

    getPositionAt( pose: Pose, idx: number ): vec3{
        const b = pose.bones[ this.links[ idx ].idx ];
        return Vec3Util.toArray( b.world.pos ) as vec3;
    }

    getAllPositions( pose: Pose ): Array< vec3 >{
        const rtn : Array< vec3 > = [];
        let   lnk : IKLink;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get head position of every bone
        for( lnk of this.links ){
            rtn.push( Vec3Util.toArray( pose.bones[ lnk.idx ].world.pos ) as vec3 );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get tail position of the last bone
        lnk     = this.links[ this.count-1 ];
        const v = vec3.fromValues( 0, lnk.len, 0 );
        pose.bones[ lnk.idx ].world.transformVec3( v );

        rtn.push( Vec3Util.toArray( v ) as vec3 );
        
        return rtn;
    }

    getStartPosition( pose: Pose ): vec3{
        const b = pose.bones[ this.links[ 0 ].idx ];
        return Vec3Util.toArray( b.world.pos ) as vec3;
    }

    getMiddlePosition( pose: Pose ): vec3{
        if( this.count == 2 ){
            const b = pose.bones[ this.links[ 1 ].idx ];
            return Vec3Util.toArray( b.world.pos ) as vec3;
        }
        console.warn( 'TODO: Implemenet IKChain.getMiddlePosition' );
        return [0,0,0];
    }

    getLastPosition( pose: Pose ): vec3{
        const b = pose.bones[ this.links[ this.count-1 ].idx ];
        return Vec3Util.toArray( b.world.pos ) as vec3;
    }

    getTailPosition( pose: Pose, ignoreScale=false ): vec3{
        const b = pose.bones[ this.links[ this.count - 1 ].idx ];
        const v = vec3.fromValues( 0, b.len, 0 );

        if( !ignoreScale ) return Vec3Util.toArray( b.world.transformVec3( v ) ) as vec3;

        vec3.transformQuat( v, v, b.world.rot );
        vec3.add( v, v, b.world.pos );
        return Vec3Util.toArray( v ) as vec3;

        // return v
        //     .transformQuat( b.world.rot )
        //     .add( b.world.pos )
        //     .toArray();
    }
    //#endregion

    //#region DIRECTION
    getAltDirections( pose: Pose, idx = 0 ): Array< vec3 >{
        const lnk       = this.links[ idx ];                    // Get Link & Bone
        const b         = pose.bones[ lnk.idx ];
        const eff: vec3 = lnk.effectorDir.slice( 0 ) as vec3;   // Clone the Directions
        const pol: vec3 = lnk.poleDir.slice( 0 ) as vec3;

        // Transform Directions
        vec3.transformQuat( eff as vec3, eff as vec3, b.world.rot );
        vec3.transformQuat( pol as vec3, pol as vec3, b.world.rot );

        return [ eff, pol ];
    }

    bindAltDirections( pose: Pose, effectorDir: vec3, poleDir: vec3 ): this{
        let l: IKLink;
        let v   = vec3.create(); //new Vec3();
        let inv = quat.create(); //new Quat();
        
        for( l of this.links ){
            quat.invert( inv, pose.bones[ l.idx ].world.rot );

            vec3.transformQuat( v, effectorDir, inv );
            vec3.copy( l.effectorDir, v );

            vec3.transformQuat( v, poleDir, inv );
            vec3.copy( l.poleDir, v );
        }

        return this;
    }

    setAltDirections( effectorDir: vec3, poleDir: vec3 ): this{
        let l: IKLink;
        for( l of this.links ){
            vec3.copy( l.effectorDir, effectorDir );
            vec3.copy( l.poleDir, poleDir );
        }
        return this;
    }
    //#endregion

    resolveToPose( pose: Pose, debug ?: any ): this{
        if( !this.solver ){ console.warn( 'Chain.resolveToPose - Missing Solver' ); return this; }
        this.solver.resolve( this, pose, debug );
        return this;
    }
}

export { IKChain, IKLink };