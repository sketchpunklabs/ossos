//#region IMPORTS
import type Pose                    from '../../armature/Pose';
import type { IKChain }             from "../rigs/IKChain";
import type { IKData }              from '..';
import type { ISolver }             from './support/ISolver';

import { Transform }                from '../../maths';
import { vec3 }                     from 'gl-matrix';
import SwingTwistSolver             from "./SwingTwistSolver";
//#endregion

class HipSolver implements ISolver{
    //#region MAIN
    isAbs       : boolean   = true;
    position    : vec3      = [0,0,0];
    bindHeight  : number    = 0;
    _swingTwist             = new SwingTwistSolver();

    initData( pose ?: Pose, chain ?: IKChain ): this{
        if( pose && chain ){
            const b = pose.bones[ chain.links[ 0 ].idx ];
            this.setMovePos( b.world.pos, true );

            this._swingTwist.initData( pose, chain );
        }
        return this;
    }
    //#endregion

    //#region SETTING TARGET DATA
    setTargetDir( e: vec3, pole ?: vec3 ): this{ this._swingTwist.setTargetDir( e, pole ); return this; }
    setTargetPos( v: vec3, pole ?: vec3 ): this{ this._swingTwist.setTargetPos( v, pole ); return this; }
    setTargetPole( v: vec3 ): this{ this._swingTwist.setTargetPole( v ); return this; }

    setMovePos( pos: vec3, isAbs=true, bindHeight=0 ): this{
        this.position[ 0 ]  = pos[ 0 ];
        this.position[ 1 ]  = pos[ 1 ];
        this.position[ 2 ]  = pos[ 2 ];
        this.isAbs          = isAbs;
        this.bindHeight     = bindHeight;
        return this;
    }
    //#endregion

    resolve( chain: IKChain, pose: Pose, debug?:any ): void{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const hipPos : vec3 = [0,0,0];
        const pt            = new Transform();
        const ptInv         = new Transform();
        const lnk           = chain.first();

        // Get the Starting Transform
        if( lnk.pidx == -1 )    pt.copy( pose.offset );
        else                    pose.getWorldTransform( lnk.pidx, pt );

        ptInv.fromInvert( pt ); // Invert Transform to Translate Position to Local Space

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Which Position Type Are we handling?

        if( this.isAbs ){
            vec3.copy( hipPos, this.position );             // Set Absolute Position of where the hip must be
        }else{
            const ct = new Transform();
            ct.fromMul( pt, lnk.bind );                     // Get Bone's BindPose position in relation to this pose

            if( this.bindHeight == 0 ){
                vec3.add( hipPos, ct.pos, this.position );  // Add Offset Position
            }else{
                // Need to scale offset position in relation to the Hip Height of the Source
                vec3.scaleAndAdd( hipPos, ct.pos, this.position, Math.abs( ct.pos[ 1 ] / this.bindHeight ) );
            }
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        ptInv.transformVec3( hipPos );                  // To Local Space
        pose.setLocalPos( lnk.idx, hipPos );

        this._swingTwist.resolve( chain, pose, debug ); // Apply SwingTwist Rotation
    }

    ikDataFromPose( chain: IKChain, pose: Pose, out: IKData.Hip ): void{
        const v : vec3  = [0,0,0]; //   = new Vec3();
        const lnk       = chain.first();
        const b         = pose.bones[ lnk.idx ];
        const tran      = new Transform();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Figure out the Delta Change of the Hip Position from its Bind Pose to its Animated Pose

        if( b.pidx == -1 )   tran.fromMul( pose.offset, lnk.bind );                     // Use Offset if there is no parent
        else                 pose.getWorldTransform( lnk.pidx, tran ).mul( lnk.bind );  // Compute Parent's WorldSpace transform, then add local bind pose to it.

        vec3.sub( v, b.world.pos, tran.pos );   // Position Change from Bind Pose

        out.isAbsolute = false;                 // This isn't an absolute Position, its a delta change
        out.bindHeight = tran.pos[ 1 ];         // Use the bind's World Space Y value as its bind height

        vec3.copy( out.pos, v );                // Save Delta Change

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Alt Effector
        vec3.transformQuat( v, lnk.effectorDir, b.world.rot );
        vec3.normalize( out.effectorDir, v );

        // Alt Pole
        vec3.transformQuat( v, lnk.poleDir, b.world.rot );
        vec3.normalize( out.poleDir, v );
    }
}

export default HipSolver;