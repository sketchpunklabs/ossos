import type { ConstVec3 }   from './Vec3';
import Vec3                 from './Vec3';

export type TQuat     = [number,number,number,number] | Float32Array | Array<number>;
export type ConstQuat = Readonly< TQuat >

export default class Quat extends Array< number >{
    // #region STATIC CONSTANTS
    static LOOKXP = [0,-0.7071067811865475,0,0.7071067811865475];
    static LOOKXN = [0,0.7071067811865475,0,0.7071067811865475];
    static LOOKYP = [0.7071067811865475,0,0,0.7071067811865475];
    static LOOKYN = [-0.7071067811865475,0,0,0.7071067811865475];
    static LOOKZP = [0,-1,0,0];
    static LOOKZN = [0,0,0,1];
    // #endregion

    // #region MAIN
    constructor( v ?: ConstQuat ){
        super( 4 );

        if( v instanceof Quat || v instanceof Float32Array || ( v instanceof Array && v.length == 4 ) ){
            this[ 0 ] = v[ 0 ];
            this[ 1 ] = v[ 1 ];
            this[ 2 ] = v[ 2 ];
            this[ 3 ] = v[ 3 ];
        }else{
            this[ 0 ] = 0;
            this[ 1 ] = 0;
            this[ 2 ] = 0;
            this[ 3 ] = 1;
        }
    }
    // #endregion

    // #region SETTERS / GETTERS
    identity(): this{
        this[ 0 ] = 0;
        this[ 1 ] = 0;
        this[ 2 ] = 0;
        this[ 3 ] = 1;
        return this
    }

    copy( a: ConstQuat ): this{
        this[ 0 ] = a[ 0 ];
        this[ 1 ] = a[ 1 ];
        this[ 2 ] = a[ 2 ];
        this[ 3 ] = a[ 3 ];
        return this
    }

    copyTo( a: TQuat ): this{
        a[ 0 ] = this[ 0 ];
        a[ 1 ] = this[ 1 ];
        a[ 2 ] = this[ 2 ];
        a[ 3 ] = this[ 3 ];
        return this;
    }
    // #endregion

