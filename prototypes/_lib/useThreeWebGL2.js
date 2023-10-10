// #region IMPORTS
import * as THREE           from 'three';
import { OrbitControls }    from 'three/examples/jsm/controls/OrbitControls.js';
export { THREE };
// #endregion

/*
<style>
    body, html { padding:0px; margin:0px; width:100%; height:100%; }
    canvas{ display:block; }
</style>

const App = useThreeWebGL2();
App.scene.add( facedCube( [0,3,0], 6 ) );
App
    .sphericalLook( 45, 35, 40 )
    .renderLoop();
*/


// #region OPTIONS
export function useDarkScene( tjs, props={} ){
    const pp = Object.assign( { ambient:0x404040, grid:true, }, props );

    // Light
    const light = new THREE.DirectionalLight( 0xffffff, 1.0 );
    light.position.set( 4, 10, 1 );
    tjs.scene.add( light );
    
    tjs.scene.add( new THREE.AmbientLight( pp.ambient ) );
    
    // Floor
    if( pp.grid ) tjs.scene.add( new THREE.GridHelper( 20, 20, 0x0c610c, 0x444444 ) );

    // Renderer
    tjs.renderer.setClearColor( 0x3a3a3a, 1 );
    return tjs;
}

export async function useVisualDebug( tjs ){
    const ary = await Promise.all([
        import( './meshes/DynLineMesh.js' ),
        import( './meshes/ShapePointsMesh.js' ),
    ]);

    const o = {};
    tjs.scene.add( ( o.ln  = new ary[ 0 ].default ) );
    tjs.scene.add( ( o.pnt = new ary[ 1 ].default ) );

    o.reset = ()=>{
        o.ln.reset();
        o.pnt.reset();
    };
    return o;
}
// #endregion

