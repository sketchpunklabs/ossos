import { BipedRig, BipedIKPose }    from '../../../src/ikrig/index';
import { Animator }                 from '../../../src/animation/index';
import { Gltf2 }                    from '../../threejs/_lib/UtilGltf2.js';
import UtilArm                      from '../../threejs/_lib/UtilArm.js';

class MixamoIKAnimatorRig{
    //#region MAIN
    animator    = new Animator();
    ikPose      = new BipedIKPose();
    arm         = null;
    rig         = null;
    boneView    = null;
    pose        = null;

    onTick      = null;
    clips       = new Map();

    constructor(){
        this.animator.inPlace = true;
    }
    //#endregion

    //#region LOADING
    async loadAsync( aryUrl ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const ary = [];
        for( let i of aryUrl ) ary.push( Gltf2.fetch( i ) );

        const gltf = await Promise.all( ary );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.setupArmature( gltf[ 0 ] );
        this.setupIKRig();
        this.setupBoneView();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( let i=0; i < gltf.length; i++ ){
            this.loadClip( gltf[ i ], (i == 0) );
        }
        return this;
    }

    setupArmature( gltf ){
        this.arm    = UtilArm.armFromGltf( gltf, 0.07 );
        this.pose   = this.arm.newPose();
        this.pose
            .updateWorld()              // Mixamo Stuff has an Offset Transform, Compute Proper WS Transforms...
            .updateBoneLengths( 0.01 ); // Then use it to get the correct bone lengths for use in IK
    }

    setupIKRig(){
        this.rig = new BipedRig();
        if( !this.rig.autoRig( this.arm ) ) console.log( 'AutoRig was Incomplete' );
        
        this.rig
            .bindPose( this.pose )                  // Setup Chains & Alt Directions, Pose should be a TPose of the character
            .updateBoneLengths( this.pose )         // Apply BoneLengths to Rig since they're different from ARM.
            .useSolversForRetarget( this.pose );    // Setup Solvers
    }

    setupBoneView(){
        this.boneView = UtilArm.newBoneView( this.arm, this.pose, 2, 1 );
    }

    loadClip( gltf, autoLoad=false ){
        const clip = UtilArm.clipFromGltf( gltf );
        this.clips.set( clip.name, clip );

        // console.log( '- Load Clip : ', clip.name );

        if( autoLoad ) this.animator.setClip( clip );
    }
    //#endregion

    toScene( app ){
        if( this.boneView ) app.add( this.boneView );
    }

    useClip( clipName ){
        const clip = this.clips.get( clipName );
        if( clip ){
            this.animator.setClip( clip ).resetClock();
        }
    }

    tick( dt ){
        this.animator
            .update( dt )                                           // Move Animation Forward
            .applyPose( this.pose );                                // Apply Animation local space transform to Pose

        this.pose.updateWorld();                                    // Update the Pose's WorldSpace Transforms
        this.boneView.updateFromPose( this.pose );                  // Update Source's Bone View Rendering

        this.ikPose.computeFromRigPose( this.rig, this.pose );      // Compute IK Pose Data from Animation Pose
        if( this.onTick ) this.onTick( this, dt );
    }
}

export default MixamoIKAnimatorRig;