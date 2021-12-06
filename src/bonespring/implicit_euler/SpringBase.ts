

// http://allenchou.net/2014/04/game-math-interpolating-quaternions-with-circular-blending/
// https://gafferongames.com/post/spring_physics/
// http://allenchou.net/2015/04/game-math-more-on-numeric-springing/
// http://allenchou.net/2015/04/game-math-precise-control-over-numeric-springing/

/** implicit euler spring */
class SpringBase{
    // #region MAIN
    oscPerSec   = Math.PI * 2;  // Oscillation per Second : How many Cycles (Pi*2) per second.	
    damping     = 1;            // How much to slow down : Value between 0 and 1. 1 creates critical damping.
    epsilon     = 0.01;
    // #endregion ///////////////////////////////////////////////////////////////////

    // #region SETTERS / GETTERS
    setTarget( v: any ): this{ console.log( "SET_TARGET NOT IMPLEMENTED"); return this; }
    setOscPerSec( sec: number ): this{ this.oscPerSec = Math.PI * 2 * sec; return this; }
    setDamp( damping: number ): this{ this.damping = damping; return this; }
    
    /** Damp Time, in seconds to damp. So damp 0.5 for every 2 seconds.
    With the idea that for every 2 seconds, about 0.5 damping has been applied */
    setDampRatio( damping: number, dampTime: number ): this{ 
        this.damping = Math.log( damping ) / ( -this.oscPerSec * dampTime );
        return this;
    }
    
    /** Reduce oscillation by half in X amount of seconds */
    setDampHalfLife( dampTime: number ){
        // float zeta = -ln(0.5f) / ( omega * lambda );
        this.damping = 0.6931472 / ( this.oscPerSec * dampTime ); 
        return this;
    }

    // Critical Damping with a speed control of how fast the cycle to run
    setDampExpo( dampTime: number ){
        this.oscPerSec  = 0.6931472 / dampTime; // -Log(0.5) but in terms of OCS its 39.7 degrees over time
        this.damping    = 1;
        return this
    }

    reset( v:any ): this{
        return this;
    }
    // #endregion ///////////////////////////////////////////////////////////////////

    update( dt: number ): boolean{ console.log( "UPDATE NOT IMPLEMENTED"); return false; }
}

export default SpringBase;