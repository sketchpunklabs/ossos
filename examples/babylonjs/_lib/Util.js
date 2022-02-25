import * as BABYLON from 'babylonjs';

export default class Util{

    static matColor( hex='#00ffff', name='colorMat' ){
        const mat  =  new BABYLON.StandardMaterial( name );
        mat.diffuseColor      = BABYLON.Color3.FromHexString( hex );
        mat.sideOrientation   = BABYLON.Material.ClockWiseSideOrientation;
        //mat.backFaceCulling   = true;
        return mat;
    }

    static mesh( name, verts, idx=null, normal=null, uv=null, mat=null ){
        const mesh = new BABYLON.Mesh( name );
        const data = new BABYLON.VertexData();
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        data.positions = verts;
        if( idx )       data.indices    = idx;
        if( normal )    data.normals    = normal;
        if( uv )        data.uvs        = uv;    
        data.applyToMesh( mesh );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( mat ) mesh.material = mat;
        return mesh;
    }

}