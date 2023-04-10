import type { ITrack } from './types';

export default class Clip{
    // #region MAIN
    name        : string             = '';
    frameCount  : number             = 0;
    duration    : number             = 0;
    timeStamps  : Array< ArrayLike<number> > = [];
    tracks      : Array< ITrack >    = [];
    events      : Array< unknown >   = [];

    constructor( name: string = '' ){
        this.name = name;
    }
    // #endregion
}
