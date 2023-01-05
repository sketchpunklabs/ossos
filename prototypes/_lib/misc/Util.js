import { vec3, quat }   from 'gl-matrix';
import * as THREE       from 'three';

export default class Util{

    static debugBones( ary, debug, flen=0.2, pntSize=1 ){
        const up   = [0,0,0];
        const fwd  = [0,0,0];
        for( let b of ary ){
            vec3.transformQuat( up, [0,1,0], b.world.rot );
            vec3.transformQuat( fwd, [0,0,1], b.world.rot );
            vec3.scaleAndAdd( up, b.world.pos, up, b.len * b.local.scl[1] );
            vec3.scaleAndAdd( fwd, b.world.pos, fwd, flen );
    
            debug.pnt.add( b.world.pos, 0x00ff00, pntSize, 1 );
            debug.ln.add( b.world.pos, up, 0x00ffff );
            debug.ln.add( b.world.pos, fwd, 0x00ff00 );
        }
    }

    static geoBuffer( verts, idx=null, norm=null, uv=null, jnt=null, wgt=null, skinSize=4 ){
        const geo = new THREE.BufferGeometry();
        geo.setAttribute( 'position', new THREE.BufferAttribute( verts, 3 ) );

        if( idx )   geo.setIndex( new THREE.BufferAttribute( idx, 1 ) );
        if( norm )  geo.setAttribute( 'normal', new THREE.BufferAttribute( norm, 3 ) );
        if( uv )    geo.setAttribute( 'uv', new THREE.BufferAttribute( uv, 2 ) );

        if( jnt && wgt ){
            geo.setAttribute( 'skinWeight', new THREE.BufferAttribute( wgt, skinSize ) );
            geo.setAttribute( 'skinIndex',  new THREE.BufferAttribute( jnt, skinSize ) );
        }

        return geo;
    }

}