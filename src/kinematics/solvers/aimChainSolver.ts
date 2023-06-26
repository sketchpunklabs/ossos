// #region IMPORTS
import type Pose         from '../../armature/Pose';
import type IKChain      from '../IKChain';
import type IKTarget     from '../IKTarget';

import Vec3              from '../../maths/Vec3';
import Quat              from '../../maths/Quat';
// #endregion

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function aimChainSolver( tar: IKTarget, chain: IKChain, _pose: Pose ): void{
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
    const cTran = chain.links[0].world;

    // Get direction from bone to target
    // const tarDir = new Vec3( tar.pos ).sub( cTran.pos ).norm();
    const tarDir = tar.dir;

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Swing Rotation - Compute bone's currect pointing direction ( Y ).
    const dir = new Vec3( chain.axes.swing ).transformQuat( cTran.rot );
    const rot = new Quat()
        .fromSwing( dir, tarDir ) // Create Swing Rotation
        .mul( cTran.rot );        // Apply swing to current bone rotation

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Reset Twisting Rotation

    // With swing rotation now aligned to the target direction,
    // test to see if the target direction is pointing directly at a pole
    // The reset direction will change depending on the pole.
    const twistDir      = new Vec3(); 
    const swingTwistDir = new Vec3();
    const orthDir       = new Vec3();

    twistDir.copy( tar.poleDir );

    /*
    // Get the twist dir from unmodifed bone rotation
    twistDir.fromQuat( cTran.rot, chain.axes.z );

    // -----------------------------------------
    // Correct twist direction by rotating it if it matches the swing point direction
    // Swing dir should now match target dir, so we can reuse that for our dot check
    const dot = Vec3.dot( twistDir, tarDir );
    if( Math.abs( dot ) > 0.9999 ){
        // Compute rotation axis to spin the Z direction
        // Can use X since its orthogonal to Y & Z already
        orthDir.fromQuat( cTran.rot, chain.axes.x );

        // Spin the twist direction 90 degrees based on the sign of the dot product
        // So if positive spin downward else spin upward.
        twistDir.transformQuat(
            Quat.axisAngle( orthDir, Math.PI * 0.5 * Math.sign( dot ) )
        );
    }
    */

    // -----------------------------------------
    // Get the twist direction after swing rotation is applied
    swingTwistDir.fromQuat( rot, chain.axes.twist );

    // With our swing pointing dir matching our target dir, we can use it instead of 
    // generating it to help realign our twist direction by finding the orthogonal dir
    orthDir.fromCross( tarDir, twistDir ); // cross( FWD, UP )    = RIGHT
    twistDir.fromCross( orthDir, tarDir ); // cross( RIGHT, FWD ) = Corrected UP
    
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Create rotation that will reset the twisting so its axis aligned
    cTran.rot.fromMul(
        Quat.swing( swingTwistDir, twistDir ),
        rot
    );
}