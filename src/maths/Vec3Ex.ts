import type { vec3 }  from 'gl-matrix'

export default class Vec3Ex{
    //#region LOADING / CONVERSION
    /** Used to get data from a flat buffer */
    static fromBuf( out: vec3, ary : Array<number> | Float32Array, idx: number ) : vec3 {
        out[ 0 ]  = ary[ idx ];
        out[ 1 ]  = ary[ idx + 1 ];
        out[ 2 ]  = ary[ idx + 2 ];
        return out;
    }

    /** Put data into a flat buffer */
    static toBuf( v: vec3, ary : Array<number> | Float32Array, idx: number ) : Vec3Ex { 
        ary[ idx ]      = v[ 0 ];
        ary[ idx + 1 ]  = v[ 1 ];
        ary[ idx + 2 ]  = v[ 2 ];
        return this;
    }
    //#endregion
}