import CharacterRig, { Gltf2 } from '../lib/CharacterRig.js';

class TinaRig extends CharacterRig{
    constructor(){ super(); }

    async loadAsync( config=null ){
        const url  = '../_res/models/tina/';
        const gltf = await Gltf2.fetch( url + 'tina.gltf' );
        this._parseArm( gltf, true )   // Create Armature
            ._autoRig()                 // Auto BipedRig

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.boneView ) this._boneView( config );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.mesh != false ){
            let base = 'cyan';
            if( config?.tex != false ) base = await this._texture( url + 'initialShadingGroup_albedo.jpg' );
            this._skinnedMesh( gltf, base, config );
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.springs != false ){
            this._boneSprings();   
            this.springs
                .addRotChain( 'braidr', ["hair.L.002","hair.L.004","hair.L.003","hair.L.005"], 3, 0.8 )
                .addRotChain( 'braidl', ["hair.R.002","hair.R.004","hair.R.003","hair.R.005"], 3, 0.8 )
                .addPosChain( "boot1", [ "breast.L" ], 3, 0.2 )
                .addPosChain( "boot2", [ "breast.R" ], 3, 0.2 )
            ;

            this.springs.setRestPose( this.pose ); // Set the resting pose of the springs
        }

        return this;
    }
}

export default TinaRig;