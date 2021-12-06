//#region IMPORTS
import { quat }         from 'gl-matrix';
import SpringBase       from './SpringBase';
import QuatUtil         from '../../maths/QuatUtil';
//#endregion

// implicit euler spring
class SpringQuat extends SpringBase {
    // #region MAIN
    vel     = quat.create(); // Velocity
    val     = quat.create(); // Current Value
    tar     = quat.create(); // Target Value
    epsilon = 0.00001;
    // #endregion ///////////////////////////////////////////////////////////////////

    //#region SETTERS / GETTERS
    setTarget( v: quat, doNorm=false ): this{
        quat.copy( this.tar, v );
        if( doNorm ) quat.normalize( this.tar, this.tar );
        return this;
    }

    reset( v ?: quat ){
        quat.identity( this.vel );

        if( v ){
            quat.copy( this.val, v );
            quat.copy( this.tar, v );
        }else{
            quat.identity( this.val );
            quat.identity( this.tar );
        }

        return this;
    }
    //#endregion ///////////////////////////////////////////////////////////////////

    update( dt: number ): boolean{
        if( QuatUtil.isZero( this.vel ) && QuatUtil.lenSqr( this.tar, this.val ) == 0 ) return false;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if ( quat.sqrLen( this.vel ) < this.epsilon && QuatUtil.lenSqr( this.tar, this.val ) < this.epsilon ) {
            quat.set( this.vel, 0, 0, 0, 0 );
            quat.copy( this.val, this.tar );
            return true;
        }

        if( quat.dot( this.tar, this.val ) < 0 ) QuatUtil.negate( this.tar ); // Can screw up skinning if axis not in same hemisphere
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let friction = 1.0 + 2.0 * dt * this.damping * this.oscPerSec,
            dt_osc	 = dt * this.oscPerSec**2,
            dt2_osc  = dt * dt_osc,
            det_inv  = 1.0 / ( friction + dt2_osc );

        this.vel[0] = ( this.vel[0] + dt_osc * ( this.tar[0] - this.val[0] ) ) * det_inv;
        this.vel[1] = ( this.vel[1] + dt_osc * ( this.tar[1] - this.val[1] ) ) * det_inv;
        this.vel[2] = ( this.vel[2] + dt_osc * ( this.tar[2] - this.val[2] ) ) * det_inv;
        this.vel[3] = ( this.vel[3] + dt_osc * ( this.tar[3] - this.val[3] ) ) * det_inv;

        this.val[0] = ( friction * this.val[0] + dt * this.vel[0] + dt2_osc * this.tar[0] ) * det_inv;
        this.val[1] = ( friction * this.val[1] + dt * this.vel[1] + dt2_osc * this.tar[1] ) * det_inv;
        this.val[2] = ( friction * this.val[2] + dt * this.vel[2] + dt2_osc * this.tar[2] ) * det_inv;
        this.val[3] = ( friction * this.val[3] + dt * this.vel[3] + dt2_osc * this.tar[3] ) * det_inv;

        quat.normalize( this.val, this.val );
        return true;
    }
}

export default SpringQuat;