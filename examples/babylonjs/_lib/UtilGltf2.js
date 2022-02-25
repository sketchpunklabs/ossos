import * as BABYLON from 'babylonjs';
import Gltf2        from '../../../src/parsers/gltf2/index';

class UtilGltf2{

    static loadMesh( gltf, name=null, mat=null ){
        const o = gltf.getMesh( name );
        let prim;
    
        if( o.primitives.length == 1 ){
            prim = o.primitives[ 0 ];
            return this.primitiveMesh( o.name, prim, mat );
        }else{
            console.error( 'Multi-Primitive GLTF Mesh conversion not implemented.' );
        }
    }

    static primitiveMesh( name, prim, mat=null ){
        const mesh = new BABYLON.Mesh( name );
        const data = new BABYLON.VertexData();
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        data.positions = prim.position.data;
        if( prim.indices )      data.indices    = prim.indices.data;
        if( prim.normal )       data.normals    = prim.normal.data;
        if( prim.texcoord_0 )   data.uvs        = prim.texcoord_0.data;

        if( prim.joints_0 && prim.weights_0 ){
            // Why Matrices? What if skinning with dual quaternions? I'm Triggered :)
            data.matricesIndices = prim.joints_0.data;
            data.matricesWeights = prim.weights_0.data;
        }
    
        if( prim.indices && !prim.normal ){
            const norm = [];
            BABYLON.VertexData.ComputeNormals(
                prim.position.data, 
                prim.indices.data, 
                norm
            );
            data.normals = norm;
        }
    
        data.applyToMesh( mesh );
    
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( mat ) mesh.material = mat;
        return mesh;
    }

}

export { UtilGltf2, Gltf2 };