// #region IMPORTS
import { Spline, Curve, Point, PointType } from './Spline';
import Nurbs                from './Nurbs';
// #endregion


export default class NurbsSpline extends Spline{
    // #region MAIN
    // degree : number        = 2;     // Kind of related topoint count, deg = p.len - 1 but, you can have deg=2 and p.len=5
    // knots  : Array<number> = [];    // Knot Scalars
    // wgts   : Array<number> = [];    // Weight values per point
    constructor(){ super(); }
    // #endregion

    // #region MANAGE POINTS

    appendCurve( pnts:Array<Vec3Like> ): this{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const cCnt = this.curves.length;
        if( cCnt === 0 && pnts.length < 3 ){ console.log( 'Initializing spline needs at least 3 points' ); return this; }
        if( cCnt > 0 && pnts.length < 2 ){ console.log( 'Appending a curve requires at least 2 points' ); return this; }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const eIdx = pnts.length - 1;
        const curv = new Curve();
        curv.attrib.wgts = [];

        // Start new curve from the end of the last one
        if( cCnt !== 0 ){
            curv.points.push( this.points.at(-1) as Point );
            curv.attrib.wgts.push(1);
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let pnt: Point;
        let typ: PointType;
        for( let i=0; i <= eIdx; i++ ){
            typ         = ( i === eIdx || ( cCnt === 0 && i === 0 ) )? PointType.Point : PointType.Control;
            pnt         = new Point( pnts[i], typ );
            pnt.index   = this.points.length;

            this.points.push( pnt );    // Flat Points
            curv.attrib.wgts.push( 1 ); // Weight of point on curve
            curv.points.push( pnt );    // Point on curve
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        curv.attrib.degree = curv.points.length - 1;
        curv.attrib.knots  = Nurbs.calcKnots( curv.attrib.degree, curv.points.length, true, true );
        this.curves.push( curv );

        return this;
    }

    // #endregion

    // #region GETTERS
    // #endregion

    // #region SPLINE OPERATIONS

    /** Get Position and Dertivates of the Spline at T */
    at( t: number, pos ?: Vec3Like, dxdy ?: Vec3Like ): void{
        const [ ci, ct ] = this._tOfCurves( t )
        const curv       = this.curves[ ci ];

        // Because of the algorithm, position is needed to compute tangent, so if pos out not
        // passed then pass one in to make the function work.
        Nurbs.at( ct, curv.attrib.degree,  curv.attrib.knots, curv.points,  curv.attrib.wgts, pos ?? [0,0,0], dxdy );
    }

    atCurve( cIdx: number, t: number, pos ?: Vec3Like, dxdy ?: Vec3Like ): void{
        const curv = this.curves[ cIdx ];

        // Because of the algorithm, position is needed to compute tangent, so if pos out not
        // passed then pass one in to make the function work.
        Nurbs.at( t, curv.attrib.degree,  curv.attrib.knots, curv.points,  curv.attrib.wgts, pos ?? [0,0,0], dxdy );
    }

    // #endregion
}
