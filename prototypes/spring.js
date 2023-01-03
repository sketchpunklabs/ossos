// http://allenchou.net/2014/04/game-math-interpolating-quaternions-with-circular-blending/
// https://gafferongames.com/post/spring_physics/
// http://allenchou.net/2015/04/game-math-more-on-numeric-springing/
// http://allenchou.net/2015/04/game-math-precise-control-over-numeric-springing/
/** Implicit Euler Spring */
function SpringIEVec( size=3 ){
    let self;
    let osc_ps  = Math.PI * 2;  // Oscillation per Second : How many Cycles (Pi*2) per second.	
    let damping = 1;            // How much to slow down  : Value between 0 and 1, 1 creates critical damping.
    let epsilon =  0.0001
    const val   = new Array( size ).fill( 0 );
    const tar   = val.slice();
    const vel   = val.slice();

    // #region Oscillation & Damping
    const setOscPerSec = ( sec )=>{ osc_ps = Math.PI * 2 * sec; return self; };
    const setDamping   = ( d )=>{ damping = d; return self; };

    // Damp Time, in seconds to damp. So damp 0.5 for every 2 seconds.
    // With the idea that for every 2 seconds, about 0.5 damping has been applied
    // IMPORTANT : Need to set OSC Per Sec First
    const dampRadio = ( d, sec )=>{ 
        damping = Math.log( d ) / ( -osc_ps * sec );
        return self;
    };

    // Reduce oscillation by half in X amount of seconds
    // IMPORTANT : Need to set OSC Per Sec First
    const dampHalflife = ( sec )=>{
        damping = 0.6931472 / ( osc_ps * sec ); // float zeta = -ln(0.5f) / ( omega * lambda );
        return self;
    };

    // Critical Damping with a speed control of how fast the cycle to run
    const dampExpo = ( sec )=>{
        osc_ps  = 0.6931472 / sec; // -Log(0.5) but in terms of OCS its 39.7 degrees over time
        damping = 1;
        return self
    };
    // #endregion


    // #region Resetting
    const reset = ( v=null )=>{
        zero( vel );
        if( v != null ){
            copy( val, v );
            copy( tar, v );
        }else{
            zero( val );
            zero( tar );
        }
        return self;
    }
    // #endregion


    // #region Quaternion Usage
    
    // Reset quaternions have a special starting value
    const quatReset = ( v=null )=>{
        quat.identity( vel );
        if( v != null ){
            vec3.copy( val, v );
            vec3.copy( tar, v );
        }else{
            quat.identity( val );
            quat.identity( tar );
        }
        return self;
    }

    // Special target setting, Need to check if the target is on the
    // same hemisphere as the value, if not it needs to be negated.
    const setQuatTarget = ( q )=>{
        quat.copy( tar, q );
        if( quat.dot( val, tar ) < 0 ) vec4.negate( tar, tar );
    }
    // #endregion


    // #region Utils
        const hasVelocity = ()=>{
            for( let v of vel ) if( v !== 0 ) return true;
            return false;
        }

        const sqrDist = ( a, b )=>{
            let rtn = 0;
            for( let i=0; i < size; i++ ) rtn += ( a[i] - b[i] )**2;
            return rtn;
        }

        const sqrLen = ( a )=>{
            let rtn = 0;
            for( let i=0; i < size; i++ ) rtn += a[i]**2;
            return rtn;
        }

        const copy = ( a, b )=>{ for( let i=0; i < size; i++ ) a[i] = b[i]; }
        const zero = ( a )=>{ for( let i=0; i < size; i++ ) a[i] = 0; }
    // #endregion

    
    // #region MAIN
    const update = ( dt )=>{
        if( !hasVelocity() && sqrDist( tar, val ) === 0 ) return false;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( sqrLen( vel ) < epsilon && sqrDist( tar, val ) < epsilon ){
            zero( vel );
            copy( val, tar );
            return true;
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const friction = 1.0 + 2.0 * dt * damping * osc_ps;
        const dt_osc   = dt * osc_ps**2;
        const dt2_osc  = dt * dt_osc;
        const det_inv  = 1.0 / ( friction + dt2_osc );

        for( let i=0; i < size; i++ ){
            vel[i] = ( vel[i] + dt_osc * ( tar[i] - val[i] ) ) * det_inv;
            val[i] = ( friction * val[i] + dt * vel[i] + dt2_osc * tar[i] ) * det_inv;
        }

        return true;
    }
    // #endregion
    

    self = {
        getTarget : ()=>{ return tar.slice(); },
        setTarget : ( v )=>{ copy( tar, v ); return self; },
        
        getValue  : ()=>{ return val.slice(); },
        getNormValue : ()=>{
            const rtn = val.slice();
            let len   = sqrLen( rtn );
            if( len > 0 ) len = 1 / Math.sqrt( len );
            
            for( let i=0; i < size; i++ ) rtn[ i ] *= len;
            return rtn;
        },

        setQuatTarget,

        setOscPerSec,
        setDamping,
        dampRadio,
        dampHalflife,
        dampExpo,

        reset,
        quatReset,
        update,
    };
    return self;
}