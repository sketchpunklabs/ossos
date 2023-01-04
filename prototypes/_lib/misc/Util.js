import { vec3, quat } from 'gl-matrix';

export default class Util{

    static debugBones( ary, debug, flen=0.2 ){
        const up   = [0,0,0];
        const fwd  = [0,0,0];
        for( let b of ary ){
            vec3.transformQuat( up, [0,1,0], b.world.rot );
            vec3.transformQuat( fwd, [0,0,1], b.world.rot );
            vec3.scaleAndAdd( up, b.world.pos, up, b.len );
            vec3.scaleAndAdd( fwd, b.world.pos, fwd, flen );
    
            debug.pnt.add( b.world.pos, 0x00ff00, 3, 1 );
            debug.ln.add( b.world.pos, up, 0x00ffff );
            debug.ln.add( b.world.pos, fwd, 0x00ff00 );
        }
    }

}