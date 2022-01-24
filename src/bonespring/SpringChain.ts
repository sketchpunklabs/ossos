//#region IMPORTS
import type Armature        from '../armature/Armature';
import type Pose            from '../armature/Pose';
import type Bone            from '../armature/Bone';
import type { ISpringType } from './index'

import SpringItem           from './SpringItem';
import SpringRot            from './SpringRot';
import SpringPos            from './SpringPos';
//#endregion

class SpringChain{
    static ROT = 0;
    static POS = 1;
    
    //#region MAIN
    items   : SpringItem[] = [];
    name    : string;
    spring  : ISpringType;
    constructor( name: string, type=0 ){
        this.name       = name;
        this.spring    = ( type == 1 )? new SpringPos() : new SpringRot();
    }
    //#endregion

    //#region SETTERS

    setBones( aryName: string[], arm: Armature, osc=5.0, damp=0.5 ): void{
        let   bn    : string;
        let   b     : Bone | null;
        let   spr   : SpringItem;

        for( bn of aryName ){
            b = arm.getBone( bn );
            if( b == null ){ console.log( 'Bone not found for spring: ', bn ); continue; }

            spr = new SpringItem( b.name, b.idx );
            spr.spring.setDamp( damp );
            spr.spring.setOscPerSec( osc );

            this.items.push( spr );
        }
    }

    setRestPose( pose: Pose, resetSpring=false, debug ?: any ): void{ this.spring.setRestPose( this, pose, resetSpring, debug ); }
    updatePose( dt: number, pose: Pose, debug ?: any ): void{ this.spring.updatePose( this, pose, dt, debug ); }

    //#endregion
}

export default SpringChain;