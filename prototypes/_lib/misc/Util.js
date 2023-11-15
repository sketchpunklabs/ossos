import * as THREE   from '@three';
import { Vec3 }     from '../../../src/index';

export default class Util{

    static debugBones( ary, debug, flen=0.2, pntSize=1, doReset=false, boneColor=0x00ffff, jntColor=0x00ff00 ){
        const up   = new Vec3();
        const fwd  = new Vec3();

        if( doReset ){
            debug.pnt.reset();
            debug.ln.reset();
        }

        for( let b of ary ){
            up  .fromQuat( b.world.rot, Vec3.UP )
                .scale( b.len * b.world.scl[1] )
                .add( b.world.pos );

            fwd .fromQuat( b.world.rot, Vec3.FORWARD )
                .scale( flen )
                .add( b.world.pos );

            debug.pnt.add( b.world.pos, jntColor, pntSize, 1 );
            debug.ln.add( b.world.pos, fwd, jntColor );
            debug.ln.add( b.world.pos, up, boneColor );
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