import Transform from '../maths/Transform';
import { TVec3 } from '../maths/Vec3';
import { TQuat } from '../maths/Quat';

export interface BoneProps{
    name    ?: string;
    parent  ?: Bone | number | string;
    len     ?: number;
    pos     ?: TVec3;
    rot     ?: TQuat;
    scl     ?: TVec3;
}

export default class Bone{
    // #region MAIN
    index   = -1;               // Array Index
    pindex  = -1;               // Array Index of Parent
    name    = '';               // Bone Name
    len     = 0;                // Length of Bone
    local   = new Transform();  // Local space transform
    world   = new Transform();  // World space transform
    constraint : any = null;

    constructor( props ?: BoneProps ){
        this.name  = ( props?.name )? props.name : 'bone' + Math.random();

        if( typeof props?.parent === 'number' ) this.pindex = props.parent; 
        if( props?.parent instanceof Bone )     this.pindex = props.parent.index;

        if( props?.rot ) this.local.rot.copy( props.rot );
        if( props?.pos ) this.local.pos.copy( props.pos );
        if( props?.scl ) this.local.scl.copy( props.scl );

        if( props?.len ) this.len = props.len;
    }
    // #endregion

    // #region METHODS
    clone(): Bone{
        const b         = new Bone();
        b.name          = this.name;
        b.index         = this.index;
        b.pindex        = this.pindex;
        b.len           = this.len;
        b.constraint    = this.constraint;

        b.local.copy( this.local );
        b.world.copy( this.world );
        return b;
    }
    // #endregion
}