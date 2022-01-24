// #region IMPORTS
import type Armature        from './Armature';
import type Pose            from './Pose';
import type Bone            from './Bone';

import { vec3, quat }       from 'gl-matrix';
// #endregion


// #region SUPPORT OBJECTS

/** Hold Object Reference along with an offset transform */
class SlotItem{
    obj         : any;
    offsetPos  ?: vec3;
    offsetRot  ?: quat;
    offsetScl  ?: vec3;
}

class Slot{
    name        : string;
    boneName    : string;
    boneIdx     : number            = -1;
    items       : Array< SlotItem > = [];
    invBindRot  : quat              = [0,0,0,1];    

    constructor( name: string, bone: Bone ){
        this.name       = name;
        this.boneName   = bone.name;
        this.boneIdx    = bone.idx;

        quat.invert( this.invBindRot, bone.world.rot );
    }
}
// #endregion


class BoneSlots{
    // #region MAIN
    arm                 : Armature;
    slots               : Map< string, Slot > = new Map();
    onAttachmentUpdate ?: ( obj:any, rot: quat, pos: vec3, scl: vec3 )=>void;

    constructor( arm: Armature ){
        this.arm = arm;
    }
    // #endregion

    // #region Methods
    add( slotName: string, boneName: string ): this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const idx = this.arm.names.get( boneName );
        if( idx == undefined ){
            console.warn( 'Can not create bone slot, bone name not found:', boneName );
            return this;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const b    = this.arm.bones[ idx ];
        const slot = new Slot( slotName, b );
    
        this.slots.set( slotName, slot );
        return this;
    }

    attach( slotName: string, obj: any, offsetRot ?: quat, offsetPos ?: vec3, offsetScl ?: vec3 ): this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const slot = this.slots.get( slotName );
        if( !slot ){ console.warn( 'Slot not found', slotName ); return this; }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const si = new SlotItem();
        si.obj = obj;
        
        if( offsetRot ) si.offsetRot = quat.copy( [0,0,0,1], offsetRot );
        if( offsetPos ) si.offsetPos = vec3.copy( [0,0,0], offsetPos );
        if( offsetScl ) si.offsetScl = vec3.copy( [0,0,0], offsetScl );
        
        slot.items.push( si );
        return this;
    }

    updateFromPose( pose: Pose ): this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( this.onAttachmentUpdate == undefined ){ 
            console.warn( 'BoneSlots need handler assigned: onAttachmentUpdate ' ); 
            return this; 
        }
        
        const offsetRot : quat = [0,0,0,1];
        const rot       : quat = [0,0,0,1];
        const pos       : vec3 = [0,0,0];
        const scl       : vec3 = [1,1,1];

        let slot    : Slot;
        let si      : SlotItem;
        let b       : Bone;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( slot of this.slots.values() ){
            //+++++++++++++++++++++++++++++++++++++++++++++++++
            // If there are no objects, just skip
            if( slot.items.length == 0 ) continue;
            
            //+++++++++++++++++++++++++++++++++++++++++++++++++
            b = pose.bones[ slot.boneIdx ];                         // Get Slot's Bone
            //quat.mul( offsetRot, slot.invBindRot, b.world.rot );    // Compute Offset Rotation from Bind Pose Rotation
            quat.mul( offsetRot, b.world.rot, slot.invBindRot );    // Compute Offset Rotation from Bind Pose Rotation

            // Loop all the objects in the slot
            for( si of slot.items ){
                //-------------------------------------
                // ROTATION
                if( !si.offsetRot ) quat.copy( rot, offsetRot );
                else                quat.mul( rot, offsetRot, si.offsetRot );
                //else                quat.mul( rot, si.offsetRot, offsetRot );
                
                //-------------------------------------
                // SCALE
                if( !si.offsetScl ) vec3.copy( scl, b.world.scl );
                else                vec3.mul( scl, b.world.scl, si.offsetScl );

                //-------------------------------------
                // POSITION
                if( !si.offsetPos ) vec3.copy( pos, b.world.pos );
                else{
                    vec3.transformQuat( pos, si.offsetPos, offsetRot );
                    vec3.add( pos, b.world.pos, pos );

                    //vec3.add( pos, b.world.pos, si.offsetPos );
                    //vec3.copy( pos, b.world.pos );
                }

                //-------------------------------------
                // APPLY
                this.onAttachmentUpdate( si.obj, rot, pos, scl );
            }
        }

        return this;
    }

    /** Get All Slotted Objects */
    getAllObjects(): Array< any >{
        const rtn   : Array< any > = [];
        let slot    : Slot;
        let si      : SlotItem;

        for( slot of this.slots.values() ){
            if( slot.items.length == 0 ) continue;

            for( si of slot.items ) rtn.push( si.obj );
        }
        return rtn;
    }
    // #endregion
}

export default BoneSlots;