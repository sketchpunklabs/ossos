//#region IMPORTS
import type { Armature, Pose } from '../../armature/index'
import { IKChain }             from './IKChain';
//#endregion

class IKRig{
    //#region MAIN
    items: Map< string, IKChain > = new Map();
    constructor(){}
    //#endregion

    //#region METHODS

    // Change the Bind Transform for all the chains
    // Mostly used for late binding a TPose when armature isn't naturally in a TPose
    bindPose( pose: Pose ): this{
        let ch: IKChain;
        for( ch of this.items.values() ) ch.bindToPose( pose );
        return this;
    }

    updateBoneLengths( pose: Pose ): this{
        let ch: IKChain;

        for( ch of this.items.values() ){
            ch.resetLengths( pose );
        }

        return this;
    }

    get( name: string ): IKChain | undefined{
        return this.items.get( name );
    }

    add( arm: Armature, name:string, bNames: string[] ): IKChain{
        const chain = new IKChain( bNames, arm );
        this.items.set( name, chain );
        return chain;
    }
    //#endregion
}

export default IKRig;