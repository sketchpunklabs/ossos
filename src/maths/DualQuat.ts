

class DualQuat extends Array< number >{
    // #region STATIC VALUES
    static BYTESIZE = 8 * Float32Array.BYTES_PER_ELEMENT;
    // #endregion

    // #region CONSTRUCTORS 
    constructor()
    constructor( q: TVec4 )
    constructor( q: TVec4, t: TVec3 )
    constructor( q?: TVec4, t?: TVec3 ){
        super( 8 );

        if( q && t ) this.fromQuatTran( q, t );
        else if( q ){
            this[ 0 ] = q[ 0 ];
            this[ 1 ] = q[ 1 ];
            this[ 2 ] = q[ 2 ];
            this[ 3 ] = q[ 3 ];
        }else this[ 3 ] = 1;
    }
    // #endregion

    // #region BASIC SETTERS / GETTERS

    reset() : this{
        this[0] = 0;
        this[1] = 0;
        this[2] = 0;
        this[3] = 1;
        this[4] = 0;
        this[5] = 0;
        this[6] = 0;
        this[7] = 0;
        return this;
    }

    clone() : DualQuat{
        const out = new DualQuat();
        out[0] = this[0];
        out[1] = this[1];
        out[2] = this[2];
        out[3] = this[3];
        out[4] = this[4];
        out[5] = this[5];
        out[6] = this[6];
        out[7] = this[7];
        return out;
    }

    copy( a : TVec8 ) : this{
        this[0] = a[0];
        this[1] = a[1];
        this[2] = a[2];
        this[3] = a[3];
        this[4] = a[4];
        this[5] = a[5];
        this[6] = a[6];
        this[7] = a[7];
        return this;
    }

    lenSqr() : number{ return this[0]*this[0] + this[1]*this[1] + this[2]*this[2] + this[3]*this[3]; }

    //----------------------------------------------------
    /** DUAL Part of DQ */
    getTranslation( out ?: TVec3 ) : TVec3{
        const ax =  this[4], ay =  this[5], az =  this[6], aw = this[7],
              bx = -this[0], by = -this[1], bz = -this[2], bw = this[3];

        out    = out || new Array(3);
        out[0] = ( ax * bw + aw * bx + ay * bz - az * by ) * 2;
        out[1] = ( ay * bw + aw * by + az * bx - ax * bz ) * 2;
        out[2] = ( az * bw + aw * bz + ax * by - ay * bx ) * 2;
        return out;
    }

    /** REAL Part of DQ */
    getQuat( out ?: TVec4 ) : TVec4{
        out      = out || [0,0,0,0];
        out[ 0 ] = this[ 0 ];
        out[ 1 ] = this[ 1 ];
        out[ 2 ] = this[ 2 ];
        out[ 3 ] = this[ 3 ];
        return out;
    }

    //----------------------------------------------------
    // FLAT BUFFERS

    /** Used to get data from a flat buffer of dualquat */
    fromBuf( ary : Array<number> | Float32Array, idx: number ) : this {
        this[ 0 ]  = ary[ idx ];
        this[ 1 ]  = ary[ idx + 1 ];
        this[ 2 ]  = ary[ idx + 2 ];
        this[ 3 ]  = ary[ idx + 3 ];
        this[ 4 ]  = ary[ idx + 4 ];
        this[ 5 ]  = ary[ idx + 5 ];
        this[ 6 ]  = ary[ idx + 6 ];
        this[ 7 ]  = ary[ idx + 7 ];
        return this;
    }

    /** Put data into a flat buffer of dualquat */
    toBuf( ary : Array<number> | Float32Array, idx: number ) : this { 
        ary[ idx ]      = this[ 0 ];
        ary[ idx + 1 ]  = this[ 1 ];
        ary[ idx + 2 ]  = this[ 2 ];
        ary[ idx + 3 ]  = this[ 3 ];
        ary[ idx + 4 ]  = this[ 4 ];
        ary[ idx + 5 ]  = this[ 5 ];
        ary[ idx + 6 ]  = this[ 6 ];
        ary[ idx + 7 ]  = this[ 7 ];
        return this;
    }

