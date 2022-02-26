import * as BABYLON from 'babylonjs';

function glColor( hex, out = null ){
    const NORMALIZE_RGB = 1 / 255;
    out = out || [0,0,0];

    out[0] = ( hex >> 16 & 255 ) * NORMALIZE_RGB;
    out[1] = ( hex >> 8 & 255 )  * NORMALIZE_RGB;
    out[2] = ( hex & 255 )       * NORMALIZE_RGB;

    return out;
}

export default class DynLineMesh extends BABYLON.Mesh{
    _defaultColor   = 0x00ff00;
    _cnt            = 0;
    _verts          = [];
    _color          = [];
    _config         = [];
    _dirty          = false;

    constructor( app, initSize=20 ){
        super( 'DynLineMesh', app.scene );
        this.material = DynLineMaterial( app );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create temp Buffers to set the Vertex Data
        // This will be the total possible points, no dynamic sizing
        const v3 = new Array( 3 * initSize * 2 ).fill( 0 );
        const v1 = new Array( initSize * 2 ).fill( 0 );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const data      = new BABYLON.VertexData();
        data.positions  = v3;
        data.applyToMesh( this );
        this.markVerticesDataAsUpdatable( BABYLON.VertexBuffer.PositionKind, true );

        // Dont get why SetVerticesData doesn't work with position, it works on playground.
        // this.setVerticesData( BABYLON.VertexBuffer.PositionKind, v3, true, 3 );
        this.setVerticesData( 'color', v3, true, 3 );
        this.setVerticesData( 'config', v1, true, 1 );

        this.isUnIndexed = true; // Must set this or renderer will try to use drawElements instead of drawArray

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

    _updateGeometry(){
        this.updateVerticesData( BABYLON.VertexBuffer.PositionKind, new Float32Array(this._verts) );
        this.updateVerticesData( 'color', this._color );
        this.updateVerticesData( 'config', this._config  );
        this._dirty = false;
    }    
}

//#region MATERIAL
function DynLineMaterial( app ){
    const mat = new BABYLON.ShaderMaterial( 'DynLineMaterial', app.scene, 
        { vertexSource: VERT_SRC, fragmentSource: FRAG_SRC },
        { attributes        : [ 'position', 'color', 'config' ],
          uniforms          : [ 'projection', 'worldView', 'dashSeg', 'dashDiv' ],
          needAlphaBlending : true,
        },
    );

    mat.setFloat( 'dashSeg', 1 / 0.07);
    mat.setFloat( 'dashDiv', 0.4);

    mat.fillMode = BABYLON.Material.LineListDrawMode;
    return mat;
}


const VERT_SRC = `
precision highp float;
in	vec3	position;
in	vec3	color;
in	float   config;

// Babylon Matrices
uniform mat4 projection;
uniform mat4 worldView;

// Fragment Output
out 	    vec3    fragColor;
out         float   fragLen;

////////////////////////////////////////////////////////////////////////

void main(void){
    vec4 wPos 	        = worldView * vec4( position, 1.0 );
        
    fragColor			= color;
    fragLen			    = config;

    gl_Position			= projection * wPos;
    //gl_PointSize = 10.0;
}`;


// Babylon Adds 
// -- #version 300 es
// precision highp float;
// out vec3 glFragColor;
const FRAG_SRC = `
////////////////////////////////////////////////////////////////////////

#define PI	3.14159265359
#define PI2	6.28318530718

in  vec3    fragColor;
in  float   fragLen;

uniform float dashSeg;
uniform float dashDiv;

////////////////////////////////////////////////////////////////////////

void main(void) {
    float alpha = 1.0;
    if( fragLen > 0.0 ) alpha = step( dashDiv, fract( fragLen * dashSeg ) );
    glFragColor = vec4( fragColor, alpha );
}`;
//#endregion
