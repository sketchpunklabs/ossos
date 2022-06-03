//#region IMPORTS
import * as THREE       from 'three';
import { vec3, quat }   from 'gl-matrix';
import Vec3Util         from '../../../src/maths/Vec3Util';
import QuatUtil         from '../../../src/maths/QuatUtil';
//#endregion


export default class BoneDirMesh extends THREE.Mesh{
    constructor( arm, color='white', useDepthTest=true ){
        const shape                 = baseShape();
        const [ boneRot, boneInfo ] = instanceData( arm );
        const bCnt                  = arm.bones.length;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const mat = BoneDirMaterial( color, useDepthTest );
        mat.uniforms.boneRot.value = new Float32Array( 4 * bCnt );
        mat.uniforms.bonePos.value = new Float32Array( 3 * bCnt );
        mat.uniforms.boneScl.value = new Float32Array( 3 * bCnt );
        mat.side = THREE.DoubleSide;

        const geo = new THREE.InstancedBufferGeometry();
        geo.setIndex( new THREE.BufferAttribute( new Uint16Array( shape.indices ), 1 ) );
        geo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( shape.vertices ), 3 ) );
        geo.setAttribute( 'instRot',  new THREE.InstancedBufferAttribute( boneRot, 4 ) );
        geo.setAttribute( 'inst',     new THREE.InstancedBufferAttribute( boneInfo, 3 ) );
        geo.instanceCount       = arm.bones.length;
        geo._maxInstanceCount   = Infinity; //ThreeJS is buggy, found in a forum setting this can fix Instancing not rendering sometimes

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        super( geo, mat );
    }

    setBoneScale( meshScl = 0.1 ){
        this.material.uniforms.meshScl.value    = meshScl;
        return this;
    }

    updateFromPose( pose ){
        const rot = this.material.uniforms.boneRot.value;
        const pos = this.material.uniforms.bonePos.value;
        const scl = this.material.uniforms.boneScl.value;

        let b, i, ii;
        for( b of pose.bones ){
            i  = b.idx * 3;
            ii = b.idx * 4;

            QuatUtil.toBuf( b.world.rot, rot, ii );
            Vec3Util.toBuf( b.world.pos, pos, i );
            Vec3Util.toBuf( b.world.scl, scl, i );
        }

        return this;
    }
}


// #region MESH HELPERS
function baseShape(){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const x1 = 1  * 0.5, 
          y1 = 1 * 0.5, 
          z1 = 1,
          x0 = -x1, 
          y0 = -y1,  
          z0 = 0;

    // Starting bottom left corner, then working counter clockwise to create the front face.
    // Backface is the first face but in reverse (3,2,1,0)
    // keep each quad face built the same way to make index and uv easier to assign
    const vert = [
        x0, y1, z1, 	//0 Front
        x0, y0, z1, 	//1
        x1, y0, z1, 	//2
        x1, y1, z1, 	//3 

        x1, y1, z0, 	//4 Back
        x1, y0, z0, 	//5
        x0, y0, z0, 	//6
        x0, y1, z0, 	//7 

        x1, y1, z1, 	//3 Right
        x1, y0, z1, 	//2 
        x1, y0, z0, 	//5
        x1, y1, z0, 	//4

        x0, y0, z1, 	//1 Bottom
        x0, y0, z0, 	//6
        x1, y0, z0, 	//5
        x1, y0, z1, 	//2

        x0, y1, z0, 	//7 Left
        x0, y0, z0, 	//6
        x0, y0, z1, 	//1
        x0, y1, z1, 	//0

        x0, y1, z0, 	//7 Top
        x0, y1, z1, 	//0
        x1, y1, z1, 	//3
        x1, y1, z0, 	//4
    ];

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //Build the index of each quad [0,1,2, 2,3,0]
    const idx = [];
    for( let i=0; i < vert.length / 3; i+=2) idx.push( i, i+1, ( Math.floor( i / 4 ) * 4 ) + ( ( i + 2 ) % 4 ) );

    return {
        vertices: vert,
        indices: idx,
    };
}