    // #endregion

    // #region FROM SETTERS
    /** Create a DualQuat from Quaternion and Translation Vector */
    fromQuatTran( q: TVec4, t: TVec4 ) : this {
        const ax = t[0] * 0.5, ay = t[1] * 0.5, az = t[2] * 0.5,
              bx = q[0],       by = q[1],       bz = q[2],       bw = q[3];

        this[0] = bx;
        this[1] = by;
        this[2] = bz;
        this[3] = bw;
        this[4] =  ax * bw + ay * bz - az * by;
        this[5] =  ay * bw + az * bx - ax * bz;
        this[6] =  az * bw + ax * by - ay * bx;
        this[7] = -ax * bx - ay * by - az * bz;
        return this;
    }

    fromTranslation( t: TVec3 ) : this{
        this[0] = 0;
        this[1] = 0;
        this[2] = 0;
        this[3] = 1;
        this[4] = t[0] * 0.5;
        this[5] = t[1] * 0.5;
        this[6] = t[2] * 0.5;
        this[7] = 0;
        return this;
    }

    fromQuat( q: TVec4 ) : this{
        this[0] = q[0];
        this[1] = q[1];
        this[2] = q[2];
        this[3] = q[3];
        this[4] = 0;
        this[5] = 0;
        this[6] = 0;
        this[7] = 0;
        return this;
    }

    fromMul( a: TVec8, b: TVec8 ) : this{
        const ax0 = a[0], ay0 = a[1], az0 = a[2], aw0 = a[3],
                ax1 = a[4], ay1 = a[5], az1 = a[6], aw1 = a[7],
                bx0 = b[0], by0 = b[1], bz0 = b[2], bw0 = b[3],
                bx1 = b[4], by1 = b[5], bz1 = b[6], bw1 = b[7];

        this[0] = ax0 * bw0 + aw0 * bx0 + ay0 * bz0 - az0 * by0;
        this[1] = ay0 * bw0 + aw0 * by0 + az0 * bx0 - ax0 * bz0;
        this[2] = az0 * bw0 + aw0 * bz0 + ax0 * by0 - ay0 * bx0;
        this[3] = aw0 * bw0 - ax0 * bx0 - ay0 * by0 - az0 * bz0;
        this[4] = ax0 * bw1 + aw0 * bx1 + ay0 * bz1 - az0 * by1 + ax1 * bw0 + aw1 * bx0 + ay1 * bz0 - az1 * by0;
        this[5] = ay0 * bw1 + aw0 * by1 + az0 * bx1 - ax0 * bz1 + ay1 * bw0 + aw1 * by0 + az1 * bx0 - ax1 * bz0;
        this[6] = az0 * bw1 + aw0 * bz1 + ax0 * by1 - ay0 * bx1 + az1 * bw0 + aw1 * bz0 + ax1 * by0 - ay1 * bx0;
        this[7] = aw0 * bw1 - ax0 * bx1 - ay0 * by1 - az0 * bz1 + aw1 * bw0 - ax1 * bx0 - ay1 * by0 - az1 * bz0;
        return this;
    }

    fromNorm( a: TVec8 ) : this {
        let magnitude = a[0]**2 + a[1]**2 + a[2]**2 + a[3]**2;
        if( magnitude == 0 ) return this;

        magnitude = 1 / Math.sqrt( magnitude );
    
        const a0 = a[0] * magnitude;
        const a1 = a[1] * magnitude;
        const a2 = a[2] * magnitude;
        const a3 = a[3] * magnitude;
    
        const b0 = a[4];
        const b1 = a[5];
        const b2 = a[6];
        const b3 = a[7];
    
        const a_dot_b = (a0 * b0) + (a1 * b1) + (a2 * b2) + (a3 * b3);
    
        this[0] = a0;
        this[1] = a1;
        this[2] = a2;
        this[3] = a3;
    
        this[4] = ( b0 - (a0 * a_dot_b) ) * magnitude;
        this[5] = ( b1 - (a1 * a_dot_b) ) * magnitude;
        this[6] = ( b2 - (a2 * a_dot_b) ) * magnitude;
        this[7] = ( b3 - (a3 * a_dot_b) ) * magnitude;

        return this;
    }

