import * as THREE           from 'three';

class DynLineMesh extends THREE.LineSegments{
    _defaultColor   = 0x00ff00;
    _cnt            = 0;
    _verts          = [];
    _color          = [];
    _config         = [];
    _dirty          = false;

    constructor( initSize = 20 ){
        super( 
            _newDynLineMeshGeometry( 
                new Float32Array( initSize * 2 * 3 ), // Two Points for Each Line
                new Float32Array( initSize * 2 * 3 ),
                new Float32Array( initSize * 2 * 1 ),
                false
            ),
            newDynLineMeshMaterial() //new THREE.PointsMaterial( { color: 0xffffff, size:8, sizeAttenuation:false } )
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

    add( p0, p1, color0=this._defaultColor, color1=null, isDash=false ){
        this._verts.push( p0[0], p0[1], p0[2], p1[0], p1[1], p1[2] );
        this._color.push( ...glColor( color0 ), ...glColor( (color1 != null) ? color1:color0 ) );

        if( isDash ){
            const len = Math.sqrt(
                (p1[0] - p0[0]) ** 2 +
                (p1[1] - p0[1]) ** 2 +
                (p1[2] - p0[2]) ** 2
            );
            this._config.push( 0, len );
        }else{
            this._config.push( 0, 0 );
        }

        this._cnt++;
        this._dirty = true;
        return this;
    }

    box( v0, v1, col=this._defaultColor, is_dash=false ){
        let x1 = v0[0], y1 = v0[1], z1 = v0[2], 
            x2 = v1[0], y2 = v1[1], z2 = v1[2];

        this.add( [x1,y1,z1], [x1,y1,z2], col, null, is_dash ); // Bottom
        this.add( [x1,y1,z2], [x2,y1,z2], col, null, is_dash );
        this.add( [x2,y1,z2], [x2,y1,z1], col, null, is_dash );
        this.add( [x2,y1,z1], [x1,y1,z1], col, null, is_dash );
        this.add( [x1,y2,z1], [x1,y2,z2], col, null, is_dash ); // Top
        this.add( [x1,y2,z2], [x2,y2,z2], col, null, is_dash );
        this.add( [x2,y2,z2], [x2,y2,z1], col, null, is_dash );
        this.add( [x2,y2,z1], [x1,y2,z1], col, null, is_dash );
        this.add( [x1,y1,z1], [x1,y2,z1], col, null, is_dash ); // Sides
        this.add( [x1,y1,z2], [x1,y2,z2], col, null, is_dash );
        this.add( [x2,y1,z2], [x2,y2,z2], col, null, is_dash );
        this.add( [x2,y1,z1], [x2,y2,z1], col, null, is_dash );
        return this;
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
            this.geometry   = _newDynLineMeshGeometry( this._verts, this._color, this._config );
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
        bConfig.count       = this._config.length / 1;
        bConfig.needsUpdate = true;

        geo.setDrawRange( 0, bVerts.count );
        geo.computeBoundingBox();
        geo.computeBoundingSphere();
        
        this._dirty = false;
    }
}

//#region SUPPORT 
function _newDynLineMeshGeometry( aVerts, aColor, aConfig, doCompute=true ){
    //if( !( aVerts instanceof Float32Array) ) aVerts = new Float32Array( aVerts );
    //if( !( aColor instanceof Float32Array) ) aColor = new Float32Array( aColor );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const bVerts    = new THREE.Float32BufferAttribute( aVerts, 3 );
    const bColor    = new THREE.Float32BufferAttribute( aColor, 3 );
    const bConfig   = new THREE.Float32BufferAttribute( aConfig, 1 );
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

function newDynLineMeshMaterial(){
    return new THREE.RawShaderMaterial({
    depthTest       : false,
    transparent 	: true, 
    uniforms        : { 
        dashSeg : { value : 1 / 0.07 },
        dashDiv : { value : 0.4 },
    },
    vertexShader    : `#version 300 es
    in	vec3    position;
    in	vec3    color;
    in	float   config;
    
    uniform     mat4    modelViewMatrix;
    uniform     mat4    projectionMatrix;
    uniform     float   u_scale;

    out 	    vec3    fragColor;
    out         float   fragLen;
    
    void main(){
        vec4 wPos 	        = modelViewMatrix * vec4( position, 1.0 );
        
        fragColor			= color;
        fragLen			    = config;

        gl_Position			= projectionMatrix * wPos;
    }`,
    fragmentShader  : `#version 300 es
    precision mediump float;

    uniform float dashSeg;
    uniform float dashDiv;

    in  vec3    fragColor;
    in  float   fragLen;
    out vec4    outColor;

    void main(){
        float alpha = 1.0;
        if( fragLen > 0.0 ) alpha = step( dashDiv, fract( fragLen * dashSeg ) );
        outColor = vec4( fragColor, alpha );
    }`});
}

//#endregion

export default DynLineMesh;