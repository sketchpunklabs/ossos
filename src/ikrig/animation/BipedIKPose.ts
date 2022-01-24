//#region IMPORT
import type BipedRig    from '../rigs/BipedRig';
import type { Pose }    from '../../armature/index'

import * as IKData      from '../IKData';
//#endregion

class BipedIKPose{
    //#region MAIN
    hip     = new IKData.Hip();
    spine   = new IKData.DirEnds();
    head    = new IKData.Dir();

    armL    = new IKData.DirScale();
    armR    = new IKData.DirScale();
    legL    = new IKData.DirScale();
    legR    = new IKData.DirScale();
    
    handL   = new IKData.Dir();
    handR   = new IKData.Dir();
    footL   = new IKData.Dir();
    footR   = new IKData.Dir();

    constructor(){}
    //#endregion

    /** Compute the IK Data from a Rig and Pose */
    computeFromRigPose( r: BipedRig, pose: Pose ): void{
        r.legL?.solver.ikDataFromPose( r.legL, pose, this.legL );
        r.legR?.solver.ikDataFromPose( r.legR, pose, this.legR );
        r.armR?.solver.ikDataFromPose( r.armR, pose, this.armR );
        r.armL?.solver.ikDataFromPose( r.armL, pose, this.armL );
        
        r.footL?.solver.ikDataFromPose( r.footL, pose, this.footL );
        r.footR?.solver.ikDataFromPose( r.footR, pose, this.footR );
        r.handR?.solver.ikDataFromPose( r.handR, pose, this.handR );
        r.handR?.solver.ikDataFromPose( r.handL, pose, this.handL );

        r.head?.solver.ikDataFromPose( r.head, pose, this.head );
        r.spine?.solver.ikDataFromPose( r.spine, pose, this.spine );
        r.hip?.solver.ikDataFromPose( r.hip, pose, this.hip );
    }

    applyToRig( r: BipedRig ): void{
        r.legL?.solver.setTargetDir( this.legL.effectorDir, this.legL.poleDir, this.legL.lenScale );
        r.legR?.solver.setTargetDir( this.legR.effectorDir, this.legR.poleDir, this.legR.lenScale );
        r.armL?.solver.setTargetDir( this.armL.effectorDir, this.armL.poleDir, this.armL.lenScale );
        r.armR?.solver.setTargetDir( this.armR.effectorDir, this.armR.poleDir, this.armR.lenScale );

        r.footL?.solver.setTargetDir( this.footL.effectorDir, this.footL.poleDir );
        r.footR?.solver.setTargetDir( this.footR.effectorDir, this.footR.poleDir );
        r.handL?.solver.setTargetDir( this.handL.effectorDir, this.handL.poleDir );
        r.handR?.solver.setTargetDir( this.handR.effectorDir, this.handR.poleDir );
        r.head?.solver.setTargetDir( this.head.effectorDir, this.head.poleDir );

        r.hip?.solver
            .setTargetDir( this.hip.effectorDir, this.hip.poleDir )
            .setMovePos( this.hip.pos, this.hip.isAbsolute, this.hip.bindHeight );

        r.spine?.solver
            .setStartDir( this.spine.startEffectorDir, this.spine.startPoleDir )
            .setEndDir( this.spine.endEffectorDir, this.spine.endPoleDir );
    }

    copy( r: BipedIKPose ): this{
        this.hip.copy( r.hip );
        this.spine.copy( r.spine );
        this.head.copy( r.head );

        this.armL.copy( r.armL );
        this.armR.copy( r.armR );
        this.legL.copy( r.legL );
        this.legR.copy( r.legR );

        this.handL.copy( r.handL );
        this.handR.copy( r.handR );
        this.footL.copy( r.footL );
        this.footR.copy( r.footR );
        return this;
    }
}

export default BipedIKPose;