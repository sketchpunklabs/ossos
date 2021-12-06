import SpringBase from './SpringBase';

// implicit euler spring
class SpringFloat extends SpringBase {
    // #region MAIN
    vel     = 0; // Velocity
    val     = 0; // Currvent Value
    tar     = 0; // Target Value
    // #endregion ///////////////////////////////////////////////////////////////////

    // #region SETTERS / GETTERS
    setTarget( v: number ){ this.tar = v; return this; }

    reset( v ?: number ): this{
        this.vel = 0;

        if( v != undefined ){
            this.val = v;
            this.tar = v;
        }else{
            this.val = 0
            this.tar = 0;
        }
        return this;
    }
    // #endregion ///////////////////////////////////////////////////////////////////

    update( dt: number ): boolean{
        if( this.vel == 0 && this.tar == this.val ) return false;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if ( Math.abs( this.vel ) < this.epsilon && Math.abs( this.tar - this.val ) < this.epsilon ) {
            this.vel = 0;
            this.val = this.tar;
            return true;
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let friction = 1.0 + 2.0 * dt * this.damping * this.oscPerSec,
            dt_osc	 = dt * this.oscPerSec**2,
            dt2_osc  = dt * dt_osc,
            det_inv  = 1.0 / ( friction + dt2_osc );

        this.vel = ( this.vel + dt_osc * ( this.tar - this.val ) ) * det_inv;
        this.val = ( friction * this.val + dt * this.vel + dt2_osc * this.tar ) * det_inv;
        
        return true;
    }
}

export default SpringFloat;