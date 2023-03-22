import * as THREE       from 'three';
import { Vec3, Quat }   from '../../../src/index.ts';

export default class SpringMesh extends THREE.Mesh{
    constructor( ringRadius=0.1, radius=0.5, steps=16, span=0.6, iter=2 ){
        const geo   = springGeometry( ringRadius, radius, steps, span, iter );
        const bGeo  = createBufferGeometry( geo.vertices, geo.indices, geo.centroid );
        super( bGeo, deformSpringMaterial() );

        this.springLength = span * iter;
    }

    setSpringScale( n ){
        this.material.springScale = n;
        return this;
    }
}

// Create Geometry of a Spring
// Radius = How much distance from origin to spiral
// Steps = How many samples per PI_2 to spiral on 1 iteration
// Span  = How much vertical distance to cover in 1 iteration
// Iter  = How many spiral iterations to do.
function springGeometry( ringRadius=0.1, radius=0.5, steps=16, span=0.6, iter=2 ){
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Built some points
    const spiral = spiralPoints( radius, steps, span, iter );
    const ring   = ringPoints( ringRadius );

    // for( let v of spiral ) Debug.pnt.add( v, 0x00ffff, 1 );
    // for( let v of ring )   Debug.pnt.add( v, 0x00ff00, 1 );
    
    const vertices = [];
    const centroid = [];
    const rot = new Quat();
    const v   = new Vec3();
    const z   = new Vec3();
    const x   = new Vec3();
    const y   = new Vec3();

    const fn = ( a, b )=>{
        z.fromSub( b, a );           // Direction to next point
        x.fromSub( a, [0,a[1],0] );  // Right Dir
        y.fromCross( x, z );         // Up Dir
        z.fromCross( y, x );         // Realign Forward

        // Debug.ln.add( a, new Vec3(z).add( a ), 0x00ff00 );
        // Debug.ln.add( a, new Vec3(x).add( a ), 0x00ffff );
        // Debug.ln.add( a, new Vec3(y).add( a ), 0xffff00 );

        rot.fromLookDir( z, Vec3.UP );

        for( let p of ring ){
            v.fromQuat( rot, p ).add( a );
            // Debug.pnt.add( v, 0x00ff00, 0.8 );
            vertices.push( ...v );
            centroid.push( ...a );
        }
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Create rings for each spiral point
    const li = spiral.length-1;
    for( let i=0; i < li; i++ ){
        fn( spiral[ i ], spiral[ i+1 ] );
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Create Final Point
    // Compute next point by using the last known direction
    y   .fromSub( spiral[ li ], spiral[ li-1 ] )
        .add( spiral[ li ] );
    fn( spiral[ li ], y );

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const indices = gridIndicesColLoop( 6, (steps-1) * iter, true, false );
    
    // TODO - End Cap Indices

    return {
        vertices, 
        indices,
        centroid,
    };
}

function createBufferGeometry( vertices, indicies, centroid ){
    const bGeo  = new THREE.BufferGeometry();
    bGeo.setIndex( indicies );
    bGeo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( vertices ), 3 ) );
    bGeo.setAttribute( 'vertCentroid', new THREE.BufferAttribute( new Float32Array( centroid ), 3 ) );
    return bGeo;
}

// Creates indices based on a grid pattern, Looping across columns
function gridIndicesColLoop( cellColCnt, cellRowCnt, doLoop=true, revQuad=false ){
    const cLoop = ( doLoop )? cellColCnt : cellColCnt - 1;
    const out   = [];
    let rr;
    let cc;
    let cm;
    let iRow0;
    let iRow1;
    let a, b, c, d;

    for( rr=0; rr < cellRowCnt; rr++ ){
        iRow0 = cellColCnt * rr;            // Starting index of Top Row
        iRow1 = cellColCnt * ( rr + 1 );    // Starting index of Bottom Roorw

        for( cc=0; cc < cLoop; cc++ ){
            cm = ( cc + 1 ) % cellColCnt;   // Loop indices, ex 0,1,2,3,0
            a  = iRow0 + cc;                // 4 Points of a quad
            b  = iRow1 + cc;
            c  = iRow1 + cm;
            d  = iRow0 + cm;

            // Turn Quad into two triangles
            if( !revQuad ) out.push( a,b,c, c,d,a ); // Counter ClockWise
            else 		   out.push( a,d,c, c,b,a ); // ClockWise
        }
    }

    return out;
}

// Create spiral points
function spiralPoints( radius=0.5, steps=6, span=0.4, iter=2 ){
    const PI2  = Math.PI * 2;
    const pnts = [];

    let i;
    let t;
    let rad;
    let spanOffset;

    steps -= 1;
    // How many rings to generate
    for( let j=0; j < iter; j++ ){
        spanOffset = j * span;

        // Create a ring where each point's height shifts up
        // After the first ring, dont start loop at zero
        for( i=(!j)?0:1; i <= steps; i++ ){
            t   = i / steps;
            rad = PI2 * t;
            pnts.push( [
                radius * Math.cos( rad ),
                spanOffset + span * t,
                radius * Math.sin( rad ),
            ] );
        }
    }

    return pnts;
}

// Create points of a circle
function ringPoints( radius=0.5, steps=6, rot=-1 ){
    const PI2  = Math.PI * 2;
    const pnts = [];
    let   t;
    let   rad;

    for( let i=0; i < steps; i++ ){
        t   = i / steps;
        rad = PI2 * t * rot;
        pnts.push( [
            radius * Math.cos( rad ),
            radius * Math.sin( rad ),
            0,
        ] );
    }

    return pnts;
}

// Shader that deforms the spring by using the centroid point of each ring
function deformSpringMaterial(){
    // https://github.com/mrdoob/three.js/tree/master/src/renderers/shaders/ShaderChunk
    const mat = new THREE.MeshPhongMaterial( { color:0x009999, flatShading:false } );
    
    let sh;
    let scl = 1;
    mat.onBeforeCompile = ( shader )=>{
        sh = shader;
        shader.uniforms.springScale = { value: [1,scl,1] };
        
        shader.vertexShader = shader.vertexShader.replace( 
            '#include <common>', 
            '#include <common> \n attribute vec3 vertCentroid; uniform vec3 springScale; ' );

        shader.vertexShader = shader.vertexShader.replace( 
            '#include <beginnormal_vertex>', 
            '#include <beginnormal_vertex> \n objectNormal = normalize( position - vertCentroid ); ' );

        shader.vertexShader = shader.vertexShader.replace( '#include <begin_vertex>', `
            vec3 transformed = vertCentroid * springScale + ( position - vertCentroid );
        `);
    };

    Object.defineProperty( mat, 'springScale', {
        // get(){ return sh?.uniforms.springScale.value[1]; },
        // set( v ){ if( sh ) sh.uniforms.springScale.value[1] = v; },
        get(){ return scl; },
        set( v ){
            scl = v;
            if( sh ) sh.uniforms.springScale.value[1] = v; 
        },
    });

    return mat;
}