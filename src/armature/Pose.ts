// #region IMPORT
import type Armature              from './Armature';
import type Bone                  from './Bone';
import Transform                  from '../maths/Transform';
import Vec3, { TVec3, ConstVec3 } from '../maths/Vec3';
import Quat, { ConstQuat }        from '../maths/Quat';
// #endregion

export default class Pose {
    // #region MAIN
    arm !: Armature;
    offset               = new Transform(); // Additional offset transformation to apply to pose root
    linkedBone ?: Bone   = undefined;       // This skeleton extends another skeleton
    bones: Array< Bone > = new Array();     // Bone transformation heirarchy

    constructor( arm ?: Armature ){ 
        if( arm ) this.arm = arm;

        // If bindpose exists, then lets do an instant clone of it
        if( arm?.poses?.bind ){
            for( let i=0; i < arm.poses.bind.bones.length; i++ ){
                this.bones.push( arm.poses.bind.bones[i].clone() );
            }

            this.offset.copy( arm.poses.bind.offset );
        }
    }
    // #endregion

    // #region GETTERS
    getBone( o: string | number ): Bone | null {
        switch( typeof o ){
            case 'string':{
                const idx = this.arm.names.get( o );
                return ( idx !== undefined )? this.bones[ idx ] : null;
                break;
            }

            case 'number':
                return this.bones[ o ];
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

    clone(): Pose{ 
        const p = new Pose();
        p.arm = this.arm;
        p.offset.copy( this.offset );

        for( const b of this.bones ) p.bones.push( b.clone() );
        return p;
    }

    getWorldTailPos( o: string | number, out: Vec3 = new Vec3() ): Vec3{
        const b = this.getBone( o );
        if( b ) b.world.transformVec3( out.xyz( 0, b.len, 0 ) );
        return out;
    }
    // #endregion

    // #region SETTERS
    setLocalPos( boneId: string | number, v: ConstVec3 ): this{
        const bone = this.getBone( boneId );
        if( bone ) bone.local.pos.copy( v );
        return this;
    }
    
    setLocalRot( boneId: string | number, v: ConstQuat ): this{
        const bone = this.getBone( boneId );
        if( bone ) bone.local.rot.copy( v );
        return this;
    }

    copy( pose: Pose ): this{
        const bLen = this.bones.length;

        for( let i=0; i < bLen; i++ ){
            this.bones[ i ].local.copy( pose.bones[ i ].local );
            this.bones[ i ].world.copy( pose.bones[ i ].world );
        }

        return this;
    }
    // #endregion

    // #region COMPUTE
    updateWorld(): this{
        for( const b of this.bones ){
            if( b.pindex !== -1 ){
                // Parent Exists
                b.world.fromMul( this.bones[ b.pindex ].world, b.local );
            }else{
                // No Parent, apply any possible offset
                b.world.fromMul( this.offset, b.local );

                // If pose is linked to another armature bone, append it as its true root
                if( this.linkedBone ){
                    b.world.pmul( this.linkedBone.world );
                }
            }
        }

        return this;
    }

    // updateLocalRot(): this{
    //     let b;
    //     for( b of this.bones ){
    //         b.local.rot
    //             .copy( b.world.rot )
    //             .pmulInvert( 
    //                 ( b.pindex !== -1 )? 
    //                     this.bones[ b.pindex ].world.rot : 
    //                     this.offset.rot  
    //             );
    //     }

    //     return this;
    // }

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

        // Add linked bone if available
        if( this.linkedBone ) out.pmul( this.linkedBone.world.rot );

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

        // Add linked bone if available
        if( this.linkedBone ) out.pmul( this.linkedBone.world );

        return out;
    }

    getWorldPosition( boneId: string | number, out = new Vec3() ): TVec3{
        return out.copy( this.getWorldTransform( boneId ).pos );
    }
    // #endregion

    // #region OPERATIONS

    rotLocal( boneId: string | number, deg: number, axis = 0 ): this{
        const bone = this.getBone( boneId );
        if( bone ){
            switch( axis ){
                case 1  : bone.local.rot.rotY( deg * Math.PI / 180 ); break;
                case 2  : bone.local.rot.rotZ( deg * Math.PI / 180 ); break;
                default : bone.local.rot.rotX( deg * Math.PI / 180 ); break;
            } 
        }else console.warn( 'Bone not found, ', boneId );

        return this;
    }

    rotWorld( boneId: string | number, deg: number, axis = 'x' ): this{
        const bone = this.getBone( boneId );
        
        if( bone ){
            const pWRot     = this.getWorldRotation( bone.pindex );                         // Get Parent World Space
            const cWRot     = new Quat( pWRot ).mul( bone.local.rot );                      // Get Bone's World Space
            const ax: TVec3 = ( axis == 'y')? [0,1,0] : ( axis == 'z' )? [0,0,1] : [1,0,0]; // Rotation Axis

            cWRot
                .pmulAxisAngle( ax, deg * Math.PI / 180 )   // Apply rotation in world space
                .pmulInvert( pWRot )                        // To Local Space
                .copyTo( bone.local.rot );                  // Save results
        }else{
            console.error( 'Pose.rotWorld - bone not found', boneId );
        }

        return this;
    }

    moveLocal( boneId: string | number, offset:ConstVec3 ): this{
        const bone = this.getBone( boneId );
        
        if( bone )  bone.local.pos.add( offset );
        else        console.warn( 'Pose.moveLocal - bone not found, ', boneId );
        
        return this;
    }

    posLocal( boneId: string | number, pos:ConstVec3 ): this{
        const bone = this.getBone( boneId );
        
        if( bone )  bone.local.pos.copy( pos );
        else        console.warn( 'Pose.posLocal - bone not found, ', boneId );
        
        return this;
    }

    sclLocal( boneId: string | number, v: number | ConstVec3 ): this{
        const bone = this.getBone( boneId );
        
        if( bone ){
            if( v instanceof Array || v instanceof Float32Array )
                bone.local.scl.copy( v );
            else if( typeof v === 'number' )
                bone.local.scl.xyz( v, v, v );

        }else{
            console.warn( 'Pose.sclLocal - bone not found, ', boneId );
        }

        return this;
    }

    // #endregion
}