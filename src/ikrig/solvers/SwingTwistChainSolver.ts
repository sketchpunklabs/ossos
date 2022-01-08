//#region IMPORTS
import type { TVec3 }               from '@oito/type';
import type { Pose }                from '@oito/armature';
import type { IKChain, Link }       from '../rigs/IKChain';
import type { ISolver }             from './ISolver';

import { Vec3, Transform, Quat }    from '@oito/core';
//#endregion

class STDirectionSet{
    effectorDir = [ 0, 0, 0 ];
    poleDir     = [ 0, 0, 0 ];
}

class SwingTwistChainSolver implements ISolver{
    //#region TARGETTING DATA
    directionSet !: Array<STDirectionSet>;
    //#endregion

    initData( pose?: Pose, chain?: IKChain ): this{
        if( pose && chain ){
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            const v     = new Vec3();
            let rot     : Quat;
            let lnk     : Link;
            let ds      : STDirectionSet;

            this.directionSet = new Array( chain.count );

            for( let i=0; i < chain.count; i++ ){
                lnk = chain.links[ i ];
                rot = pose.bones[ lnk.idx ].world.rot;
                ds  = new STDirectionSet();

                v.fromQuat( rot, lnk.effectorDir ).copyTo( ds.effectorDir );
                v.fromQuat( rot, lnk.poleDir ).copyTo( ds.effectorDir );

                this.directionSet[ i ] = ds;
            }
        }
        return this;
    }

    //#region SETTING TARGET DATA
    setChainDir( eff: TVec3[], pole: TVec3[] ): this{
        const cnt = eff.length;
        let   ds  : STDirectionSet;

        for( let i=0; i < cnt; i++ ){
            ds = this.directionSet[ i ];
            ds.effectorDir[ 0 ]  = eff[ i ][ 0 ];
            ds.effectorDir[ 1 ]  = eff[ i ][ 1 ];
            ds.effectorDir[ 2 ]  = eff[ i ][ 2 ];
            ds.poleDir[ 0 ]      = pole[ i ][ 0 ];
            ds.poleDir[ 1 ]      = pole[ i ][ 1 ];
            ds.poleDir[ 2 ]      = pole[ i ][ 2 ];
        }

        return this;
    }
    //#endregion

    resolve( chain: IKChain, pose: Pose, debug?:any ): void{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const iEnd      = chain.count - 1;
        const pRot      = new Quat();
        const cRot      = new Quat();
        const dir       = new Vec3();
        const rot       = new Quat();
        const tmp       = [ 0, 0, 0, 1 ];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let lnk: Link = chain.first();
        let ds : STDirectionSet;

        // Get Starting Parent WS Rotation
        if( lnk.pidx != -1 )    pose.getWorldRotation( lnk.pidx, pRot );
        else                    pRot.copy( pose.offset.rot );

        /* DEBUG
        const v         = new Vec3();
        const pTran     = new Transform();
        const cTran     = new Transform();
        pose.getWorldTransform( lnk.pidx, pTran );
        */

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( let i=0; i <= iEnd; i++ ){
            //-----------------------
            // PREPARE
            lnk = chain.links[ i ];             // Which Bone to act on
            ds  = this.directionSet[ i ];

            //-----------------------
            // SWING
            cRot.fromMul( pRot, lnk.bind.rot );         // Get bone in WS that has yet to have any rotation applied
            dir.fromQuat( cRot, lnk.effectorDir );      // What is the WS Effector Direction
            rot.fromUnitVecs( dir, ds.effectorDir );    // Create our Swing Rotation
            cRot.pmul( rot );                           // Then Apply to our Bone, so its now swong to match the ik effector dir

            /* DEBUG
            cTran.fromMul( pTran, lnk.bind );
            debug.pnt.add( cTran.pos, 0x00ff00, 1 );
            debug.ln.add( cTran.pos, v.fromScale( dir, 0.1 ).add( cTran.pos ), 0x00ff00 );
            */

			//-----------------------
            // TWIST
			dir.fromQuat( cRot, lnk.poleDir );          // Get our Current Pole Direction from Our Effector Rotation
			rot.fromUnitVecs( dir, ds.poleDir );        // Create our twist rotation
			cRot.pmul( rot );                           // Apply Twist so now it matches our IK Pole direction
            cRot.copyTo( tmp );                         // Save as the next Parent Rotation

            /* DEBUG
            debug.ln.add( cTran.pos, v.fromScale( dir, 0.2 ).add( cTran.pos ), 0x00ff00 );
            debug.ln.add( cTran.pos, v.fromScale( ikPole, 0.2 ).add( cTran.pos ), 0xff0000 );
            */

			//-----------------------
			cRot.pmulInvert( pRot );                    // To Local Space
			pose.setLocalRot( lnk.idx, cRot );          // Save back to pose
			if( i != iEnd ) pRot.copy( tmp );           // Set WS Rotation for Next Bone.

            /* DEBUG
            pTran.mul( cRot, lnk.bind.pos, lnk.bind.scl );
            */
        }
    }

}

export default SwingTwistChainSolver;