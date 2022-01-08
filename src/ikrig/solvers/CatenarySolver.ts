//#region IMPORTS
import type Pose                            from '../../armature/Pose';
import type { IKChain, IKLink }             from "../rigs/IKChain";
import type { ISolver }                     from './support/ISolver';

import { QuatUtil, Transform, Vec3Util }    from '../../maths';
import CurveSample                          from '../../maths/CurveSample';
import { vec3, quat }                       from 'gl-matrix';
//#endregion

class Caternary{
    // Feed it a Sag Factor( A ) and the X of the Graph when plotting the curve, 
    // will return the Y of the curve.
    static get( A: number, x: number ): number{ return A * Math.cosh( x / A ); }

    // A = Sagging Factor of the Curve. Need Length between the ends & Total Possible Length between the 2 points
    static computeSag( len: number, maxLen: number, tries=100 ): number | null{
        // Solution for Solving for A was found at http://rhin.crai.archi.fr/rld/plugin_details.php?id=990
        // I've since have modified from the original function, removing yDelta and sqrts
        // Note: This seems like newton's method for solving roots ??
        if( len > maxLen ) return null;

        const hLen          = len    * 0.5;
        const hMaxLen       = maxLen * 0.5;
        let e   : number    = Number.MAX_VALUE;
        let a   : number    = 100;
        let tmp : number    = 0;

        for( let i=0; i < tries; i++ ){
            tmp	= hLen / Math.asinh( hMaxLen / a );
            e   = Math.abs( ( tmp - a ) / a );
            a	= tmp;
            if( e < 0.001 ) break;
        }

        return a;
    }

    static fromEndPoints( p0: vec3, p1: vec3, maxLen: number, segments=5, invert=false ): Array<vec3>{
        const vecLen            = Vec3Util.len( p0, p1 );
        const A                 = this.computeSag( vecLen, maxLen );
        if( A == null ) return [];
        segments += 1;  // Skipping Zero, so need to add one to return the requested segment count

        const hVecLen           = vecLen * 0.5;
        const offset            = this.get( A, -hVecLen );  // Need starting C to base things at Zero, subtract offset from each c point
        const step		        = vecLen / segments;	    // Size of Each Segment
        const rtn : Array<vec3> = [];

        let pnt   : vec3;
        let x     : number;
        let c     : number;
        //let t     : number;

        for( let i=1; i < segments; i++ ){
            pnt = [0,0,0];
            vec3.lerp( pnt, p0, p1, i / segments ); // t   = i / segments;

            x       = i * step - hVecLen;         // x position between two points but using half as zero center
            c       = offset - this.get( A, x );  // Get a y value, but needs to be changed to work with coord system
            //c       = offset - this.get( A, t - 0.5 ); // Further testing is need but maybe able to get away just using a T value between -0.5 > 0.5 in place of X
            pnt[1]  = ( !invert )? pnt[1] - c : pnt[1] + c;

            rtn.push( pnt );
        }

        return rtn;
    }
}

// Align chain onto a Catenary curve, which is often used to simulate 
// rope/chains. There was an instance when someone called it RopeIK :/
class CatenarySolver implements ISolver{
    //#region MAIN
    effectorPos : vec3 = [0,0,0];
    sampler    !: CurveSample;

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
    //#endregion

