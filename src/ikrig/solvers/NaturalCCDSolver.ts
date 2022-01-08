//#region IMPORTS
import type Pose                            from '../../armature/Pose';
import type { IKChain, IKLink }             from "../rigs/IKChain";
//import type { IKData }                    from '..';
import type { ISolver }                     from './support/ISolver';
import type Bone                            from '../../armature/Bone';

import { QuatUtil, Transform, Vec3Util }    from '../../maths';
import { vec3, quat }                       from 'gl-matrix';
//#endregion


class NaturalCCDSolver implements ISolver{
    //#region TARGETTING DATA
    effectorPos : vec3  = [ 0, 0, 0 ];
    
    _inWorldSpace       = false;       // Use & Apply changes to pose, else will use bindpose for initial data & updating pose
    _tries              = 30;
    _minEffRng          = 0.001**2;    // Min Effector Range Square
    _chainCnt           = 0;
    _local      !: Transform[];
    _world      !: Transform[];
    _kFactor    !: any;
    //#endregion

    initData( pose?: Pose, chain?: IKChain ): this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get the Chain's Tail Position as the Effector Position
        if( pose && chain ){
            const lnk = chain.last();
            const eff : vec3 = [ 0, lnk.len, 0 ];

            pose.bones[ lnk.idx ].world.transformVec3( eff ); // The Trail Position in WorldSpace
            //eff.copyTo( this.effectorPos );
            vec3.copy( this.effectorPos, eff );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Setup Transform Chains to handle Iterative Processing of CCD
        if( chain ){
            const cnt       = chain.count;
            this._chainCnt  = cnt; 
            this._world     = new Array( cnt + 1 ); // Extra Transform for Final Tail
            this._local     = new Array( cnt + 1 );

            // Create a Transform for each link/bone
            for( let i=0; i < cnt; i++ ){
                this._world[ i ] = new Transform();
                this._local[ i ] = new Transform();
            }

            // Tail Transform
            this._world[ cnt ]  = new Transform();
            this._local[ cnt ]  = new Transform( [0,0,0,1], [0,chain.last().len,0], [1,1,1] ); 
        }

        return this;
    }

    //#region SETTING TARGET DATA
    setTargetPos( v: vec3 ): this{ 
        this.effectorPos[ 0 ] = v[ 0 ];
        this.effectorPos[ 1 ] = v[ 1 ];
        this.effectorPos[ 2 ] = v[ 2 ];
        return this;
    }

    useArcSqrFactor( c: number, offset: number, useInv = false ): this{
        this._kFactor = new KFactorArcSqr( c, offset, useInv );
        return this
    }

    inWorldSpace(): this{ this._inWorldSpace = true; return this; }

    setTries( v: number ){ this._tries = v; return this; }
    //#endregion

