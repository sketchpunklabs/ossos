// #region IMPORT
import type ISkeleton           from './ISkeleton';
import type Armature            from './Armature';
import type Bone                from './Bone';
import { Transform, transform } from '../maths/transform';
import { vec3, quat }           from 'gl-matrix';
// #endregion

export default class Pose implements ISkeleton{
    // #region MAIN
    arm !: Armature;
    bones: Array< Bone > = new Array();
    offset               = new Transform(); 

    constructor( arm: Armature ){
        this.arm = arm;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Clone data
        this.offset.copy( this.arm.offset );
        for( let b of this.arm.bones ) this.bones.push( b.clone() );
    }
    // #endregion

    // #region GETTERS
    getBone( o: string | number ): Bone | null {
        switch( typeof o ){
            case 'string':
                const idx = this.arm.names.get( o );
                return ( idx !== undefined )? this.bones[ idx ] : null;
                break;

            case 'number':
                return this.bones[ o ];
                break;
        }
        return null;
    }

    clone(): Pose{ return new Pose( this.arm ).copy( this ); }
    // #endregion

    // #region SETTERS
    setLocalPos( boneId: string | number, v: vec3 ): this{
        const bone = this.getBone( boneId );
        if( bone ) vec3.copy( bone.local.pos, v );
        return this;
    }
    
    setLocalRot( boneId: string | number, v: quat ): this{
        const bone = this.getBone( boneId );
        if( bone ) quat.copy( bone.local.rot, v );
        return this;
    }

    copy( pose: ISkeleton ): this{
        const bLen = this.bones.length;

        for( let i=0; i < bLen; i++ ){
            this.bones[ i ].local.copy( pose.bones[ i ].local );
            this.bones[ i ].world.copy( pose.bones[ i ].world );
        }

        return this;
    }
    // #endregion

    // #region COMPUTE
    updateWorld(): this {
        for( const b of this.bones ){
            if( b.pindex !== -1 ) transform.mul(  b.world, this.bones[ b.pindex ].world, b.local );
            else                  transform.mul(  b.world, this.offset, b.local );
        }

        return this;
    }

    getWorldRotation( boneId: string | number, out: quat = [0,0,0,1] ): quat{
        let bone = this.getBone( boneId );
        if( !bone ){
            if( boneId === -1 ) quat.copy( out, this.offset.rot );
            else                console.error( 'Pose.getWorldRotation - bone not found', boneId );
            return out;
        }

        // Work up the heirarchy till the root bone
        quat.copy( out, bone.local.rot );
        while( bone.pindex !== -1 ){
            bone = this.bones[ bone.pindex ];
            quat.mul( out, bone.local.rot, out );
        }

        // Add offset
        quat.mul( out, this.offset.rot, out );
        return out;
    }

    getWorldTransform( boneId: string | number, out = new Transform() ): Transform{
        let bone = this.getBone( boneId );
        if( !bone ){
            if( boneId === -1 ) transform.copy( out, this.offset );
            else                console.error( 'Pose.getWorldTransform - bone not found', boneId );
            return out;
        }

        // Work up the heirarchy till the root bone
        transform.copy( out, bone.local );
        while( bone.pindex !== -1 ){
            bone = this.bones[ bone.pindex ];
            transform.mul( out, bone.local, out );
        }

        // Add offset
        transform.mul( out, this.offset, out );
        return out;
    }

    getWorldPosition( boneId: string | number, out: vec3 = [0,0,0] ): vec3{
        return vec3.copy( out, this.getWorldTransform( boneId ).pos );
    }
    // #endregion

    // #region OPERATIONS

    rotLocal( boneId: string | number, deg: number, axis = 'x' ): this{
        const bone = this.getBone( boneId );
        if( bone ){
            switch( axis ){
                case 'y' : quat.rotateY( bone.local.rot, bone.local.rot, deg * Math.PI / 180 ); break;
                case 'z' : quat.rotateZ( bone.local.rot, bone.local.rot, deg * Math.PI / 180 ); break;
                default  : quat.rotateX( bone.local.rot, bone.local.rot, deg * Math.PI / 180 ); break;
            } 
        }else console.warn( 'Bone not found, ', boneId );

        return this;
    }

    rotWorld( boneId: string | number, deg: number, axis = 'x' ): this{
        const bone = this.getBone( boneId );
        
        if( bone ){
            const pWRot     = this.getWorldRotation( bone.pindex );                         // Get Parent World Space
            const cWRot     = quat.mul( [0,0,0,1], pWRot, bone.local.rot );                 // Get Bone's World Space

            const ax: vec3  = ( axis == 'y')? [0,1,0] : ( axis == 'z' )? [0,0,1] : [1,0,0]; // Rotation Axis
            const rot       = quat.setAxisAngle( [0,0,0,1], ax, deg * Math.PI / 180 );      // Create Axis Rotation

            quat.mul( cWRot, rot, cWRot );              // Apply rotation in world space
            quat.invert( pWRot, pWRot );                // Invert Parent Rotation
            quat.mul( bone.local.rot, pWRot, cWRot );   // Convert to local space & sace
        }else{
            console.error( 'Pose.rotWorld - bone not found', boneId );
        }

        return this;
    }

    moveLocal( boneId: string | number, offset:vec3 ): this{
        const bone = this.getBone( boneId );
        
        if( bone )  vec3.add( bone.local.pos, bone.local.pos, offset );
        else        console.warn( 'Pose.moveLocal - bone not found, ', boneId );
        
        return this;
    }

    posLocal( boneId: string | number, pos:vec3 ): this{
        const bone = this.getBone( boneId );
        
        if( bone )  vec3.copy( bone.local.pos, pos );
        else        console.warn( 'Pose.posLocal - bone not found, ', boneId );
        
        return this;
    }

    sclLocal( boneId: string | number, v: number | vec3 ): this{
        const bone = this.getBone( boneId );
        
        if( bone ){
            if( v instanceof Array || v instanceof Float32Array )
                vec3.copy( bone.local.scl, v as vec3 );
            else
                vec3.set( bone.local.scl, v, v, v );

        }else{
            console.warn( 'Pose.sclLocal - bone not found, ', boneId );
        }

        return this;
    }

    // #endregion
}