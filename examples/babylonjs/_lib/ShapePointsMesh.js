import * as BABYLON from 'babylonjs';

function glColor( hex, out = null ){
    const NORMALIZE_RGB = 1 / 255;
    out = out || [0,0,0];

    out[0] = ( hex >> 16 & 255 ) * NORMALIZE_RGB;
    out[1] = ( hex >> 8 & 255 )  * NORMALIZE_RGB;
    out[2] = ( hex & 255 )       * NORMALIZE_RGB;

    return out;
}

export default class ShapePointsMesh extends BABYLON.Mesh{
    _defaultShape   = 1;
    _defaultSize    = 6;
    _defaultColor   = 0x00ff00;
    _cnt            = 0;
    _verts          = [];
    _color          = [];
    _config         = [];
    _dirty          = false;

    constructor( app, initSize=20 ){
        super( 'ShapePointsMesh', app.scene );
        this.material = ShapePointsMaterial( app );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create temp Buffers to set the Vertex Data
        // This will be the total possible points, no dynamic sizing
        const v3 = new Array( 3 * initSize ).fill( 0 );
        const v2 = new Array( 2 * initSize ).fill( 0 );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const data      = new BABYLON.VertexData();
        data.positions  = v3;
        data.applyToMesh( this );
        this.markVerticesDataAsUpdatable( BABYLON.VertexBuffer.PositionKind, true );

        // Dont get why SetVerticesData doesn't work with position, it works on playground.
        //this.setVerticesData( BABYLON.VertexBuffer.PositionKind, v3, true, 3 );
        this.setVerticesData( 'color', v3, true, 3 );
        this.setVerticesData( 'config', v2, true, 2 );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.onBeforeDraw = ()=>{
            if( this._dirty ){
                this._updateGeometry();
                this._dirty = false;
            }
        };
    }

    reset(){
		this._cnt           = 0;
		this._verts.length  = 0;
        this._color.length  = 0;
        this._config.length = 0;
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

    _updateGeometry(){
        this.updateVerticesData( BABYLON.VertexBuffer.PositionKind, new Float32Array(this._verts) );
        this.updateVerticesData( 'color', this._color );
        this.updateVerticesData( 'config', this._config  );
        this._dirty = false;
    }    
}

//#region MATERIAL
function ShapePointsMaterial( app ){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Shader
    const mat = new BABYLON.ShaderMaterial( 'ShapePointsMaterial', app.scene, 
        { vertexSource: VERT_SRC, fragmentSource: FRAG_SRC },
        { attributes        : [ 'position', 'color', 'config' ],
          uniforms          : [ 'projection', 'worldView', 'u_scale' ],
          needAlphaBlending : true,
        },
    );

    mat.setFloat( 'u_scale', 20.0 );

    // Meshes from GTLF have triangles CCW winding, but need to
    // set to CW on the shader to render correctly. A babylonJS thing?
    mat.sideOrientation = BABYLON.Material.ClockWiseSideOrientation;

    mat.pointsCloud     = true;
    //mat.backFaceCulling = false;
    return mat;
}


const VERT_SRC = `
precision highp float;
in	vec3	position;
in	vec3	color;
in	vec2	config;

uniform float u_scale;

// Babylon Matrices
uniform mat4 projection;
uniform mat4 worldView;

// Fragment Output
out 	    vec3	fragColor;
flat out    int     fragShape;

////////////////////////////////////////////////////////////////////////

void main(void){
    vec4 wPos 	        = worldView * vec4( position, 1.0 );
    fragColor			= color;
    fragShape			= int( config.y );

    gl_Position			= projection * wPos;
    gl_PointSize        = config.x * ( u_scale / wPos.z );
}`;


// Babylon Adds 
// -- #version 300 es
// precision highp float;
// out vec3 glFragColor;
const FRAG_SRC = `
////////////////////////////////////////////////////////////////////////

#define PI	3.14159265359
#define PI2	6.28318530718

in   vec3       fragColor;
flat in int     fragShape;

////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////

void main(void) {
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

    glFragColor = vec4( fragColor, alpha );
}`;
//#endregion
