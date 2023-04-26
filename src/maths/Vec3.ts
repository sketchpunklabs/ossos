import type { ConstQuat } from './Quat';

export type TVec3     = [number,number,number] | Float32Array | Array<number> | number[];
export type ConstVec3 = Readonly< TVec3 >;

export default class Vec3 extends Array< number >{
    // #region STATIC PROPERTIES
    static UP       = [  0,  1,  0 ];
    static DOWN     = [  0, -1,  0 ];
    static LEFT     = [ -1,  0,  0 ];
    static RIGHT    = [  1,  0,  0 ];
    static FORWARD  = [  0,  0,  1 ];
    static BACK     = [  0,  0, -1 ];
    // #endregion

    // #region MAIN 
    constructor()
    constructor( v: TVec3 | ConstVec3 )
    constructor( v: number )
    constructor( x: number, y: number, z: number )
    constructor( v ?: TVec3 | ConstVec3 | number, y ?: number, z ?: number ){
        super( 3 );
        
        if( v instanceof Vec3 || v instanceof Float32Array || ( v instanceof Array && v.length == 3 )){
            this[ 0 ] = v[ 0 ]; 
            this[ 1 ] = v[ 1 ]; 
            this[ 2 ] = v[ 2 ];
        }else if( typeof v === 'number' && typeof y === 'number' && typeof z === 'number' ){
            this[ 0 ] = v
            this[ 1 ] = y; 
            this[ 2 ] = z;
        }else if( typeof v === 'number' ){
            this[ 0 ] = v;
            this[ 1 ] = v;
            this[ 2 ] = v;
        }else{
            this[ 0 ] = 0;
            this[ 1 ] = 0;
            this[ 2 ] = 0;
        }
    }
    // #endregion

    // #region GETTERS
    get len(): number{ return Math.sqrt( this[ 0 ]**2 + this[ 1 ]**2 + this[ 2 ]**2 ); }
    get lenSqr(): number{ return  this[ 0 ]**2 + this[ 1 ]**2 + this[ 2 ]**2; }
    // #endregion

    // #region SETTERS
    xyz( x:number, y:number, z:number ): this{
        this[ 0 ] = x;
        this[ 1 ] = y;
        this[ 2 ] = z;
        return this
    }

    copy( a: ConstVec3 ): this{
        this[ 0 ] = a[ 0 ];
        this[ 1 ] = a[ 1 ];
        this[ 2 ] = a[ 2 ];
        return this
    }
    
    setInfinite( sign:number=1 ): this{
        this[ 0 ] = Infinity * sign;
        this[ 1 ] = Infinity * sign;
        this[ 2 ] = Infinity * sign;
        return this
    }

    /** Generate a random vector. Can choose per axis range */
    rnd( x0=0, x1=1, y0=0, y1=1, z0=0, z1=1 ): this{
        let t;
        t = Math.random(); this[ 0 ] = x0 * (1-t) + x1 * t;
        t = Math.random(); this[ 1 ] = y0 * (1-t) + y1 * t;
        t = Math.random(); this[ 2 ] = z0 * (1-t) + z1 * t;
        return this;
    }
    // #endregion

    // #region FROM OPERATORS
    fromAdd( a: ConstVec3, b: ConstVec3 ): this{
        this[ 0 ] = a[ 0 ] + b[ 0 ];
        this[ 1 ] = a[ 1 ] + b[ 1 ];
        this[ 2 ] = a[ 2 ] + b[ 2 ];
        return this;
    }

    fromSub( a: ConstVec3, b: ConstVec3 ): this{
        this[ 0 ] = a[ 0 ] - b[ 0 ];
        this[ 1 ] = a[ 1 ] - b[ 1 ];
        this[ 2 ] = a[ 2 ] - b[ 2 ];
        return this;
    }

    fromMul( a: ConstVec3, b: ConstVec3 ): Vec3{
        this[ 0 ] = a[ 0 ] * b[ 0 ];
        this[ 1 ] = a[ 1 ] * b[ 1 ];
        this[ 2 ] = a[ 2 ] * b[ 2 ];
        return this;
    }

    fromCross( a: ConstVec3, b: ConstVec3 ): this{
        const ax = a[0], ay = a[1], az = a[2],
              bx = b[0], by = b[1], bz = b[2];

        this[ 0 ] = ay * bz - az * by;
        this[ 1 ] = az * bx - ax * bz;
        this[ 2 ] = ax * by - ay * bx;
        return this;
    }

