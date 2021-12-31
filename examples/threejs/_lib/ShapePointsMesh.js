import * as THREE           from 'three';

class ShapePointsMesh extends THREE.Points{
    _defaultShape   = 1;
    _defaultSize    = 6;
    _defaultColor   = 0x00ff00;
    _cnt            = 0;
    _verts          = [];
    _color          = [];
    _config         = [];
    _dirty          = false;

    constructor( initSize = 20 ){
        super( 
            _newShapePointsMeshGeometry( 
                new Float32Array( initSize * 3 ), 
                new Float32Array( initSize * 3 ),
                new Float32Array( initSize * 2 ),
                false
            ),
            newShapePointsMeshMaterial() //new THREE.PointsMaterial( { color: 0xffffff, size:8, sizeAttenuation:false } )
        );

        this.geometry.setDrawRange( 0, 0 );
        this.onBeforeRender = ()=>{ if( this._dirty ) this._updateGeometry(); }
    }

    reset(){
		this._cnt           = 0;
		this._verts.length  = 0;
        this._color.length  = 0;
        this._config.length = 0;
        this.geometry.setDrawRange( 0, 0 );
		return this;
    }

    add( pos, color = this._defaultColor, size = this._defaultSize, shape = this._defaultShape ){
        this._verts.push( pos[0], pos[1], pos[2] );
        this._color.push( ...glColor( color ) );
        this._config.push( size, shape );
        this._cnt++;
        this._dirty = true;
        return this;
    }

    setColorAt( idx, color ){
        const c = glColor( color );
        idx    *= 3;

        this._color[ idx     ] = c[ 0 ];
        this._color[ idx + 1 ] = c[ 1 ];
        this._color[ idx + 2 ] = c[ 2 ];
        this._dirty            = true;
        return this;
    }

    setPosAt( idx, pos ){
        idx    *= 3;
        this._verts[ idx     ] = pos[ 0 ];
        this._verts[ idx + 1 ] = pos[ 1 ];
        this._verts[ idx + 2 ] = pos[ 2 ];
        this._dirty            = true;
        return this;
    }

    getPosAt( idx ){
        idx    *= 3;
        return [
            this._verts[ idx + 0 ],
            this._verts[ idx + 1 ],
            this._verts[ idx + 2 ],
        ];
    }

