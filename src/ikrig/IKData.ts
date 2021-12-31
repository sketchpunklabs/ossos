import type { vec3 } from "gl-matrix";

export  class DirScale{
    lenScale    : number = 1;
    effectorDir : vec3   = [0,0,0];
    poleDir     : vec3   = [0,0,0];
}

export class Dir{
    effectorDir : vec3 = [0,0,0];
    poleDir     : vec3 = [0,0,0];
}

export class DirEnds{
    startEffectorDir : vec3 = [0,0,0];
    startPoleDir     : vec3 = [0,0,0];
    endEffectorDir   : vec3 = [0,0,0];
    endPoleDir       : vec3 = [0,0,0];
}

export class Hip{
    effectorDir : vec3    = [0,0,0];
    poleDir     : vec3    = [0,0,0];
    pos         : vec3    = [0,0,0];
    bindHeight  : number  = 1;
    isAbsolute  : boolean = false;
}
