import { vec3 }  from 'gl-matrix'

export default class Vec3Ex{
    // #region LOADING / CONVERSION
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
    // #endregion


    static lookAxes( dir: vec3, up: vec3=[0,1,0], xAxis:vec3=[1,0,0], yAxis:vec3=[0,1,0], zAxis:vec3=[0,0,1] ){
        // TODO, if Dir and Up are equal, a roll happends. Need to find a way to fix this.
        vec3.copy( zAxis, dir );            // Forward
        vec3.cross( xAxis, up, zAxis );     // Right
        vec3.cross( yAxis, zAxis, xAxis );  // Up
        vec3.normalize( xAxis, xAxis );
        vec3.normalize( yAxis, yAxis );
        vec3.normalize( zAxis, zAxis );
    }

    static project( out: vec3, from: vec3, to: vec3 ) : vec3{
        // TO can be a unit vector to project
        // Modified from https://github.com/Unity-Technologies/UnityCsReference/blob/master/Runtime/Export/Math/Vector3.cs#L265
        // dot( a, b ) / dot( b, b ) 
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const denom = vec3.dot( to, to );
        if( denom < 0.000001 ){
            out[ 0 ] = 0;
            out[ 1 ] = 0;
            out[ 2 ] = 0;
            return out;
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const scl = vec3.dot( from, to ) / denom;
        out[ 0 ] = to[ 0 ] * scl;
        out[ 1 ] = to[ 1 ] * scl;
        out[ 2 ] = to[ 2 ] * scl;
        return out;
    }
}