    fromNegate( a: ConstVec3 ): this{
        this[ 0 ] = -a[ 0 ]; 
        this[ 1 ] = -a[ 1 ];
        this[ 2 ] = -a[ 2 ];
        return this;
    }

    fromInvert( a: ConstVec3 ): this{
        this[ 0 ] = 1 / a[0];
        this[ 1 ] = 1 / a[1];
        this[ 2 ] = 1 / a[2];
        return this;
    }

    fromQuat( q: ConstQuat, v: ConstVec3=[0,0,1] ): this{ return this.copy( v ).transformQuat( q ); }

    fromLerp( a: ConstVec3, b: ConstVec3, t: number ): this{
        const ti  = 1 - t;
        this[ 0 ] = a[ 0 ] * ti + b[ 0 ] * t;
        this[ 1 ] = a[ 1 ] * ti + b[ 1 ] * t;
        this[ 2 ] = a[ 2 ] * ti + b[ 2 ] * t;
        return this;
    }
    // #endregion

    // #region LOADING / CONVERSION
    /** Used to get data from a flat buffer */
    fromBuf( ary: Array<number> | Float32Array, idx: number ): this{
        this[ 0 ] = ary[ idx ];
        this[ 1 ] = ary[ idx + 1 ];
        this[ 2 ] = ary[ idx + 2 ];
        return this;
    }

    /** Put data into a flat buffer */
    toBuf( ary : Array<number> | Float32Array, idx: number ): this{ 
        ary[ idx ]     = this[ 0 ];
        ary[ idx + 1 ] = this[ 1 ];
        ary[ idx + 2 ] = this[ 2 ];
        return this;
    }
    // #endregion

    // #region OPERATORS
    add( a: ConstVec3 ): this{
        this[ 0 ] += a[ 0 ];
        this[ 1 ] += a[ 1 ];
        this[ 2 ] += a[ 2 ];
        return this;
    }

    sub( v: ConstVec3 ): this{
        this[ 0 ] -= v[ 0 ];
        this[ 1 ] -= v[ 1 ];
        this[ 2 ] -= v[ 2 ];
        return this;
    }

    mul( v: ConstVec3 ): this{
        this[ 0 ] *= v[ 0 ];
        this[ 1 ] *= v[ 1 ];
        this[ 2 ] *= v[ 2 ];
        return this;
    }

    scale( v: number ): this{
        this[ 0 ] *= v;
        this[ 1 ] *= v;
        this[ 2 ] *= v;
        return this;
    }

    addScaled( a: ConstVec3, s: number ): this{
        this[ 0 ] += a[ 0 ] * s;
        this[ 1 ] += a[ 1 ] * s;
        this[ 2 ] += a[ 2 ] * s;
        return this;
    }

    invert(): this{
        this[0] = 1 / this[0];
        this[1] = 1 / this[1];
        this[2] = 1 / this[2];
        return this;
    }

    norm(): this{
        let mag = Math.sqrt( this[0]**2 + this[1]**2 + this[2]**2 );
        if( mag != 0 ){
            mag      = 1 / mag;
            this[ 0 ] *= mag;
            this[ 1 ] *= mag;
            this[ 2 ] *= mag;
        }
        return this;
    }

    cross( b: ConstVec3 ): this{
        const ax = this[0], ay = this[1], az = this[2],
              bx = b[0],    by = b[1],    bz = b[2];

        this[ 0 ] = ay * bz - az * by;
        this[ 1 ] = az * bx - ax * bz;
        this[ 2 ] = ax * by - ay * bx;
        return this;
    }

    abs(): this{ 
        this[ 0 ] = Math.abs( this[ 0 ] );
        this[ 1 ] = Math.abs( this[ 1 ] );
        this[ 2 ] = Math.abs( this[ 2 ] );
        return this;
    }

    floor(): this{
        this[ 0 ] = Math.floor( this[ 0 ] );
        this[ 1 ] = Math.floor( this[ 1 ] );
        this[ 2 ] = Math.floor( this[ 2 ] );
        return this;
    }

    ceil(): this{
        this[ 0 ] = Math.ceil( this[ 0 ] );
        this[ 1 ] = Math.ceil( this[ 1 ] );
        this[ 2 ] = Math.ceil( this[ 2 ] );
        return this;
    }

