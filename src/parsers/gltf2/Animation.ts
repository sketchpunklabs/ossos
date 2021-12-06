import type Accessor from './Accessor';

type Transform = typeof ETransform[ keyof typeof ETransform ];
export const ETransform = {
    Rot : 0,
    Pos : 1,
    Scl : 2,
} as const;

type Lerp = typeof ELerp[ keyof typeof ELerp ];
export const ELerp = {
    Step    : 0,
    Linear  : 1,
    Cubic   : 2,
} as const;

export class Track{
    //#region ENUMS
    static Transform = ETransform;
    static Lerp      = ELerp;
    //#endregion

    //#region MAIN
    transform       : Transform = ETransform.Pos;
    interpolation   : Lerp      = ELerp.Step;
    jointIndex      : number    = 0;
    timeStampIndex  : number    = 0;
    keyframes      !: Accessor;
    
    static fromGltf( jointIdx:number, target:string, inter:string ): Track{
        const t = new Track();
        t.jointIndex = jointIdx;

        switch( target ){
            case 'translation'  : t.transform = ETransform.Pos; break;
            case 'rotation'     : t.transform = ETransform.Rot; break;
            case 'scale'        : t.transform = ETransform.Scl; break;
        }

        switch( inter ){
            case 'LINEAR'       : t.interpolation = ELerp.Linear;   break;
            case 'STEP'         : t.interpolation = ELerp.Step;     break;
            case 'CUBICSPLINE'  : t.interpolation = ELerp.Cubic;    break;
        }

        return t;
    }
    //#endregion
}

export class Animation{
    name        : string            = '';
    timestamps  : Array< Accessor > = [];
    tracks      : Array< Track >    = [];

    constructor( name ?: string ){
        if( name ) this.name = name;
    }
}