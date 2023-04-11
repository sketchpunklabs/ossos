import type { ITrack } from './types';
import { EventType }   from './types';
import AnimationEvent  from './AnimationEvent';

export default class Clip{
    // #region MAIN
    name        : string                     = '';          // Clip Name
    frameCount  : number                     = 0;           // Total frames in animation
    duration    : number                     = 0;           // Total animation time
    timeStamps  : Array< ArrayLike<number> > = [];          // Different sets of shared time stamps
    tracks      : Array< ITrack >            = [];          // Collection of animations broke out as Rotation, Position & Scale
    events     ?: Array< AnimationEvent >    = undefined;   // Collection of animation events
    isLooped    : boolean                    = true;        // Is the animation to run in a loop

    constructor( name: string = '' ){
        this.name = name;
    }
    // #endregion

    // #region EVENTS
    addEvent( name:string, start: number, eventType: number = EventType.Frame, duration: number = -1 ): this{
        if( !this.events ) this.events = [];
        this.events.push( new AnimationEvent( name, start, eventType, duration ) );
        return this;
    }
    // #endregion
}
