import type { mat4 }  from 'gl-matrix'

class Mat4Util{
    
    /** Used to get data from a flat buffer of matrices */
    static fromBuf( out: mat4, ary : Array<number> | Float32Array, idx: number ) : mat4 {
        out[ 0 ]  = ary[ idx ];
        out[ 1 ]  = ary[ idx + 1 ];
        out[ 2 ]  = ary[ idx + 2 ];
        out[ 3 ]  = ary[ idx + 3 ];
        out[ 4 ]  = ary[ idx + 4 ];
        out[ 5 ]  = ary[ idx + 5 ];
        out[ 6 ]  = ary[ idx + 6 ];
        out[ 7 ]  = ary[ idx + 7 ];
        out[ 8 ]  = ary[ idx + 8 ];
        out[ 9 ]  = ary[ idx + 9 ];
        out[ 10 ] = ary[ idx + 10 ];
        out[ 11 ] = ary[ idx + 11 ];
        out[ 12 ] = ary[ idx + 12 ];
        out[ 13 ] = ary[ idx + 13 ];
        out[ 14 ] = ary[ idx + 14 ];
        out[ 15 ] = ary[ idx + 15 ];
        return out;
    }

    /** Put data into a flat buffer of matrices */
    static toBuf( m: mat4, ary : Array<number> | Float32Array, idx: number ) : Mat4Util { 
        ary[ idx ]      = m[ 0 ];
        ary[ idx + 1 ]  = m[ 1 ];
        ary[ idx + 2 ]  = m[ 2 ];
        ary[ idx + 3 ]  = m[ 3 ];
        ary[ idx + 4 ]  = m[ 4 ];
        ary[ idx + 5 ]  = m[ 5 ];
        ary[ idx + 6 ]  = m[ 6 ];
        ary[ idx + 7 ]  = m[ 7 ];
        ary[ idx + 8 ]  = m[ 8 ];
        ary[ idx + 9 ]  = m[ 9 ];
        ary[ idx + 10 ] = m[ 10 ];
        ary[ idx + 11 ] = m[ 11 ];
        ary[ idx + 12 ] = m[ 12 ];
        ary[ idx + 13 ] = m[ 13 ];
        ary[ idx + 14 ] = m[ 14 ];
        ary[ idx + 15 ] = m[ 15 ];
        return this;
    }
}

export default Mat4Util;