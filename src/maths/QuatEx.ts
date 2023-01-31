import { vec3, quat }  from 'gl-matrix'

export default class QuatEx{
    // #region GETTERS
    static axisSqrLen( q: quat ): number{ return q[0]**2 + q[1]**2 + q[2]**2; }

    static getAngle( q: quat ): number { 
        let x: number = q[3];
        if( x > 1 ) x = quat.normalize( [0,0,0,0], q )[ 3 ];
        return Math.acos( x ) * 2.0; 
    }
    // #endregion

    // #region OPS
    static look( out:quat, dir: vec3, up: vec3 = [0,1,0] ) : quat {
        
        // Ported to JS from C# example at https://pastebin.com/ubATCxJY
        // TODO, if Dir and Up are equal, a roll happends. Need to find a way to fix this.
        const zAxis	= vec3.copy( [0,0,0], dir );            // Forward
        const xAxis = vec3.cross( [0,0,0], up, zAxis );     // Right
        const yAxis = vec3.cross( [0,0,0], zAxis, xAxis );  // Up

        vec3.normalize( xAxis, xAxis );
        vec3.normalize( yAxis, yAxis );
        vec3.normalize( zAxis, zAxis );

        //fromAxis - Mat3 to Quat
        const m00 = xAxis[0], m01 = xAxis[1], m02 = xAxis[2],
              m10 = yAxis[0], m11 = yAxis[1], m12 = yAxis[2],
              m20 = zAxis[0], m21 = zAxis[1], m22 = zAxis[2],
              t   = m00 + m11 + m22;

        let x: number, 
            y: number, 
            z: number, 
            w: number, 
            s: number;

        if(t > 0.0){
            s = Math.sqrt(t + 1.0);
            w = s * 0.5 ; // |w| >= 0.5
            s = 0.5 / s;
            x = (m12 - m21) * s;
            y = (m20 - m02) * s;
            z = (m01 - m10) * s;
        }else if((m00 >= m11) && (m00 >= m22)){
            s = Math.sqrt(1.0 + m00 - m11 - m22);
            x = 0.5 * s;// |x| >= 0.5
            s = 0.5 / s;
            y = (m01 + m10) * s;
            z = (m02 + m20) * s;
            w = (m12 - m21) * s;
        }else if(m11 > m22){
            s = Math.sqrt(1.0 + m11 - m00 - m22);
            y = 0.5 * s; // |y| >= 0.5
            s = 0.5 / s;
            x = (m10 + m01) * s;
            z = (m21 + m12) * s;
            w = (m20 - m02) * s;
        }else{
            s = Math.sqrt(1.0 + m22 - m00 - m11);
            z = 0.5 * s; // |z| >= 0.5
            s = 0.5 / s;
            x = (m20 + m02) * s;
            y = (m21 + m12) * s;
            w = (m01 - m10) * s;
        }

        out[ 0 ] = x;
        out[ 1 ] = y;
        out[ 2 ] = z;
        out[ 3 ] = w;
        return out;
    }

    static negate( out: quat, q: quat ) : quat{
        out[ 0 ] = -q[ 0 ];
        out[ 1 ] = -q[ 1 ];
        out[ 2 ] = -q[ 2 ];
        out[ 3 ] = -q[ 3 ];
        return out;
    }
    // #endregion

    // #region SPECIALTY OPS
    /** Checks if on opposite hemisphere, if so, negate the first quat */
    static dotNegate( out: quat, q: quat, by:quat ): quat{ 
        if( quat.dot( q, by ) < 0 ) this.negate( out, q );
        return out;
    }

    static pmulInvert( out: quat, q: quat, inv: quat ) : quat{
        const qi = quat.invert( [0,0,0,1], inv );
        quat.mul( out, qi, q );
        return out;
    }

    static mulInvert( out: quat, q: quat, inv: quat ) : quat{
        const qi = quat.invert( [0,0,0,1], inv );
        quat.mul( out, q, qi );
        return out;
    }
    // #endregion

    // #region CONVERSIONS

    static polar( out: quat, lon: number, lat: number, up: vec3 = [0,1,0] ) : quat{
        lat = Math.max( Math.min( lat, 89.999999 ), -89.999999 ); // Clamp lat, going to 90+ makes things spring around.

        const phi       = ( 90 - lat ) * 0.01745329251; // PI / 180
        const theta     = lon * 0.01745329251;
        const phi_s	    = Math.sin( phi );
        const v: vec3   = [
            -( phi_s * Math.sin( theta ) ),
            Math.cos( phi ),
            phi_s * Math.cos( theta )
        ];

        return this.look( out, v, up );
    }

