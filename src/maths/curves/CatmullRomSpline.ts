// #region IMPORTS
import { Spline, Curve, Point, PointType } from './Spline';
import CatmullRom  from './CatmullRom';
// #endregion


/* NOTES
- 2 points & two tangent ponts needed to form a curve
- Each extra curve just requires one point to extent parts of the previous curve

*/

export default class CatmullRomSpline extends Spline{
    // #region MAIN
    constructor(){ 
        super();
    }
    // #endregion

    // #region MANAGE POINTS

    appendCurve( pnts:Array<Vec3Like> ): this{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // INITIAL CURVE
        const cCnt = this.curves.length;
        if( cCnt === 0 ){ 
            if( pnts.length < 4  ){ console.log( 'Initializing spline needs 4 points' ); return this; }
            
            // Create initial spline points
            const aa = new Point( pnts[0], PointType.Control );
            aa.index = 0;
            const a  = new Point( pnts[1] );
            a.index  = 1;
            const b  = new Point( pnts[2] );
            b.index  = 2;
            const bb = new Point( pnts[3], PointType.Control );
            bb.index = 3;

            // Save as points
            this.points.push( aa, a, b, bb  );

            // Group as a curve
            const curv = new Curve();
            curv.points.push( aa, a, b, bb );
            this.curves.push( curv );

            return this;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // PREP FOR EXTRA CURVES
        const pCnt = pnts.length;
        if( cCnt > 0 && pCnt < 0 ){ console.log( 'Appending a curve requires at least 1 points' ); return this; }

        // PreAllocate space for new points
        let pIdx      = this.points.length - 1;
        const lastPnt = this.points.at(-1) as Point;

        // Add last point to each new element, simplifies adding 
        // new points while moving last point to the end of the array
        for( let i=0; i < pCnt; i++ ) this.points.push( lastPnt );
        lastPnt.index = this.points.length - 1;
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Add extra curves to spine by extending previous curves
        let pcurv : Curve;
        let curv  : Curve;
        for( let i=0; i < pCnt; i++ ){
            // Create point that extends the spline
            let pnt       = new Point( pnts[i] );
            pnt.index     = pIdx + i;
            this.points[ pnt.index ] = pnt;
            
            // Previous curve, swop in new tangent point
            pcurv           = this.curves.at(-1) as Curve;
            pcurv.points[3] = pnt;

            // Clone curve using all points except first one
            // Add Last point as exit tangent
            curv = pcurv.extendClone( 1 );
            curv.points.push( lastPnt ); 
            this.curves.push( curv );
        }

        return this;
    }


    alignEndPoints( dist:number = 0.1 ): this{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Root Tangent
        let curv = this.curves[0];
        curv.points[0].pos
            .fromSub( curv.points[1].pos, curv.points[2].pos )
            .norm()
            .scale( dist )
            .add( curv.points[1].pos );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Final Tangent
        curv = this.curves.at(-1) as Curve;
        curv.points[3].pos
            .fromSub( curv.points[2].pos, curv.points[1].pos )
            .norm()
            .scale( dist )
            .add( curv.points[2].pos );
        
        return this;
    }

    // #endregion

    // #region SPLINE OPERATIONS

    /** Get Position and Dertivates of the Spline at T */
    at( t: number, pos ?: Vec3Like, dxdy ?: Vec3Like, dxdy2 ?: Vec3Like ): void{
        const [ ci, ct ] = this._tOfCurves( t )
        const curv       = this.curves[ ci ];
        const p          = curv.points;

        if( pos )   CatmullRom.at(p[0].pos, p[1].pos, p[2].pos, p[3].pos, ct, pos );
        if( dxdy )  CatmullRom.dxdy(p[0].pos, p[1].pos, p[2].pos, p[3].pos, ct, dxdy );
        if( dxdy2 ) CatmullRom.dxdy2(p[0].pos, p[1].pos, p[2].pos, p[3].pos, ct, dxdy2 );
    }

    atCurve( cIdx: number, t: number, pos ?: Vec3Like, dxdy ?: Vec3Like, dxdy2 ?: Vec3Like ): void{
        const curv = this.curves[ cIdx ];
        const p    = curv.points;

        if( pos )   CatmullRom.at(p[0].pos, p[1].pos, p[2].pos, p[3].pos, t, pos );
        if( dxdy )  CatmullRom.dxdy(p[0].pos, p[1].pos, p[2].pos, p[3].pos, t, dxdy );
        if( dxdy2 ) CatmullRom.dxdy2(p[0].pos, p[1].pos, p[2].pos, p[3].pos, t, dxdy2 );
    }

    // #endregion
}
