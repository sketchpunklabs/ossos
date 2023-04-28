// #region IMPORTS
import type Bone            from '../armature/Bone';
import type Pose            from '../armature/Pose';
import { TQuat }            from '../maths/Quat';

import BoneAxes             from './BoneAxes';
import Transform            from '../maths/Transform';
import Vec3, { ConstVec3 }  from '../maths/Vec3';
// #endregion

class IKLink{
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

export default class IKChain{
    // #region MAIN
    links: Array<IKLink>  = [];    // Link collection
    len                   = 0;     // Total Length of chain
    count                 = 0;
    axes                  = new BoneAxes();
    pworld                = new Transform();

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

    // Compute the worldspace transfrom of the ROOT bone from a pose
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

    // Update pose's bone using the chain's world transforms by converting to local space.
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
}
