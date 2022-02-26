import * as BABYLON from 'babylonjs';
import * as MATERIAL from 'babylonjs-materials';

// #region STARTUP
const mod_path = import.meta.url.substring( 0, import.meta.url.lastIndexOf("/") + 1 );
const css_path = mod_path + "Starter.css";

(function(){
    let link    = document.createElement( "link" );
    link.rel	= "stylesheet";
    link.type	= "text/css";
    link.media	= "all";
    link.href	= css_path;
    document.getElementsByTagName( "head" )[0].appendChild( link );
})();
// #endregion /////////////////////////////////////////////////////////////////////////

// https://github.com/BabylonJS/Babylon.js/tree/master/materialsLibrary/src/grid
// https://github.com/BabylonJS/Babylon.js/tree/master/dist/materialsLibrary

// Boiler Plate Starter for Babylon JS
class Starter{
    // #region MAIN
    scene			= null;
    engine		    = null;
    canvas 			= null;
    camera			= null;

    orbit			= null;
    render_bind		= this.render.bind( this );
    onRender		= null;
    deltaTime		= 0;
    elapsedTime		= 0;

    constructor(){
        this.initCore();
        this.initEnv();
        this.initUtil();
    }

    initCore(){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.canvas    = document.createElement( "canvas" );
        document.body.appendChild( this.canvas );

        this.engine    = new BABYLON.Engine( this.canvas, true );
        
        this.scene     = new BABYLON.Scene( this.engine );
        this.scene.clearColor = BABYLON.Color3.FromHexString( '#202020' );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.camera = new BABYLON.ArcRotateCamera( 'Camera', Math.PI/2, Math.PI/3, 4, new BABYLON.Vector3(0, 0.5, 0), this.scene );
        this.camera.attachControl( this.canvas, true );
        //this.camera.inertialRadiusOffset = 10;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    }

    initEnv(){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const light = new BABYLON.HemisphericLight( 'MainLight', new BABYLON.Vector3(1, 1, 0) );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const matGround                 = new MATERIAL.GridMaterial( "groundMaterial", this.scene );
        matGround.majorUnitFrequency    = 5;
        matGround.minorUnitVisibility   = 0.1;
        matGround.gridRatio             = 0.2;
        matGround.backFaceCulling       = false;
        matGround.mainColor             = new BABYLON.Color3(1, 1, 1);
        matGround.lineColor             = new BABYLON.Color3(0.4, 0.4, 0.4);
        matGround.opacity               = 0.98;

        const ground    = BABYLON.Mesh.CreateGround( 'Ground', 10, 10, 1, this.scene, false );
        ground.material = matGround;
    }

    initUtil(){
        window.addEventListener( 'resize', ()=>{ this.engine.resize(); });
        this.engine.runRenderLoop( this.render_bind );
    }

    render(){
        if( this.onRender ){
            const dt = this.engine.getDeltaTime() * 0.001;
            this.onRender( dt );
        }
        this.scene.render();
    }
    // #endregion ////////////////////////////////////////////////////////////////////////////////////////

    // #region METHODS
    add( o ){ this.scene.add( o ); return this; }
    remove( o ){ this.scene.remove( o ); return this; }

    setCamera( lon, lat, radius, target ){

        //this.camera.setTarget(BABYLON.Vector3.Zero());

        /*
        let phi     = ( 90 - lat ) * Math.PI / 180,
            theta   = ( lon + 180 ) * Math.PI / 180;

        this.camera.position.set(
            -(radius * Math.sin( phi ) * Math.sin(theta)),
            radius * Math.cos( phi ),
            -(radius * Math.sin( phi ) * Math.cos(theta))
        );
        
        if( target ) this.orbit.target.fromArray( target );

        this.orbit.update();
        */

        return this;
    }

    // #endregion ////////////////////////////////////////////////////////////////////////////////////////

    // #region EVENTS
    // onResize( e ){
    //     this.setSize( window.innerWidth, window.innerHeight );
    // }
    //#endregion

}

export default Starter;
export { BABYLON };