    /** Calculates the inverse of a dual quat. If they are normalized, conjugate is cheaper */
    fromInvert( a: DualQuat ) : this{
        const sqlen = 1 / a.lenSqr();
        this[0] = -a[0] * sqlen;
        this[1] = -a[1] * sqlen;
        this[2] = -a[2] * sqlen;
        this[3] =  a[3] * sqlen;
        this[4] = -a[4] * sqlen;
        this[5] = -a[5] * sqlen;
        this[6] = -a[6] * sqlen;
        this[7] =  a[7] * sqlen;
        return this;
    }

    /** If dual quaternion is normalized, this is faster than inverting and produces the same value. */
    fromConjugate( a: TVec8 ) : this {
        this[0] = -a[0];
        this[1] = -a[1];
        this[2] = -a[2];
        this[3] =  a[3];
        this[4] = -a[4];
        this[5] = -a[5];
        this[6] = -a[6];
        this[7] =  a[7];
        return this;
    }

    // #endregion

    // #region BASIC OPERATIONS

    add( q: TVec8 ) : this{
        this[0] = this[0] + q[0];
        this[1] = this[1] + q[1];
        this[2] = this[2] + q[2];
        this[3] = this[3] + q[3];
        this[4] = this[4] + q[4];
        this[5] = this[5] + q[5];
        this[6] = this[6] + q[6];
        this[7] = this[7] + q[7];
        return this;
    }

    mul( q: TVec8 ) : this{
        const   ax0 = this[0], ay0 = this[1], az0 = this[2], aw0 = this[3],
                ax1 = this[4], ay1 = this[5], az1 = this[6], aw1 = this[7],
                bx0 = q[0],    by0 = q[1],    bz0 = q[2],    bw0 = q[3],
                bx1 = q[4],    by1 = q[5],    bz1 = q[6],    bw1 = q[7];
        this[0] = ax0 * bw0 + aw0 * bx0 + ay0 * bz0 - az0 * by0;
        this[1] = ay0 * bw0 + aw0 * by0 + az0 * bx0 - ax0 * bz0;
        this[2] = az0 * bw0 + aw0 * bz0 + ax0 * by0 - ay0 * bx0;
        this[3] = aw0 * bw0 - ax0 * bx0 - ay0 * by0 - az0 * bz0;
        this[4] = ax0 * bw1 + aw0 * bx1 + ay0 * bz1 - az0 * by1 + ax1 * bw0 + aw1 * bx0 + ay1 * bz0 - az1 * by0;
        this[5] = ay0 * bw1 + aw0 * by1 + az0 * bx1 - ax0 * bz1 + ay1 * bw0 + aw1 * by0 + az1 * bx0 - ax1 * bz0;
        this[6] = az0 * bw1 + aw0 * bz1 + ax0 * by1 - ay0 * bx1 + az1 * bw0 + aw1 * bz0 + ax1 * by0 - ay1 * bx0;
        this[7] = aw0 * bw1 - ax0 * bx1 - ay0 * by1 - az0 * bz1 + aw1 * bw0 - ax1 * bx0 - ay1 * by0 - az1 * bz0;
        return this;
    }

