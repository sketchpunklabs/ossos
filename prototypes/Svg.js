const NS = "http://www.w3.org/2000/svg";

function Atr( elm, name, val ){ elm.setAttributeNS( null, name, val ); return elm; }
function HAtr( elm, name, val ){ elm.setAttribute( name, val ); return elm; }

function Elm( name, props={} ){ 
    const elm = document.createElementNS( NS, name );
    for( let [k,v] of Object.entries( props ) ) elm.setAttributeNS( null, k, v );
    return elm;
}

function AtrProps( elm, props ){
    for( let [k,v] of Object.entries( props ) ) elm.setAttributeNS( null, k, v );
    return elm;
}

export default class Svg{
    constructor( elm=null ){
        this.elm = ( typeof elm === 'string' )? document.getElementById( elm ) : elm;
    }

    // #region SETTINGS
    useCenterOrigin(){
        const box = this.elm.getBoundingClientRect();
        const w   = box.width;
        const h   = box.height;
        const x   = -Math.round( w * 0.5 );
        const y   = -Math.round( w * 0.5 );

        Atr( this.elm, 'viewBox', `${x} ${y} ${w} ${h}` );
        return this;
    }
    // #endregion

    // #region METHODS
    append(){ 
        for( let e of arguments ) this.elm.appendChild( e );
        return this;
    }

    getAttrib( elm, name ){
        elm.getAttributeNS( null, name );
    }

    clear( obj=this.elm ){
		for( let i=obj.childNodes.length-1; i >= 0; i-- ){
			obj.removeChild( obj.childNodes[ i ] );
		}
        return this;
	}
    // #endregion

    // #region EVENTS
	on( evt_name, fn ){ this.elm.addEventListener( evt_name, fn ); return this; }
	off( evt_name, fn ){ this.elm.removeEventListener( evt_name, fn ); return this; }
    // #endregion

    // #region OTHERS
    group( props={} ){ return Elm( 'g', props ); }
    // #endregion

    // #region SHAPES
    circle( x, y, radius=1, props={} ){
        const pr   = { 
            fill : '#000000',
            cx   : x,
            cy   : y,
            r    : radius,
            ...props,
        };
        return Elm( 'circle', pr );
    }

    sweepArc( cx=0, cy=0, radius=100, startAng=0, sweepAng=45, props=null ){
        const rad0 = startAng * Math.PI / 180 - Math.PI * 0.5;  // Starting angle, origin UP
        const rad1 = rad0 + sweepAng * Math.PI / 180;           // Sweet Angle appended to start angle
        const x0   = radius * Math.cos( rad0 ) + cx;            // Starting Position of Arc
        const y0   = radius * Math.sin( rad0 ) + cy;
        const x1   = radius * Math.cos( rad1 ) + cx;            // Ending Position of Arc
        const y1   = radius * Math.sin( rad1 ) + cy;

        // M {xMoveTo} {yMoveTo} A {xRadius} {yRadius} {rotationOfEllipse} {largeArcFlag} {sweepFlag} {xEnd} {yEnd}
        const pr   = { 
            fill: 'none', stroke: '#000000', 'stroke-width': 10, 
            d: `M ${x0} ${y0} A ${radius} ${radius} 0 0 1 ${x1} ${y1}`,
            ...props,
        };

        const e = AtrProps( Elm( 'path' ), pr );
        return e;
    }


