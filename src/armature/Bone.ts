import { vec3, quat }   from 'gl-matrix';
import Transform        from '../maths/Transform';

class Bone{
    name    : string;           // Name of Bone
    idx     : number;           // Bone Index
    pidx    : number;           // Index to Parent Bone if not root. -1 means no parent
    len     : number;           // Length of the Bone

    local   = new Transform();  // Local Transform of Resting Pose
    world   = new Transform();  // World Transform of Resting Pose

    constructor( name: string, idx: number, len=0 ){
        this.name   = name;
        this.idx    = idx;
        this.pidx   = -1;
        this.len    = len;
    }

    setLocal( rot ?: quat, pos ?: vec3, scl ?: vec3 ): this{
        if( rot ) quat.copy( this.local.rot, rot ); // this.local.rot.copy( rot );
        if( pos ) vec3.copy( this.local.pos, pos ); // this.local.pos.copy( pos );
        if( scl ) vec3.copy( this.local.scl, scl ); // this.local.scl.copy( scl );
        return this;
    }

    clone(): Bone{
        const b = new Bone( this.name, this.idx, this.len );
        
        b.pidx = this.pidx;
        b.local.copy( this.local );
        b.world.copy( this.world );
        return b;
    }
}

export default Bone;