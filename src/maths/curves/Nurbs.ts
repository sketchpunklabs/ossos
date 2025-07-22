
import { Point } from './Spline';
import { TVec3 } from '../Vec3'

// https://nurbscalculator.in/
// https://stackoverflow.com/questions/74468632/nurbs-derivative-using-de-boors-algorithm

export default class Nurbs{
    static at( t: number, deg: number, knots:Array<number>, pnts:Array<Point>, wgts:Array<number>, outPos:TVec3, outTan?:TVec3 ): void{
        this.deboor( t, pnts, knots, deg, wgts, outPos, outTan );
    }

    // Finds the knot span index for a given parameter u.
    // This is the index 'k' such that knot[k] <= u < knot[k+1].
    static findSpan( t: number, deg:number, iMax:number, knots:Array<number> ): number{
        const n = iMax - deg - 1;
        if( t >= knots[ n ] )   return iMax - 1;
        if( t <= knots[ deg ] ) return deg;

        let low  = deg;
        let high = iMax;
        let mid  = Math.floor( low * 0.5 + high * 0.5 );

        // Infinite loop protection
        const lmt = 30;
        let   cnt = 0;

        while( ( t < knots[mid] || t >= knots[mid+1] ) && low < high && ++cnt <= lmt ) {
            if( t < knots[mid] ) high = mid;
            else                 low  = mid;

            mid = Math.floor( low * 0.5 + high * 0.5 );
        }

        return mid;
    }

    // De Boor's Algorithm
    static deboor( t:number, pnts:Array<Point>, knots: Array<number>, deg: number, wgts: Array<number>, pos:TVec3, tan?:TVec3 ){
        const k = this.findSpan( t, deg, pnts.length-1, knots );
        const d: Array<Array<any>> = [];
        const q: Array<Array<any>> = [];

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let ii: number;
        let iii: number;
        let div: number;
        for( let i = 0; i < deg + 1; i++) {
            // ------------------------------
            // Position
            ii   = i + k - deg;
            d[i] = [ ...pnts[ii].pos, wgts[ii] ];
            if( !( i < deg ) ) continue;

            // ------------------------------
            // Tangent
            if( tan ){
                iii  = ii + 1;        
                div  = knots[i+k+1] - knots[iii];
                q[i] = [
                    (( pnts[iii].pos[0] - pnts[ii].pos[0] ) * deg ) / div,
                    (( pnts[iii].pos[1] - pnts[ii].pos[1] ) * deg ) / div,
                    (( pnts[iii].pos[2] - pnts[ii].pos[2] ) * deg ) / div,
                    (( wgts[iii] - wgts[ii] ) * deg ) / div,
                ];
            }
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let alpha: number;
        let iAlpha: number;
        for( let r=1; r < deg + 1; r++ ){
            for( let j=deg; j > r - 1; j-- ){
                
                // ------------------------------
                // Position
                ii      = j + k - deg;
                iii     = j + 1 + k - r;
                alpha   = ( t - knots[ii] ) / ( knots[iii] - knots[ii] );
                iAlpha  = 1 - alpha;

                d[j] = [
                    d[j-1][0] * iAlpha + d[j][0] * alpha,
                    d[j-1][1] * iAlpha + d[j][1] * alpha,
                    d[j-1][2] * iAlpha + d[j][2] * alpha,
                    d[j-1][3] * iAlpha + d[j][3] * alpha,
                ];

                if( !( r < deg && j < deg ) ) continue;

                // ------------------------------
                // Tangent
                if( tan ){
                    alpha  = ( t - knots[ii+1] ) / ( knots[iii] - knots[ii+1] );
                    iAlpha = 1 - alpha;
                    
                    q[j] = [
                        q[j-1][0] * iAlpha + q[j][0] * alpha,
                        q[j-1][1] * iAlpha + q[j][1] * alpha,
                        q[j-1][2] * iAlpha + q[j][2] * alpha,
                        q[j-1][3] * iAlpha + q[j][3] * alpha,
                    ];
                }
            }
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Convert to 3rd dimension from 4th
        
        pos[0] = d[deg][0] / d[deg][3];
        pos[1] = d[deg][1] / d[deg][3];
        pos[2] = d[deg][2] / d[deg][3];

        if( tan ){
            ii     = deg-1;
            tan[0] = ( q[ii][0] - pos[0] * q[ii][3] ) /  d[deg][3];
            tan[1] = ( q[ii][1] - pos[1] * q[ii][3] ) /  d[deg][3];
            tan[2] = ( q[ii][2] - pos[2] * q[ii][3] ) /  d[deg][3];

            // Normalize to use as tangent direction instead of velocity
            const mag = Math.sqrt( tan[0]**2 + tan[1]**2 + tan[2]**2 );
            tan[0] /= mag;
            tan[1] /= mag;
            tan[2] /= mag;
        }
    }

    static calcKnots( deg:number, pntLen: number, clampStart=true, clampEnd=true ): Array<number> | null{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( pntLen < deg + 1 ){
            console.log( 'Number of points must be at least degree + 1 for valid nurbs curve' );
            return null;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const total = pntLen + deg + 1; // Total Knots
        const knots: Array<number> = [];

        if( !clampStart && !clampEnd ){
            for ( let i = 0; i < total; i++ ) knots.push( i / ( total - 1 ) );
            return knots;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Initial zeros for clamping
        if( clampStart ){
            for( let i=0; i < deg; i++ ) knots.push( 0 );
        }

        // Internal Knots
        const interValues = pntLen - deg;
        for( let i=0; i <= interValues; i++ ) knots.push( i );

        // Closing Clamping
        if( clampEnd ){
            for( let i=0; i < deg; i++ ) knots.push( interValues );
        }

        // Normalize the knot vector to a [0, 1] range ( for clamped or partially clamped )
        // This assumes the last value in `knots` is the maximum unnormalized value.
        const kMax : number = knots.at(-1) as number;

        // This can happen if point count === degree + 1 and only one internal segment.
        if( kMax === 0 ){ console.log( 'ERROR Generating knots' ); return null; }

        // Normalize values
        for( let i=0; i < knots.length; i++ ) knots[i] = knots[i] / kMax;
        
        return knots;
    }
}