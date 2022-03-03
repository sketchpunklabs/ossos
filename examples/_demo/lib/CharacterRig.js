//#region IMPORTS
import { Gltf2 }                    from '../../threejs/_lib/UtilGltf2.js';
import UtilArm                      from '../../threejs/_lib/UtilArm.js';
import Util3js                      from '../../threejs/_lib/Util.js';

import { BipedRig }                 from '../../../src/ikrig/index';
//import { IKChain }                  from '../../src/ikrig/rigs/IKChain';
import BoneSpring                   from '../../../src/bonespring/index';
import BoneSlots                    from '../../../src/armature/BoneSlots';

import BipedIKPose                  from '../../../src/ikrig/animation/BipedIKPose';
import IKPoseAdditives              from '../../../src/ikrig/animation/additives/IKPoseAdditives';
//#endregion

class CharacterRig{
    //#region MAIN
    arm         = null;
    rig         = null;
    mesh        = null;
    boneView    = null;
    pose        = null;
    springs     = null;
    slots       = null;

    additives   = null;
    ikPose      = null;
    //constructor(){}
    //#endregion 

    //#region ABSTRACT METHODS
    async loadAsync(){ console.warn( 'CharacterRig.load not implemented' ); return this }
    //#endregion

    //#region LOADERS
    _parseArm( gltf, loadTPose=false ){ 
        this.arm    = UtilArm.armFromGltf( gltf );
        this.pose   = this.arm.newPose();

        if( loadTPose ){
            this.pose.fromGLTF2( gltf.getPose() );
            this.arm.updateSkinFromPose( this.pose );
        }

        this.pose.updateWorld();
        return this;
    }

    _bipedRig(){
        this.rig = new BipedRig();
        return this;
    }

    _autoRig(){
        this.rig = new BipedRig();
        if( ! this.rig.autoRig( this.arm ) ) console.log( 'AutoRigging Incomplete' );

        this.rig.bindPose( this.pose );               // Late Binding of TPose for the chains: Rigs only work with TPoses
        this.rig.useSolversForRetarget( this.pose );  // Use Default Solvers for known chains, Should Happen After Bind
        
        return this;
    }

    _skinnedMesh( gltf, base='cyan', config=null ){
        this.mesh = UtilArm.skinMtxMesh( gltf, this.arm, base );
        if( config?.meshPos ) this.mesh.position.fromArray( config.meshPos );
        return this;
    }

    _boneView( config=null, meshScl=0.02, dirScl=2 ){
        this.boneView = UtilArm.newBoneView( this.arm, null, meshScl, dirScl ); 
        this.boneView.updateFromPose( this.pose );

        if( config?.bonePos ) this.boneView.position.fromArray( config.bonePos );
        return this;
    }

    _boneSlots(){
        this.slots = new BoneSlots( this.arm );
        this.slots.onAttachmentUpdate = ( obj, rot, pos, scl )=>{
            obj.quaternion.fromArray( rot );
            obj.position.fromArray( pos );
            obj.scale.fromArray( scl );
        };
        return this;
    }

    _ikAdditives(){
        this.additives = new IKPoseAdditives();
        this.ikPose    = new BipedIKPose();
        return this;
    }

    _texture( url ){ return Util3js.loadTexture( url ); }

    _boneSprings(){
        this.springs = new BoneSpring( this.arm );
        return this;
    }
    //#endregion

    //#region METHODS
    clone( obj=null ){
        const char  = obj || new CharacterRig();
        char.arm    = this.arm.clone();
        
        if( this.pose ){
            char.pose = this.pose.clone();
            char.pose.arm = char.arm;
        }

        if( this.boneView ){
            const meshScl   = this.boneView.material.uniforms.meshScl.value;
            const dirScl    = this.boneView.material.uniforms.dirScl.value;
            char.boneView   = UtilArm.newBoneView( char.arm, null, meshScl, dirScl ); 
            char.boneView.updateFromPose( char.pose );
        }

        if( this.mesh ){
            char.mesh = this.mesh.clone();
            const mat = char.mesh.material.clone();

            // Cloned mesh will share the same material, need to clone
            // that seperatly so be able to apply skinning data for individual meshes
            mat.uniforms.pose.value = char.arm.getSkinOffsets()[ 0 ];

            // Cloning Material causes the texture to be black, so grab ref of original texture.
            mat.uniforms.texBase.value = char.mesh.material.uniforms.texBase.value; 
            char.mesh.material = mat;
        }

        return char;
    }

    toScene( app ){
        if( this.mesh )     app.add( this.mesh );
        if( this.boneView ) app.add( this.boneView );
        return this;
    }
    //#endregion

    //#region UPDATING / APPLYING
    update( dt ){
        if( this.springs )  this.springs.updatePose( dt, this.pose, true );
        if( this.boneView ) this.boneView.updateFromPose( this.pose );
        if( this.mesh )     this.arm.updateSkinFromPose( this.pose );
        if( this.slots )    this.slots.updateFromPose( this.pose );
    }

    applyIKPose( ikPose, dt ){
        if( this.ikPose && this.additives ){
            this.ikPose.copy( ikPose );
            this.additives.apply( this.ikPose );
            this.ikPose.applyToRig( this.rig );     // Set IK Data to Solvers on the Rig
        }else{
            ikPose.applyToRig( this.rig );          // Set IK Data to Solvers on the Rig
        }
        
        this.rig.resolveToPose( this.pose );        // Execute Solvers & Store Local Space results to Pose
        this.pose.updateWorld();                    // Update the pose's WorldSpace transform
        this.update( dt );
    }
    //#endregion
}

export default CharacterRig;
export { Gltf2, UtilArm };