// #region MAIN
export default function useThreeWebGL2( props={} ){
    props = Object.assign( {
        colorMode : false,
        shadows   : false,
        preserverBuffer : false,
        power           : '',
    }, props );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // RENDERER
    const options = { 
        antialias               : true, 
        alpha                   : true,
        stencil                 : true,
        depth                   : true,
        preserveDrawingBuffer   : props.preserverBuffer,
        powerPreference         : ( props.power === '')      ? 'default' : 
                                  ( props.power === 'high' ) ? 'high-performance' : 'low-power',
    };

    const canvas    = document.createElement( 'canvas' );
    options.canvas  = canvas;
    options.context = canvas.getContext( 'webgl2',  { preserveDrawingBuffer: props.preserverBuffer } );

    const renderer = new THREE.WebGLRenderer( options );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor( 0x3a3a3a, 1 );
    //if( props.preserveDrawingBuffer ){
    // renderer.autoClearColor = false;
    // renderer.autoClearDepth = false;
    // Manual clearing : r.clearColor(); r.clearDepth();
    //}

    if( props.colorMode ){
        // React-Fiber changes the default settings, the defaults can cause issues trying to map colors 1:1
        // https://docs.pmnd.rs/react-three-fiber/api/canvas#render-defaults
        // https://threejs.org/docs/#manual/en/introduction/Color-management

        renderer.outputEncoding = THREE.sRGBEncoding;           // Turns on sRGB Encoding & Gamma Correction :: THREE.LinearEncoding
        renderer.toneMapping    = THREE.ACESFilmicToneMapping;  // Try to make it close to HDR :: THREE.NoToneMapping
        THREE.ColorManagement.legacyMode = false;               // Turns old 3JS's old color manager  :: true
    }

    if( props.shadows ){
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type    = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    }

    document.body.appendChild( renderer.domElement );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // CORE
    const scene   = new THREE.Scene();    
    const clock   = new THREE.Clock();
    clock.start();

    const camera  = new THREE.PerspectiveCamera( 45, 1.0, 0.01, 5000 );
    camera.position.set( 0, 5, 20 );

    // const ratio = window.innerWidth / window.innerHeight;
    // let height  = boxHeight / 2;
    // let width   = boxHeight * ratio / 2;
    // this.camera = new THREE.OrthographicCamera( -width, width, height, -height, -1, 2500 );

    const camCtrl = new OrbitControls( camera, renderer.domElement );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // METHODS
    let self;   // Need to declare before methods for it to be useable

    const render = ( onPreRender=null, onPostRender=null ) =>{
        const deltaTime   = clock.getDelta();
        const ellapseTime = clock.getElapsedTime();

        if( onPreRender )  onPreRender( deltaTime, ellapseTime );
        renderer.render( scene, camera );
        if( onPostRender ) onPostRender( deltaTime, ellapseTime );
        return self;
    };

    const renderLoop = ()=>{
        window.requestAnimationFrame( renderLoop );
        render();
        return self;
    };

    const createRenderLoop = ( fnPreRender=null, fnPostRender=null )=>{
        let   reqId = 0;

        const onRender = ()=>{
            render( fnPreRender, fnPostRender );
            reqId = window.requestAnimationFrame( onRender );
        };
        
        return {
            stop    : () => window.cancelAnimationFrame( reqId ),
            start   : () => onRender(),
        };
    };

    const sphericalLook = ( lon, lat, radius, target=null )=>{
        const phi 	= ( 90 - lat )  * Math.PI / 180;
        const theta = ( lon + 180 ) * Math.PI / 180;

        camera.position.set(
            -(radius * Math.sin( phi ) * Math.sin(theta)),
            radius * Math.cos( phi ),
            -(radius * Math.sin( phi ) * Math.cos(theta))
        );

        if( target ) camCtrl.target.fromArray( target );
        camCtrl.update();
        return self;
    };

    const resize = ( w=0, h=0 )=>{
        const W = w || window.innerWidth;
        const H = h || window.innerHeight;
        renderer.setSize( W, H );           // Update Renderer

        if( !camera.isOrthographicCamera ){
            camera.aspect = W / H;              
        }else{
            const h = camera.top;
            const w = h * ( W / H );
            camera.left    = -w;
            camera.right   =  w;
            camera.top     =  h;
            camera.bottom  = -h;
        }

        camera.updateProjectionMatrix();
        return self;
    };

    // computeSphericalLook(
    //     lon: number,
    //     lat: number,
    //     radius: number,
    //     target?: TVec3,
    //     ): {pos: Array<number>, rot: Array<number> | null} {
    //     const result: {pos: Array<number>, rot: Array<number> | null} = {
    //         pos: [0, 0, 0],
    //         rot: null,
    //     };
    //     const phi: number = ((90 - lat) * Math.PI) / 180;
    //     const theta: number = ((lon + 180) * Math.PI) / 180;

    //     result.pos[0] = -(radius * Math.sin(phi) * Math.sin(theta));
    //     result.pos[1] = radius * Math.cos(phi);
    //     result.pos[2] = -(radius * Math.sin(phi) * Math.cos(theta));

    //     if (target) {
    //         // Rotate camera to look directly at the target
    //         result.pos[0] += target[0];
    //         result.pos[1] += target[1];
    //         result.pos[2] += target[2];

    //         result.rot = [0, 0, 0, 1];
    //         quatEx.lookAt(result.rot, result.pos, target);
    //     }

    //     return result;
    // }

    // /** Use a bounding box to compute the distance and position of the camera */
    // boundFitLook( bMin, bMax, offsetScl = 0.9 ){
    //     const size    = vec3.sub([0, 0, 0], bMax, bMin);
    //     const center  = vec3.lerp([0, 0, 0], bMin, bMax, 0.5);
    //     const maxSize = Math.max(size[0], size[1], size[2]);

    //     const fitHDist = maxSize / ( 2 * Math.atan(( Math.PI * this.camera.fov ) / 360 ));
    //     const fitWDist = fitHDist / this.camera.aspect;
    //     const dist     = offsetScl * Math.max( fitHDist, fitWDist );

    //     const look     = this.computeSphericalLook(0, 20, dist, center);
    //     this.cameraController.targetMove(look.pos);
    //     if (look.rot) {
    //         this.cameraController.targetLook(look.rot);
    //     }

    //     return this;
    // }

    // delete3DObject(
    //     obj: Any3JS,
    //     incMaterial: boolean = true,
    //     performRemove: boolean = true,
    //   ) {
    //     if (incMaterial && obj.material) {
    //       if (obj.material instanceof Array) {
    //         obj.material.forEach(mat => this.deleteMaterial(mat));
    //       } else {
    //         this.deleteMaterial(obj.material);
    //       }
    //     }
    
    //     obj?.geometry?.dispose(); // Not all Objects3D have geometry
    
    //     // Auto removing causes an error during the scene's cleanup
    //     // Dispose will call this method with removal turned off
    //     if (performRemove) {
    //       obj?.removeFromParent();
    //     }
    //   }
    
    //   /** Dispose the resources of a material */
    //   deleteMaterial(mat: Any3JS): void {
    //     if (!mat.isMaterial) {
    //       return;
    //     }
    
    //     // Find & dispose textures
    //     let value: Any3JS;
    //     for (const key of Object.keys(mat)) {
    //       value = mat[key];
    //       if (value && typeof value === 'object' && 'minFilter' in value) {
    //         value.dispose();
    //       }
    //     }
    
    //     mat.dispose();
    //   }
    
    //   dispose(): void {
    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     // Clean up Scene
    //     this.scene?.traverse(o => {
    //       // The scene it self is on the list, do not
    //       // perform any cleanup action on itself.
    //       if (!o.isScene) {
    //         this.delete3DObject(o, true, false);
    //       }
    //     });
    
    //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //     // Misc clean up
    //     if (this.resizeObserver) {
    //       this.resizeObserver.disconnect();
    //     }
    
    //     this.renderer = null;
    //   }

    // getRenderSize(){
    //     //let w = 0, h = 0, v = { set:(ww,hh)=>{ w=ww; h=hh; } }; // Hacky Three.Vector2
    //     let v = new THREE.Vector2();
    //     this.renderer.getSize( v );
    //     //return [w,h];
    //     return v.toArray();
    // }

    // useParentElementToResize(): this {
    //     const elm = this.renderer.domElement.parentNode;
    //     if (this.resizeObserver) {
    //       this.resizeObserver.disconnect();
    //       this.resizeObserver = null;
    //     }
    
    //     this.resizeObserver = new ResizeObserver(entries => {
    //       const ent = entries[0];
    //       const w = Math.round(ent.contentRect.width);
    //       const h = Math.round(ent.contentRect.height);
    //       this.resize(w, h);
    //     });
    
    //     this.resizeObserver.observe(elm);
    //     return this;
    //   }

    // saveCanvasImage( fileName = 'image', type = 'png', quality = 1 ){
    //     // Convert canvas framebuffer to a data url with an image type
    //     const canvas = this.renderer.domElement;
    //     let url;
    //     switch( type ){
    //       case 'jpg'    : url = canvas.toDataURL('image/jpeg', quality); break;
    //       case 'webp'   : url = canvas.toDataURL('image/webp', quality); break;
    //       default       : url = canvas.toDataURL('image/png'); break;
    //     }
    
    //     // Create an anchor tag to initiate download
    //     const elm    = document.createElement('a');
    //     elm.href     = url;
    //     elm.download = `${fileName}.${type}`;
    //     elm.click();
    //     elm.remove();
    // }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    window.addEventListener( 'resize', ()=>resize() );
    resize();

    return self = {
        renderer,
        scene,
        camera,
        camCtrl,

        render,
        renderLoop,
        createRenderLoop,
        sphericalLook,
        resize,

        version: ()=>{ return THREE.REVISION; },
    };
}
// #endregion