    pmul( q: TVec8 ) : this{
        const ax0 = q[0],    ay0 = q[1],    az0 = q[2],    aw0 = q[3],
              ax1 = q[4],    ay1 = q[5],    az1 = q[6],    aw1 = q[7],
              bx0 = this[0], by0 = this[1], bz0 = this[2], bw0 = this[3],
              bx1 = this[4], by1 = this[5], bz1 = this[6], bw1 = this[7];

        this[0] = ax0 * bw0 + aw0 * bx0 + ay0 * bz0 - az0 * by0;
        this[1] = ay0 * bw0 + aw0 * by0 + az0 * bx0 - ax0 * bz0;
        this[2] = az0 * bw0 + aw0 * bz0 + ax0 * by0 - ay0 * bx0;
        this[3] = aw0 * bw0 - ax0 * bx0 - ay0 * by0 - az0 * bz0;
        this[4] = ax0 * bw1 + aw0 * bx1 + ay0 * bz1 - az0 * by1 + ax1 * bw0 + aw1 * bx0 + ay1 * bz0 - az1 * by0;
        this[5] = ay0 * bw1 + aw0 * by1 + az0 * bx1 - ax0 * bz1 + ay1 * bw0 + aw1 * by0 + az1 * bx0 - ax1 * bz0;
        this[6] = az0 * bw1 + aw0 * bz1 + ax0 * by1 - ay0 * bx1 + az1 * bw0 + aw1 * bz0 + ax1 * by0 - ay1 * bx0;
        this[7] = aw0 * bw1 - ax0 * bx1 - ay0 * by1 - az0 * bz1 + aw1 * bw0 - ax1 * bx0 - ay1 * by0 - az1 * bz0;
        return this;
    }

    scale( s: number ) : this{
        this[0] = this[0] * s;
        this[1] = this[1] * s;
        this[2] = this[2] * s;
        this[3] = this[3] * s;
        this[4] = this[4] * s;
        this[5] = this[5] * s;
        this[6] = this[6] * s;
        this[7] = this[7] * s;
        return this;
    }

    norm() : this {
        let magnitude = this[0]**2 + this[1]**2 + this[2]**2 + this[3]**2;
        if( magnitude == 0 ) return this;

        magnitude = 1 / Math.sqrt( magnitude );
    
        const a0 = this[0] * magnitude;
        const a1 = this[1] * magnitude;
        const a2 = this[2] * magnitude;
        const a3 = this[3] * magnitude;
    
        const b0 = this[4];
        const b1 = this[5];
        const b2 = this[6];
        const b3 = this[7];
    
        const a_dot_b = (a0 * b0) + (a1 * b1) + (a2 * b2) + (a3 * b3);
    
        this[0] = a0;
        this[1] = a1;
        this[2] = a2;
        this[3] = a3;
    
        this[4] = ( b0 - (a0 * a_dot_b) ) * magnitude;
        this[5] = ( b1 - (a1 * a_dot_b) ) * magnitude;
        this[6] = ( b2 - (a2 * a_dot_b) ) * magnitude;
        this[7] = ( b3 - (a3 * a_dot_b) ) * magnitude;

        return this;
    }

    /** Calculates the inverse of a dual quat. If they are normalized, conjugate is cheaper */
    invert() : this{
        const sqlen = 1 / this.lenSqr();

        this[0] = -this[0] * sqlen;
        this[1] = -this[1] * sqlen;
        this[2] = -this[2] * sqlen;
        this[3] =  this[3] * sqlen;
        this[4] = -this[4] * sqlen;
        this[5] = -this[5] * sqlen;
        this[6] = -this[6] * sqlen;
        this[7] =  this[7] * sqlen;
        return this;
    }

    /** If dual quaternion is normalized, this is faster than inverting and produces the same value. */
    conjugate() : this {
       this[0] = -this[0];
       this[1] = -this[1];
       this[2] = -this[2];
       //this[3] =  this[3];
       this[4] = -this[4];
       this[5] = -this[5];
       this[6] = -this[6];
       //this[7] =  this[7];
       return this;
    }

    /** Translates a dual quat by the given vector */
    translate( v: TVec3 ) : this{
        const ax1 = this[0],    ay1 = this[1],    az1 = this[2],    aw1 = this[3],
              ax2 = this[4],    ay2 = this[5],    az2 = this[6],    aw2 = this[7],
              bx1 = v[0] * 0.5, by1 = v[1] * 0.5, bz1 = v[2] * 0.5;

        this[0] = ax1;
        this[1] = ay1;
        this[2] = az1;
        this[3] = aw1;
        this[4] = aw1 * bx1 + ay1 * bz1 - az1 * by1 + ax2;
        this[5] = aw1 * by1 + az1 * bx1 - ax1 * bz1 + ay2;
        this[6] = aw1 * bz1 + ax1 * by1 - ay1 * bx1 + az2;
        this[7] = -ax1 * bx1 - ay1 * by1 - az1 * bz1 + aw2;
        return this;
    }

