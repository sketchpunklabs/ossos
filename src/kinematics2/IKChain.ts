// #region IMPORTS
import type Pose            from '../armature/Pose';
import type Bone            from '../armature/Bone';

import Vec3                 from '../maths/Vec3';
import Quat                 from '../maths/Quat';
import Transform            from '../maths/Transform';
import BoneAxes             from './BoneAxes';
// #endregion


export class IKLink {
    index     = -1;                 // Bone Index
    pindex    = -1;                 // Parent Bone Index
    len       = 0;                  // Computed Length of the bone in chain
    axes      = new BoneAxes();     // IK May need alternative axis directions
    bind      = new Transform();    // Bind Link to a specific pose, localspace transform

    constructor( bone: Bone, swingTwist: number = -1 ){
        this.index  = bone.index;
        this.pindex = bone.pindex;
        this.bind.copy( bone.local );

        // If requesting SwingTwist, compute invert quaternion to
        // get the correct axis for this rotation space
        if( swingTwist !== -1 ){
            this.axes.setQuatDirections(
                new Quat().fromInvert( bone.world.rot ),
                swingTwist
            );
        }
    }
}


export class IKChain {
    // #region MAIN
    links : Array< IKLink > = [];    // List of linked bones
    len   : number          = 0;     // Length of the chain

    constructor( bones: Array<Bone>, swingTwist: number = -1 ){
        if( bones ) this.setBones( bones, swingTwist );
    }
    // #endregion

    // #region GETTERS // SETTERS
    get lastLink(){ return this.links[ this.links.length-1 ]; }
    get firstLink(){ return this.links[0]; }

    setBones( bones: Array< Bone >, swingTwist: number = -1 ): this{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.links.length = 0; // Reset chain just incase its been set before
        this.len          = 0;

        for( const b of bones ) this.links.push( new IKLink( b, swingTwist ) );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute the length of the chain by
        // computing the IK length of each bone
        const li = bones.length - 1;
        for( let i=1; i <= li; i++ ){
            this.links[ i-1 ].len = Vec3.dist( bones[i].world.pos, bones[i-1].world.pos );
            this.len             += this.links[ i-1 ].len; // Only compute the length till the last bone
        }

        // Its ok to save the last bone's length
        // BUT it should not be included in chain's length
        this.links[ li ].len = bones[ li ].len;

        return this;
    }

    /** Reset linked bones with the bind transfrom saved in the chain */
    resetPoseLocal( pose: Pose, startIdx=0, endIdx=-1 ): this{
        if( endIdx < 0 ) endIdx = this.links.length-1;

        let lnk: IKLink;
        for( let i=startIdx; i <= endIdx; i++ ){
            lnk = this.links[ i ];
            pose.bones[ lnk.index ]
                .local.rot.copy( lnk.bind.rot );
        }

        return this;
    }

    usePlacementForSwing( pose:Pose, twistDir:Vec3Like = [0,1,1] ): this{
        const swing = new Vec3();
        let a: IKLink;
        let b: IKLink;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( let i=1; i < this.links.length; i++ ){
            // Figure out the direction of previous link to this link
            a = this.links[i];
            b = this.links[i-1];
            swing.fromSub(
                pose.bones[ a.index ].world.pos,
                pose.bones[ b.index ].world.pos,
            ).norm();

            // Create inverse axes for the previous link pointing to this link
            b.axes
                .setOrthogonal( swing, twistDir )
                .applyInvertQuat( pose.bones[ b.index ].world.rot );
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Fix final link's axes, will continue last known swing direction
        b = this.links.at(-1) as IKLink;
        b.axes
            .setOrthogonal( swing, twistDir )
            .applyInvertQuat( pose.bones[ b.index ].world.rot );

        return this;
    }


    debug( debug: any, pose: Pose ){
        const t = new Transform();
        const a = new BoneAxes();
        const v = new Vec3();

        for( const l of this.links ){
            pose.getWorldTransform( l.index, t );   // Get World Transform from pose
            l.axes.getFromQuat( t.rot, a );         // Get World Axes Vectors

            debug.pnt.add( t.pos, 0xffffff, 1, 0 );
            debug.ln.add( t.pos, v.fromScaleThenAdd( 0.1, a.swing, t.pos ), 0xffffff );
            debug.ln.add( t.pos, v.fromScaleThenAdd( 0.1, a.twist, t.pos ), 0xff00ff );
            debug.ln.add( t.pos, v.fromScaleThenAdd( 0.1, a.ortho, t.pos ), 0x707070 );
        }
    }

    /** Simplify getting a pose bone. No index will return root bone */
    // getPoseBone( pose: Pose, idx: number = 0 ): Bone{ return pose.getBone( chain.links[ idx ].index ); }

    // getPoseWorldBind( pose: Pose, idx: number =0, pTran: Transform = new Transform() ){
    //     pose.getWorldTransform( chain.links[ idx ].pindex, pTran );
    //     return pTran.clone().mul( chain.links[ idx ].Bind );
    // }
    // #endregion
}
