import * as BABYLON from 'babylonjs';

import BoneViewMaterial from './BoneViewMaterial.js';

export default class BoneViewMesh extends BABYLON.Mesh{
    constructor( app, arm ){
        super( 'BoneView' );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const geo       = baseShape();              // Setup Instanced Mesh
        const data      = new BABYLON.VertexData();
        data.positions  = geo.vertices;
        data.indices    = geo.indices;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        data.applyToMesh( this );                   // Add Vertex Buffers to Mesh
        instanceData( this, app, arm );             // Create & Apply Instaced Vertex Buffers to Mesh
        this.material = BoneViewMaterial( app );    // Use custom shader for rendering bones.
    }

    setBoneScale( meshScl=0.02, dirScl=1.0 ){
        this.material.setFloat( 'meshScl', meshScl );
        this.material.setFloat( 'dirScl', dirScl );
    }

    updateFromPose( pose ){
        const rot = this.boneRot;
        const pos = this.bonePos;
        const scl = this.boneScl;
        let b, i, ii;
        for( b of pose.bones ){
            i   = b.idx * 4;
            ii  = b.idx * 3;

            rot[ i+0 ] = b.world.rot[ 0 ];
            rot[ i+1 ] = b.world.rot[ 1 ];
            rot[ i+2 ] = b.world.rot[ 2 ];
            rot[ i+3 ] = b.world.rot[ 3 ];

            pos[ ii+0 ] = b.world.pos[ 0 ];
            pos[ ii+1 ] = b.world.pos[ 1 ];
            pos[ ii+2 ] = b.world.pos[ 2 ];

            scl[ ii+0 ] = b.world.scl[ 0 ];
            scl[ ii+1 ] = b.world.scl[ 1 ];
            scl[ ii+2 ] = b.world.scl[ 2 ];
        }

        this.updateVerticesData( 'boneRot', rot );
        this.updateVerticesData( 'bonePos', pos );
        this.updateVerticesData( 'boneScl', scl );
        return this;
    }
    
}

//#region HELPERS
function baseShape(){
    //const a   = new Vec3( -0.5, 0, -0.5 );//.scale( 0.5 );
    //const b   = new Vec3(  0.5, 1,  0.5 );//.scale( 0.5 );
    const a     = { x:-0.5, y:0, z:-0.5 };
    const b     = { x:0.5, y:1, z:0.5 };
    const geo   = {
        vertices : [
            a.x, b.y*2, a.z,    // 0 Up
            a.x, b.y*2, b.z,    // 1
            b.x, b.y*2, b.z,    // 2
            b.x, b.y*2, a.z,    // 3

            a.x, a.y, a.z,      // 4 Bend
            a.x, b.y, b.z,      // 5
            b.x, b.y, b.z,      // 6
            b.x, a.y, a.z,      // 7

            a.x, a.y, b.z*3,    // 8 Fwd
            a.x, b.y, b.z*3,    // 9
            b.x, b.y, b.z*3,    // 10
            b.x, a.y, b.z*3,    // 11
        ],

        indices  : [
            0,1,2, 2,3,0,       // Top Face

            0,4,5, 5,1,0,       // Top Left
            1,5,6, 6,2,1,       // Top Fwd
            2,6,7, 7,3,2,       // Top Right
            3,7,4, 4,0,3,       // Top Back

            10,9,8, 8,11,10,    // Fwd Face
            4,8,5, 8,9,5,       // Fwd Left
            5,9,6, 9,10,6,      // Fwd Up
            6,10,7, 10,11,7,    // Fwd Right
            7,11,8, 4,7,8       // Fwd Bot
        ],
    }
    return geo;
}

function instanceData( mesh, app, arm ){
    const bCnt  = arm.bones.length;

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Instance Data, X: Idx, Y: BoneLen
    const rtn   = new Float32Array( 2 * bCnt );
    let b, i;
    for( b of arm.bones ){
        i           = b.idx * 2;
        rtn[ i   ]  = b.idx;
        rtn[ i+1 ]  = b.len;
    }

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Instance Transform
    mesh.boneRot = new Float32Array( 4 * bCnt );
    mesh.bonePos = new Float32Array( 3 * bCnt );
    mesh.boneScl = new Float32Array( 3 * bCnt );

    const instbuf   = new BABYLON.VertexBuffer( app.engine, rtn, 'inst', false, false, 2, true );
    const rotbuf    = new BABYLON.VertexBuffer( app.engine, mesh.boneRot, 'boneRot', true, false, 4, true );
    const posbuf    = new BABYLON.VertexBuffer( app.engine, mesh.bonePos, 'bonePos', true, false, 3, true );
    const sclbuf    = new BABYLON.VertexBuffer( app.engine, mesh.boneScl, 'boneScl', true, false, 3, true );

    mesh.setVerticesBuffer( instbuf );
    mesh.setVerticesBuffer( rotbuf );
    mesh.setVerticesBuffer( posbuf );
    mesh.setVerticesBuffer( sclbuf );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Need to force Instance Count, else it just renders one
    mesh.forcedInstanceCount = bCnt;
}
//#endregion