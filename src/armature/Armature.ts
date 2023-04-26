// #region IMPORTS
import Bone, { BoneProps }      from './Bone';
import Pose                     from './Pose';
import Vec3                     from '../maths/Vec3';
import ISkin, { AnySkin }       from '../skinning/ISkin';
// #endregion

// type Nullable<T> = T | null | undefined;
// type NonNull<T>  = Exclude< T, null | undefined >;

export default class Armature{
    // #region MAIN
    skin  ?: ISkin;
    names  : Map< string, number >   = new Map();
    poses  : { [key:string] : Pose } = {
        bind: new Pose( this ),
    };
    // #endregion

    // #region GETTERS
    get bindPose():Readonly< Pose >{ return this.poses.bind; }
    
    newPose( saveAs ?: string ): Pose {
        const p = this.poses.bind.clone();
        if( saveAs ) this.poses[ saveAs ] = p;
        return p;
    }
    // #endregion

    // #region METHODS
	addBone( obj ?: BoneProps | Bone ): Bone{
        const bones = this.poses.bind.bones;
		const idx   = bones.length;

        if( obj instanceof Bone ){
            
            obj.index = idx;
            bones.push( obj );
            this.names.set( obj.name, idx );
            return obj;

        }else{
            const bone  = new Bone( obj );
            bone.index = idx;

            bones.push( bone );
            this.names.set( bone.name, idx );

            if( typeof obj?.parent === 'string' ){
                const pIdx = this.names.get( obj?.parent );

                if( pIdx !== undefined ) bone.pindex = pIdx;
                else                     console.error( 'Parent bone not found', obj.name );
            }

            return bone;
        }
    }

    getBone( o: string | number ): Bone | null {
        switch( typeof o ){
            case 'string':{
                const idx = this.names.get( o );
                return ( idx !== undefined )? this.poses.bind.bones[ idx ] : null;
                break;
            }

            case 'number':
                return this.poses.bind.bones[ o ];
                break;
        }
        return null;
    }

    getBones( ary: Array< string | number > ): Array< Bone >{
        const rtn: Array< Bone > = [];

        let b: Bone | null;
        for( const i of ary ){
            if( ( b = this.getBone( i ) ) ) rtn.push( b );
        }

        return rtn;
    }

    bind( boneLen=0.2 ): this{
        this.poses.bind.updateWorld();
        this.updateBoneLengths( this.poses.bind, boneLen );
        return this;
    }

    // Valid useage
    // const skin = arm.useSkin( new MatrixSkin( arm.bindPose ) );
    // const skin = arm.useSkin( MatrixSkin );
    useSkin( skin: AnySkin ): AnySkin{
        switch( typeof skin ){
            case 'object'   : this.skin = skin; break;
            case 'function' : this.skin = new skin( this.poses.bind ); break;
            default:
                console.error( 'Armature.useSkin, unknown typeof of skin ref', skin );
                break;
        }
        return this.skin;
    }
    // #endregion

    // #region #COMPUTE
    updateBoneLengths( pose: Pose, boneLen=0 ): this{
        const bEnd = pose.bones.length - 1;
        let b: Bone;
        let p: Bone;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Work backwards, compute parent bones from child
        for( let i=bEnd; i >= 0; i-- ){
            b = pose.bones[ i ];

            if( b.pindex !== -1 ){ 
                p       = pose.bones[ b.pindex ];
                p.len   = Vec3.dist( p.world.pos, b.world.pos );
                if( p.len < 0.0001  ) p.len = 0;
            }
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Any bones with no length, set with default value
        if( boneLen != 0 ){
            for( b of pose.bones ){
                if( b.len == 0 ) b.len = boneLen;
            }
        }

        return this;
    }
    // #endregion
}