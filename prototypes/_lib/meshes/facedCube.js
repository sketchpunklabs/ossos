import { BoxGeometry, MeshBasicMaterial, Mesh } from 'three';

export default function facedCube( pos=null, scl=null ){
    const geo = new BoxGeometry( 1, 1, 1 );
    const mat = [
        new MeshBasicMaterial( { color: 0x00ff00 } ), // Left
        new MeshBasicMaterial( { color: 0x777777 } ), // Right
        new MeshBasicMaterial( { color: 0x0000ff } ), // Top
        new MeshBasicMaterial( { color: 0x222222 } ), // Bottom
        new MeshBasicMaterial( { color: 0xff0000 } ), // Forward
        new MeshBasicMaterial( { color: 0xffffff } ), // Back
    ];

    const mesh = new Mesh( geo, mat );
    
    if( pos )           mesh.position.fromArray( pos );
    if( scl != null )   mesh.scale.set( scl, scl, scl );

    return mesh; 
}