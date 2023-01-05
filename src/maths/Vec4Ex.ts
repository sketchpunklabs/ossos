import type { vec4 }  from 'gl-matrix'

export default class Vec3Ex{
    //#region LOADING / CONVERSION
    /** Used to get data from a flat buffer */
    static fromBuf( out: vec4, ary : Array<number> | Float32Array, idx: number ) : vec4 {
        out[ 0 ]  = ary[ idx ];
        out[ 1 ]  = ary[ idx + 1 ];
        out[ 2 ]  = ary[ idx + 2 ];
        out[ 3 ]  = ary[ idx + 3 ];
        return out;
    }

    /** Put data into a flat buffer */
    static toBuf( v: vec4, ary : Array<number> | Float32Array, idx: number ) : Vec3Ex { 
        ary[ idx ]      = v[ 0 ];
        ary[ idx + 1 ]  = v[ 1 ];
        ary[ idx + 2 ]  = v[ 2 ];
        ary[ idx + 3 ]  = v[ 3 ];
        return this;
    }
    //#endregion
}