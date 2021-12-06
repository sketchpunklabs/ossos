import type { vec3 }  from 'gl-matrix'

export type TVec3Struct = { x: number, y: number, z: number }; // Handle Data form ThreeJS

class Vec3Util{

    static len( a: vec3, b: vec3 ): number{
        return Math.sqrt( 
            (a[ 0 ]-b[ 0 ]) ** 2 + 
            (a[ 1 ]-b[ 1 ]) ** 2 + 
            (a[ 2 ]-b[ 2 ]) ** 2
        );
    }

    /** Used to get data from a flat buffer */
    static fromBuf( out: vec3, ary : Array<number> | Float32Array, idx: number ) : vec3 {
        out[ 0 ]  = ary[ idx ];
        out[ 1 ]  = ary[ idx + 1 ];
        out[ 2 ]  = ary[ idx + 2 ];
        return out;
    }

    /** Put data into a flat buffer */
    static toBuf( v: vec3, ary : Array<number> | Float32Array, idx: number ) : Vec3Util { 
        ary[ idx ]      = v[ 0 ];
        ary[ idx + 1 ]  = v[ 1 ];
        ary[ idx + 2 ]  = v[ 2 ];
        return this;
    }

    static toStruct( v: vec3, o ?: TVec3Struct ): TVec3Struct{
        o ??= { x:0, y:0, z:0 };
        o.x = v[ 0 ];
        o.y = v[ 1 ];
        o.z = v[ 2 ];
        return o;
    }

    static fromStruct( v: vec3, o: TVec3Struct ): vec3{
        v[ 0 ] = o.x; 
        v[ 1 ] = o.y;
        v[ 2 ] = o.z;
        return v;
    }

}

export default Vec3Util;