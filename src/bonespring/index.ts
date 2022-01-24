//#region IMPORTS
import type Armature    from '../armature/Armature';
import type Pose        from '../armature/Pose';
import type SpringItem  from './SpringItem';
import SpringChain      from './SpringChain';
//#endregion

interface ISpringType{
    setRestPose( chain: SpringChain, pose: Pose, resetSpring: boolean, debug ?: any ): void;
    updatePose( chain: SpringChain, pose: Pose, dt: number, debug ?: any ): void;
}

class BoneSpring{
    arm     : Armature;
    items   : Map< string, SpringChain > = new Map();
    constructor( arm: Armature ){
        this.arm = arm;
    }

    addRotChain( chName: string, bNames: string[], osc=5.0, damp=0.5 ): this{
        const chain = new SpringChain( chName, 0 );     // Rotation Spring Chain
        chain.setBones( bNames, this.arm, osc, damp );  // Setup Chain
        this.items.set( chName, chain );                // Save
        return this;
    }

    addPosChain( chName: string, bNames: string[], osc=5.0, damp=0.5 ): this{
        const chain = new SpringChain( chName, 1 );     // Position Spring Chain
        chain.setBones( bNames, this.arm, osc, damp );  // Setup Chain
        this.items.set( chName, chain );                // Save
        return this;
    }

    setRestPose( pose: Pose, resetSpring=true, debug ?: any ): this{
        let ch: SpringChain;
        for( ch of this.items.values() ){
            ch.setRestPose( pose, resetSpring, debug );
        }
        return this;
    }

    updatePose( dt: number, pose: Pose, doWorldUpdate:false, debug ?: any ): this{
        let ch: SpringChain;
        for( ch of this.items.values() ){
            ch.updatePose( dt, pose, debug );    
        }

        if( doWorldUpdate ) pose.updateWorld( true );
        return this;
    }

    //#region SPRING SETTERS

    /** Set Oscillation Per Section for all Chain Items */
    setOsc( chName: string, osc: number ): this{
        const ch = this.items.get( chName );
        if( !ch ){ console.error( 'Spring Chain name not found', chName ); return this }

        let si: SpringItem;
        for( si of ch.items ) si.spring.setOscPerSec( osc );

        return this;
    }

    /** Spread a Oscillation range on the chain */
    setOscRange( chName: string, a: number, b:number ): this{
        const ch = this.items.get( chName );
        if( !ch ){ console.error( 'Spring Chain name not found', chName ); return this }

        const len = ch.items.length - 1;
        let   t   : number;
        for( let i=0; i <= len; i++ ){
            t = i / len;
            ch.items[ i ].spring.setOscPerSec( a*(1-t) + b*t );
        }

        return this;
    }

    setDamp( chName: string, damp: number ): this{
        const ch = this.items.get( chName );
        if( !ch ){ console.error( 'Spring Chain name not found', chName ); return this }

        let si: SpringItem;
        for( si of ch.items ) si.spring.setDamp( damp );

        return this;
    }

    setDampRange( chName: string, a: number, b:number ): this{
        const ch = this.items.get( chName );
        if( !ch ){ console.error( 'Spring Chain name not found', chName ); return this }

        const len = ch.items.length - 1;
        let   t   : number;
        for( let i=0; i <= len; i++ ){
            t = i / len;
            ch.items[ i ].spring.setDamp( a*(1-t) + b*t );
        }

        return this;
    }
    //#endregion

}

export default BoneSpring;
export type { ISpringType };