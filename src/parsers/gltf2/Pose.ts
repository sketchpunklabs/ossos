
class PoseJoint{
    //#region MAIN
    index   : number;
    rot     ?: number[];
    pos     ?: number[];
    scl     ?: number[];

    constructor( idx:number, rot ?: number[], pos ?: number[], scl ?: number[] ){
        this.index  = idx;
        this.rot    = rot;
        this.pos    = pos;
        this.scl    = scl;
    }
    //#endregion
}

class Pose{
    name    : string        = '';
    joints  : Array< PoseJoint > = [];

    constructor( name ?: string ){
        if( name ) this.name = name;
    }

    add( idx:number, rot ?: number[], pos ?: number[], scl ?: number[] ): void{
        this.joints.push( new PoseJoint( idx, rot, pos, scl ) );
    }
}

export { Pose, PoseJoint };