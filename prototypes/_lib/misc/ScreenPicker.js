import * as THREE from '@three';


export default class ScreenPicker{
    // #region MAIN
    emptyScene      = new THREE.Scene();              // Needed to render an empty scene to get renderList
    targetScene     = null;                           // The scene that created the last renderList
    targetRenderer  = null;
    targetCamera    = null;
    
    bakClearColor   = new THREE.Color();                      // Backup Clear color of renderer
    nulClearColor   = new THREE.Color().setRGB( -1, -1, -1 ); // Clear color for picking
    // nulClear        = new Int32Array([-1,-1,-1,-1]);          // FOR manual Clearing
    
    texPoint        = genIntRenderTarget( 1, 1, 4 );    // 1x1 Pixel storing RGBA
    matHitID        = new PickingHitIDMaterial();       // Render meshes to get ID and Hit World Space Position

    idMapper        = null;
    app             = null;

    materials       = {
        meshHit     : new PickingHitIDMaterial(),
        shapePnt    : new PickingShapePointsMaterial(),
    }

    constructor( app=null ){
        this.emptyScene.onAfterRender = this.onAfterRender;
        
        if( app ){
            this.targetRenderer = app.renderer;
            this.targetScene    = app.scene;
            this.targetCamera   = app.camera;
        }
    }
    // #endregion

    // #region PICKING METHODS
    pickPoint( p, cam, scene, rend ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        /// Setup references used by onAfterRender
        if( rend )  this.targetRenderer = rend;
        if( scene ) this.targetScene    = scene;
        if( cam )   this.targetCamera   = cam;

        const canvas = this.targetRenderer.domElement;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Set the render viewport size, for this mode we
        // only need to render a single pixel worth
        const dpr = window.devicePixelRatio;
        this.targetCamera.setViewOffset(
            canvas.width,               // fullWidth
            canvas.height,              // fullHeight
            Math.floor( p[0] * dpr ),   // X
            Math.floor( p[1] * dpr ),   // Y
            1,                          // Width
            1,                          // Height
        );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Execute
        this.pickingRender( this.texPoint, this.targetCamera, this.targetRenderer );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Read Pixel
        const pxBuf = new Int32Array( 4 );
        this.targetRenderer.readRenderTargetPixels( this.texPoint, 0, 0, 1, 1, pxBuf );
        // console.log( Array.from(pxBuf) );
        
        if( pxBuf[0] < 0 ) return { type:'noPick', id:-1 };

        const itm = this.idMapper[ pxBuf[ 0 ] ];
        return itm.m.decodePixel( pxBuf, itm );
    }
    
    pickRect( cam, scene, rend, pMin, pMax ){
        console.log( "NEED TO FIX IMPLEMENTATION" );
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        /// Setup references used by onAfterRender
        this.targetRenderer = rend;
        this.targetScene    = scene;
        this.targetCamera   = cam;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Set the render viewport size, for this mode we
        // only need to render a single pixel worth
        const w   = pMax[0] - pMin[0];
        const h   = pMax[1] - pMin[1];
        const dpr = window.devicePixelRatio;
        cam.setViewOffset(
            rend.domElement.width,          // fullWidth
            rend.domElement.height,         // fullHeight
            Math.floor( pMin[0] * dpr ),    // X
            Math.floor( pMin[1] * dpr ),    // Y
            w,                              // Width
            h,                              // Height
        );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Execute
        const tex = genIntRenderTarget( w, h, 1 ); // Custom texture to fit rect select
        this.pickingRender( tex, cam, rend );
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Read Pixel
        const pxBuf = new Int32Array( w * h );
        rend.readRenderTargetPixels( tex, 0, 0, w, h, pxBuf );
        
        tex.dispose(); // Clear memory used by this texture. Can reuse these custom rect textures.
        // console.log( pxBuf );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create unique list of IDs
        const idList = new Set();
        for( const i of pxBuf ) if( i > 0 ) idList.add( i );

        return idList; // Array.from( idList );
    }
    // #endregion

