// https://webglfundamentals.org/webgl/lessons/webgl-data-textures.html
// https://registry.khronos.org/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform

export default class GLFloatTexture{
    // #region MAIN
    ref            = null;
    gl             = null;
    colLen         = 0;
    rowLen         = 0;
    vecSize        = 0;
    internalFormat = 0;
    format         = 0;
    type           = 0;
    data           = null;

    constructor( gl, colLen=1, rowLen=2, vecSize=3 ){
        this.gl      = gl;
        this.type    = gl.FLOAT;
        this.colLen  = colLen;
        this.rowLen  = rowLen;
        this.vecSize = vecSize;

        switch( vecSize ){
            case 3:
                this.internalFormat = gl.RGB32F;
                this.format         = gl.RGB;
                break;
            case 4:
                this.internalFormat = gl.RGBA32F;
                this.format         = gl.RGBA;
                break;
            default:
                console.error( 'GLFloatTexture - UNKNOWN VEC SIZE' );
                break;
        }

        this.data = new Float32Array( vecSize * colLen * rowLen );
        this._build();
    }
    
    dispose(){
        if( this.ref ) this.gl.deleteTexture( this.ref );
        this.gl = null;
    }
    // #endregion

    // #region METHODS
    set( idx, ...args ){
        let ii = idx * this.colLen * this.vecSize;
        let c  = 0;
        for( let a of args ){
            for( let i of a ) this.data[ ii++ ] = i;

            // Prevent writing into next row
            if( ++c >= this.colLen ) break;
        }

        return this;
    }

    upload(){
        this.gl.bindTexture( this.gl.TEXTURE_2D, this.ref );
        this.gl.texSubImage2D( this.gl.TEXTURE_2D, 
            0, 0, 0, 
            this.colLen, this.rowLen, 
            this.format, this.type, 
            this.data
        );
        this.gl.bindTexture( this.gl.TEXTURE_2D, null );
        return this;
    }
    // #endregion

    // #region HELPERS
    _build(){
        // Create & Bind
        const tex = this.gl.createTexture();
        this.gl.bindTexture( this.gl.TEXTURE_2D, tex );
        
        // No mips & no filtering
        this.gl.texParameteri( this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST );
        this.gl.texParameteri( this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST );
        this.gl.texParameteri( this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE );
        this.gl.texParameteri( this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE );

         // Data might not be 4 byte aligned, so set reading by 1 byte a time
        this.gl.pixelStorei( this.gl.UNPACK_ALIGNMENT, 1 );

        // Initialize Testure buffer with Data
        this.gl.texImage2D( this.gl.TEXTURE_2D, 0, 
            this.internalFormat, 
            this.colLen, this.rowLen, 0,
            this.format, 
            this.type, 
            this.data,
        );

        this.gl.bindTexture( this.gl.TEXTURE_2D, null );

        this.ref = tex;
    }
    // #endregion
}