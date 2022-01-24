//#region IMPORTS
import { vec3 }         from 'gl-matrix';
import SpringBase       from './SpringBase';
import Vec3Util         from '../../maths/Vec3Util';
//#endregion


// implicit euler spring
class SpringVec3 extends SpringBase {
    //#region MAIN
    vel     = vec3.create(); // Velocity
    val     = vec3.create(); // Current Value
    tar     = vec3.create(); // Target Value
    epsilon = 0.000001;
    //#endregion ///////////////////////////////////////////////////////////////////

    // #region SETTERS / GETTERS
    setTarget( v: vec3 ){ vec3.copy( this.tar, v ); return this; }

    reset( v: vec3 ){
        if( v ){
            vec3.copy( this.val, v );
            vec3.copy( this.tar, v );
        }else{
            vec3.set( this.val, 0, 0, 0 );
            vec3.set( this.tar, 0, 0, 0 );
        }

        return this;
    }
    //#endregion ///////////////////////////////////////////////////////////////////

    update( dt: number ): boolean{
        if( Vec3Util.isZero( this.vel ) && Vec3Util.lenSqr( this.tar, this.val ) == 0 ) return false;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if ( vec3.sqrLen( this.vel ) < this.epsilon && Vec3Util.lenSqr( this.tar, this.val ) < this.epsilon ) {
            vec3.set( this.vel, 0, 0, 0 );
            vec3.copy( this.val, this.tar );
            return true;
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let friction = 1.0 + 2.0 * dt * this.damping * this.oscPerSec,
            dt_osc	 = dt * this.oscPerSec**2,
            dt2_osc  = dt * dt_osc,
            det_inv  = 1.0 / ( friction + dt2_osc );

        this.vel[0] = ( this.vel[0] + dt_osc * ( this.tar[0] - this.val[0] ) ) * det_inv;
        this.vel[1] = ( this.vel[1] + dt_osc * ( this.tar[1] - this.val[1] ) ) * det_inv;
        this.vel[2] = ( this.vel[2] + dt_osc * ( this.tar[2] - this.val[2] ) ) * det_inv;

        this.val[0] = ( friction * this.val[0] + dt * this.vel[0] + dt2_osc * this.tar[0] ) * det_inv;
        this.val[1] = ( friction * this.val[1] + dt * this.vel[1] + dt2_osc * this.tar[1] ) * det_inv;
        this.val[2] = ( friction * this.val[2] + dt * this.vel[2] + dt2_osc * this.tar[2] ) * det_inv;

        return true;
    }
}

export default SpringVec3;