    /** Rotates a dual quat by a given quaternion (dq * q) */
    mulQuat( q: TVec4 ) : this {
        const qx = q[0],    qy = q[1],    qz = q[2],    qw = q[3];
        let   ax = this[0], ay = this[1], az = this[2], aw = this[3];

        this[0] = ax * qw + aw * qx + ay * qz - az * qy;
        this[1] = ay * qw + aw * qy + az * qx - ax * qz;
        this[2] = az * qw + aw * qz + ax * qy - ay * qx;
        this[3] = aw * qw - ax * qx - ay * qy - az * qz;
        
        ax = this[4]; ay = this[5]; az = this[6]; aw = this[7];
        this[4] = ax * qw + aw * qx + ay * qz - az * qy;
        this[5] = ay * qw + aw * qy + az * qx - ax * qz;
        this[6] = az * qw + aw * qz + ax * qy - ay * qx;
        this[7] = aw * qw - ax * qx - ay * qy - az * qz;
        return this;
    }

    /** Rotates a dual quat by a given quaternion (q * dq) */
    pmulQuat( q: TVec4 ) : this {
        const qx = q[0], qy = q[1], qz = q[2], qw = q[3];
        let   bx = this[0], by = this[1], bz = this[2], bw = this[3];

        this[0] = qx * bw + qw * bx + qy * bz - qz * by;
        this[1] = qy * bw + qw * by + qz * bx - qx * bz;
        this[2] = qz * bw + qw * bz + qx * by - qy * bx;
        this[3] = qw * bw - qx * bx - qy * by - qz * bz;

        bx = this[4]; by = this[5]; bz = this[6]; bw = this[7];
        this[4] = qx * bw + qw * bx + qy * bz - qz * by;
        this[5] = qy * bw + qw * by + qz * bx - qx * bz;
        this[6] = qz * bw + qw * bz + qx * by - qy * bx;
        this[7] = qw * bw - qx * bx - qy * by - qz * bz;
        return this;
    }
    // #endregion

    // #region ROTATION OPERATIONS

