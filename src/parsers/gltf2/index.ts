//#region IMPORTS
import parseGLB                                 from './Glb'; 
import Accessor                                 from './Accessor';
import { Mesh, Primitive }                      from './Mesh';
import { Skin, SkinJoint }                      from './Skin';
import { Animation, Track, ETransform, ELerp }  from './Animation';
import { Texture }                              from './Texture';
import { Pose }                                 from './Pose';
//#endregion

class Gltf2{
    //#region MAIN
    json    : any;
    bin     : ArrayBuffer;
    constructor( json: any, bin ?: ArrayBuffer | null ){
        this.json = json;
        this.bin  = bin || new ArrayBuffer(0); // TODO, Fix for base64 inline buffer
    }
    //#endregion ///////////////////////////////////////////////////////////////////////

    //#region NODES
    getNodeByName( n: string ) : [ any, number ] | null{
        let o: any, i: number;
        for( i=0; i < this.json.nodes.length; i++ ){
            o = this.json.nodes[ i ];
            if( o.name == n ) return [ o, i ];
        }
        return null;
    }    
    //#endregion ///////////////////////////////////////////////////////////////////////

    //#region MESHES

    getMeshNames() : Array<string>{
        const json = this.json, 
              rtn : Array<string> = [];
        
        let i: any;
        for( i of json.meshes ) rtn.push( i.name );
        return rtn;
    }

    getMeshByName( n: string ) : [ any, number ] | null {
        let o, i;
        for( i=0; i < this.json.meshes.length; i++ ){
            o = this.json.meshes[ i ];
            if( o.name == n ) return [ o, i ];
        }
        return null;
    }

    getMeshNodes( idx: number ) : Array< any >{
        const out : Array< any > = [];
        let n;
        for( n of this.json.nodes ){
            if( n.mesh == idx ) out.push( n );
        }
        return out;
    }