    _updateGeometry(){
        const geo       = this.geometry;
        const bVerts    = geo.attributes.position;
        const bColor    = geo.attributes.color;     //this.geometry.index;
        const bConfig   = geo.attributes.config;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( this._verts.length  > bVerts.array.length || 
            this._color.length  > bColor.array.length ||
            this._config.length > bConfig.array.length
        ){
            if( this.geometry ) this.geometry.dispose();
            this.geometry   = _newShapePointsMeshGeometry( this._verts, this._color, this._config );
            this._dirty     = false;
            return;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        bVerts.array.set( this._verts );
        bVerts.count       = this._verts.length / 3;
        bVerts.needsUpdate = true;

        bColor.array.set( this._color );
        bColor.count       = this._color.length / 3;
        bColor.needsUpdate = true;

        bConfig.array.set( this._config );
        bConfig.count       = this._config.length / 2;
        bConfig.needsUpdate = true;

        geo.setDrawRange( 0, bVerts.count );
        geo.computeBoundingBox();
        geo.computeBoundingSphere();
        
        this._dirty = false;
    }
}

//#region SUPPORT 
function _newShapePointsMeshGeometry( aVerts, aColor, aConfig, doCompute=true ){
    //if( !( aVerts instanceof Float32Array) ) aVerts = new Float32Array( aVerts );
    //if( !( aColor instanceof Float32Array) ) aColor = new Float32Array( aColor );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const bVerts    = new THREE.Float32BufferAttribute( aVerts, 3 );
    const bColor    = new THREE.Float32BufferAttribute( aColor, 3 );
    const bConfig   = new THREE.Float32BufferAttribute( aConfig, 2 );
    bVerts.setUsage(  THREE.DynamicDrawUsage );
    bColor.setUsage(  THREE.DynamicDrawUsage );
    bConfig.setUsage( THREE.DynamicDrawUsage );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const geo = new THREE.BufferGeometry();
    geo.setAttribute( 'position', bVerts );
    geo.setAttribute( 'color', bColor );
    geo.setAttribute( 'config', bConfig );

    if( doCompute ){
        geo.computeBoundingSphere();
        geo.computeBoundingBox();
    }
    return geo;
}

function glColor( hex, out = null ){
    const NORMALIZE_RGB = 1 / 255;
    out = out || [0,0,0];

    out[0] = ( hex >> 16 & 255 ) * NORMALIZE_RGB;
    out[1] = ( hex >> 8 & 255 )  * NORMALIZE_RGB;
    out[2] = ( hex & 255 )       * NORMALIZE_RGB;

    return out;
}
//#endregion

//#region SHADER

function newShapePointsMeshMaterial(){

    return new THREE.RawShaderMaterial({
    depthTest       : false,
    transparent 	: true, 
    uniforms        : { u_scale:{ value : 20.0 } },
    vertexShader    : `#version 300 es
    in	vec3	position;
    in	vec3	color;
    in	vec2	config;
    
    uniform 	mat4	modelViewMatrix;
    uniform 	mat4	projectionMatrix;
    uniform 	float	u_scale;

    out 	    vec3	fragColor;
    flat out    int     fragShape;
    
    void main(){
        vec4 wPos 	        = modelViewMatrix * vec4( position.xyz, 1.0 );
        
        fragColor			= color;
        fragShape			= int( config.y );

        gl_Position			= projectionMatrix * wPos;
        gl_PointSize		= config.x * ( u_scale / -wPos.z );

        // Get pnt to be World Space Size
        //gl_PointSize = view_port_size.y * projectionMatrix[1][5] * 1.0 / gl_Position.w;
        //gl_PointSize = view_port_size.y * projectionMatrix[1][1] * 1.0 / gl_Position.w;
    }`,
    fragmentShader  : `#version 300 es
    precision mediump float;

    #define PI	3.14159265359
    #define PI2	6.28318530718

    in   vec3       fragColor;
    flat in int     fragShape;
    out  vec4		outColor;

    float circle(){ 
        vec2 coord      = gl_PointCoord * 2.0 - 1.0; // v_uv * 2.0 - 1.0;
        float radius    = dot( coord, coord );
        float dxdy      = fwidth( radius );
        return smoothstep( 0.90 + dxdy, 0.90 - dxdy, radius );
    }
    
    float ring( float inner ){ 
        vec2 coord      = gl_PointCoord * 2.0 - 1.0;
        float radius    = dot( coord, coord );
        float dxdy      = fwidth( radius );
        return  smoothstep( inner - dxdy, inner + dxdy, radius ) - 
                smoothstep( 1.0 - dxdy, 1.0 + dxdy, radius );
    }
    
    float diamond(){
        // http://www.numb3r23.net/2015/08/17/using-fwidth-for-distance-based-anti-aliasing/
        const float radius = 0.5;
    
        float dst   = dot( abs(gl_PointCoord-vec2(0.5)), vec2(1.0) );
        float aaf   = fwidth( dst );
        return 1.0 - smoothstep( radius - aaf, radius, dst );
    }
    
    float poly( int sides, float offset, float scale ){
        // https://thebookofshaders.com/07/
        vec2 coord = gl_PointCoord * 2.0 - 1.0;
        
        coord.y += offset;
        coord *= scale;
    
        float a = atan( coord.x, coord.y ) + PI; 	// Angle of Pixel
        float r = PI2 / float( sides ); 			// Radius of Pixel
        float d = cos( floor( 0.5 + a / r ) * r-a ) * length( coord );
        float f = fwidth( d );
        return smoothstep( 0.5, 0.5 - f, d );
    }

    // signed distance to a n-star polygon with external angle en
    float sdStar( float r, int n, float m ){ // m=[2,n]
        vec2 p = vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y ) * 2.0 - 1.0;

        // these 4 lines can be precomputed for a given shape
        float an = 3.141593/float(n);
        float en = 3.141593/m;
        vec2  acs = vec2(cos(an),sin(an));
        vec2  ecs = vec2(cos(en),sin(en)); // ecs=vec2(0,1) and simplify, for regular polygon,
    
        // reduce to first sector
        float bn = mod(atan(p.x,p.y),2.0*an) - an;
        p = length(p)*vec2(cos(bn),abs(sin(bn)));
    
        // line sdf
        p -= r*acs;
        p += ecs*clamp( -dot(p,ecs), 0.0, r*acs.y/ecs.y);

        float dist = length(p)*sign(p.x);
        float f = fwidth( dist );

        return smoothstep( 0.0, 0.0 - f, dist );
    }
    

    void main(){
        float alpha = 1.0;

        if( fragShape == 1 ) alpha = circle();
        if( fragShape == 2 ) alpha = diamond();
        if( fragShape == 3 ) alpha = poly( 3, 0.2, 1.0 );	// Triangle
        if( fragShape == 4 ) alpha = poly( 5, 0.0, 0.65 );  // Pentagram
        if( fragShape == 5 ) alpha = poly( 6, 0.0, 0.65 );	// Hexagon
        if( fragShape == 6 ) alpha = ring( 0.2 );
        if( fragShape == 7 ) alpha = ring( 0.7 );
        if( fragShape == 8 ) alpha = sdStar( 1.0, 3, 2.3 );
        if( fragShape == 9 ) alpha = sdStar( 1.0, 6, 2.5 );
        if( fragShape == 10 ) alpha = sdStar( 1.0, 4, 2.4 );
        if( fragShape == 11 ) alpha = sdStar( 1.0, 5, 2.8 );

        outColor = vec4( fragColor, alpha );
    }`});
}

//#endregion

export default ShapePointsMesh;