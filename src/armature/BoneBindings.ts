import type Bone from './Bone';

export type TOnBoneTransfer = ( bone: Bone, obj: any )=>void;

type TTransferSet = {
    bone: WeakRef<Bone>,
    obj: WeakRef<any>,
};

export default class BoneBindings{
    // #region MAIN
    onUpdate : TOnBoneTransfer;
    items    : Map<string, TTransferSet> = new Map();

    constructor( fn: TOnBoneTransfer ){
        this.onUpdate = fn;
    }
    // #endregion

    // #region METHODS
    bind( bone:Bone, obj:any ): this{
        this.items.set( window.crypto.randomUUID(), {
            bone : new WeakRef( bone ),
            obj  : new WeakRef( obj ),
        });
        return this;
    }

    removeBone( bone:Bone ): this{
        const trash: Array<string> = [];
        let b : Bone | undefined;
        let k : string;
        let v : TTransferSet;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( [k,v] of this.items ){
            b = v.bone.deref();
            if( !b || b === bone ) trash.push( k );
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( trash.length > 0 ){
            for( k of trash ) this.items.delete( k );
        }

        return this;
    }

    updateAll(): this{
        const trash: Array<string> = [];
        let b : Bone | undefined;
        let o : any;
        let k : string;
        let v : TTransferSet;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( [k,v] of this.items ){
            b = v.bone.deref();
            o = v.obj.deref();

            if( b && o ) this.onUpdate( b, o );
            else         trash.push( k );
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( trash.length > 0 ){
            for( k of trash ) this.items.delete( k );
        }

        return this;
    }
    // #endregion
}