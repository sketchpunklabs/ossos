import Vec3, { TVec3 } from './Vec3';

export default class Vec3Buffer{
    // #region MAIN
    buf    !: ArrayLike<number>;
    result  = new Vec3();

    constructor( buf: ArrayLike<number> ){
        this.buf = buf;
    }
    // #endregion

    // #region GETTERS
    get( i: number, out:TVec3 = this.result ): TVec3{
        out[ 0 ] = this.buf[ i+0 ];
        out[ 1 ] = this.buf[ i+1 ];
        out[ 2 ] = this.buf[ i+2 ];
        return out;
    }
    // #endregion

    // #region INTERPOLATION
    lerp( ai: number, bi: number, t: number, out: TVec3 = this.result ): TVec3{
        const ary = this.buf;
        const ti  = 1 - t;
        out[ 0 ] = ti * ary[ ai+0 ] + t * ary[ bi+0 ];
        out[ 1 ] = ti * ary[ ai+1 ] + t * ary[ bi+1 ];
        out[ 2 ] = ti * ary[ ai+2 ] + t * ary[ bi+2 ];
        return out;
    }
    // #endregion
}
