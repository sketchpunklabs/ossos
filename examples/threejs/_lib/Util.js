import * as THREE from 'three';

class Util{
    static loadTexture( url, flipY=false ){
        return new Promise( (resolve, reject) => {
            const loader = new THREE.TextureLoader()
                .load( 
                    url, 
                    tex =>{ 
                        tex.flipY = flipY;
                        tex.wrapT = THREE.RepeatWrapping;
                        tex.wrapS = THREE.RepeatWrapping;
                        resolve( tex );
                    },  
                    undefined, 
                    err => reject( err )
            );
        });
    }
}

export default Util;