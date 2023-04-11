import { EventType } from './types';

export default class AnimationEvent{
    name        : string = '';
    type        : number = EventType.Frame;
    start       : number = -1;   // Starting Frame or Time
    duration    : number = -1;   // How many frames or seconds this event lasts

    constructor( name: string, start: number = 0, eventType: number= EventType.Frame, duration: number = -1 ){
        this.name     = name;
        this.start    = start;
        this.duration = duration;
        this.type     = eventType;
    }
}
