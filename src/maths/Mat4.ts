import type { ConstVec3, TVec3 }   from './Vec3';
import type { ConstQuat, TQuat }   from './Quat';

export type TMat4     = [number,number,number] | Float32Array | Array< number > | number[];
export type ConstMat4 = Readonly< TMat4 >

type TVec8 = Float32Array | Array< number > | number[]; // Dual Quaternion
type TMat3 = Float32Array | Array< number > | number[]; // Matrix 3x3
type TVec4 = Float32Array | Array< number > | number[]; // Vector 4

export default class Mat4 extends Array< number >{
    // #region STATIC VALUES
    static BYTESIZE = 16 * 4;
    // #endregion

    // #region CONSTRUCTOR
    constructor(){ 
        super(16);
        this[0]  = 1;
        this[1]  = 0;
        this[2]  = 0;
        this[3]  = 0;

        this[4]  = 0;
        this[5]  = 1;
        this[6]  = 0;
        this[7]  = 0;

        this[8]  = 0;
        this[9]  = 0;
        this[10] = 1;
        this[11] = 0;

        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;
    }
    // #endregion

    // #region GETTERS / SETTERS

    identity(): this {
        this[0]  = 1;
        this[1]  = 0;
        this[2]  = 0;
        this[3]  = 0;
        this[4]  = 0;
        this[5]  = 1;
        this[6]  = 0;
        this[7]  = 0;
        this[8]  = 0;
        this[9]  = 0;
        this[10] = 1;
        this[11] = 0;
        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;
        return this;
    }

    clearTranslation(): this{
        this[12] = this[13] = this[14] = 0; this[15] = 1;
        return this; 
    }

    // copy another matrix's data to this one.
    copy( mat : TMat4, offset=0 ): this{
        let i;
        for(i=0; i < 16; i++) this[i] = mat[ offset + i ];
        return this;
    }

    copyTo( out: TMat4 ): this{
        let i;
        for(i=0; i < 16; i++) out[ i ] = this[ i ];
        return this;
    }

    determinant(): number {
        const 
            a00 = this[0],
            a01 = this[1],
            a02 = this[2],
            a03 = this[3],
            a10 = this[4],
            a11 = this[5],
            a12 = this[6],
            a13 = this[7],
            a20 = this[8],
            a21 = this[9],
            a22 = this[10],
            a23 = this[11],
            a30 = this[12],
            a31 = this[13],
            a32 = this[14],
            a33 = this[15],
            b0  = a00 * a11 - a01 * a10,
            b1  = a00 * a12 - a02 * a10,
            b2  = a01 * a12 - a02 * a11,
            b3  = a20 * a31 - a21 * a30,
            b4  = a20 * a32 - a22 * a30,
            b5  = a21 * a32 - a22 * a31,
            b6  = a00 * b5 - a01 * b4 + a02 * b3,
            b7  = a10 * b5 - a11 * b4 + a12 * b3,
            b8  = a20 * b2 - a21 * b1 + a22 * b0,
            b9  = a30 * b2 - a31 * b1 + a32 * b0;
        return a13 * b6 - a03 * b7 + a33 * b8 - a23 * b9; // Calculate the determinant
    }

    /** Frobenius norm of a Matrix */
    frob(): number{
        return Math.hypot(
            this[0],
            this[1],
            this[2],
            this[3],
            this[4],
            this[5],
            this[6],
            this[7],
            this[8],
            this[9],
            this[10],
            this[11],
            this[12],
            this[13],
            this[14],
            this[15]
        );
    }

    //----------------------------------------------------
    getTranslation( out ?: TVec3 ): TVec3{
        out    = out || [ 0, 0, 0 ];
        out[0] = this[12];
        out[1] = this[13];
        out[2] = this[14];
        return out;
    }

    getScale( out ?: TVec3 ): TVec3{
        const m11 = this[0],
                m12 = this[1],
                m13 = this[2],
                m21 = this[4],
                m22 = this[5],
                m23 = this[6],
                m31 = this[8],
                m32 = this[9],
                m33 = this[10];

        out    = out || [0,0,0];
        out[0] = Math.sqrt( m11 * m11 + m12 * m12 + m13 * m13 );
        out[1] = Math.sqrt( m21 * m21 + m22 * m22 + m23 * m23 );
        out[2] = Math.sqrt( m31 * m31 + m32 * m32 + m33 * m33 );
        return out;
    }

    getRotation( out?: TQuat ): TVec3{
        // Returns a quaternion representing the rotational component of a transformation matrix.
        // Algorithm taken from http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
        const trace	= this[0] + this[5] + this[10];
        let   S		= 0;

        out = out || [0,0,0,1];
        if( trace > 0){
            S = Math.sqrt(trace + 1.0) * 2;
            out[3] = 0.25 * S;
            out[0] = (this[6] - this[9]) / S;
            out[1] = (this[8] - this[2]) / S; 
            out[2] = (this[1] - this[4]) / S; 
        }else if( (this[0] > this[5]) && (this[0] > this[10]) ){ 
            S = Math.sqrt(1.0 + this[0] - this[5] - this[10]) * 2;
            out[3] = (this[6] - this[9]) / S;
            out[0] = 0.25 * S;
            out[1] = (this[1] + this[4]) / S; 
            out[2] = (this[8] + this[2]) / S; 
        }else if(this[5] > this[10]){ 
            S = Math.sqrt(1.0 + this[5] - this[0] - this[10]) * 2;
            out[3] = (this[8] - this[2]) / S;
            out[0] = (this[1] + this[4]) / S; 
            out[1] = 0.25 * S;
            out[2] = (this[6] + this[9]) / S; 
        }else{ 
            S = Math.sqrt(1.0 + this[10] - this[0] - this[5]) * 2;
            out[3] = (this[1] - this[4]) / S;
            out[0] = (this[8] + this[2]) / S;
            out[1] = (this[6] + this[9]) / S;
            out[2] = 0.25 * S;
        }
        return out;
    }

