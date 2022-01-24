//#region IMPORTS
import type Pose                from '../../armature/Pose';
import type { IKChain, IKLink } from '../rigs/IKChain';
import type { ISolver }         from './support/ISolver';
import type { IKData }          from '..';

import { Transform }            from '../../maths';
import { vec3, quat }           from 'gl-matrix';
import QuatUtil                 from '../../maths/QuatUtil';
//#endregion

class SwingTwistSolver implements ISolver{
    //#region TARGETTING DATA
    _isTarPosition : boolean = false;        // Is the Target a Position or a Direction?
    _originPoleDir : vec3    = [ 0, 0, 0 ];  // Pole gets updated based on effector direction, so keep originally set dir to compute the orthogonal poleDir
    effectorScale  : number  = 1;
    effectorPos    : vec3    = [ 0, 0, 0 ];  // IK Target can be a Position or...
    effectorDir    : vec3    = [ 0, 0, 1 ];  // Direction. BUT if its position, need to compute dir from chain origin position.
    poleDir        : vec3    = [ 0, 1, 0 ];  // Direction that handles the twisitng rotation
    orthoDir       : vec3    = [ 1, 0, 0 ];  // Direction that handles the bending direction, like elbow/knees.
    originPos      : vec3    = [ 0, 0, 0 ];  // Starting World Position of the Chain
    //#endregion

    initData( pose?: Pose, chain?: IKChain ): this{
        if( pose && chain ){
            // If init pose is the same used for binding, this should recreate the WORLD SPACE Pole Direction just fine
            const lnk: IKLink   = chain.links[ 0 ];
            const rot: quat     = pose.bones[ lnk.idx ].world.rot;

            const eff  : vec3   = vec3.transformQuat( [0,0,0], lnk.effectorDir, rot );
            const pole : vec3   = vec3.transformQuat( [0,0,0], lnk.poleDir, rot );

            this.setTargetDir( eff, pole );
            //this.setTargetPos( chain.getTailPosition( pose ), pole );
        }
        return this;
    }

    //#region SETTING TARGET DATA
    setTargetDir( e: vec3, pole ?: vec3, effectorScale ?: number ): this{
        this._isTarPosition     = false;
        this.effectorDir[ 0 ]   = e[ 0 ];
        this.effectorDir[ 1 ]   = e[ 1 ];
        this.effectorDir[ 2 ]   = e[ 2 ];
        if( pole ) this.setTargetPole( pole );

        if( effectorScale ) this.effectorScale = effectorScale;
        return this;
    }

    setTargetPos( v: vec3, pole ?: vec3 ): this{
        this._isTarPosition     = true;
        this.effectorPos[ 0 ]   = v[ 0 ];
        this.effectorPos[ 1 ]   = v[ 1 ];
        this.effectorPos[ 2 ]   = v[ 2 ];
        if( pole ) this.setTargetPole( pole );
        return this;
    }

    setTargetPole( v: vec3 ): this{
        this._originPoleDir[ 0 ] = v[ 0 ];
        this._originPoleDir[ 1 ] = v[ 1 ];
        this._originPoleDir[ 2 ] = v[ 2 ];
        return this;
    }
    //#endregion

    resolve( chain: IKChain, pose: Pose, debug?:any ): void{
        const [ rot, pt ] = this.getWorldRot( chain, pose, debug );

        QuatUtil.pmulInvert( rot, rot, pt.rot );        // To Local Space
        pose.setLocalRot( chain.links[ 0 ].idx, rot );  // Save to Pose
    }

    ikDataFromPose( chain: IKChain, pose: Pose, out: IKData.Dir ): void{
        const dir: vec3 = [0,0,0]; //new Vec3();
        const lnk = chain.first();
        const b   = pose.bones[ lnk.idx ];

        // Alt Effector
        vec3.transformQuat( dir, lnk.effectorDir, b.world.rot );
        vec3.normalize( out.effectorDir, dir );

        // Alt Pole
        vec3.transformQuat( dir, lnk.poleDir, b.world.rot );
        vec3.normalize( out.poleDir, dir );
    }


    /** Update Target Data  */
    _update( origin: vec3 ): void{
        const v: vec3 = [0,0,0];
        const o: vec3 = [0,0,0];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute the Effector Direction if only given effector position
        if( this._isTarPosition ){
            vec3.sub( v, this.effectorPos, origin );     // Forward Axis Z
            vec3.normalize( this.effectorDir, v );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Left axis X - Only needed to make pole orthogonal to effector
        vec3.cross( v, this._originPoleDir, this.effectorDir );
        vec3.normalize( this.orthoDir, v );

        // Up Axis Y 
        vec3.cross( v, this.effectorDir, this.orthoDir );
        vec3.normalize( this.poleDir, v );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        vec3.copy( this.originPos, origin );
    }

    getWorldRot( chain: IKChain, pose: Pose, debug?:any ) : [ quat, Transform ]{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const pt    = new Transform();
        const ct    = new Transform();
        let lnk     = chain.first();

        // Get the Starting Transform
        if( lnk.pidx == -1 )    pt.copy( pose.offset );
        else                    pose.getWorldTransform( lnk.pidx, pt );

        ct.fromMul( pt, lnk.bind );     // Get Bone's BindPose position in relation to this pose
        this._update( ct.pos );         // Update Data to use new Origin.

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const rot : quat = quat.copy( [0,0,0,1], ct.rot );
        const dir : vec3 = [0,0,0];
        const q   : quat = [0,0,0,1];
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Swing
        vec3.transformQuat( dir, lnk.effectorDir, ct.rot ); // Get WS Binding Effector Direction of the Bone
        quat.rotationTo( q, dir, this.effectorDir );        // Rotation TO IK Effector Direction
        quat.mul( rot, q, rot );                            // Apply to Bone WS Rot

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Twist
        if( vec3.sqrLen( this.poleDir ) > 0.0001 ){
            vec3.transformQuat( dir, lnk.poleDir, rot );    // Get WS Binding Pole Direction of the Bone
            quat.rotationTo( q, dir, this.poleDir );        // Rotation to IK Pole Direction
            quat.mul( rot, q, rot );                        // Apply to Bone WS Rot + Swing
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Kinda Hacky putting this here, but its the only time where there is access to chain's length for all extending solvers.
        // So if not using a TargetPosition, means we're using Direction then we have to compute the effectorPos.
        if( !this._isTarPosition ){
            this.effectorPos[ 0 ] = this.originPos[ 0 ] + this.effectorDir[ 0 ] * chain.length * this.effectorScale;
            this.effectorPos[ 1 ] = this.originPos[ 1 ] + this.effectorDir[ 1 ] * chain.length * this.effectorScale;
            this.effectorPos[ 2 ] = this.originPos[ 2 ] + this.effectorDir[ 2 ] * chain.length * this.effectorScale;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return [ rot, pt ];
    }

}

export default SwingTwistSolver;