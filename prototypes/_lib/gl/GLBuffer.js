// WebGLRenderingContext.ARRAY_BUFFER
// WebGLRenderingContext.ELEMENT_ARRAY_BUFFER
// WebGLRenderingContext.UNIFORM_BUFFER

function createBuffer( gl, data, bufType=WebGLRenderingContext.ARRAY_BUFFER, dataType=WebGLRenderingContext.FLOAT, isStatic=true ){
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Is Data set or creating a blank buffer
    let content;
    if( ArrayBuffer.isView( data ) ){
        content = data;
    }else if( Array.isArray( data ) ){
        // Content MUST be a TypedArray, create one now
        switch( dataType ){
            case WebGLRenderingContext.FLOAT : content = new Float32Array( data ); break;
            default:{
                console.log( 'UNKNOWN DATA TYPE FOR TypeARRAY CONVERSION' );
                break;
            }
        }
    } // }else if( Number.isInteger( data ) ){
    

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Create Buffer and push initial data if available
    const usage = ( isStatic )
        ? WebGLRenderingContext.STATIC_DRAW
        : WebGLRenderingContext.DYNAMIC_DRAW
    
    const obj = {
        gRef : gl.createBuffer(),
        size : ( content )? content.byteLength : data,
    }
    
    gl.bindBuffer( bufType, obj.gRef );     // Set it as active

    if( content )   gl.bufferData( bufType, content, usage );   // Fill Buffer
    else            gl.bufferData( bufType, data, usage );      // Empty Buffer

    gl.bindBuffer( bufType, null );         // Deactivate

    return obj;
}

export default class GLBuffer{
    gRef        = null;         // GPU Reference
    type        = WebGLRenderingContext.ARRAY_BUFFER; // What Type of buffer is it
    dataType    = WebGLRenderingContext.FLOAT;  // Data Type
    components  = 3;            // How many components, 3 If Vec3, etc
    compacity   = 0;            // Total byte size of buffer
    size        = 0;            // Currently used bytes
    isStatic    = true;         // WebGL2: Is the buffer going to be updated often
    gl          = null;

    constructor( gl, comLen=3, dType=WebGLRenderingContext.FLOAT, isStatic=true ){
        this.gl         = gl;
        this.dataType   = dType
        this.components = comLen;
        this.isStatic   = isStatic;
    }

    set( data ){
        // TODO: Allow rewriting buffers or replacing with bigger ones
        if( !this.gRef ){
            const result    = createBuffer( this.gl, data, this.type, this.dataType, this.isStatic );
            this.gRef       = result.gRef;
            this.compacity  = result.size;
            this.size       = result.size;
        }
        return this;
    }

    dispose(){
        if( this.gRef ){
            this.gl.deleteBuffer( this.gRef );
            this.gRef = null;
        }
    }
}
