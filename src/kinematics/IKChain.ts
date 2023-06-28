// #region IMPORTS
import type Bone            from '../armature/Bone';
import type Pose            from '../armature/Pose';
import { TQuat }            from '../maths/Quat';

import BoneAxes             from './BoneAxes';
import Transform            from '../maths/Transform';
import Vec3, { ConstVec3 }  from '../maths/Vec3';
// #endregion

export class IKLink{
    index     = -1;
    pindex    = -1;
    len       = 0;
    bind      = new Transform();
    world     = new Transform();

    constructor( bone: Bone ){
        this.index  = bone.index;
        this.pindex = bone.pindex;
        this.len    = bone.len;
        this.bind.copy( bone.local );
    }
}

/*
[[[ NOTES ]]]

Default Bone Axes Directions
Y : [0,1,0]     = (FWD) Effector Direction
Z : [0,0,-1]    = (UP)  Pole Direction ( Elbow/Knee )
X : [1,0,0]     = (RIT) Bending Axis, should be created using cross( Y, Z )
*/

export class IKChain{
    // #region MAIN
    links: Array<IKLink>  = [];                 // Link collection
    len                   = 0;                  // Total Length of chain
    count                 = 0;                  // How many links in the chain
    axes                  = new BoneAxes();     // Axes Direction related to Root's WS Rotation
    pworld                = new Transform();    // Parent WS Transform when updating root bone

    constructor( bones ?: Array<Bone> ){
        if( bones ) this.addBones( bones );
    }
    // #endregion

    // #region GETTERS

    isReachable( targetPos: ConstVec3 ): boolean{
        return ( Vec3.distSqr( targetPos, this.links[0].world.pos ) < this.len**2 );
    }

    // #endregion

    // #region METHODS
    addBones( bones: Array<Bone> ): this{
        for( const b of bones ){
            this.links.push( new IKLink( b ) );
            this.len += b.len;
        }

        this.count = this.links.length;
        return this;
    }

    // #endregion

    // #region METHODS IK COMPOSITION

    // Compute the worldspace transform of the ROOT bone from a pose
    updateRootFromPose( pose: Pose ): this{
        // Get the World transform to the root's parent bone.
        pose.getWorldTransform( this.links[0].pindex, this.pworld );

        // Then compute the root using the parent & the local bind transform of the link
        this.links[0].world.fromMul(
            this.pworld,
            this.links[ 0 ].bind
        );

        return this;
    }

    // World transform of each bone using the link's bind transform
    resetWorld( startIdx=-1, endIdx=-1 ): this{
        if( startIdx < 0 ) startIdx = 0;
        if( endIdx < 0 )   endIdx   = this.links.length-1;

        let lnk: IKLink;
        let pWS: Transform;
        for( let i=endIdx; i <= endIdx; i++ ){
            lnk  = this.links[ i ];
            pWS  = ( i === 0 )? this.pworld : this.links[ i-1 ].world;
            lnk.world.fromMul( pWS, lnk.bind );
        }

        return this;
    }

    // Update pose's bones using the chain's world transforms by converting to local space.
    setLocalRotPose( pose: Pose ): this{
        let lnk  : IKLink;
        let pRot : TQuat;

        for( let i=0; i < this.links.length; i++ ){
            lnk  = this.links[ i ];
            pRot = ( i === 0 )? this.pworld.rot : this.links[ i-1 ].world.rot;
            
            pose.bones[ lnk.index ].local.rot
                .copy( lnk.world.rot )
                .pmulInvert( pRot );
        }

        return this;
    }

    // #endregion

    // #region DEBUGGING
    debug( o: any ): void{
        const t = this.links[ 0 ].world;
        const v = new Vec3();
        console.log( this.axes );
        o.pnt.add( t.pos, 0x00ff00, 1 );
        o.ln.add( t.pos, v.fromQuat( t.rot, this.axes.ortho ).add( t.pos ), 0xff0000 );
        o.ln.add( t.pos, v.fromQuat( t.rot, this.axes.swing ).add( t.pos ), 0x00ff00 );
        o.ln.add( t.pos, v.fromQuat( t.rot, this.axes.twist ).add( t.pos ), 0x0000ff );
    }
    // #endregion
}