function instanceData( arm ){
    let b, bc, cIdx, ii;
    const mapChild = new Map();
    const boneRot  = new Array( arm.bones.length );
    const boneLen  = new Array( arm.bones.length );
    const dir      = [0,0,0];
    const rot      = [0,0,0,1];
    
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Create map of each bone's first child
    for( b of arm.bones ){
        if( b.pidx != -1 && !mapChild.has( b.pidx ) ) mapChild.set( b.pidx, b.idx );
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Compute swing rotation for each bone based on the direction toward child
    for( b of arm.bones ){
        cIdx = mapChild.get( b.idx );
        
        // --------------------------------------
        // No Child Bone
        if( cIdx == undefined ){
            // Copy Parent Data for itself
            if( b.pidx != -1 ){
                boneRot[ b.idx ] = boneRot[ b.pidx ].slice( 0 );
                boneLen[ b.idx ] = boneLen[ b.pidx ];
            }
            continue;
        }

        // --------------------------------------
        // Get Bone's Direction & Length
        bc = arm.bones[ cIdx ];
        vec3.sub( dir, bc.world.pos, b.world.pos );
        boneLen[ b.idx ] = vec3.len( dir );

        // --------------------------------------
        // Swing Rotation
        vec3.normalize( dir, dir );
        quat.rotationTo( rot, [0,0,1], dir );
        boneRot[ b.idx ] = rot.slice( 0 );
    }
    
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Flatten Rotation Data
    const boneRotFlat = new Float32Array( boneRot.length * 4 );
    for( let i=0; i < boneRot.length; i++ ){
        ii = i * 4;
        boneRotFlat[ ii+0 ] = boneRot[ i ][ 0 ];
        boneRotFlat[ ii+1 ] = boneRot[ i ][ 1 ];
        boneRotFlat[ ii+2 ] = boneRot[ i ][ 2 ];
        boneRotFlat[ ii+3 ] = boneRot[ i ][ 3 ];
    }

    const boneInfoFlat = new Float32Array( boneLen.length * 3 );
    for( let i=0; i < boneLen.length; i++ ){
        ii   = i * 3;
        cIdx = mapChild.get( i );
        boneInfoFlat[ ii+0 ] = i;
        boneInfoFlat[ ii+1 ] = boneLen[ i ];
        boneInfoFlat[ ii+2 ] = ( cIdx !== undefined )? cIdx : -1;
    }

    return [ boneRotFlat, boneInfoFlat ];
}
// #endregion


function BoneDirMaterial( color='white', useDepthTest=true ){
    let mat = new THREE.RawShaderMaterial({
        //side        : THREE.DoubleSide,
        depthTest   : useDepthTest,
        uniforms    : {
            color   : { type :'vec3', value:new THREE.Color( color ) },
            meshScl : { value: 0.1 },
            boneRot : { value: null },
            bonePos : { value: null },
            boneScl : { value: null },
        },

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        vertexShader : `#version 300 es
        in vec3 position;   // Vertex Position
        in vec3 inst;       // Instanced Data : Bone Index, Bone Length, 1st Child Bone Index -1 if none
        in vec4 instRot;    

        const int MAXBONE = 100;
        uniform vec4 boneRot[ MAXBONE ];
        uniform vec3 bonePos[ MAXBONE ];
        uniform vec3 boneScl[ MAXBONE ];

        uniform float meshScl;
        
        uniform mat4 modelMatrix;       // Matrices should be filled in by THREE.JS Automatically.
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;

        out vec3 frag_wpos;             // Fragment World Space Position

        ////////////////////////////////////////////////////////////////////////

        vec3 transformSkin( int i, vec3 v ){
            vec4 q  = boneRot[ i ];
            //v       *= boneScl[ i ];
            v       += 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
            v       += bonePos[ i ];
            return v;
        }

        vec3 transformQuat( vec3 v, vec4 q ){
            return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
        }

        ////////////////////////////////////////////////////////////////////////

        void main(){
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            int bIdx        = int( inst.x ); // Get Bone Index this instance is for
            vec3 pos        = position;
            
            // Scale Bone Mesh First
            pos.xy         *= meshScl;        
            
            // Set Bone Length - Update the forward direction
            // if( inst.z >= 0.0 ){
            //     int cIdx = int( inst.z );
            //     pos.z   *= length( bonePos[cIdx] - bonePos[bIdx] );
            //}else{ 
                pos.z   *= inst.y;
            //}

            // Apply Initial Direction Rotation
            pos    = transformQuat( pos, instRot );

            // Apply Skinning Transform
            pos    = transformSkin( bIdx, pos );           

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            vec4 wpos       = modelMatrix * vec4( pos, 1.0 );
            frag_wpos       = wpos.xyz;
            gl_Position     = projectionMatrix * viewMatrix * wpos;
        }`,
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        fragmentShader	: `#version 300 es
        precision mediump float;
        
        ////////////////////////////////////////////////////////////////////////
        
        out     vec4 out_color;
        in      vec3 frag_wpos;

        uniform vec3 color;

        ////////////////////////////////////////////////////////////////////////
        
        #define LITCNT 2
        const vec3[] light_pos = vec3[](
            vec3( 0.0, 2.5, 1.0 ),
            vec3( -1.0, 0.0, 1.0 )
        );

        float computePointLights( vec3[LITCNT] lights, vec3 norm ){
            vec3 light_vec;
            vec3 light_dir;

            float dist;
            float attenuation;
            float diffuse     = 0.0;
            float constant    = 0.5;
            float linear      = 0.5;
            float quadratic   = 0.5;
            
            for( int i=0; i < LITCNT; i++ ){
                light_vec       = lights[i].xyz - frag_wpos;
                light_dir       = normalize( light_vec );
                dist            = length( light_vec );
                attenuation     = 1.0 / ( constant + linear * dist + quadratic * (dist * dist) );
                diffuse        += max( dot( norm, light_dir ), 0.0 ) * attenuation;
            }

            return diffuse;
        }

        void main(){
            vec3 norm     = normalize( cross( dFdx(frag_wpos), dFdy(frag_wpos) ) ); // Low Poly Normals
            float diffuse = max( 0.15, computePointLights( light_pos, norm ) );
            out_color     = vec4( color * diffuse, 1.0 );
            //out_color     = vec4( 1.0, 0.0, 0.0, 1.0 );
        }`,
    });

    // If not using WebGL2.0 and Want to use dfdx or fwidth, Need to load extension
    mat.extensions = { derivatives : true };
    return mat;
}