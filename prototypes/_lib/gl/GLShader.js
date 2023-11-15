export default class GLShader{
    // #region MAIN
    prog     = null;
    gl       = null;
    uniforms = {};
    constructor( gl ){ this.gl = gl; }

    dispose(){
        if( this.prog ) this.gl.deleteProgram( this.prog );
        this.gl = null;
    }
    // #endregion

    // #region METHODS
    compile( vSrc, fSrc, tfVarying=null ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compile Shader
        const vSh = this._compileShader( vSrc, true );
        if( !vSh ) return false;

        const fSh = this._compileShader( fSrc, false );
        if( !fSh ){ this.gl.deleteShader( vSh ); return false; }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.prog = this._linkProgram( vSh, fSh, tfVarying );
        return !!this.prog;
    }

    useUniforms( ary ){
        for( let i of ary ){
            this.uniforms[ i ] = this.gl.getUniformLocation( this.prog, i );
        }
        return this;
    }
    // #endregion

    // #region HELPERS
    _compileShader( src, isVert=true ){
        const sh = this.gl.createShader( isVert
            ? this.gl.VERTEX_SHADER
            : this.gl.FRAGMENT_SHADER
        );

        this.gl.shaderSource( sh, src );
        this.gl.compileShader( sh );

        if( !this.gl.getShaderParameter( sh, this.gl.COMPILE_STATUS ) ){
            console.log( 'SHADER COMPILE ERROR - isVert: ', isVert, 'MSG: ' , this.gl.getShaderInfoLog( sh ) );
            this.gl.deleteShader( sh );
            return null;
        }

        return sh;
    }

    _linkProgram( vSh, fSh, tfVarying=null ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Build Program
        const prog = this.gl.createProgram();
        this.gl.attachShader( prog, vSh );
        this.gl.attachShader( prog, fSh );
        
        if( tfVarying ){
            // Define shader TF outputs
            this.gl.transformFeedbackVaryings( prog, tfVarying, this.gl.SEPARATE_ATTRIBS );
        }

        this.gl.linkProgram( prog );
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Cleanup
        this.gl.detachShader( prog, vSh );
        this.gl.detachShader( prog, fSh );
        this.gl.deleteShader( vSh );
        this.gl.deleteShader( fSh );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Validate
        if( !this.gl.getProgramParameter( prog, this.gl.LINK_STATUS ) ){
            console.log( 'LINK ERROR', this.gl.getProgramInfoLog( prog ) );
            this.gl.deleteProgram( prog );
            return null;
        }

        return prog;
    }
    // #endregion
}
