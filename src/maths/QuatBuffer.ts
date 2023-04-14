import Quat from './Quat';

export default class QuatBuffer{
    // #region MAIN
    buf    !: ArrayLike<number>;
    result  = new Quat();

    constructor( buf: ArrayLike<number> ){
        this.buf = buf;
    }
    // #endregion

    // #region GETTERS
    get( i: number, out:Quat = this.result ): Quat{
        i       *= 4;
        out[ 0 ] = this.buf[ i+0 ];
        out[ 1 ] = this.buf[ i+1 ];
        out[ 2 ] = this.buf[ i+2 ];
        out[ 3 ] = this.buf[ i+3 ];
        return out;
    }
    // #endregion

    // #region INTERPOLATION
    nblend( ai: number, bi: number, t: number, out: Quat = this.result ): Quat{
        ai *= 4;
        bi *= 4;

        // https://physicsforgames.blogspot.com/2010/02/quaternions.html
        const ary = this.buf;
        const a_x = ary[ ai+0 ];	// Quaternion From
        const a_y = ary[ ai+1 ];
        const a_z = ary[ ai+2 ];
        const a_w = ary[ ai+3 ];
        const b_x = ary[ bi+0 ];	// Quaternion To
        const b_y = ary[ bi+1 ];
        const b_z = ary[ bi+2 ];
        const b_w = ary[ bi+3 ];
        const dot = a_x*b_x + a_y*b_y + a_z*b_z + a_w*b_w;
        const ti  = 1 - t;

        // if Rotations with a dot less then 0 causes artifacts when lerping,
        // Can fix this by switching the sign of the To Quaternion.
        const s  = ( dot < 0 )? -1 : 1;

        out[ 0 ] = ti * a_x + t * b_x * s;
        out[ 1 ] = ti * a_y + t * b_y * s;
        out[ 2 ] = ti * a_z + t * b_z * s;
        out[ 3 ] = ti * a_w + t * b_w * s;

        return out.norm();
    }

    slerp( ai: number, bi: number, t: number, out: Quat = this.result ): Quat{
        ai *= 4;
        bi *= 4;

        // benchmarks: http://jsperf.com/Quat-slerp-implementations
        const ary = this.buf;
        const ax  = ary[ai+0], ay = ary[ai+1], az = ary[ai+2], aw = ary[ai+3];
        let   bx  = ary[bi+0], by = ary[bi+1], bz = ary[bi+2], bw = ary[bi+3];
        let omega, cosom, sinom, scale0, scale1;

        // calc cosine
        cosom = ax * bx + ay * by + az * bz + aw * bw;

        // adjust signs (if necessary)
        if ( cosom < 0.0 ) {
            cosom = -cosom;
            bx = - bx;
            by = - by;
            bz = - bz;
            bw = - bw;
        }

        // calculate coefficients
        if ( (1.0 - cosom) > 0.000001 ) {
            // standard case (slerp)
            omega  = Math.acos( cosom );
            sinom  = Math.sin( omega );
            scale0 = Math.sin( ( 1.0 - t ) * omega ) / sinom;
            scale1 = Math.sin( t * omega ) / sinom;
        }else{
            // "from" and "to" Quats are very close so we can do a linear interpolation
            scale0 = 1.0 - t;
            scale1 = t;
        }

        // calculate final values
        out[ 0 ] = scale0 * ax + scale1 * bx;
        out[ 1 ] = scale0 * ay + scale1 * by;
        out[ 2 ] = scale0 * az + scale1 * bz;
        out[ 3 ] = scale0 * aw + scale1 * bw;
        return out;
    }
    // #endregion
}
