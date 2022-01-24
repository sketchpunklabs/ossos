import { vec3 }                 from 'gl-matrix';
import type BipedIKPose         from '../BipedIKPose';
import type IIKPoseAdditive     from '../support/IIKPoseAdditive';

export default class PositionOffset implements IIKPoseAdditive{
    pos: vec3 = [0,0,0];
    constructor( p: vec3 ){
        vec3.copy( this.pos, p );
    }

    apply( key:string, src: BipedIKPose ): void{
        const o : any = (src as any)[ key ];
        vec3.add( o.pos, o.pos, this.pos );
    }
}