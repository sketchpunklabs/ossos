export default class AnimationEvent{
    name      : string = '';
    startTime : number = 0;
    duration  : number = 0;
    constructor( name: string, startTime: number, duration: number ){
        this.name      = name;
        this.startTime = startTime;
        this.duration  = duration;
    }
}
