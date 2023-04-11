import type { ConstVec3 } from '../maths/Vec3.js';
import type { ConstQuat } from '../maths/Quat.js';
import type Bone          from './Bone';
import type Pose          from './Pose.js';

import Transform          from '../maths/Transform';

export type TTransformTransferHandler = ( tran: Transform, obj: any )=>void;

// #region SUPPORT STRUCTS
class SocketItem{
    local: Transform = new Transform();
    obj  : any;

    constructor( obj: any, pos ?: ConstVec3, rot ?: ConstQuat, scl ?: ConstVec3 ){
        this.obj = obj;
        if( pos ) this.local.pos.copy( pos );
        if( rot ) this.local.rot.copy( rot );
        if( scl ) this.local.scl.copy( scl );
    }
}

class Socket{
    boneIndex   : number            = -1;
    local       : Transform         = new Transform();
    items       : Array<SocketItem> = [];

    constructor( bi:number, pos ?: ConstVec3, rot ?: ConstQuat ){
        this.boneIndex = bi;
        if( pos ) this.local.pos.copy( pos );
        if( rot ) this.local.rot.copy( rot );
    }
}
// #endregion

export default class BoneSockets{
    sockets          : Map< string, Socket > = new Map();
    transformHandler ?: TTransformTransferHandler;

    constructor( tHandler ?: TTransformTransferHandler ){
        if( tHandler ) this.transformHandler = tHandler;
    }

    add( name: string, bone: Bone, pos ?: ConstVec3, rot ?: ConstQuat ): this{
        this.sockets.set( name, new Socket( bone.index, pos, rot ) );
        return this;
    }

    attach( socketName: string, obj: any, pos ?: ConstVec3, rot ?: ConstQuat, scl ?: ConstVec3 ): this{
        const s = this.sockets.get( socketName );
        
        if( s ) s.items.push( new SocketItem( obj, pos, rot, scl ) );
        else    console.error( 'Socket.attach: Socket name not found:', socketName );

        return this;
    }

    updateFromPose( pose: Pose ){
        if( !this.transformHandler ) return;

        const st = new Transform();
        const t  = new Transform();
        let b: Bone;
        
        for( const s of this.sockets.values() ){
            b = pose.bones[ s.boneIndex ];
            st.fromMul( b.world, s.local );

            for( const i of s.items ){
                t.fromMul( st, i.local );

                try{
                    this.transformHandler( t, i.obj );
                }catch( err ){
                    const msg = ( err instanceof Error )? err.message : String( err );
                    console.error( 'Error updating bone socket item: ', msg );
                }

            }
        }
    }

    debugAll( pose: Pose, debug: any ): void{
        const t = new Transform();
        let b: Bone;
        for( const s of this.sockets.values() ){
            b = pose.bones[ s.boneIndex ];
            t.fromMul( b.world, s.local );

            debug.pnt.add( t.pos, 0xffffff, 4, 2 );
        }
    }
}