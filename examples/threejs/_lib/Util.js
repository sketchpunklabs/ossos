import * as THREE from 'three';

class Util{
    static loadTexture( url ){
        return new Promise( (resolve, reject) => {
            const loader = new THREE.TextureLoader()
                .load( 
                    url, 
                    tex => resolve( tex ), 
                    undefined, 
                    err => reject( err )
            );
        });
    }
}

export default Util;