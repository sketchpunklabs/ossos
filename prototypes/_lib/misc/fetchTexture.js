import * as THREE from 'three';

export default function fetchTexture( url, flipY=true, isRepeat=false  ){
    return new Promise( async ( resolve, reject )=>{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get response
        const res = await fetch( url );
        if( !res.ok ){ reject( res.status ); return; }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Download Binary
        const blob = await res.blob();
        if( !blob ){ reject( 'Unable to download image blob' ); return; }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Convert to image
        // TODO: look into window.createImageBitmap(blob);
        const obj  = URL.createObjectURL( blob );
        const img  = new Image();
    
        img.crossOrigin	 = 'anonymous';
        img.onload       = ()=>{ URL.revokeObjectURL( obj ); resolve( mkTexture( img, flipY, isRepeat ) ); };
        img.onerror      = ()=>{ URL.revokeObjectURL( obj ); reject( 'Error loading object url into image' ); };
        img.src          = obj;
    });
}

function mkTexture( img, flipY, isRepeat ){
    const tex       = new THREE.Texture( img );
    tex.wrapT       = tex.wrapS = ( isRepeat )? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    tex.flipY       = flipY;
    tex.needsUpdate = true; // Needed, else it may render as black
    return tex;
}