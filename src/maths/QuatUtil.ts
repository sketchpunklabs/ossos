import type { quat }  from 'gl-matrix'

class QuatUtil{

    /** Used to get data from a flat buffer */
    static fromBuf( out: quat, ary : Array<number> | Float32Array, idx: number ) : quat {
        out[ 0 ]  = ary[ idx ];
        out[ 1 ]  = ary[ idx + 1 ];
        out[ 2 ]  = ary[ idx + 2 ];
        out[ 3 ]  = ary[ idx + 3 ];
        return out;
    }

    /** Put data into a flat buffer */
    static toBuf( q: quat, ary : Array<number> | Float32Array, idx: number ) : QuatUtil { 
        ary[ idx ]      = q[ 0 ];
        ary[ idx + 1 ]  = q[ 1 ];
        ary[ idx + 2 ]  = q[ 2 ];
        ary[ idx + 3 ]  = q[ 3 ];
        return this;
    }

}

export default QuatUtil;