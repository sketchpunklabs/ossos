import MixamoIKAnimatorRig  from './MixamoIKAnimatorRig.js';

class Proto{
    static Debug            = null;
    static IKVisualizer     = null;
    static mixamo           = new MixamoIKAnimatorRig();
    static mixamoReady      = false;
    static rigs             = new Map();

    static tick( dt, et ){
        if( this.mixamoReady ){
            this.mixamo.tick( dt );

            // Visualize IK Data Over Src Bone View
            if( this.IKVisualizer ) this.IKVisualizer.show( this.Debug, this.mixamo.rig, this.mixamo.pose, this.mixamo.ikPose );

            let rig;
            for( rig of this.rigs.values() ){
                rig.applyIKPose( this.mixamo.ikPose, dt );
            }
        }
    }

    static initMixamo( app, itms=null ){
        const all = [
            '../_res/anim/Walking.gltf',
            '../_res/anim/Catwalk.gltf',
            '../_res/anim/Ready.gltf',
            '../_res/anim/Running.gltf',
            '../_res/anim/Standing.gltf',
            '../_res/anim/Rumba.gltf',
            '../_res/anim/Hiphop.gltf',
        ];

        if( !itms )                         itms = all;                 // Load All Animations
        else if( typeof itms == 'number' )  itms = [ all[ itms ] ];     // Load a specific one off the list
        else if( typeof itms == 'string' )  itms = [ itms ];            // Load a custom url to load one animation

        return this.mixamo
            .loadAsync( itms )
            .then( rig=>{
                rig.toScene( app );
                Proto.mixamoReady = true;
                return rig;
            });
    }

    static async initIKVisualizer(){
        const mod = await import( './IKPoseVisualizer.js' );
        this.IKVisualizer = mod.default;
    }

    static async initDebug( app, pnt=true, ln=true ){
        const debug = {};
        const ary   = [];
        if( pnt )   ary.push( import( '../../threejs/_lib/ShapePointsMesh.js' ).then( m=>{ debug.pnt = new m.default(); } ) ); //
        if( ln )    ary.push( import( '../../threejs/_lib/DynLineMesh.js' ).then( m=>{ debug.ln = new m.default(); } ) );
        
        await Promise.all( ary );
        if( debug.pnt ) app.add( debug.pnt );
        if( debug.ln )  app.add( debug.ln );

        this.Debug = debug;
        return debug;
    }

    static initKeyboardClip(){
        window.addEventListener( 'keypress', (e)=>{
            switch( e.key ){
                case '1': Proto.mixamo.useClip( 'Walking' ); break;
                case '2': Proto.mixamo.useClip( 'Running' ); break;
                case '3': Proto.mixamo.useClip( 'Catwalk' ); break;
                case '4': Proto.mixamo.useClip( 'Ready' ); break;
                case '5': Proto.mixamo.useClip( 'Standing' ); break;
                case '6': Proto.mixamo.useClip( 'Rumba' ); break;
                case '7': Proto.mixamo.useClip( 'Hiphop' ); break;
            }
        });

        return this;
    }

    static async loadRig( app, name, config=null ){
        const mod = await import( `../rigs/${name}.js` );
        const rig = new mod.default();

        await rig.loadAsync( config );
        rig.toScene( app );

        this.rigs.set( name, rig );

        return rig;
    }
}

export default Proto;