    // https://milevski.co/svg-arc-corners/demo/
    roundedArc( cx=0, cy=0, radius=200, start=0, end=45, width=20, cornerRadius=5, props={} ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const PI2      = Math.PI * 2;
        const fnArcPnt = ( radius, angle )=>{
            const rad = ( angle - 90 ) * Math.PI / 180;
            return [
                cx + radius * Math.cos( rad ),
                cy + radius * Math.sin( rad ),
            ];
        };

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const innerRadius   = radius - width;
        const circumference = Math.abs( end - start );
        cornerRadius        = Math.min( width * 0.5, cornerRadius );

        if( 360 * ( cornerRadius / ( Math.PI * innerRadius ) ) > Math.abs( start - end ) ){
            cornerRadius = circumference / 360 * innerRadius * Math.PI;
        }
    
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // inner and outer radiuses
        const innerRadius2 = innerRadius + cornerRadius;
        const outerRadius  = radius - cornerRadius;
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Butts Corner Points
        const oStart   = fnArcPnt( outerRadius, start );
        const oEnd     = fnArcPnt( outerRadius, end );
        const iStart   = fnArcPnt( innerRadius2, start );
        const iEnd     = fnArcPnt( innerRadius2, end );

        const iSection = 360 * ( cornerRadius / ( PI2 * innerRadius ) );
        const oSection = 360 * ( cornerRadius / ( PI2 * radius ) );
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Arcs Endpoints
        const iArcStart = fnArcPnt( innerRadius, start + iSection );
        const iArcEnd   = fnArcPnt( innerRadius, end   - iSection );
        const oArcStart = fnArcPnt( radius, start + oSection );
        const oArcEnd   = fnArcPnt( radius, end   - oSection );

        const arcSweep1 = circumference > 180 + 2 * oSection ? 1 : 0;
        const arcSweep2 = circumference > 180 + 2 * iSection ? 1 : 0;
    
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const d = 
            `M ${oStart[0]} ${oStart[1]} ` +                                                        // begin path
            `A ${cornerRadius} ${cornerRadius} 0 0 1 ${oArcStart[0]} ${oArcStart[1]} ` +            // outer start corner
            `A ${radius} ${radius} 0 ${arcSweep1} 1 ${oArcEnd[0]} ${oArcEnd[1]} ` +                 // outer main arc
            `A ${cornerRadius} ${cornerRadius} 0 0 1 ${oEnd[0]} ${oEnd[1]} ` +                      // outer end corner
            `L ${iEnd[0]} ${iEnd[1]} ` +                                                            // end butt
            `A ${cornerRadius} ${cornerRadius} 0 0 1 ${iArcEnd[0]} ${iArcEnd[1]} ` +                // inner end corner
            `A ${innerRadius} ${innerRadius} 0 ${arcSweep2} 0 ${iArcStart[0]} ${iArcStart[1]} ` +   // inner arc
            `A ${cornerRadius} ${cornerRadius} 0 0 1 ${iStart[0]} ${iStart[1]} Z`;                  // inner start corner, end path

        // M {xMoveTo} {yMoveTo} A {xRadius} {yRadius} {rotationOfEllipse} {largeArcFlag} {sweepFlag} {xEnd} {yEnd}
        const pr = { d, fill: '#000000', ...props, };
        const e  = AtrProps( Elm( 'path' ), pr );
        return e;
    }

    // #endregion
}



