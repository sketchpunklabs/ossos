    
//#region IMPORTS
import * as THREE       from 'three';
import BoneViewMaterial from './BoneViewMaterial.js';
import Vec3Util         from '../../../src/maths/Vec3Util';
import QuatUtil         from '../../../src/maths/QuatUtil';
//#endregion

class BoneViewMesh extends THREE.Mesh{
    constructor( arm, color='white', useDepthTest=true ){
        const shape     = baseShape();
        const inst      = instanceData( arm );
        const bCnt      = arm.bones.length;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const mat       = BoneViewMaterial( color, useDepthTest );
        mat.uniforms.boneRot.value = new Float32Array( 4 * bCnt );
        mat.uniforms.bonePos.value = new Float32Array( 3 * bCnt );
        mat.uniforms.boneScl.value = new Float32Array( 3 * bCnt );
        mat.side = THREE.DoubleSide;

        const geo       = new THREE.InstancedBufferGeometry();
        geo.setIndex( new THREE.BufferAttribute( new Uint16Array(shape.indices), 1 ) );
        geo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array(shape.vertices), 3 ) );
        geo.setAttribute( 'inst', new THREE.InstancedBufferAttribute( inst, 2 ) );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        super( geo, mat );
    }

    setScales( meshScl = 0.02, dirScl=2.0 ){
        this.material.uniforms.meshScl.value    = meshScl;
        this.material.uniforms.dirScl.value     = dirScl;
        return this;
    }

    updateFromPose( pose ){
        const rot = this.material.uniforms.boneRot.value;
        const pos = this.material.uniforms.bonePos.value;
        const scl = this.material.uniforms.boneScl.value;

        let b, i, ii;
        for( b of pose.bones ){
            i  = b.idx * 3;
            ii = b.idx * 4;

            QuatUtil.toBuf( b.world.rot, rot, ii );
            Vec3Util.toBuf( b.world.pos, pos, i );
            Vec3Util.toBuf( b.world.scl, scl, i );
        }

        return this;
    }
}

//#region HELPERS
function baseShape(){
    //const a   = new Vec3( -0.5, 0, -0.5 );//.scale( 0.5 );
    //const b   = new Vec3(  0.5, 1,  0.5 );//.scale( 0.5 );
    const a     = Vec3Util.toStruct( [-0.5, 0, -0.5] );
    const b     = Vec3Util.toStruct( [ 0.5, 1,  0.5] );
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

function instanceData( arm ){
    const bCnt = arm.bones.length;
    const rtn  = new Float32Array( 2 * bCnt );

    let b, ii;
    for( b of arm.bones ){
        ii = b.idx * 2;
        rtn[ ii   ] = b.idx;
        rtn[ ii+1 ] = b.len;
    }

    return rtn;
}
//#endregion

export default BoneViewMesh;