/* eslint-disable no-case-declarations */

import { Skin, SkinJoint }  from './Skin';
import { Animation, Track } from './Animation';
import { quat, vec3 }       from 'gl-matrix';

export default class Bvh{
    // #region MAIN
    txt        : string;
    ignoreRoot = false;
    constructor( txt: string ){
        this.txt = txt;
    }
    // #endregion

    // #region SKIN
    getSkin(){
        // Test if there is a root bone to access.
        const startIdx = this.txt.indexOf( 'ROOT' );
        if( startIdx == -1 ) return null;

        const endIdx   = this.txt.indexOf( '\n', startIdx );
        if( endIdx == -1 || endIdx < startIdx ) return null;

        // Create root joint
        const joint = new SkinJoint();
        joint.index = 0;
        joint.name  = this.txt.substring( startIdx + 4, endIdx ).trim();

        // Create out joint collection
        const skin = new Skin();
        skin.joints.push( joint );
        
        // Find all children joints
        this.recursiveSkin( skin, joint, endIdx+1 );

        // Want to remove the root bone, will need to
        // also fix up all the indices
        if( this.ignoreRoot ){
            skin.joints.shift();
            let j: SkinJoint;
            for( j of skin.joints ){
                j.index       -= 1;
                j.parentIndex -= 1;
            }
        }

        return skin;
    }

    recursiveSkin( skin: Skin, parent: SkinJoint, initIdx:number ){
        const MAX = this.txt.length;
        let aIdx  = initIdx;
        let bIdx  = this.txt.indexOf( '\n', aIdx );
        let line  : string;
        let split : Array<string>;
        
        while( aIdx > -1 && bIdx > -1  && bIdx > aIdx && aIdx < MAX ){
            line    = this.txt.substring( aIdx, bIdx ).trim();
            split   = line.split( ' ' );
            
            switch( split[ 0 ] ){
                // ---------------------------------------
                // Joint Position
                case 'OFFSET':
                    if( split.length >= 4 && !parent.position ){
                        parent.position = [
                            parseFloat( split[ 1 ] ),
                            parseFloat( split[ 2 ] ),
                            parseFloat( split[ 3 ] ),
                        ];
                    }
                break;

                // ---------------------------------------
                // Child Joint, pause to process that
                case 'JOINT':
                    const joint = new SkinJoint();
                    joint.name        = split[ 1 ];
                    joint.index       = skin.joints.length;
                    joint.parentIndex = parent.index;

                    skin.joints.push( joint );
                    bIdx = this.recursiveSkin( skin, joint, bIdx+1 );
                break;
                
                // ---------------------------------------
                // Done processing bone
                case '}':
                case 'MOTION':
                    return bIdx;

                case 'End': // End has an extra { } area we need to skip over to get the joints end position
                    bIdx = this.txt.indexOf( '}', bIdx );
                    return this.txt.indexOf( '}', bIdx+1 ) + 1;
            }

            aIdx = bIdx + 1;
            bIdx = this.txt.indexOf( '\n', aIdx );
        }

        return bIdx;
    }
    // #endregion

    // #region ANIMATION
    getAnimation(){
        const spFrames   = this.splitFrom( 'Frames' );
        const spTime     = this.splitFrom( 'Frame Time' );
        const spChan     = this.splitFrom( 'CHANNELS' ).splice( 2 );

        const chanCount  = spChan.length;
        const chanStop   = chanCount - 1;
        const frameCount = parseInt( spFrames[1] );
        const frameTime  = parseFloat( spTime[2] );
        
        const rot : quat = [0,0,0,1];
        const pos : vec3 = [0,0,0];
        
        let anim       !: Animation;
        let aIdx        = 0;
        let bIdx        = 0;
        let jointIdx    = 0;
        let chIdx       = 0;
        let j           : number;
        let val         : number;
        let split       : Array<string>;

        aIdx = this.txt.indexOf( 'Frame Time:' );
        bIdx = this.txt.indexOf( '\n', aIdx+1 );

        for( let i=0; i < frameCount; i++ ){
            aIdx  = bIdx+1;
            bIdx  = this.txt.indexOf( '\n', aIdx+1 );
            split = this.splitLine( aIdx, bIdx );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Setup Animation on first frame to compute total joints
            if( i === 0 ){
                const jointCount = split.length / chanCount;
                anim = this._prepAnimation( frameCount, frameTime, jointCount );
            }
            
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Break number list to Position & Rotation for each joint
            for( j=0; j < split.length; j++ ){

                // -----------------------------------------
                chIdx    = j % chanCount;
                jointIdx = Math.floor( j / chanCount );
                val      = parseFloat( split[ j ] );
                //console.log( 'bone', boneIdx, 'Ch', chIdx, spChan[ chIdx ] );
                
                // -----------------------------------------
                // Reset Transform on first channel
                if( chIdx == 0 ){
                    quat.identity( rot ); 
                    vec3.set( pos, 0, 0, 0 );
                }

                // -----------------------------------------
                // Where does the data go?
                switch( spChan[ chIdx ] ){
                    case 'Xposition': pos[ 0 ] = val; break;
                    case 'Yposition': pos[ 1 ] = val; break;
                    case 'Zposition': pos[ 2 ] = val; break;
                    case 'Xrotation': quat.rotateX( rot, rot, val * Math.PI / 180  ); break;
                    case 'Yrotation': quat.rotateY( rot, rot, val * Math.PI / 180  ); break;
                    case 'Zrotation': quat.rotateZ( rot, rot, val * Math.PI / 180  ); break;
                }

                // -----------------------------------------
                // The end of one joints worth of data, save it.
                if( chIdx === chanStop ){
                    //console.log( 'DONE', 'bone', jointIdx, i, pos, rot );
                    anim.joints[ jointIdx ].pos.setFrameData( i, pos );
                    anim.joints[ jointIdx ].rot.setFrameData( i, rot );
                }
            }
        }

        // Remove root bone track data, need to fix
        // all the other track indices
        if( this.ignoreRoot ){
            anim.joints.shift();
            for( const j of anim.joints ){
                j.pos.jointIndex -= 1;
                j.rot.jointIndex -= 1;
            }
        }

        return anim;
    }

    _prepAnimation( frameCount: number, frameTime: number, jointCount:number ): Animation{
        const anim = new Animation( frameCount );
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute total time and time at each key frame
        anim.duration = (frameCount - 1) * frameTime;
        for( let i=0; i < frameCount; i++ ) anim.timestamp[ i ] = i * frameTime;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Build Joint Tracks
        for( let i=0; i < jointCount; i++ ) anim.addJoint();
        
        return anim;
    }

    splitLine( aIdx:number, bIdx:number ): Array<string>{
        return this.txt.substring( aIdx, bIdx ).trim().split( /[ \t]+/ );
    }

    splitFrom( str: string ): Array<string>{
        const aIdx = this.txt.indexOf( str );
        const bIdx = this.txt.indexOf( '\n', aIdx );
        return this.txt.substring( aIdx, bIdx ).trim().split( /[ \t]+/ );
    }
    // #endregion

    // #region STATIC
    static async fetch( url:string ): Promise< Bvh | null >{
        const res = await fetch( url );
        if( !res.ok ) return null;

        const txt = await res.text();
        return new Bvh( txt );
    }
    // #endregion
}