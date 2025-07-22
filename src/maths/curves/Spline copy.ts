import Vec3, { TVec3, ConstVec3 } from '../Vec3'

export class Point{
    attrib : Record<string, any>    = {}; // {[key: string]: any} 
    pos                             = new Vec3();
    constructor( pos: ConstVec3 ){
        this.pos.copy( pos );
    }
}

export class Spline{
    // #region MAIN
    points : Array<Point> = []; // All the Points that defines all the curves of the Spline
    _curveCnt  = 0;             // How many curves make up the spline
    _pointCnt  = 0;             // Total points in spline
    _isLoop    = false;         // Is the spline closed? Meaning should the ends be treated as another curve
    // #endregion

    // #region GETTERS / SETTERS
    set isLoop( b: boolean ){ this._isLoop = b; }
    get isLoop(): boolean{ return this._isLoop; }

    get curveCount() : number{ return this._curveCnt; }
    get pointCount() : number{ return this._pointCnt; }
    // #endregion

    // #region MANAGE POINTS
    /** Add Points to the spline */
    add( pos: ConstVec3 ) : Point{
        const o = new Point( pos );
        this.points.push( o );
        this._pointCnt = this.points.length;
        // TODO - Each subclass has to update the curveCount
        return o;
    }

    /** Update point position */
    setPos( idx: number, pos: ConstVec3 ) : this{
        this.points[ idx ].pos.copy( pos );
        return this;
    }
    // #endregion

    // #region ABSTRACT METHODS
    at( t: number, pos ?: TVec3, dxdy ?: TVec3, dxdy2 ?: TVec3 ) : void{}

    atCurve( cIdx: number, t: number, pos ?: TVec3, dxdy ?: TVec3, dxdy2 ?: TVec3 ): void{}
    // #endregion
}