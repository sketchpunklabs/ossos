import { Transform }    from '../maths/transform';
import { quat, vec3 }   from 'gl-matrix';

export interface BoneProps{
    name    ?: string;
    parent  ?: Bone | number | string;
    pos     ?: vec3;
    rot     ?: quat;
    scl     ?: vec3;
    len     ?: number;
}

export default class Bone{
    // #region MAIN
    index   = -1;
    pindex  = -1;
    name    = '';
    len     = 0;
    local   = new Transform();
    world   = new Transform();

    constructor( props ?: BoneProps ){
        this.name  = ( props?.name )? props.name : 'bone' + Math.random();

        if( typeof props?.parent === 'number' ) this.pindex = props.parent; 
        if( props?.parent instanceof Bone )     this.pindex = props.parent.index;

        if( props?.rot ) quat.copy( this.local.rot, props.rot );
        if( props?.pos ) vec3.copy( this.local.pos, props.pos );
        if( props?.scl ) vec3.copy( this.local.scl, props.scl );

        if( props?.len ) this.len = props.len;
    }
    // #endregion

    // #region METHODS

    // #endregion
};