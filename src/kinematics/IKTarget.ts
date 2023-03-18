import { vec3, quat } from 'gl-matrix';

// enum TargetType {
//     Position    = 1,
//     Direction   = 2,
// }

export default class IKTarget{
    targetPos: vec3     = [0,0,0];
    targetDir: vec3     = [0,0,0];
    targetScl: number   = 1;
    targetRot: quat     = [0,0,0,1];
    poleDir  : vec3     = [0,0,0];
    twist    : number   = 0;

    // Maybe do a Position relative to a point
    // so have world and local position
    setPosition( v: vec3 ): this{
        vec3.copy( this.targetPos, v );
        // this.type = TargetType.Position
        return this;
    }

    // // If Direction, to get position it needs to position
    // fromDirection( v: vec3, scl: number = 1 ): this{
    //     vec3.copy( this.targetDir, v );
    //     this.targetScl = scl;
    //     // this.type = TargetType.Direction
    //     return this;
    // }
}