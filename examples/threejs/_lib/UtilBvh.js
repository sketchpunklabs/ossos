import { Armature, SkinMTX }    from '../../../src/armature/index';
import { Clip }                 from '../../../src/animation/index';
import Bvh                      from '../../../src/parsers/bvh/index';

import BoneDirMesh              from './BoneDirMesh.js';

class UtilBvh{
    static async fetchArmClip( url ){
        const bvh  = await Bvh.fetch( url );
        bvh.ignoreRoot = true;

        const clip = this.getClip( bvh );
        const arm  = this.getArmature( bvh );

        return [ arm, clip ];
    }

    static getClip( bvh ){    
        const anim = bvh.getAnimation();
        return Clip.fromBvh( anim, [0] );
    }

    static getArmature( bvh, defaultBoneLen = 0.07 ){
        const arm  = new Armature();
        const skin = bvh.getSkin();
    
        for( let j of skin.joints ){
            arm.addBone( j.name, j.parentIndex, j.rotation, j.position );
        }
    
        // Create Bind Pose
        arm.bind( SkinMTX, defaultBoneLen );
        return arm;
    }

    static getBoneView( pose, boneScl=0.1 ){
        const boneView = new BoneDirMesh( pose );
        boneView.setBoneScale( boneScl );
        boneView.updateFromPose( pose );
        return boneView;
    }
}

export { UtilBvh, Bvh };