    resolve( chain: IKChain, pose: Pose, debug?:any ): void{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( !this._local ){
            const cnt =     chain.count;
            this._world     = new Array( cnt + 1 ); // Extra Transform for Final Tail
            this._local     = new Array( cnt + 1 );

            for( let i=0; i < cnt; i++ ){
                this._world[ i ] = new Transform();
                this._local[ i ] = new Transform();
            }

            // Tail Transform
            this._world[ cnt ]  = new Transform();
            this._local[ cnt ]  = new Transform( [0,0,0,1], [0,chain.last().len,0], [1,1,1] ); 
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const root      = new Transform();
        let lnk: IKLink = chain.first();

        // Get the Starting Transform
        pose.getWorldTransform( lnk.pidx, root );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let i: number;

        // Set the Initial Local Space from the chain Bind Pose
        for( i=0; i < chain.count; i++ ){
            if( !this._inWorldSpace )   this._local[ i ].copy( chain.links[ i ].bind );
            else                        this._local[ i ].copy( pose.bones[ chain.links[ i ].idx ].local );
        }

        this._updateWorld( 0, root );   // Update World Space
        if( Vec3Util.lenSqr( this.effectorPos, this._getTailPos() ) < this._minEffRng ){
            //console.log( 'CCD Chain is already at endEffector at initial call' );
            return;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( i=0; i < this._tries; i++ ){
            if( this._iteration( chain, pose, root, debug ) ) break; // Exit early if reaching effector
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Save Results to Pose
        for( i=0; i < chain.count; i++ ){
            pose.setLocalRot( chain.links[ i ].idx, this._local[ i ].rot );
        }
    }

    // Update the Iteration Transform Chain, helps know the position of 
    // each joint & end effector ( Last point on the chain )
    _updateWorld( startIdx: number, root: Transform ){
        const w     = this._world;
        const l     = this._local;
        let   i     : number;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // HANDLE ROOT TRANSFORM
        if( startIdx == 0 ){
            w[ 0 ].fromMul( root, l[ 0 ] );     // ( Pose Offset * Chain Parent ) * First Link
            startIdx++;                         // Start on the Nex Transform
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // HANDLE MIDDLE TRANSFORMS
        for( i=startIdx; i < w.length; i++ ){ 
            w[ i ].fromMul( w[ i-1 ], l[ i ] );     // Parent * Child
        }
    }

    _getTailPos(){ return this._world[ this._world.length - 1 ].pos; }

    _iteration( chain: IKChain, pose: Pose, root: Transform, debug ?:any ): boolean{
        const w                 = this._world;
        const l                 = this._local;
        const cnt               = w.length - 1;
        const tail              = w[ cnt ];
        const tailDir : vec3    = [0,0,0];
        const effDir  : vec3    = [0,0,0];
        const lerpDir : vec3    = [0,0,0];
        const q       : quat    = [0,0,0,1];
        const k                 = this._kFactor;

        let   i       : number;
        let   diff    : number;
        let   b       : Transform;

        if( k ) k.reset();

        for( i=cnt-1; i >= 0; i-- ){                            // Skip End Effector Transform
            //--------------------------------------
            // Check how far tail is from End Effector
            diff = Vec3Util.lenSqr( tail.pos, this.effectorPos );   // Distance Squared from Tail to Effector
            if( diff <= this._minEffRng ) return true;          // Point Reached, can Stop

            //--------------------------------------
            b = w[ i ];
            //tailDir.fromSub( tail.pos,         b.pos ).norm();  // Direction from current joint to end effector
            //effDir.fromSub(  this.effectorPos, b.pos ).norm();  // Direction from current joint to target
            
            vec3.sub( tailDir, tail.pos, b.pos );
            vec3.normalize( tailDir, tailDir );

            vec3.sub( effDir, this.effectorPos, b.pos );
            vec3.normalize( effDir, effDir );

            if( k ) k.apply( chain, chain.links[ i ], tailDir, effDir, lerpDir );     // How Factor to Rotation Movement
            else    vec3.copy( lerpDir, effDir ); //lerpDir.copy( effDir );

            //q   .fromUnitVecs( tailDir, lerpDir )               // Create Rotation toward target
            //    .mul( b.rot );                                  // Apply to current World rotation

            quat.rotationTo( q, tailDir, lerpDir );
            quat.mul( q, q, b.rot );

            // if( i != 0 ) q.pmulInvert( w[ i-1 ].rot );          // To Local Space
            // else         q.pmulInvert( root.rot );

            if( i != 0 ) QuatUtil.pmulInvert( q, q, w[ i-1 ].rot );          // To Local Space
            else         QuatUtil.pmulInvert( q, q, root.rot );

            //l[ i ].rot.copy( q );                               // Save back to bone
            quat.copy( l[ i ].rot, q );

            //--------------------------------------             
            this._updateWorld( i, root );                       // Update Chain from this bone and up.
        }

        return false;
    }
}


/*
class KFactorCircle{
    constructor( c, r ){
        this.k = Maths.clamp( c / r, 0, 1 ); // K = Constant / Radius 
    }

    static fromChainLen( c, chainLen ){
        // Radius = ( 180 + ArcLength ) / ( PI * ArcAngle )
        let r = ( 180 * chainLen ) / ( Math.PI * Math.PI * 2 );
        return new KFactorCircle( c, r );
    }

    static fromChain( c, chain ){
        // Radius = ( 180 + ArcLength ) / ( PI * ArcAngle )
        let r = ( 180 * chain.len ) / ( Math.PI * Math.PI * 2 );
        return new KFactorCircle( c, r );
    }

    reset(){} // No State to reset

    apply( bone, effDir, tarDir, out ){
        out.from_lerp( effDir, tarDir, this.k ).norm();
    }
}
*/

class KFactorArcSqr{
    c       : number;
    offset  : number;
    arcLen  = 0;
    useInv  = false;

    constructor( c: number, offset: number, useInv = false ){
        this.c      = c;
        this.offset = offset;
        this.useInv = useInv;
    }

    reset(){ this.arcLen = 0; }

    apply( chain: IKChain, lnk: IKLink, tailDir: vec3 , effDir: vec3, out: vec3 ){
        // Notes, Can do the inverse of pass in chain's length so chain.len - this.arcLen
        // This causes the beginning of the chain to move more and the tail less.
        this.arcLen += lnk.len;   // Accumulate the Arc length for each bone
        
        //const k = this.c / Math.sqrt( this.arcLen + this.offset );  // k = Constant / sqrt( CurrentArcLen )
        const k = ( !this.useInv )?
            this.c / Math.sqrt( this.arcLen + this.offset ) :
            this.c / Math.sqrt( ( chain.length - this.arcLen ) + this.offset )
        
        //out.fromLerp( tailDir, effDir, k ).norm();
        vec3.lerp( out, tailDir, effDir, k );
        vec3.normalize( out, out );
    }
}

/*

class KFactorArc{
    constructor( c, offset ){
        this.c      = c;
        this.arcLen = 0;
        this.offset = offset;
    }

    reset(){
        this.arcLen = 0;
    }

    apply( bone, effDir, tarDir, out ){
        // Notes, Can do the inverse of pass in chain's length so chain.len - this.arcLen
        // This causes the beginning of the chain to move more and the tail less.
        this.arcLen += bone.len;   //Accumulate the Arc length for each bone
        
        let k = this.c / ( this.arcLen + this.offset );  // k = Constant / CurrentArcLen
        
        out.from_lerp( effDir, tarDir, k ).norm();
    }
}

class KFactorOther{
    constructor( chainLen ){
        this.chainLen   = chainLen;
        this.arcLen     = 0;
        this.offset     = 0.1;
        this.scalar     = 1.3;
    }

    reset(){ this.arcLen = 0; }

    apply( bone, effDir, tarDir, out ){
        // Just messing around with numbers to see if there is ways to alter the movement of the chain
        this.arcLen += bone.len;
        let k = ( ( this.chainLen - this.arcLen + this.offset ) / ( this.chainLen*this.scalar ) )**2;
        out.from_lerp( effDir, tarDir, k ).norm();
    }
}
*/

export default NaturalCCDSolver;