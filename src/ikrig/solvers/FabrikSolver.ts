//#region IMPORTS
import type Pose                            from '../../armature/Pose';
import type { IKChain, IKLink }             from "../rigs/IKChain";
import type { ISolver }                     from './support/ISolver';
import type Bone                            from '../../armature/Bone';

import { QuatUtil, Transform, Vec3Util }    from '../../maths';
import { vec3, quat }                       from 'gl-matrix';
//#endregion

// Forward And Backward Reaching Inverse Kinematics
class FabrikSolver implements ISolver{
    //#region MAIN
    maxIteration        = 15;       // Max Attempts to reach the end effector
    effectorPos  : vec3 = [0,0,0];  // IK Target can be a Position or...
    effectorFwd  : vec3 = [0,0,0];

    _inWorldSpace       = false;    // Use & Apply changes to pose, else will use bindpose for initial data & updating pose
    _threshold          = 0.0001 ** 2;
    _bonePos    !: Array< vec3 >;   // Use to keep track of the position of each bone

    _radLimit = 45 * Math.PI / 180;
    _dotLimit = Math.cos( this._radLimit );

    _radLimit2 = 10 * Math.PI / 180;
    _dotLimit2 = Math.cos( this._radLimit2 );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    initData( pose ?: Pose, chain ?: IKChain ): this{
        return this;
    }

    setTargetPos( v: vec3 ): this{
        //this._isTarPosition     = true;
        this.effectorPos[ 0 ]   = v[ 0 ];
        this.effectorPos[ 1 ]   = v[ 1 ];
        this.effectorPos[ 2 ]   = v[ 2 ];
        return this;
    }

    setTargetFwd( v: vec3 ): this{
        this.effectorFwd[ 0 ]   = v[ 0 ];
        this.effectorFwd[ 1 ]   = v[ 1 ];
        this.effectorFwd[ 2 ]   = v[ 2 ];
        return this;
    }

    inWorldSpace(): this{ this._inWorldSpace = true; return this; }
    //#endregion

    resolve( chain: IKChain, pose: Pose, debug?:any ): void{
        this._preProcess( chain, pose, debug );

        let i:number = 0;
        let good: number = 0;
        for( i; i < this.maxIteration; i++ ){            
            this._iterateBackward( chain, debug );
            this._iterateForward( chain, debug  );

            if( Vec3Util.lenSqr( this.effectorPos, this._bonePos[ chain.count ] ) <= this._threshold ){
                good++;
                if( good >= 3 ) break;
            }
        }
        // console.log( 'Total Iter', i );
        if( this._inWorldSpace )    this._update_fromWorldPose( chain, pose, debug );   // Apply Changes to Pose thats passed in.
        else                        this._update_fromBindPose( chain, pose, debug );    // Apply to BindPose then save results to pose.
    }

