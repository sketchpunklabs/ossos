import type { TVec3 }   from '../maths/Vec3';
import Vec3Buffer       from '../maths/Vec3Buffer';

export default class RootMotion{
    // #region MAIN
    values       : ArrayLike<number>; // Flat array of positions for each frame
    vbuf         : Vec3Buffer;        //
    frameCount   : number = 0;        // How many frames worth of data exists
    timeStampIdx : number = -1;       // Which time stamp to be used by root motion

    p0           : TVec3  = [0,0,0];  // Preallocate vec objects so no need to reallocated every frame.
    p1           : TVec3  = [0,0,0];
    result       : TVec3  = [0,0,0];

    constructor( data: ArrayLike<number> ){
        this.values     = data;
        this.vbuf       = new Vec3Buffer( this.values );
        this.frameCount = data.length / 3;
    }
    // #endregion

    getBetweenFrames( f0: number, t0: number, f1: number, t1: number ): TVec3{
        const p0  = this.p0;
        const p1  = this.p1;
        const rtn = this.result;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Cross over animation from end to start
        if( f0 > f1 ){
            // First compute how much distance is left to travel as the end of the animation
            // getting the previous position subtracting from final frame position should give
            // use that whats left to travel.
            if( ( f0+1 ) < this.frameCount ){
                this.vbuf.get( this.frameCount - 1, p1 );
                this.vbuf.lerp( f0, f0+1, t0, p0 );

                p0[0] = p1[0] - p0[0];
                p0[1] = p1[1] - p0[1];
                p0[2] = p1[2] - p0[2];
            }else{
                // If its the final frame, there is no travel left
                p0[0] = 0;
                p0[1] = 0;
                p0[2] = 0;
            }

            // Then we just get the position of the second frame which should be
            // at the start of the animation. We can add this starting travel with
            // the ending travel to get the total travel from end to start.
            this.vbuf.lerp( f1, f1+1, t1, p1 );
                
            rtn[0] = p0[0] + p1[0];
            rtn[1] = p0[1] + p1[1];
            rtn[2] = p0[2] + p1[2];
            return rtn;
        }
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute the distance traveled between current * previous frame
        this.vbuf.lerp( f0, f0+1, t0, p0 );
        if( ( f1+1 ) < this.frameCount ) this.vbuf.lerp( f1, f1+1, t1, p1 );
        else                             this.vbuf.get( f1, p1 );

        rtn[0] = p1[0] - p0[0];
        rtn[1] = p1[1] - p0[1];
        rtn[2] = p1[2] - p0[2];

        return rtn;
    }
}