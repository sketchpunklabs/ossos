// #region IMPORTS
import type ISkeleton           from './ISkeleton';
import Bone, { BoneProps }      from './Bone';
import Vec3                     from '../maths/Vec3';
import Quat                     from '../maths/Quat';
import Transform                from '../maths/Transform';
// #endregion

// type Nullable<T> = T | null | undefined;
// type NonNull<T>  = Exclude< T, null | undefined >;
export default class Armature implements ISkeleton{
    // #region MAIN
    bones: Array< Bone >         = new Array();
    names: Map< string, number > = new Map();
    offset                       = new Transform();
    // #endregion

    // #region MANAGE BONES

	addBone( obj ?: BoneProps | Bone ): Bone{
		const idx = this.bones.length;

        if( obj instanceof Bone ){
            
            obj.index = idx;
            this.bones.push( obj );
            this.names.set( obj.name, idx );
            return obj;

        }else{
            const bone  = new Bone( obj );
            bone.index = idx;

            this.bones.push( bone );
            this.names.set( bone.name, idx );

            if( typeof obj?.parent === 'string' ){
                const pIdx = this.names.get( obj?.parent );

                if( pIdx !== undefined ) bone.pindex = pIdx;
                else                     console.error( 'Parent bone not found', obj.name );
            }

            return bone;
        }
    }

    getBone( o: string | number ): Bone | null{
        switch( typeof o ){
            case 'string':
                const idx = this.names.get( o );
                return ( idx !== undefined )? this.bones[ idx ] : null;
                break;

            case 'number':
                return this.bones[ o ];
                break;
        }
        return null;
    }

    getBones( ary: Array< string | number > ): Array< Bone >{
        const rtn: Array< Bone > = [];

        let b: Bone | null;
        for( let i of ary ){
            if( ( b = this.getBone( i ) ) ) rtn.push( b );
        }

        return rtn;
    }

    bind( boneLen=0.2 ): this{ return this.updateWorld().updateBoneLengths( boneLen ); }
    
    // #endregion

    // #region #COMPUTE
    updateWorld(): this{
        for( const b of this.bones ){
            if( b.pindex !== -1 ) b.world.fromMul( this.bones[ b.pindex ].world, b.local );
            else                  b.world.fromMul( this.offset, b.local );
        }

        return this;
    }

    getWorldRotation( boneId: string | number, out = new Quat() ): Quat{
        let bone = this.getBone( boneId );
        if( !bone ){
            if( boneId === -1 ) out.copy( this.offset.rot );
            else                console.error( 'Pose.getWorldRotation - bone not found', boneId );
            return out;
        }

        // Work up the heirarchy till the root bone
        out.copy( bone.local.rot );
        while( bone.pindex !== -1 ){
            bone = this.bones[ bone.pindex ];
            out.pmul( bone.local.rot );
        }

        // Add offset
        out.pmul( this.offset.rot );
        return out;
    }

    getWorldTransform( boneId: string | number, out = new Transform() ): Transform{
        let bone = this.getBone( boneId );
        if( !bone ){
            if( boneId === -1 ) out.copy( this.offset );
            else                console.error( 'Pose.getWorldTransform - bone not found', boneId );
            return out;
        }

        // Work up the heirarchy till the root bone
        out.copy( bone.local );
        while( bone.pindex !== -1 ){
            bone = this.bones[ bone.pindex ];
            out.pmul( bone.local );
        }

        // Add offset
        out.pmul( this.offset );
        return out;
    }

    updateBoneLengths( boneLen=0 ): this{
        const bEnd = this.bones.length - 1;
        let b: Bone;
        let p: Bone;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Work backwards, compute parent bones from child
        for( let i=bEnd; i >= 0; i-- ){
            b = this.bones[ i ];

            if( b.pindex !== -1 ){ 
                p       = this.bones[ b.pindex ];
                p.len   = Vec3.dist( p.world.pos, b.world.pos );
                if( p.len < 0.0001  ) p.len = 0;
            }
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Any bones with no length, set with default value
        if( boneLen != 0 ){
            for( b of this.bones ){
                if( b.len == 0 ) b.len = boneLen;
            }
        }

        return this;
    }
    // #endregion
}