    // #region RENDERING
    // Begin render process to compute texture that will hold the pixel ID
    pickingRender( tex, cam, rend ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Setup
        this.idMapper = {};

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Need to render an empty scene with a post render callback setup
        // to properly have access to internal bits that allows us to
        // render objects manually along with getting a list of objects
        // that was used to render the last frame. This list is how we can
        // use the main scene to render without needing to keep track
        // of a picking specific scene with cloned meshes.
        rend.setRenderTarget( tex );                // Set which texture to render to
        rend.getClearColor( this.bakClearColor );   // Backup existing clear color
        rend.setClearColor( this.nulClearColor );   // Set new clear color used for picking

        // NOTE There is a version of 3JS that can't clear an int buffer, so doing a manual clear
        // rend.autoClear = false;
        // rend.clearDepth();
        // const gl = rend.getContext();
        // gl.clearBufferiv( gl.COLOR, 0, this.nulClear );

        rend.render( this.emptyScene, cam );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Cleanup		
        cam.clearViewOffset();
        rend.setRenderTarget( null );
        rend.setClearColor( this.bakClearColor );
    }
    
    // Event bound to emptyScene, helps trigger rendering to the texture
    // this is needed to keep alive currentRenderState & grab last renderList 
    onAfterRender = ()=>{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get the last render list done by the renderer
        const rl    = this.targetRenderer.renderLists.get( this.targetScene, 0 ); // scene, renderCallDepth 
        const merge = rl.opaque.concat( rl.transmissive, rl.transparent );

        // console.log( rl.opaque );
        // console.log( rl.transmissive );
        // console.log( rl.transparent );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Manually render each object
        let intID;
        let pickMat;
        for( const i of merge ){
            pickMat = this.materials.meshHit;

            // ----------------------------------
            // Filter out objects that can be used by picking plus set the proper material
            // console.log( i.object.name, i.object.type, i.object.id, i.object.uuid );
            switch( i.object.type ){
                case 'Mesh'  : break;
                case 'Points':
                    if( i.object.name === 'ShapePointsMesh' ){
                        pickMat = this.materials.shapePnt;
                        pickMat.depthTest = i.object.material.depthTest;
                    }
                    break;
                
                // Skip this object
                default: continue;
            }

            // ----------------------------------
            // Picking can store int32 in the R Channel, so lets truncate
            // the UUID to an int to use it as an identifier.
            // TODO: This part may need to change in later applications
            // but this is good enough for this prototype
            // intID = uuidToInt( i.object.uuid );
            intID = i.object.id;
            // console.log( i.id, i.object.name || 'noname', i.object.uuid, intID, ( intID > 2_147_483_647 ) );

            // Update picking material with object's ID
            pickMat.intID = intID;
            this.idMapper[ intID ] = { o:i.object, m:pickMat };

            // ----------------------------------
            // NOTE: renderBufferDirect only works on a scene.onAfterRender else an error out
            // because currentRenderState is null. To handle this issue, render an empty scene
            // which will then do nothing but still have access to a set render state while still
            // having access to the previous frame's renderLists
            
            // Method is not documented, Will need to dig into source to get an idea.
            // https://github.com/mrdoob/three.js/blob/master/src/renderers/WebGLRenderer.js#L750
            this.targetRenderer.renderBufferDirect( 
                this.targetCamera, 
                null, 
                i.geometry, 
                pickMat, 
                i.object, 
                null
            );
        }
    }
    // #endregion

    // #region TASKS

    pixelTaskFromEvent( e, fn, alwaysCall=false ){
        return ()=>{
            const pos = [ e.clientX, e.clientY ];
            const dat = this.pickPoint( pos );
            // console.log( 'PICKING', pos, dat );
            if( alwaysCall || dat.id !== -1 ) fn( dat );
        }
    }

    // #endregion
}


// #region HELPERS
function uuidToInt( id ){
    // First 8 characters are a random in hex form
    // MAX int32 Value : 0x7FFFFFFF, 2_147_483_647
    // Need to grab the first 7 char else using 8
    // can overflow the value. Truncating the first 
    // 24 bits out of a 128 bit number

    return parseInt( id.substring( 0, 7 ), 16 );
}

