import { vec3 } from 'gl-matrix';
import { Vec3Util } from '.';

class CurveSample{
    // #region MAIN
    _totalLen  = 0;     // Total Length of the Spline
    _sampleCnt = 0;     // Total Samples Collected
    _aryLen    : Array<number>;  // Total Length at each sample point
    _aryInc    : Array<number>;  // Delta Length at each sample point, Cached as a Range value when Remapping Distance between Samples
    _aryPos    : Array<vec3>;

    constructor( cnt = 0 ){
        if( cnt == 0 ){
            this._aryLen = [];
            this._aryInc = [];
            this._aryPos = [];
        }else{
            this._sampleCnt = cnt;
            this._aryLen    = new Array( cnt );
            this._aryLen.fill( 0 );

            this._aryInc    = this._aryLen.slice( 0 );
            this._aryPos    = this._aryLen.map( ()=>[0,0,0] );
        }
    }
    // #endregion ///////////////////////////////////////////////////////

    add( pnt: vec3 ){
        if( this._sampleCnt > 0 ){
            const inc = Vec3Util.len( pnt, this._aryPos[ this._sampleCnt-1 ] );
            this._totalLen += inc;                  // Total Length
            this._aryLen.push( this._totalLen );    // Current Total Length at this point
            this._aryInc.push( inc );               // Length between Current+Previous Point
        }else{
            this._aryLen.push( 0 );
            this._aryInc.push( 0 );
        }

        this._aryPos.push( Array.from( pnt ) as vec3 ); 
        this._sampleCnt++;
    }

    set( i:number, pnt: vec3 ):void{ vec3.copy( this._aryPos[ i ], pnt ); }

    updateLengths():void{
        let inc: number;
        this._totalLen = 0;

        for( let i=1; i < this._sampleCnt; i++ ){
            inc = Vec3Util.len( this._aryPos[ i ], this._aryPos[ i-1 ] );
            this._totalLen     += inc;
            this._aryLen[ i ]   = this._totalLen;
            this._aryInc[ i ]   = inc;
        }
    }

    atLength( len: number, out ?: vec3 ): vec3{
        const alen  = this._aryLen;
        const ainc  = this._aryInc;
        out       ??= [0,0,0];

        if( len <= 0 )                              vec3.copy( out, this._aryPos[ 0 ] );
        else if( len >= this._totalLen - 0.001 )    vec3.copy( out, this._aryPos[ this._sampleCnt-1 ] );
        else{
            for( let i=this._sampleCnt-1; i >= 0; i-- ){
                if( alen[ i ] < len ){
                    const t = ( len - alen[ i ] ) / ainc[ i+1 ];                    // Normalize Search Length ( x-a / b - a );
                    vec3.lerp( out, this._aryPos[ i ], this._aryPos[ i+1 ], t );    // Get the Position between the two sample positions.
                    return out;
                }
            }
        }

        return out;
    }

    /*
    atLen( len, a=null, b=null ){
		if( a == null ) a = 0;
		if( b == null ) b = this.sample_cnt-2;

		for( let i=b; i >= a; i-- ){
			if( this.ary_len[ i ] < len ){
				let tt	= ( len - this.ary_len[ i ] ) / this.ary_inc[ i+1 ]; 		// Normalize the Search Length   ( x-a / b-a )
                let ttt	= this.ary_time[ i ] * (1-tt) + this.ary_time[ i+1 ] * tt;	// Interpolate the Curve Time between two points
				return ttt / this.curve_cnt;	// Since time saved as as Curve# + CurveT, Normalize it based on total time which is curve count
			}
		}
		return 0;
	}

	// Get Spline T based on Time of Arc Length
	at( t ){
		if( t >= 1 ) return 1;
		if( t <= 0 ) return 0;
		return this.at_len( this.total_len * t );
    }
    */


    // #region SETUP
    /*
    from_spline( spline, samp_cnt=5 ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Setup
        let ccnt                = spline.curve_count;
        this.curve_cnt          = ccnt;
        this.per_curve_sample   = samp_cnt;
        this.sample_cnt         = samp_cnt * ccnt + 1;
		this.ary_len 	        = new Array( this.sample_cnt );
		this.ary_inc	        = new Array( this.sample_cnt );
		this.ary_time	        = new Array( this.sample_cnt );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let prev = new Vec3(),
			pos	 = new Vec3();

		this.ary_len[ 0 ]  = 0;
		this.ary_inc[ 0 ]  = 0;
		this.ary_time[ 0 ] = 0;

        spline.at_curve( 0, 0, prev );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let c, s, t, len, i=1;
        for( c=0; c < ccnt; c++ ){                          // For Every Curve...
            for( s=1; s <= samp_cnt; s++ ){                 // Compute the same Samples
                t = s / samp_cnt;
                spline.at_curve( c, t, pos );	
                
                //------------------------------
                len 				= Vec3.len( prev, pos );
				this.total_len		+= len;					// Total Length
				this.ary_len[ i ]	= this.total_len;		// Current Total Length at this point
				this.ary_inc[ i ]	= len;					// Length between Current+Previous Point
				this.ary_time[ i ]	= c + t;				// Time Curve Step, Saving Curve Index with T
                //console.log( "map", c, s, i, this.total_len );
                //------------------------------
                prev.copy( pos );
                i++;
            }
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return this;
    }
    */
    // #endregion ///////////////////////////////////////////////////////

    // #region GETTERS

    /*
	// Compute the Spline's T Value based on a specific length of the curve
	at_len( len, a=null, b=null ){
		if( a == null ) a = 0;
		if( b == null ) b = this.sample_cnt-2;

		for( let i=b; i >= a; i-- ){
			if( this.ary_len[ i ] < len ){
				let tt	= ( len - this.ary_len[ i ] ) / this.ary_inc[ i+1 ]; 		// Normalize the Search Length   ( x-a / b-a )
                let ttt	= this.ary_time[ i ] * (1-tt) + this.ary_time[ i+1 ] * tt;	// Interpolate the Curve Time between two points
				return ttt / this.curve_cnt;	// Since time saved as as Curve# + CurveT, Normalize it based on total time which is curve count
			}
		}
		return 0;
	}

	// Get Spline T based on Time of Arc Length
	at( t ){
		if( t >= 1 ) return 1;
		if( t <= 0 ) return 0;
		return this.at_len( this.total_len * t );
    }

    at_curve( idx, t ){
        let ai = this.per_curve_sample * idx;
        let bi = ai + this.per_curve_sample;

        let a = this.ary_len[ ai ];
        let b = this.ary_len[ bi ];

        let len = a * (1-t) + b * t;
        return this.at_len( len );
    }

    at_idx_range( t, idx_a, idx_b ){
        let ai = this.per_curve_sample * idx_a;
        let bi = this.per_curve_sample * idx_b + this.per_curve_sample;

        let a = this.ary_len[ ai ];
        let b = this.ary_len[ bi ];

        let len = a * (1-t) + b * t;
        return this.at_len( len );
    }

    */
    // #endregion ///////////////////////////////////////////////////////
}

export default CurveSample;