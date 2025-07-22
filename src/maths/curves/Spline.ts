// #region IMPORTS
import Vec3 from '../Vec3'
// #endregion

// #region POINTS
export const PointType = Object.freeze({
    Point   : 0,
    Control : 1,
});

export type PointType = typeof PointType[keyof typeof PointType];

export class Point{
    attrib : Record<string, any> = {};
    type   : PointType = PointType.Point;
    index  : number    = -1;
    pos    = new Vec3();
    constructor( pos: ConstVec3, t: PointType = PointType.Point ){
        this.pos.copy( pos );
        this.type = t;
    }

    setPos( v: Vec3Like ){ this.pos.copy( v ); }
}
// #endregion

// #region CURVE
export class Curve{
    points: Array<Point>        = [];   // Array of points in the proper order of the specific curve
    attrib: Record<string, any> = {};   // Used to extra data per curve, NURBS for example
    constructor(){}

    // Clone a curve that may extent this curve
    extendClone( start?:number, end?: number ): Curve{
        const curv  = new Curve();
        curv.points = this.points.slice( start, end );
        curv.attrib = {...this.attrib};
        return curv;
    }
}
// #endregion

export class Spline{
    // #region MAIN
    points: Array<Point> = [];  // Flatten out all the points for
    curves: Array<Curve> = [];  // Collection of points per curve
    _isLoop = false;            // Is the spline closed? Meaning should the ends be treated as another curve
    // #endregion

    // #region GETTERS / SETTERS
    get pointCount(){ return this.points.length; }
    get curveCount(){ return this.curves.length; }
    // #endregion

    // #region MANAGE POINTS

    // @ts-ignore 6133
    appendCurve( pnts:Array<Vec3Like> ): this{ console.log( 'Spline.appendCurve is not implemented' ); return this; }

    /** Update point position */
    setPos( idx: number, pos: ConstVec3 ) : this{
        // @ts-ignore ts(2532) :: at(-1) is fine
        this.points.at(idx).pos.copy( pos );
        return this;
    }

    // #endregion

    // #region ABSTRACT METHODS
    // @ts-ignore 6133
    at( t: number, pos ?: Vec3Like, dxdy ?: Vec3Like, dxdy2 ?: Vec3Like ) : void{}

    // @ts-ignore 6133
    atCurve( cIdx: number, t: number, pos ?: Vec3Like, dxdy ?: Vec3Like, dxdy2 ?: Vec3Like ): void{}
    // #endregion

    // #region HELPERS

    /** Return [ CurveIndex, CurveT ] : Take t over spline & compute curve's index and lerp time */
    _tOfCurves( t: number  ): Array<number>{ 
        const rtn = [0,0]; // if t <= 0
        if( t >= 1 ){
            rtn[0] = this.curves.length - 1;
            rtn[1] = 1;
        }else if( t > 0 ){
            const f = this.curves.length * t;
            rtn[0] = Math.floor( f );
            rtn[1] = f - rtn[0];
        }

        return rtn;
    }

    // #endregion
}