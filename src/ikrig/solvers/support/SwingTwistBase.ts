//#region IMPORTS
import type Pose                    from '../../../armature/Pose';
import type { IKChain }             from '../../rigs/IKChain';
import type { IKData }              from '../..';
import type { ISolver }             from './ISolver';

import { vec3 }                     from 'gl-matrix';

import SwingTwistSolver             from '../SwingTwistSolver';
//#endregion


class SwingTwistBase implements ISolver{
    //#region MAIN
    _swingTwist = new SwingTwistSolver();

    initData( pose?: Pose, chain?: IKChain ): this{
        if( pose && chain ) this._swingTwist.initData( pose, chain );
        return this;
    }
    //#endregion

    //#region SETTING TARGET DATA
    setTargetDir( e: vec3, pole ?: vec3, effectorScale ?: number ): this{ this._swingTwist.setTargetDir( e, pole, effectorScale ); return this; }
    setTargetPos( v: vec3, pole ?: vec3 ): this{ this._swingTwist.setTargetPos( v, pole ); return this; }
    setTargetPole( v: vec3 ): this{ this._swingTwist.setTargetPole( v ); return this; }
    //#endregion
    
    resolve( chain: IKChain, pose: Pose, debug?:any ): void{}

    ikDataFromPose( chain: IKChain, pose: Pose, out: IKData.DirScale ): void{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Length Scaled & Effector Direction
        const p0  : vec3   = chain.getStartPosition( pose );
        const p1  : vec3   = chain.getTailPosition( pose, true );
        const dir : vec3   = vec3.sub( [0,0,0], p1, p0 );
        
        out.lenScale = vec3.len( dir ) / chain.length;
        vec3.normalize( out.effectorDir, dir );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Pole Direction
        const lnk   = chain.first();            // Chain Link : Pole is based on the first Bone's Rotation
        const bp    = pose.bones[ lnk.idx ];    // Bone ref from Pose 

        vec3.transformQuat( dir, lnk.poleDir, bp.world.rot );   // Get Alt Pole Direction from Pose
        vec3.cross( dir, dir, out.effectorDir );                // Get orthogonal Direction...
        vec3.cross( dir, out.effectorDir, dir );                // to Align Pole to Effector
        vec3.normalize( out.poleDir, dir );
    }
}

export default SwingTwistBase;