    // #region DATA
    _preProcess( chain: IKChain, pose: Pose, debug ?: any ): void{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // JIT Array
        if( !this._bonePos ){
            this._bonePos   = [];
            for( let i=0; i < chain.count; i++ ) this._bonePos.push( [0,0,0] );
            this._bonePos.push( [0,0,0] ); // One more to store tail
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute all the Starting Positions for the Chain
        let lnk: IKLink;

        if( this._inWorldSpace ){

            for( let i=0; i < chain.count; i++ ){
                lnk = chain.links[ i ];
                vec3.copy( this._bonePos[ i ], pose.bones[ lnk.idx ].world.pos );
            }

        }else{
            const pt    = new Transform();
            const ct    = new Transform();
            lnk         = chain.first();

            // Start in Bind Space
            pose.getWorldTransform( lnk.pidx, pt );     // Get the Starting Transform for the chain.
        
            ct.fromMul( pt, lnk.bind );                 // Shift Bind to World Space
            vec3.copy( this._bonePos[0], ct.pos );      // Save First Position
    
            for( let i=1; i < chain.count; i++ ){
                ct.mul( chain.links[ i ].bind );        // Add Next Bone to transform chain
                vec3.copy( this._bonePos[i], ct.pos );  // Save its position
            }
        }
    }

    _update_fromWorldPose( chain: IKChain, pose: Pose, debug ?: any ): void{
        const pt            = new Transform();
        const ct            = new Transform();
        let lnk             = chain.first();
        const tail : vec3   = [0,0,0];
        const from : vec3   = [0,0,0];
        const to   : vec3   = [0,0,0];
        const q    : quat   = [0,0,0,1];
        let b    : Bone;

        pose.getWorldTransform( lnk.pidx, pt ); // Get the Starting Transform for the chain.

        for( let i=0; i < chain.count; i++ ){
            lnk = chain.links[ i ];
            b   = pose.bones[ lnk.idx ];
            
            ct.fromMul( pt, b.local );                  // Get Bone's World Space Transform
            tail[0] = 0;
            tail[1] = lnk.len;
            tail[2] = 0;

            ct.transformVec3( tail );                   // Get its Tail Position
            
            vec3.sub( from, tail, ct.pos );             // From Direction, WS Bone to WS Bind Tail
            vec3.normalize( from, from );
            
            vec3.sub( to, this._bonePos[i+1], ct.pos ); // To Direction, WS Bone to Fabrik Pos
            vec3.normalize( to, to );

            quat.rotationTo( q, from, to );             // Create Swing Rotation
            quat.mul( q, q, ct.rot );                   // Apply it to world space bind
            QuatUtil.pmulInvert( q, q, pt.rot );        // To Local

            pose.setLocalRot( lnk.idx, q );             // Save
            pt.mul( q, lnk.bind.pos, lnk.bind.scl );    // Set WorldSpace Transform for next bone
        }
    }


    _update_fromBindPose( chain: IKChain, pose: Pose, debug ?: any ): void{
        const tail : vec3 = [0,0,0];
        const from : vec3 = [0,0,0];
        const to   : vec3 = [0,0,0];
        const q    : quat = [0,0,0,1];
        const pt    = new Transform();
        const ct    = new Transform();
        let lnk     = chain.first();

        pose.getWorldTransform( lnk.pidx, pt ); // Get the Starting Transform for the chain.

        for( let i=0; i < chain.count; i++ ){
            lnk = chain.links[ i ];

            ct.fromMul( pt, lnk.bind );
            tail[0] = 0;
            tail[1] = lnk.len;
            tail[2] = 0;

            ct.transformVec3( tail );

            vec3.sub( from, tail, ct.pos );             // From Direction, Bone to Bind Tail
            vec3.normalize( from, from );

            vec3.sub( to, this._bonePos[i+1], ct.pos ); // To Direction, Bone to Fabrik Pos
            vec3.normalize( to, to );

            quat.rotationTo( q, from, to );             // Create Swing Rotation
            quat.mul( q, q, ct.rot );                   // Apply it to world space bind
            QuatUtil.pmulInvert( q, q, pt.rot );        // To Local

            pose.setLocalRot( lnk.idx, q );             // Save
            pt.mul( q, lnk.bind.pos, lnk.bind.scl );    // Set WorldSpace Transform for next bone
        }
    }
    // #endregion

    // #region ITERATIONS

    _applyAngleConstraint( fromDir: vec3, toDir: vec3, t: number ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const dLmt = lerp( this._dotLimit, this._dotLimit2, t );
        const dot = Math.max( Math.min( vec3.dot( fromDir, toDir ) , 1 ), -1 ) ;
        if( dot > dLmt ) return;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const rad           = Math.acos( dot );
        const axis : vec3   = vec3.cross( [0,0,0], fromDir, toDir );
        vec3.normalize( axis, axis );

        const radLmt = lerp( this._radLimit, this._radLimit2, t );
        const q    : quat   = quat.setAxisAngle( [0,0,0,0], axis, -( rad - radLmt ) );
        vec3.transformQuat( toDir, toDir, q );
    }

    _iterateBackward( chain: IKChain, debug ?: any ): void{
        // debug.pnt.reset();
        // debug.ln.reset();

        const endIdx            = chain.count - 1;
        const apos              = this._bonePos;
        const lnks              = chain.links;
        const dir     : vec3    = [0,0,0];
        const prevDir : vec3    = [0,0,0];
        const prevPos : vec3    = vec3.copy( [0,0,0], this.effectorPos );   // Start Pointing to Effector
        
        // Skip root point since we can consider it pinned
        let i, t;
        for( i=endIdx; i > 0; i-- ){    
            //------------------------------------
            vec3.sub( dir, apos[i], prevPos );  // Direction from pos toward prev
            vec3.normalize( dir, dir ); 
            
            if( this._radLimit && i != endIdx ){
                t = 1 - ( i / endIdx);
                t = 1 - Math.abs( 2 * t - 1 );  // 0-1 to 0-1-0
                t = sigmoid( t, -0.5 );          // Apply controllable curve on T

                this._applyAngleConstraint( prevDir, dir, t );
            }

            //------------------------------------
            // Scale direction by bone's legth, move bone so its tail touches prev pos
            vec3.scaleAndAdd( apos[i], prevPos, dir, lnks[i].len );
            vec3.copy( prevPos, apos[i] );  // Save for next bone as target pos
            vec3.copy( prevDir, dir );      // Save for next bone for Angle Constraint Testing
            
            //debug.pnt.add( apos[i], 0xffff00, 1.5 );
        }
    }

    _iterateForward( chain: IKChain, debug ?: any ): void{
        const apos              = this._bonePos;
        const lnks              = chain.links;
        const dir     : vec3    = [0,0,0] ;
        const prevPos : vec3    = vec3.copy( [0,0,0], apos[0] ) ;
        let prevLen   : number  = lnks[0].len;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Move all the points back towards the root position
        for( let i=1; i < chain.count; i++ ){
            vec3.sub( dir, apos[i], prevPos );  // Direction from Bone pos to prev pos
            vec3.normalize( dir, dir );         // Normalize it
            
            // Scale Direction by Prev Bone's Length then Move it so its touches prev bone's
            vec3.scaleAndAdd( apos[i], prevPos, dir, prevLen );

            vec3.copy( prevPos, apos[i] );      // Save for next bone
            prevLen = lnks[ i ].len;            // Save Previous Bone Length to compute tail position
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Figure out the tail position after iteration
        const ilast     = chain.count - 1;
        vec3.sub( prevPos, this.effectorPos, apos[ ilast ] );
        
        vec3.normalize( prevPos, prevPos );
        vec3.scaleAndAdd( apos[ chain.count ], apos[ ilast ], prevPos, lnks[ ilast ].len );
    }
    // #endregion
}

function lerp( a: number, b: number, t: number ): number{
    return a * (1-t) + b * t;
}

function sigmoid( t: number, k=0 ){ // Over 0, Eases in the middle, under eases in-out
    // this uses the -1 to 1 value of sigmoid which allows to create easing at 
    // start and finish. Can pass in range 0:1 and it'll return that range.
    // https://dhemery.github.io/DHE-Modules/technical/sigmoid/
    // https://www.desmos.com/calculator/q6ukniiqwn
    return ( t - k*t ) / ( k - 2*k*Math.abs(t) + 1 );
}

export default FabrikSolver;