    min( a: ConstVec3 ) : this{
        this[ 0 ] = Math.min( this[ 0 ], a[ 0 ] );
        this[ 1 ] = Math.min( this[ 1 ], a[ 1 ] );
        this[ 2 ] = Math.min( this[ 2 ], a[ 2 ] );
        return this;
    }

    max( a: ConstVec3 ) : this{
        this[ 0 ] = Math.max( this[ 0 ], a[ 0 ] );
        this[ 1 ] = Math.max( this[ 1 ], a[ 1 ] );
        this[ 2 ] = Math.max( this[ 2 ], a[ 2 ] );
        return this;
    }

    /** When values are very small, like less then 0.000001, just make it zero */
    nearZero(): this{
        if( Math.abs( this[ 0 ] ) <= 1e-6 ) this[ 0 ] = 0;
        if( Math.abs( this[ 1 ] ) <= 1e-6 ) this[ 1 ] = 0;
        if( Math.abs( this[ 2 ] ) <= 1e-6 ) this[ 2 ] = 0;
        return this;
    }

    negate(): this{
        this[ 0 ] = -this[ 0 ];
        this[ 1 ] = -this[ 1 ];
        this[ 2 ] = -this[ 2 ];
        return this;
    }

    clamp( min: ConstVec3, max: ConstVec3 ): this{
        this[ 0 ] = Math.min( Math.max( this[ 0 ], min[ 0 ] ), max[ 0 ] );
        this[ 1 ] = Math.min( Math.max( this[ 1 ], min[ 1 ] ), max[ 1 ] );
        this[ 2 ] = Math.min( Math.max( this[ 2 ], min[ 2 ] ), max[ 2 ] );
        return this;
    }

    dot( b: ConstVec3 ): number{ return this[ 0 ] * b[ 0 ] + this[ 1 ] * b[ 1 ] + this[ 2 ] * b[ 2 ]; } 
    // #endregion

    // #region TRANFORMS
    transformQuat( q: ConstQuat ): this{ 
        const qx = q[ 0 ],    qy = q[ 1 ],    qz = q[ 2 ], qw = q[ 3 ],
              vx = this[ 0 ], vy = this[ 1 ], vz = this[ 2 ],
              x1 = qy * vz - qz * vy,
              y1 = qz * vx - qx * vz,
              z1 = qx * vy - qy * vx,
              x2 = qw * x1 + qy * z1 - qz * y1,
              y2 = qw * y1 + qz * x1 - qx * z1,
              z2 = qw * z1 + qx * y1 - qy * x1;
        this[ 0 ] = vx + 2 * x2;
        this[ 1 ] = vy + 2 * y2;
        this[ 2 ] = vz + 2 * z2;
        return this;
    }

    axisAngle( axis: ConstVec3, rad: number ): this{
        // Rodrigues Rotation formula:
        // v_rot = v * cos(theta) + cross( axis, v ) * sin(theta) + axis * dot( axis, v) * (1-cos(theta))
        const cp  = new Vec3().fromCross( axis, this ),
              dot = Vec3.dot( axis, this ),
              s   = Math.sin(rad),
              c   = Math.cos(rad),
              ci  = 1 - c;

        this[ 0 ] = this[ 0 ] * c + cp[ 0 ] * s + axis[ 0 ] * dot * ci;
        this[ 1 ] = this[ 1 ] * c + cp[ 1 ] * s + axis[ 1 ] * dot * ci;
        this[ 2 ] = this[ 2 ] * c + cp[ 2 ] * s + axis[ 2 ] * dot * ci;
        return this;
    }

    rotate( rad: number, axis="x" ): this{
        // https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/3drota.htm
        const sin = Math.sin( rad ),
              cos = Math.cos( rad ),
              x   = this[ 0 ],
              y   = this[ 1 ],
              z   = this[ 2 ];

        switch( axis ){
            case "y": //..........................
                this[ 0 ] = z * sin + x * cos; //x
                this[ 2 ] = z * cos - x * sin; //z
            break;
            case "x": //..........................
                this[ 1 ] = y * cos - z * sin; //y
                this[ 2 ] = y * sin + z * cos; //z
            break;
            case "z": //..........................
                this[ 0 ] = x * cos - y * sin; //x
                this[ 1 ] = x * sin + y * cos; //y
            break;
        }

        return this;
    }
    // #endregion

