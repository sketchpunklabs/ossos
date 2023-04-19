// #region IMPORTS
import type Clip from './Clip';
import type Pose from '../armature/Pose';
import Maths     from '../maths/Maths';
import { TVec3 } from '../maths/Vec3';
// #endregion

export type TOnEventHandler = ( evt:string )=>void;

export default class PoseAnimator{
    // #region MAIN
    isRunning                           = false;
    clip       ?: Clip                  = undefined;    // Animation Clip
    clock       : number                = 0;            // Animation Clock
    fInfo       : Array<FrameInfo>      = [];           // Clips can have multiple Timestamps
    scale       : number                = 1;            // Scale the speed of the animation
    onEvent    ?: TOnEventHandler       = undefined;    //
    eventCache ?: Map<string, boolean>  = undefined;
    // #endregion
    
    // #region SETTERS
    setClip( clip: Clip ): this{
        this.clip           = clip;
        this.clock          = 0;
        this.fInfo.length   = 0;

        // For each set of timesteps, create a frame info struct for it
        for( let i=0; i < clip.timeStamps.length; i++ ){
            this.fInfo.push( new FrameInfo() );
        }

        // Create an event cache if clip has events
        if( clip.events && !this.eventCache ){
            this.eventCache = new Map();
        }
        
        // Compute the times for the first frame
        this.computeFrameInfo();
        return this;
    }

    setScale( s: number ): this{ this.scale = s; return this; }
    // #endregion

    // #region FRAME CONTROLS
    step( dt: number ): this{
        if( this.clip && this.isRunning ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            const tick = dt * this.scale;

            if( !this.clip.isLooped && this.clock + tick >= this.clip.duration ){
                this.clock      = this.clip.duration;
                this.isRunning  = false;
            }else{
                // Clear event cache if restarting new loop
                if( ( this.clock + tick ) >= this.clip.duration ){
                    this.eventCache?.clear();
                }

                this.clock = ( this.clock + tick ) % this.clip.duration;
            }

            this.computeFrameInfo();

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            if( this.clip.events  && this.onEvent ){
                this.checkEvents();
            }
        }
        return this;
    }

    atTime( t: number ): this{
        if( this.clip ){
            this.clock = t % this.clip.duration; //Math.max( 0, Math.min( this.clip.duration, t ) );
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
            fi.t    = 0;
            fi.kA   = ( n <= tsLen )? n : tsLen;
            fi.kB   = fi.kA;
            fi.kC   = fi.kA;
            fi.kD   = fi.kA;
        }

        return this;
    }
    // #endregion

    // #region METHODS
    start(): this{ this.isRunning=true; return this; }
    stop(): this{ this.isRunning=false; return this; }

    updatePose( pose: Pose ): this{
        if( this.clip ){
            let t;
            for( t of this.clip.tracks ){
                t.apply( pose, this.fInfo[ t.timeIndex ] );
            }
        }

        return this;
    }

    getMotion(): TVec3 | null{
        const rm = this?.clip?.rootMotion;
        if( rm ){
            const fi = this.fInfo[ rm.timeStampIdx ];
            return rm.getBetweenFrames( fi.pkB, fi.pt, fi.kB, fi.t );
        }

        return null;
    }
    // #endregion

    // #region INTERNAL METHODS
    computeFrameInfo(){
        if( !this.clip ) return;

        const time = this.clock;
        let fi     : FrameInfo;
        let ts     : ArrayLike<number>;
        let imin   : number;
        let imax   : number;
        let imid   : number;

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
            // Save previous frame
            fi.pkB = Math.max( fi.kB, 0 ); // Might be -1 to denote animation hasn't started yet
            fi.pt  = fi.t;

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
            // Lerp Time
            fi.t  = ( time - ts[ fi.kB ] ) / ( ts[ fi.kC ] - ts[ fi.kB ] ); // Map Time between the Two Time Stamps
        }
    }

    checkEvents(): void{
        // const fi = this.fInfo[ 0 ];
        if( !this?.clip?.events || !this.onEvent ) return;

        // For every timestamp set...
        for( const fi of this.fInfo ){

            // Check if a marker has been crossed.
            for( const evt of this.clip.events ){

                if( evt.start >= fi.pkB && evt.start < fi.kB && !this.eventCache?.get( evt.name ) ){
                    this.eventCache?.set( evt.name, true );     // Trigger only once per cycle
                    try{
                        this.onEvent( evt.name );
                    }catch( err ){
                        const msg = ( err instanceof Error )? err.message : String( err );
                        console.error( 'Error while calling animation event callback:', msg );
                    }
                    break;
                }
            }
        }
    }
    // #endregion
}

export class FrameInfo{
    t   : number =  0; // Lerp Time
    kA  : number = -1; // Keyframe Pre Tangent
    kB  : number = -1; // Keyframe Lerp Start
    kC  : number = -1; // Keyframe Lerp End
    kD  : number = -1; // Keyframe Post Tangent

    pkB : number = 0;  // Previous Lerp Start
    pt  : number = 0;  // Previous Lerp Time

    // Set info for single frame timeStamp
    singleFrame(){
        this.t   =  1;
        this.kA  =  0;
        this.kB  = -1;
        this.kC  = -1;
        this.kD  =  0;

        this.pkB = 0;
        this.pt  = 0;
    }
}