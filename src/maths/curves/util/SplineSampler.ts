// #region IMPORTS
import SplineSample from './SplineSample';
import { Spline }   from '../Spline';
import Vec3         from '../../Vec3'
// #endregion


export default class SplineSampler{
    // #region MAIN
    items: Array<SplineSample> = []; // Each sample of the curve
    arcLength = 0;                  // Total Length of the Spline
    
    // curveCnt 	= 0;            // How many curves in spline
    // sampPerCrv  = 0;            // How many samples per curve
    // sampCnt     = 0;            // Total Sample Count
    // lenAry  !: Array<number>;	// Total length at each sample 
    // incAry  !: Array<number>;	// Length Traveled at each samples
    // timeAry !: Array<number>;   // Curve T Value at each samples
    // spline  !: Spline;

    constructor(){}
    // #endregion

    // #region BUILD
    // TODO: Add fromSubCurves( s:spline, sampCnt=5 ):this

    fromSpline( s: Spline, sampCnt: number = 5 ): this{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~        
        const eIdx          = sampCnt - 1;
        this.arcLength      = 0;
        this.items.length   = 0;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let itm = new SplineSample();
        s.at( itm.time, itm.pos, itm.tangent );
        this.items.push( itm );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for( let i=1; i <= eIdx; i++ ){
            itm      = new SplineSample();
            itm.time = i / eIdx;
            s.at( itm.time, itm.pos, itm.tangent );

            // @ts-ignore Object is possibly 'undefined'.ts(2532) :: at(-1)
            itm.inc  = Vec3.dist( itm.pos, this.items.at(-1).pos );
            itm.dist = ( this.arcLength += itm.inc );
            
            this.items.push( itm );
        }

        return this;
    }
    // #endregion

    // #region GETTERS
    // Get lerped sample at a specific distance along the spline sampling
    atDist( dist:number, out=new SplineSample() ): SplineSample{
        let a: SplineSample;
        let b: SplineSample;
        let t: number;

        // console.log( 'atDist', dist, this.arcLength, this.items.length );

        if( dist <= 0 ){
            // Skip to first two items
            a = this.items[0];
            b = this.items[1];
            t = 0;
        }else if( dist >= this.arcLength ){
            // Skip to the last two items
            a = this.items.at(-2) as SplineSample;
            b = this.items.at(-1) as SplineSample;
            t = 1;
        }else{
            // BinarySearch: Find the first item that is greater then seek value
            let imid: number;
            let imin = 0;
            let imax = this.items.length - 1;

            while( imin < imax ){                     // Once Min Crosses or Equals Max, Stop Loop.
                imid = ( imin + imax ) >>> 1;         // Compute Mid Index
                if( dist < this.items[ imid ].dist )
                    imax = imid;      // value is LT seek, use mid as new Max Range
                else               
                    imin = imid + 1;  // value is GTE seek, move min to one after mid to make the cross fail happen
            }

            // console.log( imax, dist );
            // console.log( '----', this.items[ imax-1 ].dist )
            // console.log( '----', this.items[ imax ].dist )

            a = this.items[ imax-1 ];                    // Get the two samples where seek is between
            b = this.items[ imax ];
            t = ( dist - a.dist ) / ( b.dist - a.dist ); // Compute T between the two samples
        }
        
        // console.log( a, b, t );

        out.fromLerp( a, b, t );        

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // for( let i=b; i >= a; i-- ){
        //     if( this.lenAry[ i ] < len ){
        //         let tt	= ( len - this.lenAry[ i ] ) / this.incAry[ i+1 ];          // Normalize the Search Length   ( x-a / b-a )
        //         let ttt	= this.timeAry[ i ] * (1-tt) + this.timeAry[ i+1 ] * tt;    // Interpolate the Curve Time between two points
        //         return ttt / this.curveCnt;                                         // Since time saved as as Curve# + CurveT, Normalize it based on total time which is curve count
        //     }
        // }
        return out;
    }

    // // Get Spline T based on Time of Arc Length
    // at( t: number ): number{
    //     if( t >= 1 ) return 1;
    //     if( t <= 0 ) return 0;
    //     return this.atLen( this.arcLen * t );
    // }

    // // Get Spline T based on Time between Two Main Points on the Spline
    // atRange( a: number, b: number, t: number ): number{
    //     const ai 	= a * this.sampPerCrv;
    //     const bi	= b * this.sampPerCrv;
    //     const len	= this.lenAry[ ai ] * (1-t) + this.lenAry[ bi ] * t;
    //     return this.atLen( len, ai, bi );
    // }
    // #endregion

    // #region ITERATORS
    // iterPoints() : { [Symbol.iterator]() : { next:()=>{ value:Vec3, done:boolean } } } {
    //     const result  = { value:new Vec3(), done:false };
    //     const len     = this.timeAry.length;
    //     let i = 0;
    //     let t;
    //     let c; 

    //     const next    = ()=>{
    //             if( i >= len ) result.done = true;
    //             else{
    //                 const n = this.timeAry[i];
    //                 if( n >= this.curveCnt ){
    //                     c = this.curveCnt - 1;
    //                     t = 1;
    //                 }else{
    //                     c = Math.floor( n );
    //                     t = n - c;
    //                 }
   
    //                 this.spline.atCurve( c, t, result.value );
    //                 i++;
    //             }
    //             return result;
    //           };
    //     return { [Symbol.iterator](){ return { next }; } };
    // }
    // #endregion
}