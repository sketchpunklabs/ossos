const PI_2 		= 6.283185307179586;
const PI_2_INV 	= 1 / 6.283185307179586;

class Cycle{
    constructor( sec=1 ){
        this.value			= 0;	// Current Cycle Value
        this.cycle_inc		= 0;	// How much to move per millisecond
        this.speed_scale    = 1.0;	// Scale the rate of the cycle
        this.tickStack      = new Array();
        this.setBySeconds( sec );
    }

    onTick( fn ){ this.tickStack.push( fn ); return this; }

    setBySeconds( s ){ this.cycle_inc = PI_2 / ( s * 1000 ); return this;}

    backwards(){ if( this.speed_scale > 0 ) this.speed_scale *= -1; return this;}
    forwards(){  if( this.speed_scale < 0 ) this.speed_scale *= -1; return this;}

    get( offset=0 ){ return (this.value + offset) % PI_2; }
    asSin( offset=0 ){ return Math.sin( this.value + offset ); }
    asSin01( offset=0 ){ return Math.sin( this.value + offset ) * 0.5 + 0.5; }
    asSinAbs( offset=0 ){ return Math.abs( Math.sin( this.value + offset ) ); }
    asCycle01( offset=0 ){ return (this.value + offset) * PI_2_INV; }
    asCycle010( offset=0 ){ 
        var n = (this.value + offset) * PI_2_INV * 2;
        return ( n > 1 )? 1 - (n - 1) : n;
    }

	tick( dt ){
        this.value = ( this.value + ( dt * 1000 * this.speed_scale) * this.cycle_inc ) % PI_2;

        if( this.tickStack.length > 0 ){
            for( let t of this.tickStack ) t( this );
        }

		return this;
	}
}

export default Cycle;