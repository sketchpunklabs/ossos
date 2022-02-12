//#region IMPORTS
import type { ITrack, fnInterp, Lerp }  from './types';
import type { FrameInfo }               from '../Animator';
import type Pose                        from '../../armature/Pose'

import { ELerp }                        from './types'
import TypePool                         from '../TypePool';
import { quat }                         from 'gl-matrix'
import QuatUtil                         from '../../maths/QuatUtil';
//#endregion


//#region ELERP FUNCTIONS
function quat_step( track: ITrack, fi: FrameInfo, out: quat ) : quat{
    return QuatUtil.fromBuf( out, track.values, fi.k0 * 4 );
}

function quat_linear( track: ITrack, fi: FrameInfo, out: quat ) : quat{
    const v0 = TypePool.quat();
    const v1 = TypePool.quat();

    QuatUtil.fromBuf( v0, track.values, fi.k0 * 4 );
    QuatUtil.fromBuf( v1, track.values, fi.k1 * 4 );
    QuatUtil.nblend( out, v0, v1, fi.t );   // TODO : Maybe Slerp in the future?

    TypePool.recycle_quat( v0, v1 );
    return out;
}
//#endregion


export default class QuatTrack implements ITrack{
    name            : string = 'QuatTrack';
    values         !: Float32Array;
    boneIndex       = -1;
    timeStampIndex  = -1;
    fnLerp          : fnInterp<quat> = quat_linear;

    setInterpolation( i: Lerp ): this {
        switch( i ){
            case ELerp.Step     : this.fnLerp = quat_step; break;
            case ELerp.Linear   : this.fnLerp = quat_linear; break;
            case ELerp.Cubic    : console.warn( 'Quat Cubic Lerp Not Implemented' ); break;
        }
        return this;
    }

    apply( pose: Pose, fi: FrameInfo ): this{
        const q = TypePool.quat();
        pose.setLocalRot( this.boneIndex, this.fnLerp( this, fi, q  ) );
        TypePool.recycle_quat( q );
        return this;
    }
}