    //----------------------------------------------------
    fromPerspective( fovy: number, aspect: number, near: number, far: number ): this{
        const f  = 1.0 / Math.tan( fovy * 0.5 ),
                nf = 1 / ( near - far );
        this[0]  = f / aspect;
        this[1]  = 0;
        this[2]  = 0;
        this[3] = 0;
        this[4]  = 0;
        this[5]  = f;
        this[6]  = 0;
        this[7]  = 0;
        this[8]  = 0;
        this[9]  = 0;
        this[10] = ( far + near ) * nf;
        this[11] = -1;
        this[12] = 0;
        this[13] = 0;
        this[14] = ( 2 * far * near ) * nf;
        this[15] = 0;
        return this;
    }

    /*
    Generates a perspective projection matrix with the given bounds.
    * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
    export function perspectiveNO(out, fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy / 2);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[15] = 0;
    if (far != null && far !== Infinity) {
        const nf = 1 / (near - far);
        out[10] = (far + near) * nf;
        out[14] = 2 * far * near * nf;
    } else {
        out[10] = -1;
        out[14] = -2 * near;
    }
    return out;
    }

    Generates a perspective projection matrix suitable for WebGPU with the given bounds.
    The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
    export function perspectiveZO(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[15] = 0;
        if (far != null && far !== Infinity) {
          const nf = 1 / (near - far);
          out[10] = far * nf;
          out[14] = far * near * nf;
        } else {
          out[10] = -1;
          out[14] = -near;
        }
        return out;
      }

     * Generates a perspective projection matrix with the given field of view.
    * This is primarily useful for generating projection matrices to be used
    * with the still experiemental WebVR API.
    export function perspectiveFromFieldOfView(out, fov, near, far) {
        let upTan = Math.tan((fov.upDegrees * Math.PI) / 180.0);
        let downTan = Math.tan((fov.downDegrees * Math.PI) / 180.0);
        let leftTan = Math.tan((fov.leftDegrees * Math.PI) / 180.0);
        let rightTan = Math.tan((fov.rightDegrees * Math.PI) / 180.0);
        let xScale = 2.0 / (leftTan + rightTan);
        let yScale = 2.0 / (upTan + downTan);
    
        out[0] = xScale;
        out[1] = 0.0;
        out[2] = 0.0;
        out[3] = 0.0;
        out[4] = 0.0;
        out[5] = yScale;
        out[6] = 0.0;
        out[7] = 0.0;
        out[8] = -((leftTan - rightTan) * xScale * 0.5);
        out[9] = (upTan - downTan) * yScale * 0.5;
        out[10] = far / (near - far);
        out[11] = -1.0;
        out[12] = 0.0;
        out[13] = 0.0;
        out[14] = (far * near) / (near - far);
        out[15] = 0.0;
        return out;
    }

    */

    fromOrtho( left: number, right: number, bottom: number, top: number, near: number, far: number ): this{
        const lr = 1 / ( left - right ),
                bt = 1 / ( bottom - top ),
                nf = 1 / ( near - far );
        this[0]  = -2 * lr;
        this[1]  = 0;
        this[2]  = 0;
        this[3]  = 0;
        this[4]  = 0;
        this[5]  = -2 * bt;
        this[6]  = 0;
        this[7]  = 0;
        this[8]  = 0;
        this[9]  = 0;
        this[10] = 2 * nf;
        this[11] = 0;
        this[12] = ( left + right ) * lr;
        this[13] = ( top + bottom ) * bt;
        this[14] = ( far + near )   * nf;
        this[15] = 1;
        return this;
    }

    /*
    * Generates a orthogonal projection matrix with the given bounds.
    * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
    * which matches WebGL/OpenGL's clip volume.
   export function orthoNO(out, left, right, bottom, top, near, far) {
     const lr = 1 / (left - right);
     const bt = 1 / (bottom - top);
     const nf = 1 / (near - far);
     out[0] = -2 * lr;
     out[1] = 0;
     out[2] = 0;
     out[3] = 0;
     out[4] = 0;
     out[5] = -2 * bt;
     out[6] = 0;
     out[7] = 0;
     out[8] = 0;
     out[9] = 0;
     out[10] = 2 * nf;
     out[11] = 0;
     out[12] = (left + right) * lr;
     out[13] = (top + bottom) * bt;
     out[14] = (far + near) * nf;
     out[15] = 1;
     return out;
   }

    * Generates a orthogonal projection matrix with the given bounds.
    * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
    * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
    export function orthoZO(out, left, right, bottom, top, near, far) {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = near * nf;
    out[15] = 1;
    return out;
    }

    */