    resolve( chain: IKChain, pose: Pose, debug?:any ): void{
        const sCnt = chain.count * 2;
        if( !this.sampler ) this.sampler = new CurveSample( sCnt+2 );

        const pt            = new Transform();
        const ct            = new Transform();
        let lnk : IKLink    = chain.first();

        pose.getWorldTransform( lnk.pidx, pt );     // Get the Starting Transform for the chain.
        ct.fromMul( pt, lnk.bind );                 // Move Bind to WS, to get staring position of the chain

        const pnts = Caternary.fromEndPoints( ct.pos, this.effectorPos, chain.length, sCnt, false );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Update Curve Sampler with new Data
        let i = 1;
        this.sampler.set( 0, ct.pos );                      // Set Starting Point

        for( let p of pnts ) this.sampler.set( i++, p );    // Inbetween Points
        
        this.sampler.set( i, this.effectorPos );            // End Point
        this.sampler.updateLengths();                       // Recompute the Curve lengths

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        
        const tail  : vec3 = [0,0,0];       // Bone's Tail Position
        const tar   : vec3 = [0,0,0];       // Target Position
        const from  : vec3 = [0,0,0];       // Unit Vector of Bone Head to Bone Tail
        const to    : vec3 = [0,0,0];       // Unit Vector of Bone Head to Target
        const q     : quat = [0,0,0,1];     // Rotation for FROM > TO
        let   dist         = 0;             // Distance at each step of the curve
        
        for( let i=0; i < chain.count; i++ ){
            //--------------------------------------
            lnk     = chain.links[ i ];                 // Get Bone Link
            dist   += lnk.len;                          // Current Distance of the chain this bone's tail reaches.

            ct.fromMul( pt, lnk.bind );                 // Move Bind to World Space
            tail[0] = 0;
            tail[1] = lnk.len;
            tail[2] = 0;
            ct.transformVec3( tail );                   // Get WS Position of Tail

            this.sampler.atLength( dist, tar );         // Get the closes point on the curve in relation to the bone's tail distance

            //--------------------------------------
            vec3.sub( from, tail, ct.pos );             // Bind Direction
            vec3.normalize( from, from );

            vec3.sub( to, tar, ct.pos );                // Target Direction
            vec3.normalize( to, to );

            quat.rotationTo( q, from, to );             // Create rotation from bind to target

            //--------------------------------------
            // QuatUtil.dotNegate( q, q, ct.rot );
            quat.mul( q, q, ct.rot );                   // Apply
            QuatUtil.pmulInvert( q, q, pt.rot );        // To Local
            pose.setLocalRot( lnk.idx, q );             // Save

            pt.mul( q, lnk.bind.pos, lnk.bind.scl );    // Create WorldSpace Parent for next bone
        }
    }
}


/*
//TODO, This function creates a parabolic-like curve with its center at zero (-1 to 1).
//With that in mind, It creates the same set of values for both sides. To optimize this
//further, only calcuate from 0 to 1 then repeat those values backwards so we only process
//unique values and just repeat them for 0 to -1. They are the exact same Y values, no need to invert.
/*
catenary.getByLengths = function(vecLen, maxLen, segCnt){
	let vecLenHalf 	= vecLen * 0.5,				// ... Half of that
		segInc		= vecLen / segCnt,			// Size of Each Segment
		A 			= catenary.getA(vecLen, maxLen),
		offset		= catenary(A, -vecLenHalf),	// Need starting C to base things at Zero, subtract offset from each c point
		rtn			= new Array(segCnt - 1),
		i;

	//loop in a -1 to 1 way.
	for(i=1; i < segCnt; i++) rtn[i-1] = offset - catenary(A, i * segInc - vecLenHalf);
	return rtn;
}
*/

/*
//First version before doing some changes like taking things out that doesn't seem to be there.
catenary.getA = function(vec0, vec1, ropeLen){
    //Solving A comes from : http://rhin.crai.archi.fr/rld/plugin_details.php?id=990
    let yDelta = vec1[1] - vec0[0],
        vecLen = vec1.length(vec0);
    if(yDelta > ropeLen || vecLen > ropeLen){ console.log("not enough rope"); return null; }
    if(yDelta < 0){	//Swop verts, low end needs to be on the left side
        var tmp 	= vec0;
        vec0		= vec1;
        vec1		= vec0;
        yDelta		*= -1;
    }
    //....................................
    const max_tries = 100;
    let vec3		= new Vec2( vec1[0], vec0[1] ),
        e			= Number.MAX_VALUE,
        a			= 100,
        aTmp		= 0,
        yRopeDelta	= 0.5 * Math.sqrt(ropeLen*ropeLen - yDelta*yDelta),	//Optimize the loop
        vecLenHalf	= 0.5 * vecLen,										//Optimize the loop
        i;
    for(i=0; i < max_tries; i++){
        //aTmp	= 0.5 * vecLen / ( Math.asinh( 0.5 * Math.sqrt(ropeLen**2 - yDelta**2) / a ) );
        aTmp	= vecLenHalf / ( Math.asinh( yRopeDelta / a ) );
        e		= Math.abs( (aTmp - a) / a );
        a		= aTmp;
        if(e < 0.001) break;
    }
    console.log("tries", i);
    return a;
}
*/

export default CatenarySolver;