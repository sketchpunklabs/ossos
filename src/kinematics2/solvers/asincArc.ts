// #region IMPORTS
import type { IKChain } from '../IKChain';
import type IKTarget    from '../IKTarget';
import Vec3             from '../../maths/Vec3';
import Quat             from '../../maths/Quat';
import { TSolverOptions } from '../consts';
// #endregion

export type AsincArcData = {
    arcAngle        : number,   // Angle of the Arc
    chordLen        : number,   // Chord Length of the arc
    radius          : number,   // Radius from circle center
    centerOffset    : number,   // Distance from chord mid point to circle center

    midPos          : Vec3,     // Chord mid position
    centerPos       : Vec3,     // Position of the circle center
    orthoAxis       : Vec3,     // Orthagonal direction of the chord, use as rotation axis for coplaner point computation
}

// Using two points of input, Chord Length & Arc Length
// Compute all the remaining bits of information that defines an arc
export function calcAsincArc( tar: IKTarget, chain: IKChain ): AsincArcData | null{
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~    
    const chordLen = tar.dist;  // Target distance substitutes chord length
    const arcLen   = chain.len; // Chain length substitutes Arc Length

    // Angle in radius of the arc with an arc length & chord length
    // NOTE: should be arcLen / chordLen but doesn't work correctly with his version of asinc
    // Also asinc results in half angle, so 2x will give full angle
    const arcAngle = 2 * asinc( chordLen / arcLen ); 
    if( arcLen <= chordLen || isNaN( arcAngle ) || arcAngle <= 0 || arcAngle > Math.PI * 2 ){
        return null;
    }

    // Radius of the circle the arc is part of
    const radius        = arcLen / arcAngle;

    // Distance frin mid point of the chord line to the circle center
    const centerOffset  = Math.sqrt( radius**2 - ( chordLen / 2 ) ** 2 );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Chord line mid point
    const mid = new Vec3().fromLerp( tar.startPos, tar.endPos, 0.5 );
    const up  = tar.twist.clone();

    // const axis = norm( cross( [0,1,0], dir ) ); // Ortho direction between up & chord dir
    // const up   = norm( cross( dir, axis ) );    // Direction toward circle center

    // If angle is over 180d, flip direction to circle center
    if( arcAngle <= Math.PI ) up.negate();

    // Circle center, up * chordMidOffset + chordMid
    const center = new Vec3().fromScaleThenAdd( centerOffset, up, mid );

    return {
        radius, arcAngle, centerOffset, chordLen,
        centerPos   : center,
        midPos      : mid,
        orthoAxis   : tar.ortho,
    };
}

// Two ways to compute points on the arc, either one works
// better depending on which hemisphere of the arc is in
export function calcArcPoints( tar: IKTarget, chain: IKChain, o:AsincArcData, useChord:boolean = true, opts ?: TSolverOptions ): Array<Vec3>{
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Init Point Data
    const points = Array.from( { length: chain.links.length }, ()=>new Vec3() );
    points[0].copy( tar.startPos );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Compute plane vectors to create co-planer points
    // Need to know where the Up and Right directions of the plane

    // Compute the UV vectors using the IKTarget start point as the origin
    const u = new Vec3( tar.startPos ).sub( o.centerPos ).norm();
    const v = new Vec3( tar.endPos ).sub( o.centerPos );
    const p = new Vec3().fromCross( u, v ); // axis to help make V orthogonal to U
    v.fromCross( p, u ).norm();
    
    // When arcAngle is over pi, the direction of the circle center is flipped
    // so negate V to flip it the right side up so it matches twist direction
    if( o.arcAngle > Math.PI ) v.negate();

    // Requesting to flip the arc
    if( opts?.revPole ) v.negate();

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Compute points
    let rad = 0;

    if( useChord ){
        // Compute sub arc using bone len as chord len,
        // this allows to properly place varied segment lengths
        // onto a curve which works very well for arcs less then 180deg
        const clamp  = ( v: number )=>Math.min( 1, Math.max( -1, v ) );
        for( let i=0; i < chain.links.length-1; i++ ){
            // NOTE: asin will result to a HALF Angle, so * 2 gives correct angle
            // arcAngle = 2 * Math.asin( chordLen / ( 2 * radius ) );
            rad += 2 * Math.asin( clamp( chain.links[i].len / ( 2 * o.radius ) ) );
            points[ i+1 ].fromArc( o.radius, u, v, rad, o.centerPos );
        }
    }else{
        // Use ArcLength and the Bone Lengths to compute the general position
        // on the arc. This is a less accurate way to compute a point but
        // when coupled with F&B step it works better in arcs greater then
        // 180deg

        let len = 0;
        for( let i=0; i < chain.links.length-1; i++ ){
            len += chain.links[i].len;
            rad  = ( len / chain.len ) * o.arcAngle;
            points[ i+1 ].fromArc( o.radius, u, v, rad, o.centerPos );
        }
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Realign Points so they all are in the
    // same side of the IK target swing line
    // const Debug = globalThis.Debug;
    // const tt = new Vec3();

    u.fromSub( points.at( -1 ) as Vec3, tar.startPos ).norm();  // Current overshot vector
    const q = new Quat().fromSwing( u, tar.swing );             // Make overshoot matach target swing vector

    // Rotate all the points
    for( let p of points ){
        p   .sub( tar.startPos )
            .transformQuat( q )
            .add( tar.startPos );
    }
    // Debug.pnt.add( points.at(-1), 0x00ff00, 5 );
    // Debug.ln.add( tar.startPos, tt.fromScaleThenAdd( 5, u, tar.startPos ), 0x00ff00 );
    // console.log( 'x',points );

    return points;
}


// #region MATHS

// https://www.youtube.com/watch?v=UNrrd_XhPMA
// https://www.youtube.com/watch?v=S-zAk6VqL-E
// https://www.youtube.com/watch?v=docgrYp6A88
// https://www.youtube.com/watch?v=MULuu-bkPKs
// https://discussions.unity.com/t/ik-chain/406592/10
function asinc( x0: number ): number{
    let   x  : number = 6 * ( 1-x0 );
    const x1 : number = x;  
    let   a  : number = x;                               x *= x1; 
    a += x                   / 20.0;                     x *= x1; 
    a += x * 2.0             / 525.0;                    x *= x1; 
    a += x * 13.0            / 37800.0;                  x *= x1; 
    a += x * 4957.0          / 145530000.0;              x *= x1; 
    a += x * 58007.0         / 16216200000.0;            x *= x1;
    a += x * 1748431.0       / 4469590125000.0;          x *= x1; 
    a += x * 4058681.0       / 92100645000000.0;         x *= x1;
    a += x * 5313239803.0    / 1046241656460000000.0;    x *= x1;
    a += x * 2601229460539.0 / 4365681093774000000000.0; // x^10
    return Math.sqrt( a );
}


// https://www.hpmuseum.org/forum/thread-11011-post-133362.html#pid133362

// And my VEX implementation of it is such:

// function float asinc(float xx){
//  float x = clamp(xx, 0, 1) ;
//  float y = 12 * (1 - x) ;
//  y /= 1 - 0.2041 * (1 - x) + sqrt((27.11 - x) * (0.0065 + 0.0318 * x)) ;
//  y = sqrt(y) ;
//  return y ;
// }

// #endregion