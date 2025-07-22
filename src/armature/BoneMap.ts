// #region IMPORTS
import Armature from './Armature';
import Bone     from './Bone';
import Pose     from './Pose';
// #endregion

export default class BoneMap {
    bones : Map<string, BoneInfo> = new Map();
    obj  !: Armature | Pose;

    constructor( obj ?: Armature | Pose ){
        if( obj ) this.from( obj );
    }

    from( obj: Armature | Pose ){
        this.obj = obj;

        const bAry = (obj instanceof Armature)? obj.bindPose.bones : obj.bones;
        let bp  : BoneParse;
        let bi  : BoneInfo | undefined;
        let key : string | null;

        for( const b of bAry ){
            // console.log( 'Bone: ', b.name );
            for( bp of Parsers ){
                // Can generate universal bone key?
                if( !(key = bp.test( b.name )) ) continue;
                bi = this.bones.get( key );

                // console.log( '---', key );

                // Get bone info, else create if doesn't exist
                if( !bi ) this.bones.set( key, new BoneInfo( b ) );

                // If found & is a chain, push extra bones
                else if( bi && bp.isChain ) bi.push( b );

                break;
            }
        }
    }

    getBoneMap( name: string ): BoneInfo | undefined{ return this.bones.get( name ); }

    getBoneIndex( name:string ): number{
        const bi = this.bones.get( name );
        return ( bi )? bi.items[0].index : -1;
    }

    getBones( aryNames: Array<string> ): Array<Bone> | null{
        const bAry = ( this.obj instanceof Armature)? this.obj.bindPose.bones : this.obj.bones;
        const rtn : Array<Bone> = [];

        let bi: BoneInfo | undefined;
        let i : BoneInfoItem;
        for( const name of aryNames ){
            bi = this.bones.get( name );
            if( bi ){
                for( i of bi.items ) rtn.push( bAry[ i.index ] );
            }else{
                console.warn( 'Bonemap.getBones - Bone not found', name );
            }
        }

        return ( rtn.length >= aryNames.length )? rtn : null;
    }

    getBoneNames( ary: Array<string> ): Array<string> | null{
        const rtn : Array<string> = [];
        let bi    : BoneInfo | undefined;
        let i     : BoneInfoItem;

        for( const name of ary ){
            if( ( bi = this.bones.get( name ) ) ){
                for( i of bi.items ) rtn.push( i.name );
            }else{
                console.warn( 'Bonemap.getBoneNames - Bone not found', name );
                return null;
            }
        }

        return rtn;
    }

    getChestBone(): Array<Bone> | null{
        const bAry = ( this.obj instanceof Armature )? this.obj.bindPose.bones : this.obj.bones;
        const rtn : Array<Bone> = [];

        const bi   = this.bones.get( 'spine' );
        if( bi ){
            rtn.push( bAry[ bi.lastIndex ] );
        }

        return ( rtn.length > 0 )? rtn : null;
    }

    getBoneSet( n: string  ): Nullable<Array<Bone>>{
        // @ts-ignore ts(7053)
        const bs  = BONE_SETS[ n ];
        const ary : Array<Bone> = [];

        let bi: Nullable<BoneInfo>;
        for( let i of bs ){
            bi = this.bones.get( i );
            if( bi ){
                for( const bii of bi.items ){
                    // @ts-ignore ts(7053)
                    ary.push( this.obj.bones[ bii.index ] );
                }
            }else{
                console.log( 'Missing bone: ', i, 'for set', n );
                return null;
            }
        }

        return ary;
    }
}

// #region DATA STRUCTURES
type BoneInfoItem = {
    index : number,
    name  : string,
};

export class BoneInfo {
    items: Array< BoneInfoItem > = [];

    constructor( b ?: Bone ){
        if( b ) this.push( b );
    }

    push( bone: Bone ): this{
        this.items.push({ index: bone.index, name: bone.name });
        return this
    }

    get isChain(): boolean{ return ( this.items.length > 1 ); }
    get count(): number{ return this.items.length; }
    get index(): number{ return this.items[0].index; }
    get lastIndex(): number{ return this.items[ this.items.length-1 ].index; }
}

const BONE_SETS = {
    leftArm     : [ 'upperarm_l', 'forearm_l', 'hand_l' ],
    rightArm    : [ 'upperarm_r', 'forearm_r', 'hand_r' ],
    leftLeg     : [ 'thigh_l', 'shin_l', 'ankle_l' ],
    rightLeg    : [ 'thigh_r', 'shin_r', 'ankle_r' ],
    hip         : [ 'hip' ],
    spine       : [ 'spine' ],
    head        : [ 'head' ],
};

// #endregion

// #region NAME PARSING

class BoneParse {
    name        : string;
    isLR        : boolean;
    isChain     : boolean;
    reFind      : RegExp;
    reExclude  ?: RegExp;

    constructor( name: string, isLR: boolean, reFind :string, reExclude?: string, isChain=false ){
        this.name       = name;
        this.isLR       = isLR;
        this.isChain    = isChain;
        this.reFind     = new RegExp( reFind, 'i' );
        if( reExclude ) this.reExclude = new RegExp( reExclude, 'i' );
    }

    test( bname: string ): string | null{ 
        if( !this.reFind.test( bname ) )                     return null;
        if( this.reExclude && this.reExclude.test( bname ) ) return null;

        if( this.isLR && reLeft.test( bname ) )  return this.name + '_l';
        if( this.isLR && reRight.test( bname ) ) return this.name + '_r';

        return this.name;
    }
}

const reLeft    = new RegExp( '\\.l|left|_l', 'i' );
const reRight   = new RegExp( '\\.r|right|_r', 'i' );

const Parsers   = [
    new BoneParse( 'thigh',     true, 'thigh|up.*leg|hip(?!s)', 'twist' ), //upleg | upperleg, hip NOT hips
    new BoneParse( 'shin',      true, 'shin|leg|calf|knee', 'up|twist' ),
    new BoneParse( 'ankle',     true, 'ankle' ),
    new BoneParse( 'foot',      true, 'foot' ),
    new BoneParse( 'toe',       true, 'toe' ),
    new BoneParse( 'shoulder',  true, 'clavicle|shoulder|collar', 'shoulder_BIND' ),            // Exclude cartwheel's upperarm being shoulder_BIND
    new BoneParse( 'upperarm',  true, '(upper.*arm|arm)|shoulder_BIND', 'fore|twist|lower' ),   // Cartwheel upper-arm name : shoulder_BIND
    new BoneParse( 'forearm',   true, 'forearm|arm|elbow', 'up|twist' ),
    new BoneParse( 'hand',      true, 'hand|wrist', 'thumb|index|middle|ring|pinky' ),

    new BoneParse( 'head',      false, 'head' ),
    new BoneParse( 'neck',      false, 'neck' ),
    new BoneParse( 'hip',       false, 'hips*|pelvis' ),
    new BoneParse( 'root',      false, 'root' ),

    // eslint-disable-next-line no-useless-escape
    new BoneParse( 'spine',     false, 'spine.*\d*|chest', undefined, true ),
];

// #endregion