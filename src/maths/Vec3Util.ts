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

    static lenSqr( a: vec3, b: vec3 ): number{
        return  (a[ 0 ]-b[ 0 ]) ** 2 + 
                (a[ 1 ]-b[ 1 ]) ** 2 + 
                (a[ 2 ]-b[ 2 ]) ** 2 ;
    }

    static isZero( v: vec3 ): boolean { return ( v[0] == 0 && v[1] == 0 && v[2] == 0 ); }

    /** When values are very small, like less then 0.000001, just make it zero */
    static nearZero( out: vec3, v: vec3 ) : vec3{
        out[ 0 ] = ( Math.abs( v[ 0 ] ) <= 1e-6 )? 0 : v[ 0 ];
        out[ 1 ] = ( Math.abs( v[ 1 ] ) <= 1e-6 )? 0 : v[ 1 ];
        out[ 2 ] = ( Math.abs( v[ 2 ] ) <= 1e-6 )? 0 : v[ 2 ];
        return out;
    }
    
    //#region LOADING / CONVERSION
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

    static toArray( v: vec3 ): number[]{ return [ v[0], v[1], v[2] ]; }
    //#endregion

}

export default Vec3Util;