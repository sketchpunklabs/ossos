// #region IMPORTS
import { Spline, Curve, Point, PointType } from './Spline';
import BezierQuad  from './BezierQuad';
// #endregion

/* NOTES
- 2 points & 1 control point between needed to form a curve
- Each extra curve just requires a control point and a point to extend the prev curve
*/

export default class BezierQuadSpline extends Spline{
    // #region MAIN
    constructor(){ super(); }
    // #endregion

    // #region MANAGE POINTS

    appendCurve( pnts:Array<Vec3Like> ): this{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // INITIAL CURVE
        const cCnt = this.curves.length;
        if( cCnt === 0 ){ 
            if( pnts.length < 3  ){ console.log( 'Initializing spline needs 3 points' ); return this; }
            
            // Create initial spline points
            const a = new Point( pnts[0] );
            a.index = 0;
            const b = new Point( pnts[1], PointType.Control );
            b.index = 1;
            const c = new Point( pnts[2] );
            c.index = 2;
            
            // Save as points
            this.points.push( a, b, c );

            // Group as a curve
            const curv = new Curve();
            curv.points.push( a, b, c );
            this.curves.push( curv );

            return this;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // CHECKS FOR EXTENDING SPLINE
        const pCnt = pnts.length;
        if( cCnt > 0 && pCnt < 1 ){ console.log( 'Appending a curve requires at least 2 points' ); return this; }

        if( (pCnt & 1) !== 0 ){ console.log( 'Appending a curve requires pairs of points'); return this; }
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Add extra curves to spine by extending previous curves
        const pIdx = this.points.length;
        let curv: Curve;
        for( let i=0; i < pCnt; i+=2 ){
            // Control & Point
            const a = new Point( pnts[i], PointType.Control );
            a.index = pIdx + i;
            const b = new Point( pnts[i+1], PointType.Point );
            b.index = a.index + 1;
            
            // New curve uses last point as first point
            curv = new Curve()
            curv.points.push( this.points.at(-1) as Point, a, b ); 
            this.curves.push( curv );

            // Add to flat array of points
            this.points.push( a, b );
        }

        return this;
    }

    // #endregion

    // #region SPLINE OPERATIONS

    /** Get Position and Dertivates of the Spline at T */
    at( t: number, pos ?: Vec3Like, dxdy ?: Vec3Like, dxdy2 ?: Vec3Like ): void{
        const [ ci, ct ] = this._tOfCurves( t )
        const curv       = this.curves[ ci ];
        const p          = curv.points;

        if( pos )   BezierQuad.at(p[0].pos, p[1].pos, p[2].pos, ct, pos );
        if( dxdy )  BezierQuad.dxdy(p[0].pos, p[1].pos, p[2].pos, ct, dxdy );
        if( dxdy2 ) BezierQuad.dxdy2(p[0].pos, p[1].pos, p[2].pos, ct, dxdy2 );
    }

    atCurve( cIdx: number, t: number, pos ?: Vec3Like, dxdy ?: Vec3Like, dxdy2 ?: Vec3Like ): void{
        const curv = this.curves[ cIdx ];
        const p    = curv.points;

        if( pos )   BezierQuad.at(p[0].pos, p[1].pos, p[2].pos, t, pos );
        if( dxdy )  BezierQuad.dxdy(p[0].pos, p[1].pos, p[2].pos, t, dxdy );
        if( dxdy2 ) BezierQuad.dxdy2(p[0].pos, p[1].pos, p[2].pos, t, dxdy2 );
    }

    // #endregion
}
