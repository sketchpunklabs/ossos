import Transform        from '../maths/Transform';
import { quat, vec3 }   from 'gl-matrix';

export interface BoneProps{
    name    ?: string;
    parent  ?: Bone | number | string;
    len     ?: number;
    pos     ?: vec3;
    rot     ?: quat;
    scl     ?: vec3;
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

        // if( props?.rot ) quat.copy( this.local.rot, props.rot );
        // if( props?.pos ) vec3.copy( this.local.pos, props.pos );
        // if( props?.scl ) vec3.copy( this.local.scl, props.scl );

        if( props?.rot ) this.local.rot.copy( props.rot );
        if( props?.pos ) this.local.pos.copy( props.pos );
        if( props?.scl ) this.local.scl.copy( props.scl );

        if( props?.len ) this.len = props.len;
    }
    // #endregion

    // #region METHODS
    clone(): Bone{
        const b     = new Bone();
        b.name      = this.name;
        b.index     = this.index;
        b.pindex    = this.pindex;
        b.len       = this.len;

        b.local.copy( this.local );
        b.world.copy( this.world );
        // transform.copy( b.local, this.local );
        // transform.copy( b.world, this.world );
        return b;
    }
    // #endregion
};