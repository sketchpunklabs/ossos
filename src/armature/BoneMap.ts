//#region IMPORTS
import Bone     from "./Bone";
import Armature from "./Armature";
//#endregion

//#region BONE PARSING
class BoneParse{
    name        : string;
    isLR        : boolean;
    isChain     : boolean;
    reFind      : RegExp;
    reExclude   ?: RegExp;

    constructor( name: string, isLR: boolean, reFind :string, reExclude?: string, isChain=false ){
        this.name       = name;
        this.isLR       = isLR;
        this.isChain    = isChain;
        this.reFind     = new RegExp( reFind, "i" );
        if( reExclude ) this.reExclude = new RegExp( reExclude, "i" );
    }

    test( bname: string ){ 
        if( !this.reFind.test( bname ) ) return null;
        if( this.reExclude && this.reExclude.test( bname ) ) return null;

        if( this.isLR && reLeft.test( bname ) ) return this.name + "_l";
        if( this.isLR && reRight.test( bname ) ) return this.name + "_r";

        return this.name;
    }
}

const reLeft    = new RegExp( "\\.l|left|_l", "i" );
const reRight   = new RegExp( "\\.r|right|_r", "i" );
const Parsers   = [
    new BoneParse( "thigh",     true, "thigh|up.*leg", "twist" ), //upleg | upperleg
    new BoneParse( "shin",      true, "shin|leg|calf", "up|twist" ),
    new BoneParse( "foot",      true, "foot" ),
    new BoneParse( "shoulder",  true, "clavicle|shoulder" ),
    new BoneParse( "upperarm",  true, "(upper.*arm|arm)", "fore|twist|lower" ),
    new BoneParse( "forearm",   true, "forearm|arm", "up|twist" ),
    new BoneParse( "hand",      true, "hand", "thumb|index|middle|ring|pinky" ),
    new BoneParse( "head",      false, "head" ),
    new BoneParse( "neck",      false, "neck" ),
    new BoneParse( "hip",       false, "hips*|pelvis" ),
    new BoneParse( "spine",     false, "spine.*\d*|chest", undefined, true ),
];

//console.log( 'TEST', Parsers[ 0 ].test( 'mixamorig:LeftUpLeg' ) );
//#endregion

//#region DATA STRUCTS
class BoneChain{
    items : BoneInfo[] = [];
}

class BoneInfo{
    index : number;
    name  : string;
    constructor( idx: number, name: string ){
        this.index  = idx;
        this.name   = name;
    }
}
//#endregion

class BoneMap{
    bones : Map< string, BoneInfo | BoneChain > = new Map();
    constructor( arm: Armature ){
        let i   : number;
        let b   : Bone;
        let bp  : BoneParse;
        let key   : string | null;

        for( i=0; i < arm.bones.length; i++ ){
            b = arm.bones[ i ];
            for( bp of Parsers ){
                if( !(key = bp.test( b.name )) ) continue;    // Didn't pass test, Move to next parser.

                if( !this.bones.has( key ) ){
                    if( bp.isChain ){
                        const ch = new BoneChain();
                        ch.items.push( new BoneInfo( i, b.name ) );
                        this.bones.set( key, ch );
                    }else{
                        this.bones.set( key, new BoneInfo( i, b.name ) );
                    }
                }else{
                    if( bp.isChain ){
                        const ch = this.bones.get( bp.name )
                        if( ch && ch instanceof BoneChain ) ch.items.push( new BoneInfo( i, b.name ) );
                    }
                }

                break;
            }
        }
    }
}

export default BoneMap;
export { BoneInfo, BoneChain };