function genIntRenderTarget( w=1, h=1, size=4 ){
    let format          = null;
    let internalFormat  = null;
    switch( size ){
        case 1: format = THREE.RedIntegerFormat;    internalFormat = 'R32I'; break;
        case 4: format = THREE.RGBAIntegerFormat;   internalFormat = 'RGBA32I'; break;
        default: return null;
    }

    return new THREE.WebGLRenderTarget( w, h, {
        minFilter   : THREE.NearestFilter,
        magFilter   : THREE.NearestFilter,
        type        : THREE.IntType,
        format,
        internalFormat,
    });
}
// #endregion


// #region PICKING MATERIALS

class PickingHitIDMaterial extends THREE.RawShaderMaterial{
    set intID( v ){ 
        this.uniforms.intID.value = v; 
        this.uniformsNeedUpdate   = true;
    }

    decodePixel( px, itm ){
        const floatScale = 10000;
        return { 
            type : 'meshHit',
            obj  : itm.o,
            id   : px[0],
            hit  : [
                px[1] / floatScale,
                px[2] / floatScale,
                px[3] / floatScale,
            ],
        };
    }

    constructor(){
        super({
        name            : 'PickingHitIDMaterial',
        glslVersion     : THREE.GLSL3,
        depthTest       : true,
        uniforms        : { intID : { type: 'int', value: 0 } },
        vertexShader    : `
        in vec3 position;

        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;

        out vec3 fragWPos;

        void main(){
            vec4 wPos     = modelMatrix * vec4( position, 1.0 );  // World Space
            vec4 vPos     = viewMatrix * wPos;                    // View Space
            gl_Position   = projectionMatrix * vPos;              // Projection Space
            fragWPos      = wPos.xyz;                             // Worldspace Vertex Position
        }`,

        fragmentShader  : `
        precision mediump float;

        uniform int  intID;
        in      vec3 fragWPos;
        layout(location=0) out ivec4 outData;
        
        const float toInt = 10000.0; // Scale float values so they can sit inside an int32

        void main(){ outData = ivec4( intID, ivec3( fragWPos * toInt ) ); }`
        });
    }
}

class PickingShapePointsMaterial extends THREE.RawShaderMaterial{
    set intID( v ){ 
        this.uniforms.intID.value   = v; 
        this.uniformsNeedUpdate     = true;
    }

    decodePixel( px, itm ){
        return { 
            type    : 'shapePoint',
            obj     : itm.o,
            id      : px[0],
            idx     : px[1],
            hit     : itm.o.getPosAt( px[1] ),
        };
    }

    constructor(){
        super({
        name            : 'PickingShapePoints',
        glslVersion     : THREE.GLSL3,
        depthTest       : true,
        uniforms        : { 
            intID   : { type: 'int',    value: 0 },
            u_scale : { type: 'float',  value: 20.0 } 
        },
        vertexShader    : `
        in	vec3	position;
        in	vec3	color;
        in	vec2	config;

        // uniform mat4 modelMatrix;
        // uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        
        uniform float u_scale;

        flat out int vertIdx;

        void main(){
            vec4 vPos     = modelViewMatrix * vec4( position, 1.0 );
            gl_Position   = projectionMatrix * vPos;
            gl_PointSize  = config.x * ( u_scale / -vPos.z );
            vertIdx       = gl_VertexID;
        }`,

        fragmentShader  : `
        precision mediump float;

        uniform int intID;
        flat in int vertIdx;

        layout(location=0) out ivec4 outData;
    
        void main(){ outData = ivec4( intID, vertIdx, 0, 0 ); }`
        });
    }
}

// #endregion


// #region TASK QUEUE

export class Tasker{
    queue = [];
    constructor(){}

    push( task ){ this.queue.push( task ); return this; }

    run(){
        if( this.queue.length === 0 ) return;

        // Copy reference and start a new queue.
        // Tasks can potentially create new tasks, so dont want
        // to create the possiblily of an infinite loop where a
        // queue is never empty.
        const q     = this.queue;
        this.queue  = [];

        for( let fn of q ){
            try {
                fn();                
            } catch( err ){
                console.error(`Error executing task:`, err);
            }
        }
    }
}

// #endregion