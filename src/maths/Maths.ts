
export default class Maths{
    // #region CONSTANTS
    static TAU          = 6.283185307179586; // PI * 2
    static PI_H         = 1.5707963267948966;
    static TAU_INV      = 1 / 6.283185307179586;
    static PI_Q         = 0.7853981633974483;
    static PI_Q3        = 1.5707963267948966 + 0.7853981633974483;
    static PI_270       = Math.PI + 1.5707963267948966;
    static DEG2RAD      = 0.01745329251; // PI / 180
    static RAD2DEG      = 57.2957795131; // 180 / PI
    static EPSILON      = 1e-6;
    static PHI          = 1.618033988749895; // Goldren Ratio, (1 + sqrt(5)) / 2
    //#endregion

    // #region OPERATIONS

    static clamp( v: number, min: number, max: number ): number { return Math.max( min, Math.min( max, v ) ); }
    static clampGrad( v: number ): number { return Math.max( -1, Math.min( 1, v ) ); }
    static saturate( v: number ): number { return Math.max( 0, Math.min( 1, v ) ); }

    static fract( f: number ): number { return f - Math.floor( f ); }
    static nearZero( v: number): number{ return (Math.abs(v) <= Maths.EPSILON)? 0 : v; }

    static dotToDeg( dot: number ): number{ return Math.acos( Maths.clampGrad( dot ) ) * Maths.RAD2DEG; }

    static remap( x: number, xMin: number, xMax: number, zMin: number, zMax: number ): number{ 
        return ( x - xMin ) / ( xMax - xMin ) * ( zMax-zMin ) + zMin;
    }
    
    static snap( x: number, step: number ): number { return Math.floor( x / step ) * step; }

    static norm( min: number, max: number, v: number ): number { return (v-min) / (max-min); }

    // Modulas that handles Negatives ex "Maths.mod( -1, 5 ) = 4
    static mod( a: number, b: number ) : number{	
        const v = a % b;
        return ( v < 0 )? b + v : v;
    }

    static lerp( a: number, b: number, t: number ): number{
        return a * (1-t) + b * t;
    }

    // Logarithmic Interpolation
    static eerp( a: number, b: number, t: number ): number{
        // https://twitter.com/FreyaHolmer/status/1068280369886240768?s=20
        // https://www.gamedeveloper.com/programming/logarithmic-interpolation
        return a * ( ( b / a ) ** t );
        // return 2 ** ( Math.log( a ) * (1-t) + Math.log( b ) * t );
    }

    // Move value to the closest step
    static roundStep( value: number, step: number ): number{ return Math.round( value / step ) * step; }
    
    // https://docs.unity3d.com/ScriptReference/Mathf.SmoothDamp.html
    // https://github.com/Unity-Technologies/UnityCsReference/blob/a2bdfe9b3c4cd4476f44bf52f848063bfaf7b6b9/Runtime/Export/Math/Mathf.cs#L308
    static smoothDamp( cur: number, tar: number, vel: number, dt: number, smoothTime=0.0001, maxSpeed=Infinity ): [ number, number ]{
        // Based on Game Programming Gems 4 Chapter 1.10
        smoothTime      = Math.max( 0.0001, smoothTime );
        const omega     = 2 / smoothTime;
        const x         = omega * dt;
        const exp       = 1 / ( 1  + x + 0.48 * x * x + 0.235 * x * x * x);
        let   change    = cur - tar;

        // Clamp maximum speed
        const maxChange = maxSpeed * smoothTime;
        change          = Math.min( maxChange, Math.max( change, -maxChange ) );

        const temp      = ( vel + omega * change ) * dt;
        vel             = ( vel - omega * temp ) * exp;
        let val         = ( cur - change ) + ( change + temp ) * exp;

        // Prevent overshooting
        if( tar - cur > 0.0 && val > tar ){
            val = tar;
            vel = 0;
        }

        return [ val, vel ];
    }
    // #endregion
}