    fromMul( a: ConstMat4, b: ConstMat4 ): this{ 
        const   a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3],
                a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7],
                a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11],
                a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        // Cache only the current line of the second matrix
        let b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        this[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        this[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        this[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        this[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

        b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
        this[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        this[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        this[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        this[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

        b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
        this[8]  = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        this[9]  = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        this[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        this[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

        b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
        this[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        this[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        this[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        this[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
        return this;	
    }

    fromInvert( mat: ConstMat4 ): this{
        const a00 = mat[0],  a01 = mat[1],  a02 = mat[2],  a03 = mat[3],
                a10 = mat[4],  a11 = mat[5],  a12 = mat[6],  a13 = mat[7],
                a20 = mat[8],  a21 = mat[9],  a22 = mat[10], a23 = mat[11],
                a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15],

                b00 = a00 * a11 - a01 * a10,
                b01 = a00 * a12 - a02 * a10,
                b02 = a00 * a13 - a03 * a10,
                b03 = a01 * a12 - a02 * a11,
                b04 = a01 * a13 - a03 * a11,
                b05 = a02 * a13 - a03 * a12,
                b06 = a20 * a31 - a21 * a30,
                b07 = a20 * a32 - a22 * a30,
                b08 = a20 * a33 - a23 * a30,
                b09 = a21 * a32 - a22 * a31,
                b10 = a21 * a33 - a23 * a31,
                b11 = a22 * a33 - a23 * a32;

        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; // Calculate the determinant

        if( !det ) return this;
        det = 1.0 / det;

        this[0]  = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        this[1]  = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        this[2]  = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        this[3]  = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        this[4]  = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        this[5]  = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        this[6]  = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        this[7]  = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        this[8]  = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        this[9]  = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        this[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        this[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        this[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        this[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        this[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        this[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

        return this;
    }

    fromAdjugate( a: ConstMat4 ): this {
        const
            a00 = a[0],
            a01 = a[1],
            a02 = a[2],
            a03 = a[3],
            a10 = a[4],
            a11 = a[5],
            a12 = a[6],
            a13 = a[7],
            a20 = a[8],
            a21 = a[9],
            a22 = a[10],
            a23 = a[11],
            a30 = a[12],
            a31 = a[13],
            a32 = a[14],
            a33 = a[15],
            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,
            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,
            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,
            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32;
      
        this[0]  = a11 * b11 - a12 * b10 + a13 * b09;
        this[1]  = a02 * b10 - a01 * b11 - a03 * b09;
        this[2]  = a31 * b05 - a32 * b04 + a33 * b03;
        this[3]  = a22 * b04 - a21 * b05 - a23 * b03;
        this[4]  = a12 * b08 - a10 * b11 - a13 * b07;
        this[5]  = a00 * b11 - a02 * b08 + a03 * b07;
        this[6]  = a32 * b02 - a30 * b05 - a33 * b01;
        this[7]  = a20 * b05 - a22 * b02 + a23 * b01;
        this[8]  = a10 * b10 - a11 * b08 + a13 * b06;
        this[9]  = a01 * b08 - a00 * b10 - a03 * b06;
        this[10] = a30 * b04 - a31 * b02 + a33 * b00;
        this[11] = a21 * b02 - a20 * b04 - a23 * b00;
        this[12] = a11 * b07 - a10 * b09 - a12 * b06;
        this[13] = a00 * b09 - a01 * b07 + a02 * b06;
        this[14] = a31 * b01 - a30 * b03 - a32 * b00;
        this[15] = a20 * b03 - a21 * b01 + a22 * b00;
        return this;
    }

    fromFrustum( left: number, right: number, bottom: number, top: number, near: number, far: number ): this{
        const rl = 1 / (right - left);
        const tb = 1 / (top - bottom);
        const nf = 1 / (near - far);
        this[0]  = near * 2 * rl;
        this[1]  = 0;
        this[2]  = 0;
        this[3]  = 0;
        this[4]  = 0;
        this[5]  = near * 2 * tb;
        this[6]  = 0;
        this[7]  = 0;
        this[8]  = (right + left) * rl;
        this[9]  = (top + bottom) * tb;
        this[10] = (far + near) * nf;
        this[11] = -1;
        this[12] = 0;
        this[13] = 0;
        this[14] = far * near * 2 * nf;
        this[15] = 0;
        return this;
    }

    //----------------------------------------------------
    fromQuatTranScale( q: ConstQuat, v: ConstVec3, s: ConstVec3 ): this{
        // Quaternion math
        const x = q[0], y = q[1], z = q[2], w = q[3],
                x2 = x + x,
                y2 = y + y,
                z2 = z + z,

                xx = x * x2,
                xy = x * y2,
                xz = x * z2,
                yy = y * y2,
                yz = y * z2,
                zz = z * z2,
                wx = w * x2,
                wy = w * y2,
                wz = w * z2,
                sx = s[0],
                sy = s[1],
                sz = s[2];

        this[0]  = ( 1 - ( yy + zz ) ) * sx;
        this[1]  = ( xy + wz ) * sx;
        this[2]  = ( xz - wy ) * sx;
        this[3]  = 0;
        this[4]  = ( xy - wz ) * sy;
        this[5]  = ( 1 - ( xx + zz ) ) * sy;
        this[6]  = ( yz + wx ) * sy;
        this[7]  = 0;
        this[8]  = ( xz + wy ) * sz;
        this[9]  = ( yz - wx ) * sz;
        this[10] = ( 1 - ( xx + yy ) ) * sz;
        this[11] = 0;
        this[12] = v[0];
        this[13] = v[1];
        this[14] = v[2];
        this[15] = 1;

        return this;
    }

    fromQuatTran( q: ConstQuat, v: ConstVec3 ): this{
        // Quaternion math
        const x = q[0], y = q[1], z = q[2], w = q[3],
            x2 = x + x,
            y2 = y + y,
            z2 = z + z,

            xx = x * x2,
            xy = x * y2,
            xz = x * z2,
            yy = y * y2,
            yz = y * z2,
            zz = z * z2,
            wx = w * x2,
            wy = w * y2,
            wz = w * z2;

        this[0]  = 1 - ( yy + zz );
        this[1]  = xy + wz;
        this[2]  = xz - wy;
        this[3]  = 0;
        this[4]  = xy - wz;
        this[5]  = 1 - ( xx + zz );
        this[6]  = yz + wx;
        this[7]  = 0;
        this[8]  = xz + wy;
        this[9]  = yz - wx;
        this[10] = 1 - ( xx + yy );
        this[11] = 0;
        this[12] = v[0];
        this[13] = v[1];
        this[14] = v[2];
        this[15] = 1;
        return this;
    }

    fromQuat( q: ConstQuat ): this{
        // Quaternion math
        const x = q[0], y = q[1], z = q[2], w = q[3],
            x2 = x + x,
            y2 = y + y,
            z2 = z + z,

            xx = x * x2,
            xy = x * y2,
            xz = x * z2,
            yy = y * y2,
            yz = y * z2,
            zz = z * z2,
            wx = w * x2,
            wy = w * y2,
            wz = w * z2;

        this[0]  = 1 - ( yy + zz );
        this[1]  = xy + wz;
        this[2]  = xz - wy;
        this[3]  = 0;
        this[4]  = xy - wz;
        this[5]  = 1 - ( xx + zz );
        this[6]  = yz + wx;
        this[7]  = 0;
        this[8]  = xz + wy;
        this[9]  = yz - wx;
        this[10] = 1 - ( xx + yy );
        this[11] = 0;
        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;
        return this;
    }

    /** Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin */
    fromQuatTranScaleOrigin( q: ConstQuat, v: ConstVec3, s: ConstVec3, o: ConstVec3 ): this {
        // Quaternion math
        const x = q[0],
            y = q[1],
            z = q[2],
            w = q[3];
        const x2 = x + x;
        const y2 = y + y;
        const z2 = z + z;

        const xx = x * x2;
        const xy = x * y2;
        const xz = x * z2;
        const yy = y * y2;
        const yz = y * z2;
        const zz = z * z2;
        const wx = w * x2;
        const wy = w * y2;
        const wz = w * z2;

        const sx = s[0];
        const sy = s[1];
        const sz = s[2];

        const ox = o[0];
        const oy = o[1];
        const oz = o[2];

        const out0  = (1 - (yy + zz)) * sx;
        const out1  = (xy + wz) * sx;
        const out2  = (xz - wy) * sx;
        const out4  = (xy - wz) * sy;
        const out5  = (1 - (xx + zz)) * sy;
        const out6  = (yz + wx) * sy;
        const out8  = (xz + wy) * sz;
        const out9  = (yz - wx) * sz;
        const out10 = (1 - (xx + yy)) * sz;

        this[0]  = out0;
        this[1]  = out1;
        this[2]  = out2;
        this[3]  = 0;
        this[4]  = out4;
        this[5]  = out5;
        this[6]  = out6;
        this[7]  = 0;
        this[8]  = out8;
        this[9]  = out9;
        this[10] = out10;
        this[11] = 0;
        this[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
        this[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
        this[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
        this[15] = 1;

        return this;
    }

    fromDualQuat( a: TVec8 ): this {
        const   bx = -a[0],
                by = -a[1],
                bz = -a[2],
                bw = a[3],
                ax = a[4],
                ay = a[5],
                az = a[6],
                aw = a[7];

        const translation = [0,0,0];
        let   magnitude   = bx * bx + by * by + bz * bz + bw * bw;

        // Only scale if it makes sense
        if( magnitude > 0 ){
            magnitude      = 1 / magnitude;
            translation[0] = ((ax * bw + aw * bx + ay * bz - az * by) * 2) * magnitude;
            translation[1] = ((ay * bw + aw * by + az * bx - ax * bz) * 2) * magnitude;
            translation[2] = ((az * bw + aw * bz + ax * by - ay * bx) * 2) * magnitude;
        }else{
            translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
            translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
            translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
        }

        this.fromQuatTran( a, translation );
        return this;
    }

    //----------------------------------------------------
    /** This creates a View Matrix, not a World Matrix. Use fromTarget for a World Matrix */
    fromLook( eye: ConstVec3, center: ConstVec3, up: ConstVec3 ): this {
        let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
        const eyex    = eye[0];
        const eyey    = eye[1];
        const eyez    = eye[2];
        const upx     = up[0];
        const upy     = up[1];
        const upz     = up[2];
        const centerx = center[0];
        const centery = center[1];
        const centerz = center[2];

        if (Math.abs( eyex - centerx ) < 0.000001 &&
            Math.abs( eyey - centery ) < 0.000001 &&
            Math.abs( eyez - centerz ) < 0.000001) {

            this.identity();   // Identity
            return this;
        }

        z0  = eyex - centerx;
        z1  = eyey - centery;
        z2  = eyez - centerz;

        len = 1 / Math.sqrt( z0 * z0 + z1 * z1 + z2 * z2 );
        z0  *= len;
        z1  *= len;
        z2  *= len;

        x0  = upy * z2 - upz * z1;
        x1  = upz * z0 - upx * z2;
        x2  = upx * z1 - upy * z0;
        len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);

        if( !len ){
            x0  = 0;
            x1  = 0;
            x2  = 0;
        }else{
            len = 1 / len;
            x0  *= len;
            x1  *= len;
            x2  *= len;
        }

        y0  = z1 * x2 - z2 * x1;
        y1  = z2 * x0 - z0 * x2;
        y2  = z0 * x1 - z1 * x0;
        len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);

        if( !len ){
            y0  = 0;
            y1  = 0;
            y2  = 0;
        }else{
            len = 1 / len;
            y0  *= len;
            y1  *= len;
            y2  *= len;
        }

        this[0]  = x0;
        this[1]  = y0;
        this[2]  = z0;
        this[3]  = 0;
        this[4]  = x1;
        this[5]  = y1;
        this[6]  = z1;
        this[7]  = 0;
        this[8]  = x2;
        this[9]  = y2;
        this[10] = z2;
        this[11] = 0;
        this[12] = -( x0 * eyex + x1 * eyey + x2 * eyez );
        this[13] = -( y0 * eyex + y1 * eyey + y2 * eyez );
        this[14] = -( z0 * eyex + z1 * eyey + z2 * eyez );
        this[15] = 1;

        return this;
    }

    /** This creates a World Matrix, not a View Matrix. Use fromLook for a View Matrix */
    fromTarget( eye: ConstVec3, target: ConstVec3, up: ConstVec3 ): this {
        const eyex = eye[0],
                eyey = eye[1],
                eyez = eye[2],
                upx  = up[0],
                upy  = up[1],
                upz  = up[2];

        let   z0   = eyex - target[0],
                z1   = eyey - target[1],
                z2   = eyez - target[2],
                len  = z0*z0 + z1*z1 + z2*z2;

        if( len > 0 ){
            len = 1 / Math.sqrt( len );
            z0  *= len;
            z1  *= len;
            z2  *= len;
        }

        let x0 = upy * z2 - upz * z1,
            x1 = upz * z0 - upx * z2,
            x2 = upx * z1 - upy * z0;

        len = x0*x0 + x1*x1 + x2*x2;
        if( len > 0 ){
            len = 1 / Math.sqrt( len );
            x0  *= len;
            x1  *= len;
            x2  *= len;
        }

        this[0]  = x0;
        this[1]  = x1;
        this[2]  = x2;
        this[3]  = 0;
        this[4]  = z1 * x2 - z2 * x1;
        this[5]  = z2 * x0 - z0 * x2;
        this[6]  = z0 * x1 - z1 * x0;
        this[7]  = 0;
        this[8]  = z0;
        this[9]  = z1;
        this[10] = z2;
        this[11] = 0;
        this[12] = eyex;
        this[13] = eyey;
        this[14] = eyez;
        this[15] = 1;
        return this;
    }

    //----------------------------------------------------

    fromAxisAngle( axis: ConstVec3, rad: number ): this {
        let x   = axis[0],
            y   = axis[1],
            z   = axis[2],
            len = Math.hypot( x, y, z );
      
        if( len < 0.000001 ) return this;
      
        len = 1 / len;
        x   *= len;
        y   *= len;
        z   *= len;
        const s   = Math.sin(rad);
        const c   = Math.cos(rad);
        const t   = 1 - c;
      
        // Perform rotation-specific matrix multiplication
        this[0] = x * x * t + c;
        this[1]  = y * x * t + z * s;
        this[2]  = z * x * t - y * s;
        this[3]  = 0;
        this[4]  = x * y * t - z * s;
        this[5]  = y * y * t + c;
        this[6]  = z * y * t + x * s;
        this[7]  = 0;
        this[8]  = x * z * t + y * s;
        this[9]  = y * z * t - x * s;
        this[10] = z * z * t + c;
        this[11] = 0;
        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;

        return this;
    }
      
    fromRotX( rad: number ): this {
        const   s = Math.sin( rad ),
                c = Math.cos( rad );
        this[0]  = 1;
        this[1]  = 0;
        this[2]  = 0;
        this[3]  = 0;
        this[4]  = 0;
        this[5]  = c;
        this[6]  = s;
        this[7]  = 0;
        this[8]  = 0;
        this[9]  = -s;
        this[10] = c;
        this[11] = 0;
        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;
        return this;
    }
    
    fromRotY( rad: number ): this {
        const   s = Math.sin( rad ),
                c = Math.cos( rad );
        this[0]  = c;
        this[1]  = 0;
        this[2]  = -s;
        this[3]  = 0;
        this[4]  = 0;
        this[5]  = 1;
        this[6]  = 0;
        this[7]  = 0;
        this[8]  = s;
        this[9]  = 0;
        this[10] = c;
        this[11] = 0;
        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;
        return this;
    }

    fromRotZ( rad: number ): this {
        const   s = Math.sin( rad ),
                c = Math.cos( rad );
        this[0]  = c;
        this[1]  = s;
        this[2]  = 0;
        this[3]  = 0;
        this[4]  = -s;
        this[5]  = c;
        this[6]  = 0;
        this[7]  = 0;
        this[8]  = 0;
        this[9]  = 0;
        this[10] = 1;
        this[11] = 0;
        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;
        return this;
    }

    //----------------------------------------------------
    // Calculates a 3x3 normal matrix ( transpose & inverse ) from this 4x4 matrix
    toNormalMat3( out ?: TMat3 ): TMat3{
        const a00 = this[0],  a01 = this[1],  a02 = this[2],  a03 = this[3],
                a10 = this[4],  a11 = this[5],  a12 = this[6],  a13 = this[7],
                a20 = this[8],  a21 = this[9],  a22 = this[10], a23 = this[11],
                a30 = this[12], a31 = this[13], a32 = this[14], a33 = this[15],

                b00 = a00 * a11 - a01 * a10,
                b01 = a00 * a12 - a02 * a10,
                b02 = a00 * a13 - a03 * a10,
                b03 = a01 * a12 - a02 * a11,
                b04 = a01 * a13 - a03 * a11,
                b05 = a02 * a13 - a03 * a12,
                b06 = a20 * a31 - a21 * a30,
                b07 = a20 * a32 - a22 * a30,
                b08 = a20 * a33 - a23 * a30,
                b09 = a21 * a32 - a22 * a31,
                b10 = a21 * a33 - a23 * a31,
                b11 = a22 * a33 - a23 * a32;

        
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; // Calculate the determinant
        out     = out || [ 0,0,0, 0,0,0, 0,0,0 ];
        if( !det ) return out;

        det    = 1.0 / det;
        out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

        out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

        out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        return out;
    }

    //----------------------------------------------------
    // FLAT BUFFERS

    /** Used to get data from a flat buffer of matrices */
    fromBuf( ary : Array<number> | Float32Array, idx: number ): this {
        this[ 0 ]  = ary[ idx ];
        this[ 1 ]  = ary[ idx + 1 ];
        this[ 2 ]  = ary[ idx + 2 ];
        this[ 3 ]  = ary[ idx + 3 ];
        this[ 4 ]  = ary[ idx + 4 ];
        this[ 5 ]  = ary[ idx + 5 ];
        this[ 6 ]  = ary[ idx + 6 ];
        this[ 7 ]  = ary[ idx + 7 ];
        this[ 8 ]  = ary[ idx + 8 ];
        this[ 9 ]  = ary[ idx + 9 ];
        this[ 10 ] = ary[ idx + 10 ];
        this[ 11 ] = ary[ idx + 11 ];
        this[ 12 ] = ary[ idx + 12 ];
        this[ 13 ] = ary[ idx + 13 ];
        this[ 14 ] = ary[ idx + 14 ];
        this[ 15 ] = ary[ idx + 15 ];
        return this;
    }

    /** Put data into a flat buffer of matrices */
    toBuf( ary : Array<number> | Float32Array, idx: number ): this { 
        ary[ idx ]      = this[ 0 ];
        ary[ idx + 1 ]  = this[ 1 ];
        ary[ idx + 2 ]  = this[ 2 ];
        ary[ idx + 3 ]  = this[ 3 ];
        ary[ idx + 4 ]  = this[ 4 ];
        ary[ idx + 5 ]  = this[ 5 ];
        ary[ idx + 6 ]  = this[ 6 ];
        ary[ idx + 7 ]  = this[ 7 ];
        ary[ idx + 8 ]  = this[ 8 ];
        ary[ idx + 9 ]  = this[ 9 ];
        ary[ idx + 10 ] = this[ 10 ];
        ary[ idx + 11 ] = this[ 11 ];
        ary[ idx + 12 ] = this[ 12 ];
        ary[ idx + 13 ] = this[ 13 ];
        ary[ idx + 14 ] = this[ 14 ];
        ary[ idx + 15 ] = this[ 15 ];
        return this;
    }

    // #endregion

    // #region OPERATIONS
    add( b: ConstMat4 ): this{
        this[0]  = this[0]  + b[0];
        this[1]  = this[1]  + b[1];
        this[2]  = this[2]  + b[2];
        this[3]  = this[3]  + b[3];
        this[4]  = this[4]  + b[4];
        this[5]  = this[5]  + b[5];
        this[6]  = this[6]  + b[6];
        this[7]  = this[7]  + b[7];
        this[8]  = this[8]  + b[8];
        this[9]  = this[9]  + b[9];
        this[10] = this[10] + b[10];
        this[11] = this[11] + b[11];
        this[12] = this[12] + b[12];
        this[13] = this[13] + b[13];
        this[14] = this[14] + b[14];
        this[15] = this[15] + b[15];
        return this;
    }

    sub( b: ConstMat4 ): this {
        this[0]  = this[0]  - b[0];
        this[1]  = this[1]  - b[1];
        this[2]  = this[2]  - b[2];
        this[3]  = this[3]  - b[3];
        this[4]  = this[4]  - b[4];
        this[5]  = this[5]  - b[5];
        this[6]  = this[6]  - b[6];
        this[7]  = this[7]  - b[7];
        this[8]  = this[8]  - b[8];
        this[9]  = this[9]  - b[9];
        this[10] = this[10] - b[10];
        this[11] = this[11] - b[11];
        this[12] = this[12] - b[12];
        this[13] = this[13] - b[13];
        this[14] = this[14] - b[14];
        this[15] = this[15] - b[15];
        return this;
    }

    mul( b: ConstMat4 ): this{ 
        const   a00 = this[0],	a01 = this[1],	a02 = this[2],	a03 = this[3],
                a10 = this[4],	a11 = this[5],	a12 = this[6],	a13 = this[7],
                a20 = this[8],	a21 = this[9],	a22 = this[10],	a23 = this[11],
                a30 = this[12],	a31 = this[13],	a32 = this[14],	a33 = this[15];

        // Cache only the current line of the second matrix
        let b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        this[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        this[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        this[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        this[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

        b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
        this[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        this[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        this[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        this[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

        b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
        this[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        this[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        this[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        this[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

        b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
        this[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        this[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        this[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        this[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
        return this;	
    }

    pmul( b: ConstMat4 ): this{ 
        const   a00 = b[0],	 a01 = b[1],  a02 = b[2],  a03 = b[3],
                a10 = b[4],  a11 = b[5],  a12 = b[6],  a13 = b[7],
                a20 = b[8],  a21 = b[9],  a22 = b[10], a23 = b[11],
                a30 = b[12], a31 = b[13], a32 = b[14], a33 = b[15];

        // Cache only the current line of the second matrix
        let b0  = this[0], b1 = this[1], b2 = this[2], b3 = this[3];
        this[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        this[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        this[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        this[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

        b0 = this[4]; b1 = this[5]; b2 = this[6]; b3 = this[7];
        this[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        this[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        this[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        this[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

        b0 = this[8]; b1 = this[9]; b2 = this[10]; b3 = this[11];
        this[8]  = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        this[9]  = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        this[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        this[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

        b0 = this[12]; b1 = this[13]; b2 = this[14]; b3 = this[15];
        this[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
        this[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
        this[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
        this[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
        return this;	
    }

    invert(): this{
        const a00 = this[0],  a01 = this[1],  a02 = this[2],  a03 = this[3],
            a10 = this[4],  a11 = this[5],  a12 = this[6],  a13 = this[7],
            a20 = this[8],  a21 = this[9],  a22 = this[10], a23 = this[11],
            a30 = this[12], a31 = this[13], a32 = this[14], a33 = this[15],

            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,
            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,
            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,
            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32;

        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; // Calculate the determinant

        if( !det ) return this;
        det = 1.0 / det;

        this[0]  = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        this[1]  = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        this[2]  = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        this[3]  = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        this[4]  = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        this[5]  = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        this[6]  = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        this[7]  = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        this[8]  = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        this[9]  = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        this[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        this[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        this[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        this[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        this[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        this[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

        return this;
    }

    translate( v: ConstVec3 ): this
    translate( v: number, y: number, z: number ): this
    translate( v: number | ConstVec3, y ?: number, z ?: number ): this{
        let xx: number, yy: number, zz: number;
        if( v instanceof Float32Array || ( v instanceof Array && v.length == 3 )){
            xx = v[0];
            yy = v[1];
            zz = v[2];
        }else if( typeof v === 'number' && typeof y === "number" && typeof z === "number" ){
            xx = v;
            yy = y;
            zz = z;
        }else return this;

        this[12] = this[0] * xx + this[4] * yy + this[8]	* zz + this[12];
        this[13] = this[1] * xx + this[5] * yy + this[9]	* zz + this[13];
        this[14] = this[2] * xx + this[6] * yy + this[10]	* zz + this[14];
        this[15] = this[3] * xx + this[7] * yy + this[11]	* zz + this[15];

        return this;
    }

    scale( x: number ): this
    scale( x: number, y: number, z: number ): this
    scale( x: number, y?: number, z ?: number ): this{
        if( y == undefined ) y = x;
        if( z == undefined ) z = x;
        this[0]  *= x;
        this[1]  *= x;
        this[2]  *= x;
        this[3]  *= x;
        this[4]  *= y;
        this[5]  *= y;
        this[6]  *= y;
        this[7]  *= y;
        this[8]  *= z;
        this[9]  *= z;
        this[10] *= z;
        this[11] *= z;
        return this;
    }


    //----------------------------------------------------
    /** Make the rows into the columns */
    transpose(): this {
        const   a01 = this[1], 
                a02 = this[2], 
                a03 = this[3], 
                a12 = this[6], 
                a13 = this[7], 
                a23 = this[11];
        this[1]  = this[4];
        this[2]  = this[8];
        this[3]  = this[12];
        this[4]  = a01;
        this[6]  = this[9];
        this[7]  = this[13];
        this[8]  = a02;
        this[9]  = a12;
        this[11] = this[14];
        this[12] = a03;
        this[13] = a13;
        this[14] = a23;
        return this;
    }

    //----------------------------------------------------
    decompose( out_r: TQuat, out_t: TVec3, out_s: TVec3 ): this{
        out_t[0]  = this[12];
        out_t[1]  = this[13];
        out_t[2]  = this[14];
        
        const m11 = this[0];
        const m12 = this[1];
        const m13 = this[2];
        const m21 = this[4];
        const m22 = this[5];
        const m23 = this[6];
        const m31 = this[8];
        const m32 = this[9];
        const m33 = this[10];
        
        out_s[0]  = Math.hypot( m11, m12, m13 );
        out_s[1]  = Math.hypot( m21, m22, m23 );
        out_s[2]  = Math.hypot( m31, m32, m33 );
        
        const is1 = 1 / out_s[0];
        const is2 = 1 / out_s[1];
        const is3 = 1 / out_s[2];
        
        const sm11 = m11 * is1;
        const sm12 = m12 * is2;
        const sm13 = m13 * is3;
        const sm21 = m21 * is1;
        const sm22 = m22 * is2;
        const sm23 = m23 * is3;
        const sm31 = m31 * is1;
        const sm32 = m32 * is2;
        const sm33 = m33 * is3;
        
        const trace = sm11 + sm22 + sm33;
        let S = 0;
        
        if (trace > 0) {
            S = Math.sqrt(trace + 1.0) * 2;
            out_r[3] = 0.25 * S;
            out_r[0] = (sm23 - sm32) / S;
            out_r[1] = (sm31 - sm13) / S;
            out_r[2] = (sm12 - sm21) / S;
        } else if (sm11 > sm22 && sm11 > sm33) {
            S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
            out_r[3] = (sm23 - sm32) / S;
            out_r[0] = 0.25 * S;
            out_r[1] = (sm12 + sm21) / S;
            out_r[2] = (sm31 + sm13) / S;
        } else if (sm22 > sm33) {
            S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
            out_r[3] = (sm31 - sm13) / S;
            out_r[0] = (sm12 + sm21) / S;
            out_r[1] = 0.25 * S;
            out_r[2] = (sm23 + sm32) / S;
        } else {
            S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
            out_r[3] = (sm12 - sm21) / S;
            out_r[0] = (sm31 + sm13) / S;
            out_r[1] = (sm23 + sm32) / S;
            out_r[2] = 0.25 * S;
        }
        
        return this;
    }
        

    //----------------------------------------------------
    rotX( rad: number ): this {
        const   s   = Math.sin( rad ),
                c   = Math.cos( rad ),
                a10 = this[4],
                a11 = this[5],
                a12 = this[6],
                a13 = this[7],
                a20 = this[8],
                a21 = this[9],
                a22 = this[10],
                a23 = this[11];

        // Perform axis-specific matrix multiplication
        this[4]  = a10 * c + a20 * s;
        this[5]  = a11 * c + a21 * s;
        this[6]  = a12 * c + a22 * s;
        this[7]  = a13 * c + a23 * s;
        this[8]  = a20 * c - a10 * s;
        this[9]  = a21 * c - a11 * s;
        this[10] = a22 * c - a12 * s;
        this[11] = a23 * c - a13 * s;
        return this;
    }

    rotY( rad: number ): this {
        const   s   = Math.sin( rad ),
                c   = Math.cos( rad ),
                a00 = this[0],
                a01 = this[1],
                a02 = this[2],
                a03 = this[3],
                a20 = this[8],
                a21 = this[9],
                a22 = this[10],
                a23 = this[11];

        // Perform axis-specific matrix multiplication
        this[0]  = a00 * c - a20 * s;
        this[1]  = a01 * c - a21 * s;
        this[2]  = a02 * c - a22 * s;
        this[3]  = a03 * c - a23 * s;
        this[8]  = a00 * s + a20 * c;
        this[9]  = a01 * s + a21 * c;
        this[10] = a02 * s + a22 * c;
        this[11] = a03 * s + a23 * c;
        return this;
    }

    rotZ( rad: number ): this {
        const   s   = Math.sin( rad ),
                c   = Math.cos( rad ),
                a00 = this[0],
                a01 = this[1],
                a02 = this[2],
                a03 = this[3],
                a10 = this[4],
                a11 = this[5],
                a12 = this[6],
                a13 = this[7];

        // Perform axis-specific matrix multiplication
        this[0] = a00 * c + a10 * s;
        this[1] = a01 * c + a11 * s;
        this[2] = a02 * c + a12 * s;
        this[3] = a03 * c + a13 * s;
        this[4] = a10 * c - a00 * s;
        this[5] = a11 * c - a01 * s;
        this[6] = a12 * c - a02 * s;
        this[7] = a13 * c - a03 * s;
        return this;
    }

    rotAxisAngle( axis: ConstVec3, rad: number ): this {
        let x   = axis[0], 
            y   = axis[1], 
            z   = axis[2],
            len = Math.sqrt( x * x + y * y + z * z );

        if( Math.abs( len ) < 0.000001 ) return this;

        len = 1 / len;
        x   *= len;
        y   *= len;
        z   *= len;

        const s   = Math.sin( rad );
        const c   = Math.cos( rad );
        const t   = 1 - c;

        const a00 = this[0]; const a01 = this[1]; const a02 = this[2];  const a03 = this[3];
        const a10 = this[4]; const a11 = this[5]; const a12 = this[6];  const a13 = this[7];
        const a20 = this[8]; const a21 = this[9]; const a22 = this[10]; const a23 = this[11];

        // Construct the elements of the rotation matrix
        const b00 = x * x * t + c;        const b01 = y * x * t + z * s;    const b02 = z * x * t - y * s;
        const b10 = x * y * t - z * s;    const b11 = y * y * t + c;        const b12 = z * y * t + x * s;
        const b20 = x * z * t + y * s;    const b21 = y * z * t - x * s;    const b22 = z * z * t + c;

        // Perform rotation-specific matrix multiplication
        this[0]  = a00 * b00 + a10 * b01 + a20 * b02;
        this[1]  = a01 * b00 + a11 * b01 + a21 * b02;
        this[2]  = a02 * b00 + a12 * b01 + a22 * b02;
        this[3]  = a03 * b00 + a13 * b01 + a23 * b02;
        this[4]  = a00 * b10 + a10 * b11 + a20 * b12;
        this[5]  = a01 * b10 + a11 * b11 + a21 * b12;
        this[6]  = a02 * b10 + a12 * b11 + a22 * b12;
        this[7]  = a03 * b10 + a13 * b11 + a23 * b12;
        this[8]  = a00 * b20 + a10 * b21 + a20 * b22;
        this[9]  = a01 * b20 + a11 * b21 + a21 * b22;
        this[10] = a02 * b20 + a12 * b21 + a22 * b22;
        this[11] = a03 * b20 + a13 * b21 + a23 * b22;
        return this;
    }
    // #endregion

    // #region TRANSFORMS
    transformVec3( v: ConstVec3, out: TVec3 = [0,0,0] ) : TVec3{
        const x = v[0], y = v[1], z = v[2];
        out[0] = this[0] * x + this[4] * y + this[8]	* z + this[12];
        out[1] = this[1] * x + this[5] * y + this[9]	* z + this[13];
        out[2] = this[2] * x + this[6] * y + this[10]	* z + this[14];
        return out;
    }
        
    transformVec4( v: TVec4, out: TVec4 = [0,0,0,0] ) : TVec4{
        const x = v[0], y = v[1], z = v[2], w = v[3];
        out[0] = this[0] * x + this[4] * y + this[8]	* z + this[12] * w;
        out[1] = this[1] * x + this[5] * y + this[9]	* z + this[13] * w;
        out[2] = this[2] * x + this[6] * y + this[10]	* z + this[14] * w;
        out[3] = this[3] * x + this[7] * y + this[11]	* z + this[15] * w;
        return out;
    }
    // #endregion

    // #region STATIC
    
    static mul( a: ConstMat4, b: ConstMat4 ) : Mat4{ return new Mat4().fromMul( a, b ); }
    static invert( a: ConstMat4 ) : Mat4 { return new Mat4().fromInvert( a ); }

    // #endregion 
}