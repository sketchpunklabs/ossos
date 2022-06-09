import { vec3 } from "gl-matrix";

type Transform = typeof ETransform[ keyof typeof ETransform ];
export const ETransform = {
    Rot : 0,
    Pos : 1,
} as const;

export class Track{
    //#region ENUMS
    static Transform = ETransform;
    //#endregion

    //#region MAIN
    transform       : Transform;
    jointIndex      : number;
    keyframes      !: Float32Array;

    constructor( jointIndex:number = 0, transformType:Transform = ETransform.Pos ){
        this.transform  = transformType;
        this.jointIndex = jointIndex;
    }
    //#endregion   

    // #region METHODS
    buildKeyframeData( frameCount:number ): this{
        const comSize = ( this.transform == ETransform.Pos )? 3 : 4;
        this.keyframes = new Float32Array( frameCount * comSize );
        return this;
    }

    setFrameData( frameIndex: number, data: Array<number> ): void{
        const idx = ( this.transform == ETransform.Pos )? 3 * frameIndex : 4 * frameIndex;
        this.keyframes.set( data, idx );
    }
    // #endregion

    // #region STATIC 
    static newPosition( jointIndex:number ): Track{ return new Track( jointIndex, ETransform.Pos ); }
    static newRotation( jointIndex:number ): Track{ return new Track( jointIndex, ETransform.Rot ); }
    // #endregion
}

export class Animation{
    name        : string         = '';
    duration    : number         = 0;
    timestamp   : Float32Array;
    joints      : Array< { rot:Track, pos:Track } > = [];
    frameCount  : number;
    
    constructor( frameCount:number ){
        this.timestamp  = new Float32Array( frameCount );
        this.frameCount = frameCount;
    }

    addJoint(): number{
        const idx  = this.joints.length;
        const tRot = Track.newRotation( idx ).buildKeyframeData( this.frameCount );
        const tPos = Track.newPosition( idx ).buildKeyframeData( this.frameCount );
        this.joints.push({ rot: tRot, pos: tPos });
        return idx;
    }
}