    rotX( rad: number ) : this {
        const bbx =  this[0], bby =  this[1], bbz =  this[2], bbw = this[3];    // Quat
        let   bx  = -this[0], by  = -this[1],  bz = -this[2],  bw = this[3];    // Neg XYZ
        const ax  =  this[4], ay  =  this[5],  az =  this[6],  aw = this[7];
        
        //----------------------------------------
        // Reverse Trans
        const ax1 = ax * bw + aw * bx + ay * bz - az * by,
                ay1 = ay * bw + aw * by + az * bx - ax * bz,
                az1 = az * bw + aw * bz + ax * by - ay * bx,
                aw1 = aw * bw - ax * bx - ay * by - az * bz;

        //----------------------------------------
        // Rotate Quaternion
        rad *= 0.5; 
        const sin = Math.sin( rad ), 
              cos = Math.cos( rad );
        bx = this[0] = bbx * cos + bbw * sin;
        by = this[1] = bby * cos + bbz * sin;
        bz = this[2] = bbz * cos - bby * sin;
        bw = this[3] = bbw * cos - bbx * sin;

        //----------------------------------------
        this[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
        this[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
        this[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
        this[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
        return this;
    }

    rotY( rad : number ) : this {
        const bbx =  this[0], bby =  this[1], bbz =  this[2], bbw = this[3];    // Quat
        let   bx  = -this[0], by  = -this[1],  bz = -this[2],  bw = this[3];    // Neg XYZ
        const ax  =  this[4], ay  =  this[5],  az =  this[6],  aw = this[7];

        //----------------------------------------
        // Reverse Trans
        const ax1 = ax * bw + aw * bx + ay * bz - az * by,
              ay1 = ay * bw + aw * by + az * bx - ax * bz,
              az1 = az * bw + aw * bz + ax * by - ay * bx,
              aw1 = aw * bw - ax * bx - ay * by - az * bz;

        //----------------------------------------
        // Rotate Quaternion
        rad *= 0.5; 
        const sin = Math.sin( rad ), 
              cos = Math.cos( rad );
        bx = this[0] = bbx * cos - bbz * sin;
        by = this[1] = bby * cos + bbw * sin;
        bz = this[2] = bbz * cos + bbx * sin;
        bw = this[3] = bbw * cos - bby * sin;

        //----------------------------------------
        this[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
        this[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
        this[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
        this[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
        return this;
    }

    rotZ( rad : number ) : this{
        const bbx =  this[0], bby =  this[1], bbz =  this[2], bbw = this[3];    // Quat
        let   bx  = -this[0], by  = -this[1],  bz = -this[2],  bw = this[3];    // Neg XYZ
        const ax  =  this[4], ay  =  this[5],  az =  this[6],  aw = this[7];

        //----------------------------------------
        // Reverse Trans
        const ax1 = ax * bw + aw * bx + ay * bz - az * by,
              ay1 = ay * bw + aw * by + az * bx - ax * bz,
              az1 = az * bw + aw * bz + ax * by - ay * bx,
              aw1 = aw * bw - ax * bx - ay * by - az * bz;

        //----------------------------------------
        // Rotate Quaternion
        rad *= 0.5; 
        const sin = Math.sin( rad ), 
              cos = Math.cos( rad );
        bx = this[0] = bbx * cos + bby * sin;
        by = this[1] = bby * cos - bbx * sin;
        bz = this[2] = bbz * cos + bbw * sin;
        bw = this[3] = bbw * cos - bbz * sin;

        //----------------------------------------
        this[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
        this[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
        this[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
        this[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
        return this;
    }

    /** Rotates a dual quat around a given axis. Does the normalisation automatically */
    rotAxisAngle( axis: TVec3, rad: number ) : this{
        // Special case for rad = 0
        if( Math.abs( rad ) < 0.000001 ) return this;

        const axisLength = 1 / Math.sqrt( axis[0]**2 + axis[1]**2 + axis[2]**2 );

        rad         = rad * 0.5;
        const s     = Math.sin(rad);
        const bx    = s * axis[ 0 ] * axisLength;
        const by    = s * axis[ 1 ] * axisLength;
        const bz    = s * axis[ 2 ] * axisLength;
        const bw    = Math.cos( rad );
        const ax1   = this[0], ay1 = this[1], az1 = this[2], aw1 = this[3];
        const ax    = this[4], ay  = this[5], az  = this[6], aw  = this[7];

        this[0] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
        this[1] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
        this[2] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
        this[3] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;

        this[4] = ax * bw + aw * bx + ay * bz - az * by;
        this[5] = ay * bw + aw * by + az * bx - ax * bz;
        this[6] = az * bw + aw * bz + ax * by - ay * bx;
        this[7] = aw * bw - ax * bx - ay * by - az * bz;
        return this;
    }
    // #endregion

    // #region TRANSFORMATIONS
    transformVec3( v: TVec3, out ?: TVec3 ) : TVec3{
        // Quaternion Transform on a Vec3, Then Add Position to results
        const   pos = this.getTranslation(); 
        const   qx = this[ 0 ], qy = this[ 1 ], qz = this[ 2 ], qw = this[ 3 ],
                vx = v[ 0 ],    vy = v[ 1 ],    vz = v[ 2 ],
                x1 = qy * vz - qz * vy,
                y1 = qz * vx - qx * vz,
                z1 = qx * vy - qy * vx,
                x2 = qw * x1 + qy * z1 - qz * y1,
                y2 = qw * y1 + qz * x1 - qx * z1,
                z2 = qw * z1 + qx * y1 - qy * x1;
                
        out      = out || v;
        out[ 0 ] = ( vx + 2 * x2 ) + pos[ 0 ];
        out[ 1 ] = ( vy + 2 * y2 ) + pos[ 1 ];
        out[ 2 ] = ( vz + 2 * z2 ) + pos[ 2 ];
        return out;
    }
    // #endregion

} 

export default DualQuat;