/*
	on( evt_name, fn ){ this.svg.addEventListener( evt_name, fn ); return this; }
	off( evt_name, fn ){ this.svg.removeEventListener( evt_name, fn ); return this; }


	clear(){
		for( let i=this.svg.childNodes.length-1; i >= 0;  i-- ){
			this.svg.removeChild( this.svg.childNodes[i] );
		}
	}

	remove(elm){ this.tag.removeChild(elm); return this; }
	append(elm){ this.tag.appendChild(elm); return this; }

	//Creates an Quadratic Curve path in SVG
	createPath(pathColor=null, pathWidth=null, pashDashAry=null){
		var elm = document.createElementNS(this.ns,"path");
		elm.setAttribute("fill", "none");
		
		if(pathColor != null)	elm.setAttribute("stroke", pathColor);
		if(pathWidth != null) 	elm.setAttribute("stroke-width", pathWidth);
		if(pashDashAry != null)	elm.setAttribute("stroke-dasharray", pashDashAry);

		this.tag.appendChild(elm);
		return elm;
	}

	//Set the position of the curve with the control points at an even position on the x pos
	setQCurveScaledXPos(elm,x1,y1,x2,y2,scale){
		var d = Math.abs(x1-x2) / scale,	//Delta X times scale factor 9
		str = "M" + x1	+ "," + y1 + " C" +	//MoveTo
			(x1 + d)	+ "," + y1 + " " +	//First Control Point
			(x2 - d)	+ "," + y2 + " " +	//Second Control Point
			x2			+ "," + y2;			//End Point
		elm.setAttribute('d', str);
	}

	setStroke(elm,color){ elm.setAttribute("stroke",color); }

	//Unused function at the moment, it creates a straight line
	createLine(x1, y1, x2, y2, color, w) {
		var line = document.createElementNS(this.ns,'line');
		line.setAttribute('x1', x1);
		line.setAttribute('y1', y1);
		line.setAttribute('x2', x2);
		line.setAttribute('y2', y2);
		line.setAttribute('stroke', color);
		line.setAttribute('stroke-width', w);
		this.tag.appendChild(line);
		return line;
	}

    
    static ellipse( x, y, xRadius, yRadius, fillColor=null, strokeColor=null, strokeWidth=0 ){
        let e = Elm( 'ellipse' );
        Atr( e, 'cx', x );
        Atr( e, 'cy', y );
        Atr( e, 'rx', xRadius );
        Atr( e, 'ry', yRadius );
        if( fillColor )     Atr( e, 'fill',         fillColor );
        if( strokeColor )   Atr( e, 'stroke',       strokeColor );
        if( strokeWidth )   Atr( e, 'stroke-width', strokeWidth );
        return e;
    }

    static rect( x, y, w, h, fillColor=null, strokeColor=null, strokeWidth=0 ){
        let e = Elm( 'rect' );
        Atr( e, 'x', x );
        Atr( e, 'y', y );
        Atr( e, 'width', w );
        Atr( e, 'height', h );
        if( fillColor )     Atr( e, 'fill',         fillColor );
        if( strokeColor )   Atr( e, 'stroke',       strokeColor );
        if( strokeWidth )   Atr( e, 'stroke-width', strokeWidth );
        return e;
    }

    static roundRect( x, y, w, h, r, fillColor=null, strokeColor=null, strokeWidth=0 ){
        let e = Elm( 'rect' );
        Atr( e, 'x', x );
        Atr( e, 'y', y );
        Atr( e, 'width', w );
        Atr( e, 'height', h );
        Atr( e, 'rx', r );
        Atr( e, 'ry', r );
        if( fillColor )     Atr( e, 'fill',         fillColor );
        if( strokeColor )   Atr( e, 'stroke',       strokeColor );
        if( strokeWidth )   Atr( e, 'stroke-width', strokeWidth );
        return e;
    }

    static line( x1=null, y1=null, x2=null, y2=null, strokeColor=null, strokeWidth=0 ){
        let e = Elm( 'line' );
        if( x1 ) Atr( e, 'x1', x1 );
        if( y1 ) Atr( e, 'y1', y1 );
        if( x2 ) Atr( e, 'x2', x2 );
        if( y2 ) Atr( e, 'y2', y2 );
        if( strokeColor )   Atr( e, 'stroke',       strokeColor );
        if( strokeWidth )   Atr( e, 'stroke-width', strokeWidth );
        return e;
    }

    // points='0,0 100,100, 100,50' 
    static polygon( svgPnts, fillColor=null, strokeColor=null, strokeWidth=0 ){
        let e = Elm( 'polygon' );
        Atr( e, 'points', svgPnts );
        if( fillColor )     Atr( e, 'fill',         fillColor );
        if( strokeColor )   Atr( e, 'stroke',       strokeColor );
        if( strokeWidth )   Atr( e, 'stroke-width', strokeWidth );
        return e;
    }

    // points='0,0 100,100, 100,50'
    static polygline( svgPnts, strokeColor=null, strokeWidth=0 ){
        let e = Elm( 'polyline' );
        Atr( e, 'points', svgPnts );
        if( fillColor )     Atr( e, 'fill',         fillColor );
        return e;
    }

    static translate( elm, x, y ){ elm.setAttributeNS( null, "transform", 'translate(' + x + "," + y + ")" ); }
*/
