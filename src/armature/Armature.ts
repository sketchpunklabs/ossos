// #region IMPORTS
import type ISkeleton           from './ISkeleton';
import Bone, { BoneProps }      from './Bone';
import { vec3 }                 from 'gl-matrix';
import { Transform, transform } from '../maths/transform';
// #endregion

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

    bind( boneLen=0.2 ): this{ return this.updateWorld().updateBoneLengths( boneLen ); }
    
    // #endregion

    // #region #COMPUTE
    updateWorld(): this{
        for( const b of this.bones ){
            if( b.pindex !== -1 ) transform.mul(  b.world, this.bones[ b.pindex ].world, b.local );
            else                  transform.mul(  b.world, this.offset, b.local );
        }

        return this;
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
                p.len   = vec3.dist( p.world.pos, b.world.pos );
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