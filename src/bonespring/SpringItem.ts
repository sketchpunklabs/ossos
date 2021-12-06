//#region IMPORTS
import Transform        from '../maths/Transform';
import SpringVec3       from './implicit_euler/SpringVec3';
//#endregion

class SpringItem{
    index   : number;
    name    : string;
    spring  = new SpringVec3();
    bind    = new Transform();  // Bind Transform in Local Space

    constructor( name: string, idx: number ){
        this.name   = name;
        this.index  = idx;
    }
}

export default SpringItem;