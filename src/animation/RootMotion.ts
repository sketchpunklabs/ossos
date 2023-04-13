import type { TVec3 }   from '../maths/Vec3';
import Vec3Buffer       from '../maths/Vec3Buffer';

export default class RootMotion{
    values       : ArrayLike<number>; // Flat array of positions for each frame
    vbuf         : Vec3Buffer;
    frameCount   : number = 0;        // How many frames worth of data exists
    timeStampIdx : number = -1;       // Which time stamp to be used by root motion 

    constructor( data: ArrayLike<number> ){
        this.values     = data;
        this.vbuf       = new Vec3Buffer( this.values );
        this.frameCount = data.length / 3;
    }

    getBetweenFrames( f0: number, t0: number, f1: number, t1: number ): TVec3{
        // TODO: Previous frame is after current frame
        if( f0 > f1 ){
            console.log( 'meh' );
            return [0,0,0];
        }
        
        // Neighbor frames
        // if( f0 + 1 === f1 ){
        //     console.log( this)
        //     return this.vbuf.lerp( f0*3, f1*3, t1, [0,0,0] );
        // }

        // Linear frames, Get the position of each frame & return the delta
        if( f1 < this.frameCount ){ //f0 < f1 &&
            // let a0, a1;
            // let b0, b1;
            // a0=f0; a1=f0+1; b0=f1; b1=f1+1;
            // // else{              a0=f0; a1=f0+1; b0=f1; b1=f1+1; }


            // const p0 = this.vbuf.lerp( a0*3, a1*3, t0, [0,0,0] );
            // const p1 = ( f1+1 < this.frameCount )?
            //     this.vbuf.lerp( b0*3, b1*3, t1, [0,0,0] ) :
            //     this.vbuf.get( b0*3, [0,0,0] );

            // const delta = [
            //     p1[0] - p0[0],
            //     p1[1] - p0[1],
            //     p1[2] - p0[2],
            // ];

            // // console.log( 'delta', delta[2] );

            // console.log( 'f0', f0, t0, p0, 'f1', f1, t1, p1, 'delta',  delta );
            // return delta;

            const p0 = this.vbuf.lerp( f0*3, (f0+1)*3, t0, [0,0,0] );
            const p1 = this.vbuf.lerp( f1*3, (f1+1)*3, t1, [0,0,0] );

            const delta = [
                p1[0] - p0[0],
                p1[1] - p0[1],
                p1[2] - p0[2],
            ];

            // console.log( delta, p0[2], p1[2] );

            return delta;
        }

        console.log( 'oof' );
        return [0,0,0];
    }
}