    // #region FROM OPERATORS
    fromMul( a: ConstQuat, b: ConstQuat ) : Quat{
        const ax = a[0], ay = a[1], az = a[2], aw = a[3],
              bx = b[0], by = b[1], bz = b[2], bw = b[3];

        this[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
        this[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
        this[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
        this[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    }
    
    /** Axis must be normlized, Angle in Radians  */
    fromAxisAngle( axis: ConstVec3, rad: number ): this{ 
        const half = rad * 0.5;
        const s    = Math.sin( half );
        this[ 0 ]  = axis[ 0 ] * s;
        this[ 1 ]  = axis[ 1 ] * s;
        this[ 2 ]  = axis[ 2 ] * s;
        this[ 3 ]  = Math.cos( half );
        return this;
    }

    /** Using unit vectors, Shortest swing rotation from Direction A to Direction B  */
    fromSwing( a: ConstVec3, b: ConstVec3 ): this {
        // http://physicsforgames.blogspot.com/2010/03/Quat-tricks.html
        const dot = Vec3.dot( a, b );

        if( dot < -0.999999 ){ // 180 opposites
            const tmp = new Vec3().fromCross( Vec3.LEFT, a );

            if( tmp.len < 0.000001 ) tmp.fromCross( Vec3.UP, a );
            this.fromAxisAngle( tmp.norm(), Math.PI );

        }else if( dot > 0.999999 ){ // Same Direction
            this[ 0 ] = 0;
            this[ 1 ] = 0;
            this[ 2 ] = 0;
            this[ 3 ] = 1;

        }else{
            const v   = Vec3.cross( a, b, [0,0,0] );
            this[ 0 ] = v[ 0 ];
            this[ 1 ] = v[ 1 ];
            this[ 2 ] = v[ 2 ];
            this[ 3 ] = 1 + dot;
            this.norm();
        }

        return this;
    }

    fromInvert( q: ConstQuat ): this{
        const a0  = q[0],
              a1  = q[1],
              a2  = q[2],
              a3  = q[3],
              dot = a0*a0 + a1*a1 + a2*a2 + a3*a3;
        
        if( dot == 0 ){ this[0] = this[1] = this[2] = this[3] = 0; return this; }

        const invDot = 1.0 / dot; // let invDot = dot ? 1.0/dot : 0;
        this[ 0 ]    = -a0 * invDot;
        this[ 1 ]    = -a1 * invDot;
        this[ 2 ]    = -a2 * invDot;
        this[ 3 ]    =  a3 * invDot;
        return this;
    }

    fromLookDir( dir: ConstVec3, up: ConstVec3 = [0,1,0] ): this{
        // Ported to JS from C# example at https://pastebin.com/ubATCxJY
        // TODO, if Dir and Up are equal, a roll happends. Need to find a way to fix this.
        const zAxis	= new Vec3( dir ).norm();                       // Forward
        const xAxis = new Vec3().fromCross( up, zAxis ).norm();     // Right
        const yAxis = new Vec3().fromCross( zAxis, xAxis ).norm();  // Up

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

        this[ 0 ] = x;
        this[ 1 ] = y;
        this[ 2 ] = z;
        this[ 3 ] = w;
        return this;
    }

    fromNBlend( a: ConstQuat, b: ConstQuat, t: number ): this{
        // https://physicsforgames.blogspot.com/2010/02/quaternions.html
        const a_x = a[ 0 ];	// Quaternion From
        const a_y = a[ 1 ];
        const a_z = a[ 2 ];
        const a_w = a[ 3 ];
        const b_x = b[ 0 ];	// Quaternion To
        const b_y = b[ 1 ];
        const b_z = b[ 2 ];
        const b_w = b[ 3 ];
        const dot = a_x*b_x + a_y*b_y + a_z*b_z + a_w*b_w;
        const ti  = 1 - t;

        // if Rotations with a dot less then 0 causes artifacts when lerping,
        // Can fix this by switching the sign of the To Quaternion.
        const s   = ( dot < 0 )? -1 : 1;
        this[ 0 ] = ti * a_x + t * b_x * s;
        this[ 1 ] = ti * a_y + t * b_y * s;
        this[ 2 ] = ti * a_z + t * b_z * s;
        this[ 3 ] = ti * a_w + t * b_w * s;
        return this.norm();
    }

    /** Used to get data from a flat buffer */
    fromBuf( ary: Array<number> | Float32Array, idx: number ): this{
        this[ 0 ] = ary[ idx ];
        this[ 1 ] = ary[ idx + 1 ];
        this[ 2 ] = ary[ idx + 2 ];
        this[ 3 ] = ary[ idx + 3 ];
        return this;
    }

    /** Put data into a flat buffer */
    toBuf( ary : Array<number> | Float32Array, idx: number ): this{ 
        ary[ idx ]     = this[ 0 ];
        ary[ idx + 1 ] = this[ 1 ];
        ary[ idx + 2 ] = this[ 2 ];
        ary[ idx + 3 ] = this[ 3 ];
        return this;
    }

    // /** Create a rotation from eye & target position */
    // lookAt(
    //   out: TVec4,
    //   eye: TVec3, // Position of camera or object
    //   target: TVec3 = [0, 0, 0], // Position to look at
    //   up: TVec3 = [0, 1, 0], // Up direction for orientation
    // ): TVec4 {
    //   // Forward is inverted, will face correct direction when converted
    //   // to a ViewMatrix as it'll invert the Forward direction anyway
    //   const z: TVec3 = vec3.sub([0, 0, 0], eye, target);
    //   const x: TVec3 = vec3.cross([0, 0, 0], up, z);
    //   const y: TVec3 = vec3.cross([0, 0, 0], z, x);
    
    //   vec3.normalize(x, x);
    //   vec3.normalize(y, y);
    //   vec3.normalize(z, z);
    
    //   // Format: column-major, when typed out it looks like row-major
    //   quat.fromMat3(out, [...x, ...y, ...z]);
    //   return quat.normalize(out, out);
    // }
    // #endregion

    // #region OPERATORS
    /** Multiple Quaternion onto this Quaternion */
    mul( q: ConstQuat ): Quat{ 
        const ax = this[0], ay = this[1], az = this[2], aw = this[3],
              bx = q[0],    by = q[1],    bz = q[2],    bw = q[3];
        this[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
        this[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
        this[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
        this[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    }

    /** PreMultiple Quaternions onto this Quaternion */
    pmul( q: ConstQuat ): Quat{
        const ax = q[0],    ay  = q[1],     az = q[2],    aw = q[3],
              bx = this[0], by  = this[1],  bz = this[2], bw = this[3];
        this[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
        this[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
        this[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
        this[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    }

    norm(): this{
        let len =  this[0]**2 + this[1]**2 + this[2]**2 + this[3]**2;
        if( len > 0 ){
            len = 1 / Math.sqrt( len );
            this[ 0 ] *= len;
            this[ 1 ] *= len;
            this[ 2 ] *= len;
            this[ 3 ] *= len;
        }
        return this;
    }

    invert(): Quat{
        const a0  = this[ 0 ],
              a1  = this[ 1 ],
              a2  = this[ 2 ],
              a3  = this[ 3 ],
              dot = a0*a0 + a1*a1 + a2*a2 + a3*a3;
        
        if(dot == 0){ this[0] = this[1] = this[2] = this[3] = 0; return this }

        const invDot = 1.0 / dot; // let invDot = dot ? 1.0/dot : 0;
        this[ 0 ]    = -a0 * invDot;
        this[ 1 ]    = -a1 * invDot;
        this[ 2 ]    = -a2 * invDot;
        this[ 3 ]    =  a3 * invDot;
        return this;
    }

    negate(): Quat{
        this[ 0 ] = -this[ 0 ];
        this[ 1 ] = -this[ 1 ];
        this[ 2 ] = -this[ 2 ];
        this[ 3 ] = -this[ 3 ];
        return this;
    }
    // #endregion

    // #region ROTATIONS
    rotX( rad: number ) : Quat{
        //https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/quat.js
        rad *= 0.5; 

        const ax = this[0], ay = this[1], az = this[2], aw = this[3],
              bx = Math.sin(rad), bw = Math.cos(rad);

        this[0] = ax * bw + aw * bx;
        this[1] = ay * bw + az * bx;
        this[2] = az * bw - ay * bx;
        this[3] = aw * bw - ax * bx;
        return this;
    }

    rotY( rad: number ) : Quat{
        rad *= 0.5; 

        const ax = this[0], ay = this[1], az = this[2], aw = this[3],
              by = Math.sin(rad), bw = Math.cos(rad);

        this[0] = ax * bw - az * by;
        this[1] = ay * bw + aw * by;
        this[2] = az * bw + ax * by;
        this[3] = aw * bw - ay * by;
        return this;
    }

    rotZ( rad: number ) : Quat{
        rad *= 0.5; 

        const ax = this[0], ay = this[1], az = this[2], aw = this[3],
              bz = Math.sin(rad),
              bw = Math.cos(rad);

        this[0] = ax * bw + ay * bz;
        this[1] = ay * bw - ax * bz;
        this[2] = az * bw + aw * bz;
        this[3] = aw * bw - az * bz;
        return this;
    }

    rotDeg( deg: number, axis=0 ) : Quat{
        const rad = deg * Math.PI / 180;
        switch( axis ){
            case 0 : this.rotX( rad ); break;
            case 1 : this.rotY( rad ); break;
            case 2 : this.rotZ( rad ); break;
        }
        return this;
    }
    // #endregion

    // #region SPECIAL OPERATORS
    /** Inverts the quaternion passed in, then pre multiplies to this quaternion. */
    pmulInvert( q: ConstQuat ): this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // q.invert()
        let ax = q[ 0 ],	
            ay = q[ 1 ],
            az = q[ 2 ],
            aw = q[ 3 ];

        const dot = ax*ax + ay*ay + az*az + aw*aw;

        if( dot === 0 ){
            ax = ay = az = aw = 0;
        }else{
            const dot_inv = 1.0 / dot;
            ax = -ax * dot_inv;
            ay = -ay * dot_inv;
            az = -az * dot_inv;
            aw =  aw * dot_inv;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Quat.mul( a, b );
        const bx = this[ 0 ],	
              by = this[ 1 ],
              bz = this[ 2 ],
              bw = this[ 3 ];
        this[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
        this[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
        this[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
        this[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    }

    pmulAxisAngle( axis: ConstVec3, rad: number ): this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Quat.AxisAngle()
        const half = rad * 0.5;
        const s    = Math.sin( half );
        const ax   = axis[ 0 ] * s;
        const ay   = axis[ 1 ] * s;
        const az   = axis[ 2 ] * s;
        const aw   = Math.cos( half );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Quat.mul( a, b );
        const bx = this[ 0 ],	
              by = this[ 1 ],
              bz = this[ 2 ],
              bw = this[ 3 ];
        this[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
        this[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
        this[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
        this[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    }
    // #endregion

    // #region STATIC
    static dot( a: ConstQuat, b: ConstQuat ) : number{ return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; }
    static lenSqr( a: ConstQuat, b: ConstQuat ) : number{ return (a[0]-b[0]) ** 2 + (a[1]-b[1]) ** 2 + (a[2]-b[2]) ** 2 + (a[3]-b[3]) ** 2; }

    static nblend( a: ConstQuat, b: ConstQuat, t: number, out: Quat ): Quat{
        // https://physicsforgames.blogspot.com/2010/02/quaternions.html
        const a_x = a[ 0 ];	// Quaternion From
        const a_y = a[ 1 ];
        const a_z = a[ 2 ];
        const a_w = a[ 3 ];
        const b_x = b[ 0 ];	// Quaternion To
        const b_y = b[ 1 ];
        const b_z = b[ 2 ];
        const b_w = b[ 3 ];
        const dot = a_x*b_x + a_y*b_y + a_z*b_z + a_w*b_w;
        const ti  = 1 - t;

        // if Rotations with a dot less then 0 causes artifacts when lerping,
        // Can fix this by switching the sign of the To Quaternion.
        const s  = ( dot < 0 )? -1 : 1;
        out[ 0 ] = ti * a_x + t * b_x * s;
        out[ 1 ] = ti * a_y + t * b_y * s;
        out[ 2 ] = ti * a_z + t * b_z * s;
        out[ 3 ] = ti * a_w + t * b_w * s;
        return out.norm();
    }

    static slerp( a: ConstQuat, b: ConstQuat, t: number, out: Quat ): Quat{
        // benchmarks: http://jsperf.com/Quat-slerp-implementations
        const ax = a[0], ay = a[1], az = a[2], aw = a[3];
        let   bx = b[0], by = b[1], bz = b[2], bw = b[3];
        let omega, cosom, sinom, scale0, scale1;

        // calc cosine
        cosom = ax * bx + ay * by + az * bz + aw * bw;

        // adjust signs (if necessary)
        if ( cosom < 0.0 ) {
            cosom = -cosom;
            bx = - bx;
            by = - by;
            bz = - bz;
            bw = - bw;
        }

        // calculate coefficients
        if ( (1.0 - cosom) > 0.000001 ) {
            // standard case (slerp)
            omega  = Math.acos(cosom);
            sinom  = Math.sin(omega);
            scale0 = Math.sin((1.0 - t) * omega) / sinom;
            scale1 = Math.sin(t * omega) / sinom;
        }else{
            // "from" and "to" Quats are very close so we can do a linear interpolation
            scale0 = 1.0 - t;
            scale1 = t;
        }

        // calculate final values
        out[ 0 ] = scale0 * ax + scale1 * bx;
        out[ 1 ] = scale0 * ay + scale1 * by;
        out[ 2 ] = scale0 * az + scale1 * bz;
        out[ 3 ] = scale0 * aw + scale1 * bw;

        return out;
    }

    static shortest( from: ConstQuat, to: ConstQuat, out:TQuat ): TQuat{
        // if( Quaternion.Dot(a, b) < 0 ){
        //     return a * Quaternion.Inverse( Multiply(b, -1) );
        // }   else return a * Quaternion.Inverse(b);

        const ax  = from[0], ay = from[1], az = from[2], aw = from[3];
        let   bx  = to[0],   by = to[1],   bz = to[2],   bw = to[3];

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const dot = ax * bx + ay * by + az * bz + aw * bw;
        if( dot < 0 ){
            // quat.negate
            bx = -bx;
            by = -by;
            bz = -bz;
            bw = -bw;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // quat.invert
        const d = bx*bx + by*by + bz*bz + bw*bw;
        if( d === 0 ){
            bx = 0;
            by = 0;
            bz = 0;
            bw = 0;
        }else{
            const di = 1.0 / d;
            bx    = -bx * di;
            by    = -by * di;
            bz    = -bz * di;
            bw    =  bw * di;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // quat.mul
        out[ 0 ] = ax * bw + aw * bx + ay * bz - az * by;
        out[ 1 ] = ay * bw + aw * by + az * bx - ax * bz;
        out[ 2 ] = az * bw + aw * bz + ax * by - ay * bx;
        out[ 3 ] = aw * bw - ax * bx - ay * by - az * bz;
        return out;
    }

    // // https://pastebin.com/66qSCKcZ
    // // https://forum.unity.com/threads/manually-calculate-angular-velocity-of-gameobject.289462/#post-4302796
    // static angularVelocity( foreLastFrameRotation: ConstQuat, lastFrameRotation: ConstQuat): TVec3{
    //     var q = lastFrameRotation * Quaternion.Inverse(foreLastFrameRotation);
        
    //     // no rotation?
    //     // You may want to increase this closer to 1 if you want to handle very small rotations.
    //     // Beware, if it is too close to one your answer will be Nan
    //     if ( Mathf.Abs(q.w) > 1023.5f / 1024.0f ) return [0,0,0]; Vector3.zero;
        
    //     float gain;
    //     // handle negatives, we could just flip it but this is faster
    //     if( q.w < 0.0f ){
    //         var angle = Mathf.Acos(-q.w);
    //         gain = -2.0f * angle / (Mathf.Sin(angle) * Time.deltaTime);
    //     }else{
    //         var angle = Mathf.Acos(q.w);
    //         gain = 2.0f * angle / (Mathf.Sin(angle) * Time.deltaTime);
    //     }

    //     Vector3 angularVelocity = new Vector3(q.x * gain, q.y * gain, q.z * gain);

    //     if(float.IsNaN(angularVelocity.z)) angularVelocity = Vector3.zero;

    //     return angularVelocity;
    // }
    // #endregion

}


// https://gist.github.com/maxattack/4c7b4de00f5c1b95a33b
/*
public static Quaternion IntegrateRotation(Quaternion Rotation, Vector3 AngularVelocity, float DeltaTime) {
    if (DeltaTime < Mathf.Epsilon) return Rotation;
    var Deriv = AngVelToDeriv(Rotation, AngularVelocity);
    var Pred = new Vector4(
            Rotation.x + Deriv.x * DeltaTime,
            Rotation.y + Deriv.y * DeltaTime,
            Rotation.z + Deriv.z * DeltaTime,
            Rotation.w + Deriv.w * DeltaTime
    ).normalized;
    return new Quaternion(Pred.x, Pred.y, Pred.z, Pred.w);
}

public static Quaternion AngVelToDeriv(Quaternion Current, Vector3 AngVel) {
    var Spin = new Quaternion(AngVel.x, AngVel.y, AngVel.z, 0f);
    var Result = Spin * Current;
    return new Quaternion(0.5f * Result.x, 0.5f * Result.y, 0.5f * Result.z, 0.5f * Result.w);
} 

public static Vector3 DerivToAngVel(Quaternion Current, Quaternion Deriv) {
    var Result = Deriv * Quaternion.Inverse(Current);
    return new Vector3(2f * Result.x, 2f * Result.y, 2f * Result.z);
}
*/