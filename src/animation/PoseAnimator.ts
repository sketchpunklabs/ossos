
import type Clip    from './Clip';
import type Pose    from '../armature/Pose';

import Maths        from '../maths/Maths';

export default class PoseAnimator{
    clip  ?: Clip               = undefined;    // Animation Clip
    clock  : number             = 0;            // Animation Clock
    fInfo  : Array<FrameInfo>   = [];           // Clips can have multiple Timestamps

    setClip( clip: Clip ): this{
        this.clip           = clip;
        this.clock          = 0;
        this.fInfo.length   = 0;

        for( let i=0; i < clip.timeStamps.length; i++ ){
            this.fInfo.push( new FrameInfo() );
        }
        
        return this;
    }

    step( dt: number ): this{
        if( this.clip ){
            this.clock = ( this.clock + dt ) % this.clip.duration;
            this.computeFrameInfo();
        }
        return this;
    }

    atFrame( n: number ): this{
        if( !this.clip ) return this;
        n = Math.max( 0, Math.min( this.clip.frameCount, n ) ); // Clamp frame number

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const tsAry = this.clip.timeStamps;
        const fiAry = this.fInfo;
        let tsLen   : number;               // TimeStamp Length;
        let ts      : ArrayLike<number>;    // TimeStamp;
        let fi      : FrameInfo;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( let i=0; i < tsAry.length; i++ ){
            ts      = tsAry[ i ];
            fi      = fiAry[ i ];
            tsLen   = ts.length - 1;
            fi.t    = 1;
            fi.ti   = 0;
            fi.kA   = ( n <= tsLen )? n : tsLen;
            fi.kB   = fi.kA;
            fi.kC   = fi.kA;
            fi.kD   = fi.kA;
        }

        return this;
    }

    updatePose( pose: Pose ): this{
        if( this.clip ){
            let t;
            for( t of this.clip.tracks ){
                t.apply( pose, this.fInfo[ t.timeIndex ] );
            }
        }

        return this;
    }

    computeFrameInfo(){
        if( !this.clip ) return;

        const time = this.clock;
        let fi      : FrameInfo;
        let ts      : ArrayLike<number>;
        let imin    : number;
        let imax    : number;
        let imid    : number;

        for( let i=0; i < this.fInfo.length; i++ ){
            fi = this.fInfo[ i ];

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // This timestamp has only 1 frame, set the default value & exit early
            if( this.clip.timeStamps[ i ].length === 0 ){
                fi.singleFrame();
                continue;
            }
            
            ts = this.clip.timeStamps[ i ];

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // If the clock has moved passed the previous keyframe range, recompute new range
            if( time < ts[ fi.kB ] || time > ts[ fi.kC ] || fi.kB === -1 ){

                // Find the first frame that is greater then the clock time.
                // Do this by using a binary search by shrinking a range of indices
                imin = 0;
                imax = ts.length - 1;
                while( imin < imax ){                         // Once Min Crosses or Equals Max, Stop Loop.
                    imid = ( imin + imax ) >>> 1              // Compute Mid Index
                    if( time < ts[ imid ] ) imax = imid;      // Time is LT Timestamp, use mid as new Max Range
                    else                    imin = imid + 1;  // Time is GTE TimeStamp, move min to one after mid to make the cross fail happen
                }

                if( imax <= 0 ){  fi.kB = 0;      fi.kC = 1; }      // Can't go negative, set to first frame
                else{             fi.kB = imax-1; fi.kC = imax; }   // Our Frame range

                // Tangent keyframe indices need to loop around when dealing with cubic interpolation
                fi.kA = Maths.mod( fi.kB - 1, ts.length );
                fi.kD = Maths.mod( fi.kC + 1, ts.length );
            }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Lerp Time & it's inverse
            fi.t  = ( time - ts[ fi.kB ] ) / ( ts[ fi.kC ] - ts[ fi.kB ] ); // Map Time between the Two Time Stamps
            fi.ti = 1 - fi.t;
        }

    }
}

export class FrameInfo{
    t  : number =  0; // Lerp Time
    ti : number =  0; // Lerp Time Inverse
    kA : number = -1; // Keyframe Pre Tangent
    kB : number = -1; // Keyframe Lerp Start
    kC : number = -1; // Keyframe Lerp End
    kD : number = -1; // Keyframe Post Tangent

    // Set info for single frame timeStamp
    singleFrame(){
        this.t  = 1;
        this.ti = 0;
        this.kA = 0;
        this.kB = -1;
        this.kC = -1;
        this.kD = 0;
    }
}