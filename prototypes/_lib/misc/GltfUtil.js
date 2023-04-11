// #region IMPORTS
import * as THREE               from 'three';
import { vec3, quat }           from 'gl-matrix';
import { Armature, Clip, TrackVec3, TrackQuat } 
                                from '../../../src/index';
import Gltf2                    from '../gltf2Parser.es.js';
// import MatrixSkinMaterial       from '../customSkinning/MatrixSkinMaterial.js';
import MatrixSkinPbrMaterial    from '../customSkinning/MatrixSkinPbrMaterial.js';
// #endregion

export { Gltf2 };

export default class GltfUtil{

    // #region ARMATURE
    static parseArmature( gltf ){
        const skin  = gltf.getSkin();
        const arm   = new Armature();

        let b;
        for( const j of skin.joints ){
            b = arm.addBone( { name: j.name, parent: j.parentIndex } );
            if( j.rotation ) quat.copy( b.local.rot, j.rotation );
            if( j.position ) vec3.copy( b.local.pos, j.position );
            if( j.scale )    vec3.copy( b.local.scl, j.scale );
        }

        arm.bind( 0.1 );
        return arm;
    }
    // #endregion

    // #region METHODS
    static async fetch( url ){ return await Gltf2.fetch( url ); }

    static filterNodes( gltf, props={} ){
        const { 
            prefix  = '', 
            isMesh  = false,
            hasSkin = false,
        } = props;

        const out = [];
        for( let n of gltf.json.nodes ){
            if( isMesh  && n.mesh === undefined ) continue;
            if( hasSkin && n.skin === undefined ) continue;
            if( prefix  && !n.name.startsWith( prefix ) ) continue;
            out.push( n );
        }

        return out;
    }

    static loadNodeMeshes( gltf, nList, skin=null, grp=new THREE.Group ){
        const matCache  = {};
        const useSkin   = !!skin;

        let m;
        let geo;
        let mat;
        let mesh;
        let matId;

        for( let n of nList ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Check if there is any mesh available
            m = gltf.getMesh( n.mesh );
            if( !m || m.primitives.length == 0 ){ console.error( 'No gltf mesh found', n.mesh ); continue; }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            for( let p of m.primitives ){
                
                // Get Data 
                geo     = this.geoPrimitive( p, useSkin );
                
                // What Material To use?
                matId   = p.materialIdx || 'default';
                mat     = matCache[ matId ];
                if( !mat ){
                    const color = ( p.materialIdx !== undefined )? 
                        gltf.getMaterial( p.materialIdx ).baseColor.slice( 0, 2 ) : 
                        'cyan';

                    mat = ( skin )? 
                        MatrixSkinPbrMaterial( color, skin ) :
                        new THREE.MeshPhongMaterial( { color } );

                    matCache[ matId ] = mat;
                }

                // Create 3JS Mesh
                mesh = new THREE.Mesh( geo, mat );
                grp.add( mesh );
            }
        }

        return grp;
    }
    // #endregion

    // #region MESHES
    static loadMesh( gltf, id, useSkin=false ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const m = gltf.getMesh( id );
        if( !m || m.primitives.length == 0 ){
            console.error( 'No gltf mesh found', id );
            return null;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const out = [];
        let gGeo;
        let gMat;
        let mesh;
        let mat;
        let col;
        for( let p of m.primitives ){
            gGeo = this.geoPrimitive( p, useSkin );

            if( p.materialIdx !== undefined ){
                gMat = gltf.getMaterial( p.materialIdx );
                col  = new THREE.Color( gMat.baseColorFactor[0], gMat.baseColorFactor[1], gMat.baseColorFactor[2] );
                mat  = new THREE.MeshPhongMaterial( { color: col } );
            }else{
                mat  = new THREE.MeshPhongMaterial();
            }

            mesh = new THREE.Mesh( gGeo, mat );
            out.push( mesh );
        }

        return out;
    }

    static geoPrimitive( prim, useSkin=false ){
        const geo = new THREE.BufferGeometry();
        geo.setAttribute( 'position', new THREE.BufferAttribute( prim.position.data, prim.position.componentLen ) );

        if( prim.indices )    geo.setIndex( new THREE.BufferAttribute( prim.indices.data, 1 ) );
        if( prim.normal )     geo.setAttribute( 'normal', new THREE.BufferAttribute( prim.normal.data, prim.normal.componentLen ) );
        if( prim.texcoord_0 ) geo.setAttribute( 'uv', new THREE.BufferAttribute( prim.texcoord_0.data, prim.texcoord_0.componentLen ) );

        if( useSkin && prim.joints_0 && prim.weights_0 ){
            geo.setAttribute( 'skinWeight', new THREE.BufferAttribute( prim.weights_0.data, prim.weights_0.componentLen ) );
            geo.setAttribute( 'skinIndex',  new THREE.BufferAttribute( prim.joints_0.data,  prim.joints_0.componentLen ) );
        }

        return geo;

    }

    static loadGeoBuffers( gltf, id, useSkin=true ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const m = gltf.getMesh( id );
        if( !m || m.primitives.length == 0 ){
            console.error( 'No gltf mesh found', id );
            return null;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const out = [];
        for( let p of m.primitives ){
            out.push( this.geoPrimitive( p, useSkin ) );
        }

        return out;
    }
    
    // #endregion

    // #region ANIMATIONS
    static loadAnimationClip( gltf, name, pose ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const anim  = gltf.getAnimation( name );
        const clip  = new Clip( anim.name );
    
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let i;
        for( i of anim.timestamps ){
            if( i.data )                         clip.timeStamps.push( new Float32Array( i.data ) ); // Clone TimeStamp Data so its not bound to GLTF's BIN
            if( i.elementCnt > clip.frameCount ) clip.frameCount = i.elementCnt;                     // Find max frame counts
            if( i?.boundMax[0] > clip.duration ) clip.duration   = i.boundMax[0];                    // Find full duration
        }
    
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let gTrack; // Gltf Track
        let oTrack; // Ossos Track
        let bName;  // Bone Name
        let reBoneFilter = new RegExp( /(root|hips?)/i ); // Only use Vec3 tracks for root or hip bone
    
        for( gTrack of anim.tracks ){
            // -------------------------------------------
            if( !gTrack.keyframes.data ){
                console.error( 'GLTF Animation Track has no keyframe data' );
                continue;
            }
    
            // -------------------------------------------
            oTrack = null;
            switch( gTrack.transform ){
                // Rotation
                case 0: oTrack = new TrackQuat( gTrack.interpolation ); break;
    
                // Translation
                case 1:
                    bName = pose.bones[ gTrack.jointIndex ].name;
                    if( reBoneFilter.test( bName ) ){
                        oTrack = new TrackVec3( gTrack.interpolation ); break;
                    }
                    break;
    
                // Scale
                case 2: break;
            }
    
            // -------------------------------------------
            if( !oTrack ) continue;
    
            oTrack.setData( gTrack.keyframes.data );
            oTrack.boneIndex = gTrack.jointIndex;
            oTrack.timeIndex = gTrack.timeStampIndex;
    
            clip.tracks.push( oTrack );
        }
    
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return clip;
    }
    // #endregion

}
