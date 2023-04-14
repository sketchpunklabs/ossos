import type { TVec3 }   from '../maths/Vec3';
import Vec3Buffer       from '../maths/Vec3Buffer';

export default class RootMotion{
    // #region MAIN
    values       : ArrayLike<number>; // Flat array of positions for each frame
    vbuf         : Vec3Buffer;
    frameCount   : number = 0;        // How many frames worth of data exists
    timeStampIdx : number = -1;       // Which time stamp to be used by root motion

    p0           : TVec3  = [0,0,0];  // Preallocate vec objects so no need to reallocated every frame.
    p1           : TVec3  = [0,0,0];
    result       : TVec3  = [0,0,0];
    // #endregion

    constructor( data: ArrayLike<number> ){
        this.values     = data;
        this.vbuf       = new Vec3Buffer( this.values );
        this.frameCount = data.length / 3;
    }

    getBetweenFrames( f0: number, t0: number, f1: number, t1: number ): TVec3{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Cross over animation from end to start
        if( f0 > f1 ){
            let p0;
            let p1;

            // First compute how much distance is left to travel as the end of the animation
            // getting the previous position subtracting from final frame position should give
            // use that whats left to travel.
            if( ( f0+1 ) < this.frameCount ){
                p1 = this.vbuf.get( (this.frameCount-1) * 3, [0,0,0] );
                p0 = this.vbuf.lerp( f0*3, (f0+1)*3, t0, [0,0,0] );

                p0[0] = p1[0] - p0[0];
                p0[1] = p1[1] - p0[1];
                p0[2] = p1[2] - p0[2];
            }else{
                p0 = [0,0,0];
            }

            // Then we just get the position of the second frame which should be
            // at the start of the animation. We can add this starting travel with
            // the ending travel to get the total travel from end to start.
            p1 = this.vbuf.lerp( f1*3, (f1+1)*3, t1, p1 );
                
           const rtn = [
                p0[0] + p1[0],
                p0[1] + p1[1],
                p0[2] + p1[2],
            ];

            return rtn;
        }
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const p0 = this.vbuf.lerp( f0*3, (f0+1)*3, t0, [0,0,0] );
        const p1 = ( ( f1+1 ) < this.frameCount )?
            this.vbuf.lerp( f1*3, (f1+1)*3, t1, [0,0,0] ) :
            this.vbuf.get( f1*3, [0,0,0] );

        const delta = [
            p1[0] - p0[0],
            p1[1] - p0[1],
            p1[2] - p0[2],
        ];

        return delta;
    }
}