    // #region STATIC    
    static len( a: ConstVec3 ): number{ return Math.sqrt( a[ 0 ]**2 + a[ 1 ]**2 + a[ 2 ]** 2 ); }
    static lenSqr( a: ConstVec3 ): number{ return a[ 0 ]**2 + a[ 1 ]**2 + a[ 2 ]** 2; }

    static dist( a: ConstVec3, b: ConstVec3 ): number{ return Math.sqrt( (a[ 0 ]-b[ 0 ]) ** 2 + (a[ 1 ]-b[ 1 ]) ** 2 + (a[ 2 ]-b[ 2 ]) ** 2 ); }
    static distSqr( a: TVec3, b: TVec3 ): number{ return (a[ 0 ]-b[ 0 ]) ** 2 + (a[ 1 ]-b[ 1 ]) ** 2 + (a[ 2 ]-b[ 2 ]) ** 2; }

    static dot( a: ConstVec3, b: ConstVec3 ): number { return a[ 0 ] * b[ 0 ] + a[ 1 ] * b[ 1 ] + a[ 2 ] * b[ 2 ]; }
    static cross( a: ConstVec3, b: ConstVec3, out: TVec3 = new Vec3() ): TVec3{
        const ax = a[0], ay = a[1], az = a[2],
              bx = b[0], by = b[1], bz = b[2];

        out[ 0 ] = ay * bz - az * by;
        out[ 1 ] = az * bx - ax * bz;
        out[ 2 ] = ax * by - ay * bx;
        return out;
    }

    static scaleThenAdd( scale: number, a: ConstVec3, b: ConstVec3, out:TVec3 = new Vec3() ) {
        out[0] = a[0] * scale + b[0];
        out[1] = a[1] * scale + b[1];
        out[2] = a[2] * scale + b[2];
        return out;
    }

    static fromQuat( q: ConstQuat, v: ConstVec3=[0,0,1] ): Vec3{ return new Vec3( v ).transformQuat( q ); }

    /*
    static smoothDamp( cur: ConstVec3, tar: ConstVec3, vel: TVec3, dt: number, smoothTime: number = 0.25, maxSpeed: number = Infinity ): TVec3{
        // Based on Game Programming Gems 4 Chapter 1.10
        smoothTime   = Math.max( 0.0001, smoothTime );
        const omega  = 2 / smoothTime;
        const x      = omega * dt;
        const exp    = 1 / ( 1 + x + 0.48 * x * x + 0.235 * x * x * x );
    
        const change = vec3.sub( [0,0,0], cur, tar );
    
        // Clamp maximum speed
        const maxChange   = maxSpeed * smoothTime;
        const maxChangeSq = maxChange * maxChange;
        const magnitudeSq = change[0]**2 + change[1]**2 + change[2]**2;
    
        if( magnitudeSq > maxChangeSq ){
            const magnitude = Math.sqrt( magnitudeSq );
            vec3.scale( change, change, 1 / (magnitude * maxChange ) );
        }
    
        const diff = vec3.sub( [0,0,0], cur, change );
    
        // const tempX = ( velocity.x + omega * changeX ) * deltaTime;
        const temp  = vec3.scaleAndAdd( [0,0,0], vel, change, omega );
        vec3.scale( temp, temp, dt );
    
        // velocityR.x = ( velocity.x - omega * tempX ) * exp;
        vec3.scaleAndAdd( vel, vel, temp, -omega );
        vec3.scale( vel, vel, exp );
    
        // out.x = targetX + ( changeX + tempX ) * exp;
        const out = vec3.add( [0,0,0], change, temp );
        vec3.scale( out, out, exp );
        vec3.add( out, diff, out );
    
        // Prevent overshooting
        const origMinusCurrent = vec3.sub( [0,0,0], tar, cur );
        const outMinusOrig     = vec3.sub( [0,0,0], out, tar );
        if( origMinusCurrent[0] * outMinusOrig[0] + origMinusCurrent[1] * outMinusOrig[1] +  origMinusCurrent[2] * outMinusOrig[2] > -0.00001 ){
            vec3.copy( out, tar );
            vec3.copy( vel, [0,0,0] );
        }
    
        return out;
    }
    */

    // #endregion
}