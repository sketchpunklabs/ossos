export type TVec4     = [number,number,number,number] | Float32Array | Array<number> | number[];
export type ConstVec4 = Readonly< TVec4 >;

export default class Vec4 extends Array< number >{
    constructor(){
        super( 4 );
        this[ 0 ] = 0;
        this[ 1 ] = 0;
        this[ 2 ] = 0;
        this[ 3 ] = 0;
    }

    /** Used to get data from a flat buffer */
    fromBuf( ary : Array<number> | Float32Array, idx: number ): this {
        this[ 0 ]  = ary[ idx ];
        this[ 1 ]  = ary[ idx + 1 ];
        this[ 2 ]  = ary[ idx + 2 ];
        this[ 3 ]  = ary[ idx + 3 ];
        return this;
    }

    /** Put data into a flat buffer */
    toBuf( ary : Array<number> | Float32Array, idx: number ): this { 
        ary[ idx ]      = this[ 0 ];
        ary[ idx + 1 ]  = this[ 1 ];
        ary[ idx + 2 ]  = this[ 2 ];
        ary[ idx + 3 ]  = this[ 3 ];
        return this;
    }
}