    // https://github.com/NASAWorldWind/WorldWindJava/blob/develop/src/gov/nasa/worldwind/geom/Quaternion.java#L306
    static fromEulerXYZ( out: quat, x:number, y:number, z:number ): quat{
        const halfToRad = ( 0.5 * Math.PI ) / 180.0;
        const xx = x * halfToRad;
        const yy = y * halfToRad;
        const zz = z * halfToRad;
        const sx = Math.sin( xx );
        const sy = Math.sin( yy );
        const sz = Math.sin( zz );
        const cx = Math.cos( xx );
        const cy = Math.cos( yy );
        const cz = Math.cos( zz );

        // QX = (sx, 0,  0,  cx)
        // QY = (0,  sy, 0,  cy)
        // QZ = (0,  0,  sz, cz)
        // (QZ * QY * QX)
        out[0] = (sx * cy * cz) - (cx * sy * sz);
        out[1] = (cx * sy * cz) + (sx * cy * sz);
        out[2] = (cx * cy * sz) - (sx * sy * cz);
        out[3] = (cx * cy * cz) + (sx * sy * sz);
        return out;
    }
    
    static fromEulerYXZ( out: quat, x:number, y:number, z:number ): quat{
        const halfToRad = ( 0.5 * Math.PI ) / 180.0;
        const xx = x * halfToRad;
        const yy = y * halfToRad;
        const zz = z * halfToRad;
        const sx = Math.sin( xx );
        const sy = Math.sin( yy );
        const sz = Math.sin( zz );
        const cx = Math.cos( xx );
        const cy = Math.cos( yy );
        const cz = Math.cos( zz );

        // QX = (sx, 0,  0,  cx)
        // QY = (0,  sy, 0,  cy)
        // QZ = (0,  0,  sz, cz)
        // (QY * QX * QZ)

        out[0] = (sx * cy * cz) + (cx * sy * sz);
        out[1] = (cx * sy * cz) - (sx * cy * sz);
        out[2] = (cx * cy * sz) - (sx * sy * cz);
        out[3] = (cx * cy * cz) + (sx * sy * sz);
        return out;
    }

    // https://github.com/NASAWorldWind/WorldWindJava/blob/develop/src/gov/nasa/worldwind/geom/Quaternion.java#L306
    static fromEulerZYX( out: quat, x:number, y:number, z:number ): quat{
        const halfToRad = ( 0.5 * Math.PI ) / 180.0;
        const xx = x * halfToRad;
        const yy = y * halfToRad;
        const zz = z * halfToRad;
        const sx = Math.sin( xx );
        const sy = Math.sin( yy );
        const sz = Math.sin( zz );
        const cx = Math.cos( xx );
        const cy = Math.cos( yy );
        const cz = Math.cos( zz );

        // QX = (sx, 0,  0,  cx)
        // QY = (0,  sy, 0,  cy)
        // QZ = (0,  0,  sz, cz)
        // (QX * QY * QZ)

        out[0] = (sx * cy * cz) + (cx * sy * sz);
        out[1] = (cx * sy * cz) - (sx * cy * sz);
        out[2] = (cx * cy * sz) + (sx * sy * cz);
        out[3] = (cx * cy * cz) - (sx * sy * sz);
        return out;
    }

    static getEulerYZX( out: vec3, q: quat, inDeg: boolean=true ): vec3{ //order="YZX"
        // http://bediyap.com/programming/convert-Quat-to-euler-rotations/
        // http://schteppe.github.io/cannon.js/docs/files/src_math_Quat.js.html
        let pitch !: number; 
        let yaw   !: number;
        let roll  !: number;
        const x     = q[0];
        const y     = q[1];
        const z     = q[2];
        const w     = q[3];
        const test  = x*y + z*w;
        
        //..............................
        // singularity at north pole
        if( test > 0.499 ){ //console.log("North");
            pitch   = 2 * Math.atan2( x, w );
            yaw     = Math.PI / 2;
            roll    = 0;
        }

        //..............................
        // singularity at south pole
        if( test < -0.499 ){ //console.log("South");
            pitch   = -2 * Math.atan2( x, w );
            yaw     = - Math.PI / 2;
            roll    = 0;
        }

        //..............................
        if( isNaN( pitch ) ){ // console.log("isNan");
            const sqz   = z*z;
            roll        = Math.atan2( 2*x*w - 2*y*z , 1 - 2*x*x - 2*sqz );  // bank
            pitch       = Math.atan2( 2*y*w - 2*x*z , 1 - 2*y*y - 2*sqz );  // Heading
            yaw         = Math.asin(  2*test );                             // attitude
        }

        //..............................
        const deg = ( inDeg )? 180 / Math.PI : 1;
        out[ 0 ] = roll  * deg;
        out[ 1 ] = pitch * deg;
        out[ 2 ] = yaw   * deg;
        return out;
    }