    getMesh( id: string | number | undefined ) : Mesh | null {
        if( !this.json.meshes ){ console.warn( "No Meshes in GLTF File" ); return null; }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const json  = this.json;
        let m    : any | null    = null;
        let mIdx : number | null = null;

        switch( typeof id ){
            case "string" : {
                const tup = this.getMeshByName( id );
                if( tup !== null ){
                    m    = tup[ 0 ];
                    mIdx = tup[ 1 ];
                }
            break; }
            case "number" : if( id < json.meshes.length ){ m = json.meshes[ id ]; mIdx = id; } break;
            default       : m = json.meshes[ 0 ]; mIdx = 0; break;
        }

        if( m == null || mIdx == null ){ console.warn( "No Mesh Found", id ); return null; }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const mesh = new Mesh();
        mesh.name  = m.name;
        mesh.index = mIdx;

        let p: any, prim: any, attr: any;
        for( p of m.primitives ){
            attr = p.attributes;
            prim = new Primitive();

            //------------------------------------------------------
            if( p.material != undefined && p.material != null ){
                prim.materialIdx    = p.material;
                prim.materialName   = json.materials[ p.material ].name;
            }

            //------------------------------------------------------
            if( p.indices       != undefined ) prim.indices    = this.parseAccessor( p.indices );
            if( attr.POSITION   != undefined ) prim.position   = this.parseAccessor( attr.POSITION );
            if( attr.NORMAL     != undefined ) prim.normal     = this.parseAccessor( attr.NORMAL );
            if( attr.TANGENT    != undefined ) prim.tangent    = this.parseAccessor( attr.TANGENT );
            if( attr.TEXCOORD_0 != undefined ) prim.texcoord_0 = this.parseAccessor( attr.TEXCOORD_0 );
            if( attr.TEXCOORD_1 != undefined ) prim.texcoord_1 = this.parseAccessor( attr.TEXCOORD_1 );
            if( attr.JOINTS_0   != undefined ) prim.joints_0   = this.parseAccessor( attr.JOINTS_0 );
            if( attr.WEIGHTS_0  != undefined ) prim.weights_0  = this.parseAccessor( attr.WEIGHTS_0 );
            if( attr.COLOR_0    != undefined ) prim.color_0    = this.parseAccessor( attr.COLOR_0 );

            //------------------------------------------------------
            mesh.primitives.push( prim );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const nodes = this.getMeshNodes( mIdx );
        // Save Position, Rotation and Scale if Available.
        if( nodes?.length ){
            if( nodes[0].translation )	mesh.position	= nodes[0].translation.slice( 0 );
            if( nodes[0].rotation )		mesh.rotation	= nodes[0].rotation.slice( 0 );
            if( nodes[0].scale )		mesh.scale		= nodes[0].scale.slice( 0 );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return mesh;
    }
    //#endregion ///////////////////////////////////////////////////////////////////////

    //#region SKINS

    getSkinNames() : Array<string> {
        const json = this.json, 
              rtn: Array<string> = [];
        
        let i: any;
        for( i of json.skins ) rtn.push( i.name );
        return rtn;
    }

    getSkinByName( n: string ) : [ any, number ] | null{
        let o, i;
        for( i=0; i < this.json.skins.length; i++ ){
            o = this.json.skins[ i ];
            if( o.name == n ) return [ o, i ];
        }
        return null;
    }

    getSkin( id: string | number | undefined ) : Skin | null{
        if( !this.json.skins ){ console.warn( "No Skins in GLTF File" ); return null; }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const json = this.json;
        let js  : any | null    = null;
        let idx : number | null = null;

        switch( typeof id ){
            case "string" : {
                const tup = this.getSkinByName( id );
                if( tup !== null ){
                    js  = tup[ 0 ];
                    idx = tup[ 1 ];
                }
            break; }
            case "number" : if( id < json.skins.length ){ js = json.meshes[ id ]; idx = id; } break;
            default       : js = json.skins[ 0 ]; idx = 0; break;
        }

        if( js == null ){ console.warn( "No Skin Found", id ); return null; }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const bind : Accessor | null = this.parseAccessor( js.inverseBindMatrices );
        if( bind && bind.elementCnt != js.joints.length ){
            console.warn( "Strange Error. Joint Count & Bind Matrix Count dont match" );
            return null;
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let i     : number, 
            bi    : number, 
            ni    : number, 
            joint : SkinJoint, 
            node  : Record<string,any>;

        const jMap  = new Map();    // Map Node Index to Joint Index;
        const skin  = new Skin();
        skin.name   = js.name;
        skin.index  = idx;

        for( i=0; i < js.joints.length; i++ ){
            //console.log( i, js.joints[ i ] );
            ni              = js.joints[ i ];
            node            = json.nodes[ ni ];
        
            jMap.set( ni, i );  // Map Node Index to Joint Index
            
            //-----------------------------------------
            joint               = new SkinJoint();
            joint.index         = i;
            joint.name          = ( node.name )? node.name : "bone_" + i;

            // Get Local Space Transform if available on the Node
            joint.rotation      = node?.rotation?.slice( 0 )    ?? null;
            joint.position      = node?.translation?.slice( 0 ) ?? null;
            joint.scale         = node?.scale?.slice( 0 )       ?? null;

            if( bind && bind.data ){
                bi               = i * 16;
                joint.bindMatrix = Array.from( bind.data.slice( bi, bi+16 ) );
            }

            //-----------------------------------------
            // Because of Rounding Errors, If Scale is VERY close to 1, Set it to 1.
            // This helps when dealing with transform hierachy since small errors will
            // compound and cause scaling in places that its not ment to.
            if( joint.scale ){
                if( Math.abs( 1 - joint.scale [0] ) <= 0.000001 ) joint.scale [0] = 1;
                if( Math.abs( 1 - joint.scale [1] ) <= 0.000001 ) joint.scale [1] = 1;
                if( Math.abs( 1 - joint.scale [2] ) <= 0.000001 ) joint.scale [2] = 1;
            }

            //-----------------------------------------
            skin.joints.push( joint );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Update Joints with the index to their parent. In GLTF we only know a joint's
        // children. Using the Node-Joint Map, we can translate the node children to
        // joints.
        let j: number;
        for( i=0; i < js.joints.length; i++ ){
            ni              = js.joints[ i ];   // Joint Points t a Node
            node            = json.nodes[ ni ]; // Get that Joint's Node

            // If joint Node has children, Loop threw the list and
            // update their parentIndex to match this current joint.
            if( node?.children?.length ){
                for( j=0; j < node.children.length; j++ ){
                    bi = jMap.get( node.children[ j ] );                        // Joint Node Children Index, get their mapped joint index.
                    if( bi != undefined ) skin.joints[ bi ].parentIndex = i;    // With Child Joint Index, Save this Index as its parent.
                    else console.log( 'BI', bi, node );
                }
            }
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Sometimes there is a Node Transform available for a Skin
        if( skin.name ){
            const snode = this.getNodeByName( skin.name );
            if( snode ){
                const n = snode[ 0 ];
                skin.rotation      = n?.rotation?.slice( 0 )    ?? null;
                skin.position      = n?.translation?.slice( 0 ) ?? null;
                skin.scale         = n?.scale?.slice( 0 )       ?? null;
            }
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return skin;
    }
    
    //#endregion ///////////////////////////////////////////////////////////////////////

    //#region MATERIALS
    // https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_010_Materials.md

    getMaterial( id: number | undefined ) : any{
        if( !this.json.materials ){ console.warn( "No Materials in GLTF File" ); return null; }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const json = this.json;
        let mat    = null;

        switch( typeof id ){
            case "number" : if( id < json.materials.length ){ mat = json.materials[ id ].pbrMetallicRoughness; } break;
            default       : mat = json.materials[ 0 ].pbrMetallicRoughness; break;
        }

        return mat;
    }

    // https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#texture-data
    getTexture( id: number ): Texture | null{
        const js    = this.json;
        const t     = js.textures[ id ];
        //const samp  = js.samplers[ t.sampler ];
        const img   = js.images[ t.source ];
        const bv    = js.bufferViews[ img.bufferView ];

        const bAry  = new Uint8Array( this.bin, bv.byteOffset, bv.byteLength );
        const tex   = new Texture();
        tex.index   = id;
        tex.name    = img.name;
        tex.mime    = img.mimeType;
        tex.blob    = new Blob( [ bAry ], { type: img.mimeType } );

        return tex;
    }

    //#endregion ///////////////////////////////////////////////////////////////////////

    //#region ANIMATION
    /*
    https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
    https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#appendix-c-spline-interpolation (Has math for cubic spline)
    https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-animation
    animation = {
        frame_cnt		: int
        time			: float,
        times			: [ float32array, float32array, etc ],
        tracks			: [
            { 
                type		: "rot || pos || scl",
                time_idx 	: 0,
                joint_idx	: 0,
                lerp 		: "LINEAR || STEP || CUBICSPLINE",
                data		: float32array,
            },
        ]
    }
    {   
        name: '',
        channels: [ { 
            sampler: SAMPLER_INDEX, 
            target:{ 
                node : NODE_INDEX, ( NEED TO TRANSLATE NODE INDEX TO JOINT INDEX )
                path : 'translation' | 'rotation' | 'scale'
            } 
        ] ],
        samplers: [ { 
            input: ACCESSOR_INDEX_FOR_KEYFRAME_TIMESTAMP, 
            interpolation: 'LINEAR' | 'STEP' | 'CUBICSPLINE', 
            output: ACCESSOR_INDEX_FOR_KEYFRAME_TRANFORM_VALUE,
        } ],
    }

    */

    getAnimationNames() : Array<string> {
        const json = this.json, 
              rtn: Array<string> = [];
        
        let i: any;
        for( i of json.animations ) rtn.push( i.name );
        return rtn;
    }

    getAnimationByName( n: string ) : [ any, number ] | null{
        let o: any, i: number;
        for( i=0; i < this.json.animations.length; i++ ){
            o = this.json.animations[ i ];
            if( o.name == n ) return [ o, i ];
        }
        return null;
    }

    getAnimation( id: string | number | undefined ): any {
        //this.getAnimationByName( 'Armature|mixamo.com|Layer0' );
        if( !this.json.animations ){ console.warn( "No Animations in GLTF File" ); return null; }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const json = this.json;
        let js  : any | null    = null;
        let idx : number | null = null;

        switch( typeof id ){
            case "string" : {
                const tup = this.getAnimationByName( id );
                if( tup !== null ){
                    js  = tup[ 0 ]; // Object Reference
                    idx = tup[ 1 ]; // Object Index
                }
            break; }
            case "number" : if( id < json.animations.length ){ js = json.animations[ id ]; idx = id; } break;
            default       : js = json.animations[ 0 ]; idx = 0; break;
        }

        if( js == null ){ console.warn( "No Animation Found", id ); return null; }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const NJMap      : Map< number, number >    = new Map(); // Node to Joint Map;
        const timeStamps : Array< Accessor >        = [];
        const tsMap      : Map< number, number >    = new Map(); // Timestamp Sample ID to Array Index

        // Get the Joint Index from the Node Index
        const fnGetJoint = ( nIdx: number ) : number=>{
            let jIdx : number | undefined = NJMap.get( nIdx );
            if( jIdx != undefined ) return jIdx;

            // Search every skin's joints for the node index
            // if found, the index is the joint index that
            // can be used for skinning.
            for( let skin of this.json.skins ){
                jIdx = skin.joints.indexOf( nIdx );
                if( jIdx != -1 && jIdx != undefined ){
                    NJMap.set( nIdx, jIdx );  // Map the indices
                    return jIdx;
                }
            }

            return -1; // This should Never Happen
        };

        // Get the Timestamp index from the Accessor Sample Index.
        // This will also cache a unique list of timestamps that
        // can be references from multiple tracks.
        const fnGetTimestamp = ( sIdx: number ) : number=>{
            let aIdx : number | undefined = tsMap.get( sIdx );
            if( aIdx != undefined ) return aIdx;

            const acc = this.parseAccessor( sIdx );
            if( acc ){
                aIdx = timeStamps.length;
                timeStamps.push( acc );     // Save Timestamp Data
                tsMap.set( sIdx, aIdx );    // Map the Indices
                return aIdx;
            }

            return -1; // This should Never Happen
        };

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const anim = new Animation( js.name );
        anim.timestamps = timeStamps;

        let track       : Track;                // New Track Object
        let ch          : any;                  // Channel
        let jointIdx    : number;               // Joint Index it Effects
        let sampler     : any;                  // Sampler Object ( Input:Timestamp Array, Output:Value Array )
        let acc         : Accessor | null;      // Accessor tmp var
        for( ch of js.channels ){
            //---------------------------------
            jointIdx = fnGetJoint( ch.target.node );
            sampler  = js.samplers[ ch.sampler ];
            track    = Track.fromGltf( jointIdx, ch.target.path, sampler.interpolation );

            //---------------------------------
            // Get the Keyframe Vaues for this Transform Track
            acc = this.parseAccessor( sampler.output ); // ACCESSOR_INDEX_FOR_KEYFRAME_TRANFORM_VALUE,
            if( acc ) track.keyframes = acc;

            //---------------------------------
            // Save Timestamp Data Since its shared amoung tracks.
            // This creates a unique array of TimeStamps that we can
            // reference by using the index value
            track.timeStampIndex = fnGetTimestamp( sampler.input );

            //---------------------------------
            anim.tracks.push( track );
        }

        return anim;
    }
    //#endregion ///////////////////////////////////////////////////////////////////////

    //#region POSES ( CUSTOM, NOT PART OF GLTF SPEC )
    getPoseByName( n: string ) : [ any, number ] | null{
        let o: any, i: number;
        for( i=0; i < this.json.poses.length; i++ ){
            o = this.json.poses[ i ];
            if( o.name == n ) return [ o, i ];
        }
        return null;
    }

    getPose( id ?: string ): Pose | null{
        if( !this.json.poses ){ console.warn( "No Poses in GLTF File" ); return null; }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const json = this.json;
        let js  : any | null    = null;
        let idx : number | null = null;

        switch( typeof id ){
            case "string" : {
                const tup = this.getPoseByName( id );
                if( tup !== null ){
                    js  = tup[ 0 ]; // Object Reference
                    idx = tup[ 1 ]; // Object Index
                }
            break; }
            default       : js = json.poses[ 0 ]; idx = 0; break;
        }

        if( js == null ){ console.warn( "No Pose Found", id ); return null; }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const pose = new Pose( js.name );
        let jnt: any;
        
        for( jnt of js.joints ){
            pose.add( jnt.idx, jnt.rot, jnt.pos, jnt.scl );
        }

        return pose;
    }
    //#endregion ///////////////////////////////////////////////////////////////////////

    //#region SUPPORT
    // https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_005_BuffersBufferViewsAccessors.md
    parseAccessor( accID: number ) : Accessor | null {
        const accessor      = this.json.accessors[ accID ];
        const bufView       = this.json.bufferViews[ accessor.bufferView ];

        if( bufView.byteStride ){ console.error( "UNSUPPORTED - Parsing Stride Buffer" ); return null; }

        return new Accessor( accessor, bufView, this.bin );
    }
    //#endregion ///////////////////////////////////////////////////////////////////////

    //#region STATIC

    static async fetch( url: string ) : Promise< Gltf2 | null >{
        const res = await fetch( url );
        if( !res.ok ) return null;

        switch( url.slice( -4 ).toLocaleLowerCase() ){
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case 'gltf':
                let bin : ArrayBuffer | undefined;
                const json = await res.json();

                if( json.buffers && json.buffers.length > 0 ){
                    const path = url.substring( 0, url.lastIndexOf( '/') + 1 );
                    bin        = await fetch( path + json.buffers[ 0 ].uri ).then( r=>r.arrayBuffer() );
                }
                
                return new Gltf2( json, bin );
            
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            case '.glb':
                const tuple = await parseGLB( res );
                return ( tuple )? new Gltf2( tuple[0], tuple[1] ) : null;
        }

        return null;
    }

    //#endregion ///////////////////////////////////////////////////////////////////////
}

export default Gltf2;
export { Accessor };