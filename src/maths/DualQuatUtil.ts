import type { quat2 }  from 'gl-matrix'

class DualQuatUtil{
    
    /** Used to get data from a flat buffer of matrices */
    static fromBuf( out: quat2, ary : Array<number> | Float32Array, idx: number ) : quat2 {
        out[ 0 ]  = ary[ idx ];
        out[ 1 ]  = ary[ idx + 1 ];
        out[ 2 ]  = ary[ idx + 2 ];
        out[ 3 ]  = ary[ idx + 3 ];
        out[ 4 ]  = ary[ idx + 4 ];
        out[ 5 ]  = ary[ idx + 5 ];
        out[ 6 ]  = ary[ idx + 6 ];
        out[ 7 ]  = ary[ idx + 7 ];
        return out;
    }

    /** Put data into a flat buffer of matrices */
    static toBuf( m: quat2, ary : Array<number> | Float32Array, idx: number ) : DualQuatUtil { 
        ary[ idx ]      = m[ 0 ];
        ary[ idx + 1 ]  = m[ 1 ];
        ary[ idx + 2 ]  = m[ 2 ];
        ary[ idx + 3 ]  = m[ 3 ];
        ary[ idx + 4 ]  = m[ 4 ];
        ary[ idx + 5 ]  = m[ 5 ];
        ary[ idx + 6 ]  = m[ 6 ];
        ary[ idx + 7 ]  = m[ 7 ];
        return this;
    }
}

export default DualQuatUtil;