    /** Rotation based on 3 Orthoginal Directions */
    static fromAxes( out: quat, xAxis: vec3, yAxis: vec3, zAxis: vec3 ) : quat{
        const m00 = xAxis[0], m01 = xAxis[1], m02 = xAxis[2];
        const m10 = yAxis[0], m11 = yAxis[1], m12 = yAxis[2];
        const m20 = zAxis[0], m21 = zAxis[1], m22 = zAxis[2];
        const t   = m00 + m11 + m22;
        
        let x=0, y=0, z=0, w=0, s=0;

        if(t > 0.0){
            s = Math.sqrt(t + 1.0);
            w = s * 0.5 ; // |w| >= 0.5
            s = 0.5 / s;
            x = (m12 - m21) * s;
            y = (m20 - m02) * s;
            z = (m01 - m10) * s;
        }else if((m00 >= m11) && (m00 >= m22)){
            s = Math.sqrt(1.0 + m00 - m11 - m22);
            x = 0.5 * s;// |x| >= 0.5
            s = 0.5 / s;
            y = (m01 + m10) * s;
            z = (m02 + m20) * s;
            w = (m12 - m21) * s;
        }else if(m11 > m22){
            s = Math.sqrt(1.0 + m11 - m00 - m22);
            y = 0.5 * s; // |y| >= 0.5
            s = 0.5 / s;
            x = (m10 + m01) * s;
            z = (m21 + m12) * s;
            w = (m20 - m02) * s;
        }else{
            s = Math.sqrt(1.0 + m22 - m00 - m11);
            z = 0.5 * s; // |z| >= 0.5
            s = 0.5 / s;
            x = (m20 + m02) * s;
            y = (m21 + m12) * s;
            w = (m01 - m10) * s;
        }

        out[ 0 ] = x;
        out[ 1 ] = y;
        out[ 2 ] = z;
        out[ 3 ] = w;
        return out;
    }

    // #endregion
}



/*
// Try THIS https://allenchou.net/2014/04/game-math-interpolating-quaternions-with-circular-blending/



    public final LatLon getLatLon()
    {
        double latRadians = Math.asin((2.0 * this.y * this.w) - (2.0 * this.x * this.z));
        double lonRadians = Math.atan2((2.0 * this.y * this.z) + (2.0 * this.x * this.w),
                                       (this.w * this.w) - (this.x * this.x) - (this.y * this.y) + (this.z * this.z));
        if (Double.isNaN(latRadians) || Double.isNaN(lonRadians))
            return null;

        return LatLon.fromRadians(latRadians, lonRadians);
    }

 https://github.com/NASAWorldWind/WorldWindJava/blob/develop/src/gov/nasa/worldwind/geom/Quaternion.java#L368
     * Returns a Quaternion created from latitude and longitude rotations.
     * Latitude and longitude can be extracted from a Quaternion by calling
     * {@link #getLatLon}.
     *
     * @param latitude Angle rotation of latitude.
     * @param longitude Angle rotation of longitude.
     * @return Quaternion representing combined latitude and longitude rotation.
     public static Quaternion fromLatLon(Angle latitude, Angle longitude)
    {
        if (latitude == null || longitude == null)
        {
            String msg = Logging.getMessage("nullValue.AngleIsNull");
            Logging.logger().severe(msg);
            throw new IllegalArgumentException(msg);
        }

        double clat = latitude.cosHalfAngle();
        double clon = longitude.cosHalfAngle();
        double slat = latitude.sinHalfAngle();
        double slon = longitude.sinHalfAngle();
        
        // The order in which the lat/lon angles are applied is critical. This can be thought of as multiplying two
        // quaternions together, one for each lat/lon angle. Like matrices, quaternions affect vectors in reverse
        // order. For example, suppose we construct a quaternion
        //     Q = QLat * QLon
        // then transform some vector V by Q. This can be thought of as first transforming V by QLat, then QLon. This
        // means that the order of quaternion multiplication is the reverse of the order in which the lat/lon angles
        // are applied.
        //
        // The ordering below refers to order in which angles are applied.
        //
        // QLat = (0,    slat, 0, clat)
        // QLon = (slon, 0,    0, clon)
        //
        // 1. LatLon Ordering
        // (QLon * QLat)
        // qw = clat * clon;
        // qx = clat * slon;
        // qy = slat * clon;
        // qz = slat * slon;
        //
        // 2. LonLat Ordering
        // (QLat * QLon)
        // qw = clat * clon;
        // qx = clat * slon;
        // qy = slat * clon;
        // qz = - slat * slon;
        //

        double qw = clat * clon;
        double qx = clat * slon;
        double qy = slat * clon;
        double qz = 0.0 - slat * slon;

        return new Quaternion(qx, qy, qz, qw);
    }
*/