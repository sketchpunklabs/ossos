import type { vec3, quat } from 'gl-matrix';

export default class IKTarget{
    targetPos: vec3     = [0,0,0];
    targetDir: vec3     = [0,0,0];
    targetScl: number   = 1;
    targetRot: quat     = [0,0,0,1];
    poleDir: vec3       = [0,0,0];
}

