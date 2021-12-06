//#region IMPORTS
import type Accessor    from '../parsers/gltf2/Accessor'
import type { Track }   from '../parsers/gltf2/Animation';
import type { ITrack }  from './tracks/types';

import { ELerp }        from './tracks/types';
import Vec3Track        from './tracks/Vec3Track';
import QuatTrack        from './tracks/QuatTrack';
//#endregion

class Clip{
    //#region MAIN
    name       : string                 = '';   // Name of the Clip
    frameCount : number                 = 0;    // How many frames
    duration   : number                 = 0;    // How Long is the Animation
    tracks     : Array<ITrack>          = [];   // Tracks : Each track is a single Transform Property( Rot|Trans|Scale ) per bone.
    timeStamps : Array<Float32Array>    = [];   // Clip can have multiple timeStamps that is shared by the Tracks
    //#endregion

    //#region STATIC METHODS
    
    /** Translate GLTF Animation to Armature Animation Clip */
    static fromGLTF2( anim: any ) : Clip{
        const clip  = new Clip();
        clip.name   = anim.name;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let i:Accessor;
        for( i of anim.timestamps ){
            if( i.data )                                        clip.timeStamps.push( new Float32Array( i.data ) );  // Clone TimeStamp Data so its not bound to GLTF's BIN
            if( i.elementCnt > clip.frameCount )                clip.frameCount = i.elementCnt;                 // Find out the max frame count
            if( i.boundMax && i.boundMax[ 0 ] > clip.duration ) clip.duration   = i.boundMax[ 0 ];              // Find out the full animation time
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let t       : Track;    // GLTF Track
        let track   : ITrack;   // Animator Track
        for( t of anim.tracks ){
            //-------------------------------------------
            // Filter out all translation tracks unless its for the root bone.
            // TODO: Future add the ability to list out bone names or indexes as a filter
            // The reason being that if there is a root bone & hip bone, might want to have those
            // two include position tracks.
            if( t.transform == 1 && t.jointIndex != 0 ) continue;

            switch( t.transform ){
                case 0 : track = new QuatTrack(); break; // Rot
                case 1 : track = new Vec3Track(); break; // Pos
                case 2 : continue; break;                // Scl, Filter this out

                default :
                    console.error( 'unknown animation track transform', t.transform );
                    continue;
                break;
            }

            //-------------------------------------------
            switch( t.interpolation ){
                case 0 : track.setInterpolation( ELerp.Step );      break;
                case 1 : track.setInterpolation( ELerp.Linear );    break;
                case 2 : track.setInterpolation( ELerp.Cubic );     break;
            }

            //-------------------------------------------
            if( t.keyframes.data ) track.values = new Float32Array( t.keyframes.data ); // Clone Data so its not bound to GLTF's BIN
            else                   console.error( 'Track has no keyframe data' );

            track.timeStampIndex    = t.timeStampIndex;
            track.boneIndex         = t.jointIndex;

            //-------------------------------------------
            clip.tracks.push( track );
        }

        return clip;
    }
    
    //#endregion
}

export default Clip;