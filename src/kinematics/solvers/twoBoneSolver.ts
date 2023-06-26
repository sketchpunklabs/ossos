// #region IMPORTS
import type Pose         from '../../armature/Pose';
import type IKChain      from '../IKChain';
import type IKTarget     from '../IKTarget';

import Vec3              from '../../maths/Vec3';
// #endregion

function lawcos_sss( aLen: number, bLen: number, cLen: number ): number{
    // Law of Cosines - SSS : cos(C) = (a^2 + b^2 - c^2) / 2ab
    // The Angle between A and B with C being the opposite length of the angle.
    const v = ( aLen**2 + bLen**2 - cLen**2 ) / ( 2 * aLen * bLen );    
    return Math.acos( Math.min( 1, Math.max( -1, v ) ) );  // Clamp to prevent NaN Errors
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function twoBoneSolver( tar: IKTarget, chain: IKChain, _pose: Pose ): void{
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Get our two bones
    const l0 = chain.links[ 0 ];  // aLen               
    const l1 = chain.links[ 1 ];  // bLen

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // FIRST BONE
    const bendAxis = Vec3.fromQuat( l0.world.rot, chain.axes.ortho );  // X axis will act as our bending rotation
    const cLen     = Vec3.dist( l0.world.pos, tar.pos );           // Compute the 3rd side of the triangle by using the distance between root & target
    let   rad      = lawcos_sss( l0.len, cLen, l1.len );           // Get the Angle between First Bone and Target.
    l0.world.rot.pmulAxisAngle( bendAxis, -rad );                   // Apply Bending Rotation

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // SECOND BONE
    // Need to rotate from Right to Left, So take the angle and subtract it from 180 to rotate from 
    // the other direction. Ex. L->R 70 degrees == R->L 110 degrees
    rad	= Math.PI - lawcos_sss( l0.len, l1.len, cLen );
    l1.world.rot
        .fromMul( l0.world.rot, l1.bind.rot )   // Create unmodified ws rotation for bone 2
        .pmulAxisAngle( bendAxis, rad );       // Apply Bending Rotation
}

