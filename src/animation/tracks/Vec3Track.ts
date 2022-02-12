//#region IMPORTS
import type { ITrack, fnInterp, Lerp }  from './types';
import type { FrameInfo }               from '../Animator';
import type Pose                        from '../../armature/Pose'

import { ELerp }                        from './types'
import TypePool                         from '../TypePool';
import { vec3 }                         from 'gl-matrix'
import { Vec3Util }                     from '../../maths';
//#endregion

//#regeion ELERP FUNCTIONS
function vec3_step( track: ITrack, fi: FrameInfo, out: vec3 ) : vec3{
    return Vec3Util.fromBuf( out, track.values, fi.k0 * 3 );
}

function vec3_linear( track: ITrack, fi: FrameInfo, out: vec3 ) : vec3{
    const v0 = TypePool.vec3();
    const v1 = TypePool.vec3();

    Vec3Util.fromBuf( v0, track.values, fi.k0 * 3 );
    Vec3Util.fromBuf( v1, track.values, fi.k1 * 3 );
    vec3.lerp( out, v0, v1, fi.t );

    TypePool.recycle_vec3( v0, v1 );
    return out;
}
//#endregion

export default class Vec3Track implements ITrack{
    name            : string = 'Vec3Track';
    values         !: Float32Array;
    boneIndex       = -1;
    timeStampIndex  = -1;
    fnLerp          : fnInterp<vec3> = vec3_linear;

    setInterpolation( i: Lerp ): this {
        switch( i ){
            case ELerp.Step     : this.fnLerp = vec3_step; break;
            case ELerp.Linear   : this.fnLerp = vec3_linear; break;
            case ELerp.Cubic    : console.warn( 'Vec3 Cubic Lerp Not Implemented' ); break;
        }
        return this;
    }

    apply( pose: Pose, fi: FrameInfo ): this{
        const v = TypePool.vec3();
        pose.setLocalPos( this.boneIndex, this.fnLerp( this, fi, v ) );
        TypePool.recycle_vec3( v );
        return this;
    }
}