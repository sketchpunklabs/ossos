import type { vec4 }  from 'gl-matrix'

class Vec4Util{

    /** Used to get data from a flat buffer */
    static fromBuf( out: vec4, ary : Array<number> | Float32Array, idx: number ) : vec4 {
        out[ 0 ]  = ary[ idx ];
        out[ 1 ]  = ary[ idx + 1 ];
        out[ 2 ]  = ary[ idx + 2 ];
        return out;
    }

    /** Put data into a flat buffer */
    static toBuf( v: vec4, ary : Array<number> | Float32Array, idx: number ) : Vec4Util { 
        ary[ idx ]      = v[ 0 ];
        ary[ idx + 1 ]  = v[ 1 ];
        ary[ idx + 2 ]  = v[ 2 ];
        return this;
    }
}

export default Vec4Util;