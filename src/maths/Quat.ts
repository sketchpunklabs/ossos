import type { ConstVec3 }   from './Vec3';
import Vec3                 from './Vec3';

export type TQuat     = [number,number,number,number] | Float32Array | Array<number>;
export type ConstQuat = Readonly<TQuat>

export default class Quat extends Array<number>{

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
    // #endregion

}