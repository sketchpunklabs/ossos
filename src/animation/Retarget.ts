//#region IMPORTS
import type Armature    from '../armature/Armature'
import type Bone        from '../armature/Bone';
import type Clip        from './Clip';

import { vec3, quat }   from 'gl-matrix';
import QuatUtil         from '../maths/QuatUtil';
import Vec3Util         from '../maths/Vec3Util';
import Animator         from './Animator';
import Pose             from '../armature/Pose';
import BoneMap, { BoneInfo, BoneChain } from '../armature/BoneMap';
//#endregion

//#region TYPES
class Source{
    arm     : Armature;
    pose    : Pose;
    posHip  = vec3.create();
    constructor( arm: Armature ){
        this.arm    = arm;
        this.pose   = arm.newPose();
    }
}

class BoneLink{
    fromIndex : number;
    fromName  : string;
    toIndex   : number;
    toName    : string;

    quatFromParent  = quat.create();  // Cache the Bone's Parent WorldSpace Quat    
    quatDotCheck    = quat.create();  // Cache the FROM TPOSE Bone's Worldspace Quaternion for DOT Checking
    wquatFromTo     = quat.create();  // Handles "FROM WS" -> "TO WS" Transformation
    toWorldLocal    = quat.create();  // Cache Result to handle "TO WS" -> "TO LS" Transformation

    constructor( fIdx: number, fName:string, tIdx:number, tName:string ){
        this.fromIndex = fIdx;
        this.fromName  = fName;
        this.toIndex   = tIdx
        this.toName    = tName;
    }

    bind( fromTPose: Pose, toTPose: Pose ): this{
        const fBone : Bone = fromTPose.bones[ this.fromIndex ];
        const tBone : Bone = toTPose.bones[ this.toIndex ];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // What is the From Parent WorldSpace Transform can we use?
        quat.copy( this.quatFromParent,
            ( fBone.pidx != -1 )? 
                fromTPose.bones[ fBone.pidx ].world.rot :   // Bone's Parent
                fromTPose.offset.rot                        // Pose Offset, most often its an identity value
        );            

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Caching the parent Bone of the "To Bone" and inverting it
        // This will make it easy to convert the final results back
        // to the TO Bone's Local Space.
        if( tBone.pidx != -1 )
            quat.invert( this.toWorldLocal, toTPose.bones[ tBone.pidx ].world.rot );
        else
            quat.invert( this.toWorldLocal, toTPose.offset.rot );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // This Transform is to handle Transforming the "From TPose Bone" to
        // be equal to "To TPose Bone". Basiclly allow to shift
        // the FROM worldspace to the TO worldspace.
        //this.wquatFromTo
        //    .fromInvert( fBone.world.rot )  // What is the diff from FBone WorldSpace...
        //    .mul( tBone.world.rot );        // to TBone's WorldSpace

        quat.invert( this.wquatFromTo, fBone.world.rot );                   // What is the diff from FBone WorldSpace
        quat.mul( this.wquatFromTo, this.wquatFromTo, tBone.world.rot );    // ...to TBone's WorldSpace

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        //this.quatDotCheck.copy( fBone.world.rot );
        quat.copy( this.quatDotCheck, fBone.world.rot );
        
        return this;
    }
}
//#endregion

class Retarget{
    //#region MAIN
    hipScale                        = 1;                // Retarget Hip Position
    anim                            = new Animator();   // Animate Clip
    map  : Map< string, BoneLink >  = new Map();        // All the Linked Bones
    from !: Source;                                     // Armature for the Clip
    to   !: Source;                                     // Armature to retarget animation for
    //#endregion

    //#region SETTERS
    setClip( c:Clip ): this { 
        this.anim.setClip( c ); 
        return this;
    }

    setClipArmature( arm: Armature ){
        this.from = new Source( arm );
        return this;
    }

    setClipPoseOffset( rot ?: quat, pos ?: vec3, scl ?: vec3 ): this{
        const p = this.from.pose;
        
        // Armature has a Transform on itself sometimes
        // Apply it as the Offset Transform that gets preApplied to the root
        //if( rot ) p.offset.rot.copy( rot );
        //if( pos ) p.offset.pos.copy( pos );
        //if( scl ) p.offset.scl.copy( scl );

        if( rot ) quat.copy( p.offset.rot, rot );
        if( pos ) vec3.copy( p.offset.pos, pos );
        if( scl ) vec3.copy( p.offset.scl, scl );

        return this;
    }

