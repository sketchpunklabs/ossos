import { vec3 }    from "gl-matrix";

export  class DirScale{
    lenScale    : number = 1;
    effectorDir : vec3   = [0,0,0];
    poleDir     : vec3   = [0,0,0];

    copy( v: DirScale ): void{
        this.lenScale = v.lenScale;
        vec3.copy( this.effectorDir, v.effectorDir );
        vec3.copy( this.poleDir, v.poleDir );
    }

    clone(): DirScale{
        const c = new DirScale();
        c.copy( this );
        return c;
    }
}

export class Dir{
    effectorDir : vec3 = [0,0,0];
    poleDir     : vec3 = [0,0,0];

    copy( v: Dir ): void{
        vec3.copy( this.effectorDir, v.effectorDir );
        vec3.copy( this.poleDir, v.poleDir );
    }
}

export class DirEnds{
    startEffectorDir : vec3 = [0,0,0];
    startPoleDir     : vec3 = [0,0,0];
    endEffectorDir   : vec3 = [0,0,0];
    endPoleDir       : vec3 = [0,0,0];

    copy( v: DirEnds ): void{
        vec3.copy( this.startEffectorDir,   v.startEffectorDir );
        vec3.copy( this.startPoleDir,       v.startPoleDir );
        vec3.copy( this.endEffectorDir,     v.endEffectorDir );
        vec3.copy( this.endPoleDir,         v.endPoleDir );
    }
}

export class Hip{
    effectorDir : vec3    = [0,0,0];
    poleDir     : vec3    = [0,0,0];
    pos         : vec3    = [0,0,0];
    bindHeight  : number  = 1;
    isAbsolute  : boolean = false;

    copy( v: Hip ): void{
        this.bindHeight = v.bindHeight;
        this.isAbsolute = v.isAbsolute;
        vec3.copy( this.effectorDir,    v.effectorDir );
        vec3.copy( this.poleDir,        v.poleDir );
        vec3.copy( this.pos,            v.pos );
    }
}