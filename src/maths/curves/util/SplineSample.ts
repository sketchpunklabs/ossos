// #region IMPORTS
import { Spline }   from '../Spline';
import Vec3         from '../../Vec3'
// #endregion

export default class SplineSample{
    dist        = 0; // Distance from start of spline
    inc         = 0; // Incremental step since last sample
    time        = 0; // Curve T at each sample

    pos         = new Vec3();
    tangent     = new Vec3();   // Z : Forward
    normal      = new Vec3();   // Y : Up
    binormal    = new Vec3();   // X : Right

    fromLerp( a: SplineSample, b: SplineSample, t: number ): SplineSample{
        const ti  = 1 - t;
        this.dist = a.dist * ti + b.dist * t;
        this.inc  = a.inc * ti + b.inc * t;
        this.time = a.time * ti + b.time * t;

        this.pos.fromLerp( a.pos, b.pos, t );
        this.tangent.fromLerp( a.tangent, b.tangent, t );
        this.normal.fromLerp( a.normal, b.normal, t );
        this.binormal.fromLerp( a.binormal, b.binormal, t );

        return this;
    }

    clone(): SplineSample{
        const s = new SplineSample();
        s.dist  = this.dist;
        s.inc   = this.inc;
        s.time  = this.time;

        s.pos.copy( this.pos );
        s.tangent.copy( this.tangent );
        s.normal.copy( this.normal );
        s.binormal.copy( this.binormal );
        return s;
    }
}