    setTargetArmature( arm: Armature ){
        this.to = new Source( arm );
        return this;
    }
    //#endregion

    //#region GETTERS
    getClipPose( doUpdate=false, incOffset=false ): Pose{
        if( doUpdate ) this.from.pose.updateWorld( incOffset );
        return this.from.pose;
    }

    getTargetPose( doUpdate=false, incOffset=false ): Pose{
        if( doUpdate ) this.to.pose.updateWorld( incOffset );
        return this.to.pose;
    }
    //#endregion

    //#region METHODS
    bind(): boolean{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute a Common Bone Map to make it easy to compare
        // and link together
        const mapFrom   = new BoneMap( this.from.arm );
        const mapTo     = new BoneMap( this.to.arm );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Make sure the pose worldspace data is setup
        // and using any offset that pre exists.
        // Has to be done on bind because TPoses can be set
        // after calling setTargetAramature / setClipArmature
        this.from.pose.updateWorld( true );
        this.to.pose.updateWorld( true );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Loop the FROM map looking for any Matches in the TO map
        let i     : number,
            fLen  : number,
            tLen  : number,
            len   : number,
            lnk   : BoneLink,
            k     : string, 
            bFrom : BoneInfo | BoneChain,
            bTo   : BoneInfo | BoneChain | undefined;

        for( [ k, bFrom ] of mapFrom.bones ){
            //-------------------------------------------------
            // Check if there is a Matching Bone
            bTo = mapTo.bones.get( k );
            if( !bTo ){ console.warn( 'Target missing bone :', k ); continue; }

            //-------------------------------------------------
            // Single Bones
            if( bFrom instanceof BoneInfo && bTo instanceof BoneInfo ){
                
                lnk = new BoneLink( bFrom.index, bFrom.name, bTo.index, bTo.name );
                lnk.bind( this.from.pose, this.to.pose );

                this.map.set( k, lnk );

            //-------------------------------------------------
            // Bone Chain
            }else if( bFrom instanceof BoneChain && bTo instanceof BoneChain ){
                fLen = bFrom.items.length;
                tLen = bTo.items.length;

                if( fLen == 1 && tLen == 1 ){
                    //++++++++++++++++++++++++++++++++++++++
                    // Chain of both are just a single bone
                    this.map.set( k, new BoneLink(
                        bFrom.items[0].index, 
                        bFrom.items[0].name, 
                        bTo.items[0].index, 
                        bTo.items[0].name
                    ).bind( this.from.pose, this.to.pose ) );

                }else if( fLen >= 2 && tLen >=2 ){
                    //++++++++++++++++++++++++++++++++++++++
                    // Link the Chain ends first, then fill in the middle bits
                    
                    // Match up the first bone on each chain. 
                    this.map.set( k + "_0", new BoneLink(
                        bFrom.items[0].index, 
                        bFrom.items[0].name, 
                        bTo.items[0].index, 
                        bTo.items[0].name
                    ).bind( this.from.pose, this.to.pose ) );

                    // Match up the Last bone on each chain. 
                    this.map.set( k + "_x", new BoneLink(
                        bFrom.items[ fLen-1 ].index, 
                        bFrom.items[ fLen-1 ].name, 
                        bTo.items[ tLen-1 ].index, 
                        bTo.items[ tLen-1 ].name
                    ).bind( this.from.pose, this.to.pose ) );

                    // Match any middle bits
                    for( i=1; i < Math.min( fLen-1, tLen-1 ); i++ ){
                        lnk = new BoneLink(
                            bFrom.items[i].index, 
                            bFrom.items[i].name, 
                            bTo.items[i].index, 
                            bTo.items[i].name
                        );
    
                        lnk.bind( this.from.pose, this.to.pose );
                        this.map.set( k + "_" + i, lnk );
                    }

                }else{
                    //++++++++++++++++++++++++++++++++++++++
                    // Try to match up the bones
                    len = Math.min( bFrom.items.length, bTo.items.length );
                    for( i=0; i < len; i++ ){
                        lnk = new BoneLink(
                            bFrom.items[i].index, 
                            bFrom.items[i].name, 
                            bTo.items[i].index, 
                            bTo.items[i].name
                        );
    
                        lnk.bind( this.from.pose, this.to.pose );
                        this.map.set( k + "_" + i, lnk );
                    }
                }
            
            //-------------------------------------------------
            // Match but the data is mismatch, one is a bone while the other is a chain.
            }else{
                console.warn( 'Bone Mapping is mix match of info and chain', k );
            }
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Data to handle Hip Position Retargeting
        const hip = this.map.get( 'hip' );
        if( hip ){
            const fBone = this.from.pose.bones[ hip.fromIndex ];    // TBone State
            const tBone = this.to.pose.bones[ hip.toIndex ];

            //this.from.posHip.copy( fBone.world.pos ).nearZero();    // Cache to Retargeting
            //this.to.posHip.copy( tBone.world.pos ).nearZero();

            Vec3Util.nearZero( this.from.posHip, fBone.world.pos );   // Cache for Retargeting
            Vec3Util.nearZero( this.to.posHip,   tBone.world.pos );

            //this.hipScale = Math.abs( this.to.posHip.y / this.from.posHip.y ); // Retarget Scale FROM -> TO
            this.hipScale = Math.abs( this.to.posHip[1] / this.from.posHip[1] ); // Retarget Scale FROM -> TO
        }

        return true;
    }

    animateNext( dt: number ) : this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Run Animation & Update the FROM Pose with the results
        this.anim
            .update( dt )
            .applyPose( this.from.pose );

        this.from.pose.updateWorld( true );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.applyRetarget();
        this.to.pose.updateWorld( true );

        return this;
    }

    atKey( k: number ) : this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Set Animator to keyframe & update the FROM Pose with the results
        this.anim
            .atKey( k )
            .applyPose( this.from.pose );

        this.from.pose.updateWorld( true );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.applyRetarget();
        this.to.pose.updateWorld( true );
        
        return this;
    }

    applyRetarget(){
        const fPose     = this.from.pose.bones;
        const tPose     = this.to.pose.bones;
        const diff      = quat.create();
        const tmp       = quat.create();
        let   fBone : Bone;
        let   tBone : Bone;
        let   bl    : BoneLink;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Update the bone rotations
        for( bl of this.map.values() ){
            fBone = fPose[ bl.fromIndex ];
            tBone = tPose[ bl.toIndex ];

            //------------------------------------
            // Move Bone's Animated LocalSpace into the TPose WorldSpace
            // Using the Cached Quat when the TPoses where bound.
            // The FromTo Rotation is based on the TPose, so the animated
            // pose needs to live in that world, as if out of the whole pose
            // this is the only bone has been modified.

            //diff.fromMul( bl.quatFromParent, fBone.local.rot );
            quat.mul( diff, bl.quatFromParent, fBone.local.rot );

            //------------------------------------
            // Do dot check to prevent artifacts when applyin to vertices

            //if( Quat.dot( diff, bl.quatDotCheck ) < 0 ) diff.mul( tmp.fromNegate( bl.wquatFromTo ) );
            //else                                        diff.mul( bl.wquatFromTo );    
            
            if( quat.dot( diff, bl.quatDotCheck ) < 0 ){
                QuatUtil.negate( tmp, bl.wquatFromTo );
                quat.mul( diff, diff, tmp );
            }else{
                quat.mul( diff, diff, bl.wquatFromTo );
            }

            //diff.pmul( bl.toWorldLocal );   // Move to Local Space
            quat.mul( diff, bl.toWorldLocal, diff ); // Move to Local Space

            //tBone.local.rot.copy( diff );   // Save
            quat.copy( tBone.local.rot, diff ); // Save
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Apply Bone Translations
        const hip = this.map.get( 'hip' );
        if( hip ){
            const fBone = this.from.pose.bones[ hip.fromIndex ];
            const tBone = this.to.pose.bones[ hip.toIndex ];

            //const v = Vec3
            //    .sub( fBone.world.pos, this.from.posHip )   // Change Since TPose
            //    .scale( this.hipScale )                     // Scale Diff to Target's Scale
            //    .add( this.to.posHip )                      // Add Scaled Diff to Target's TPose Position

            const v = vec3.create();
            vec3.sub( v, fBone.world.pos, this.from.posHip );   // Change Since TPose
            vec3.scale( v, v, this.hipScale );                  // Scale Diff to Target's Scale
            vec3.add( v, v, this.to.posHip );                   // Add Scaled Diff to Target's TPose Position

            //tBone.local.pos.copy( v );                      // Save To Target
            vec3.copy( tBone.local.pos, v );
        }
    }
    //#endregion
}

export default Retarget;