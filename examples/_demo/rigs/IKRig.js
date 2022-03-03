import CharacterRig     from '../lib/CharacterRig.js';
import Armature         from '../../../src/armature/Armature';
import SkinMTX          from '../../../src/armature/skins/SkinMTX';

import * as THREE       from 'three';
import { AnimationObjectGroup } from 'three';

import { quat } from 'gl-matrix';

import HipSolver                from '../../../src/ikrig/solvers/HipSolver';
import SwingTwistEndsSolver         from '../../../src/ikrig/solvers/SwingTwistEndsSolver';
import TrapezoidSolver          from '../../../src/ikrig/solvers/TrapezoidSolver';
import SwingTwistSolver         from '../../../src/ikrig/solvers/SwingTwistSolver';

import EffectorScale            from '../../../src/ikrig/animation/additives/EffectorScale';
//import PositionOffset           from '../../../src/ikrig/animation/additives/PositionOffset';
import ArcSinSolver         from '../../../src/ikrig/solvers/ArcSinSolver';
import ArcSolver         from '../../../src/ikrig/solvers/ArcSolver';
import ZSolver         from '../../../src/ikrig/solvers/ZSolver';

const PROTO_BONES = [
	{ "name":"hips",	"len":0.1, "idx":0,"p_idx":null,"pos":[0,0.8,0], "rot":[0,0,0,1] },
	{ "name":"spine",	"len":0.1, "idx":1,"p_idx":0,"pos":[0,0.1,0], "rot":[0,0,0,1]},
	{ "name":"spine1",	"len":0.1, "idx":2,"p_idx":1,"pos":[0,0.1,0], "rot":[0,0,0,1]},
	{ "name":"spine2",	"len":0.17, "idx":3,"p_idx":2,"pos":[0,0.1,0], "rot":[0,0,0,1]},

	{ "name":"neck",	"len":0.1, "idx":4, "p_idx":3,"pos":[0,0.15,0],"rot":[0,0,0,1]},
	{ "name":"head",	"len":0.1, "idx":5, "p_idx":4,"pos":[0,0.1,0],"rot":[0,0,0,1]},
	
	{ "name":"shoulder_l","len":0.1,"idx":6,"p_idx":3, "pos":[0.07,0.15,0],"rot":[0.7071067690849304,0.7071067690849304,5.338507236274381e-8,-5.338507236274381e-8]},
	{ "name":"shoulder_r","len":0.1,"idx":7,"p_idx":3, "pos":[-0.07,0.15,0],"rot":[1.0185958743136325e-8,-1.0185956966779486e-8,0.7071067690849304,0.7071067690849304]},
];

const q_z_180 = quat.setAxisAngle( [0,0,0,0], [0,0,1], Math.PI );
const q_x_90 = quat.setAxisAngle( [0,0,0,0], [1,0,0], Math.PI * 0.5 );

const LIMBS = {
    "arm_l" : { p:"shoulder_l", pos:[ -0.05, 0.15, 0 ] },
    "arm_r" : { p:"shoulder_r", pos:[ -0.05, 0.15, 0 ] },
    "leg_l" : { pIdx:0, pos:[ 0.13, 0.0, 0 ], rot:q_z_180 },
    "leg_r" : { pIdx:0, pos:[ -0.13, 0.0, 0  ], rot:q_z_180  },
}

class IKRig extends CharacterRig{
    constructor(){ super(); }

    async loadAsync( config=null ){
        this._initCustomArm();
        
        const arml = this._createLimb( 'armL', 6, [0,0.1,0], [0.1,0.2,0.1] );
        const armr = this._createLimb( 'armR', 7, [0,0.1,0], [0.1,0.1,0.1,0.1,0.1] );
        const legl = this._createLimb( 'legL', LIMBS.leg_l.pIdx, LIMBS.leg_l.pos, [0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1], LIMBS.leg_l.rot );
        const legr = this._createLimb( 'legR', LIMBS.leg_r.pIdx, LIMBS.leg_r.pos, [0.34,0.34,0.34], LIMBS.leg_r.rot );

        this.arm.bind( SkinMTX, 0.07 );
        this.pose = this.arm.newPose();
        this.pose.offset.setPos( [1,0,0] );
        this.pose.updateWorld();

        this._boneSlots();
        this._meshes();

        const mat       = new THREE.MeshPhongMaterial( { color: 0x156289, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true, transparent:true, opacity:0.8, } );
        const geoTorus  = new THREE.TorusGeometry( 0.07, 0.02, 5, 6 );
        const geoBox    = new THREE.BoxGeometry( 0.05, 0.05, 0.05 );
        const geoSphere = new THREE.SphereGeometry( 0.05, 6, 4 );
        
        this._chainAttach( legl, geoTorus, mat, q_x_90, [0,-0.05,0] );
        this._chainAttach( legr, geoBox, mat, null, [0,-0.17,0], [2,6.5,2] );
        this._chainAttach( armr, geoSphere, mat, null, [-0.05,0,0], [1.1,1.1,1.1] );
        this._chainAttach( arml, geoBox, mat, null, null, null, [ [0.05,0,0], [0.1,0,0], [0.05,0,0] ], [ [2,1,1], [3.5,1,1], [2,1,1] ]  );

        //this._parseArm( gltf, false );   // Create Armature
        this._bipedRig();
        this._setupRig();
        this._ikAdditives();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~23
        // Legs are too Long for human animatons, Scale down the EffectorScale
        // value to make the leg lengths to match up with the floor.
        //const add_leg_scl = new EffectorScale( 0.73 );
        this.additives.add( 'legL', new EffectorScale( 0.8 ) );
        this.additives.add( 'legR', new EffectorScale( 0.8 ) );
        //this.additives.add( 'hip',  new PositionOffset( [0,0.0,0 ] ) );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.boneView ) this._boneView( config, 0.02, 0.8 );

        // this.pose.rotLocal( 0, -15, 'x' );
        // this.pose.rotLocal( 1, 10, 'x' );
        // this.pose.rotLocal( 2, 10, 'x' );
        // this.pose.rotLocal( 3, 10, 'x' );

        // this.pose.rotLocal( 4, -15, 'x' );
        // this.pose.rotLocal( 5, -15, 'x' );
        // this.pose.updateWorld();

        this.update( 0 );
        return this;
    }

    _initCustomArm(){
        let b, j;
        this.arm = new Armature();
        for( j of PROTO_BONES ){
            b       = this.arm.addBone( j.name, j.p_idx, j.rot, j.pos );
            b.len   = j.len;
        }
    }

    _chainAttach( bones, geo, mat, rot=null, pos=null, scl=null, posAry=null, sclAry=null ){
        let b;
        for( let i=0; i < bones.length; i++ ){
            b = bones[ i ];
            this.slots.add( b.name, b.name );
            this.slots.attach( b.name, new THREE.Mesh( geo, mat ), 
                rot, 
                (posAry)? posAry[i] : pos, 
                (sclAry)? sclAry[i] : scl, 
            );
        }
    }

    _meshes(){
        const mat       = new THREE.MeshPhongMaterial( { color: 0x156289, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true, transparent:true, opacity:0.8, } );
        //const mat       = new THREE.MeshPhongMaterial( {color: 0x00ffff, transparent:true, opacity:0.5, wireframe: false } );
        const geoBox    = new THREE.BoxGeometry( 0.05, 0.05, 0.05 );
        const geoTorus  = new THREE.TorusGeometry( 0.07, 0.02, 5, 6 );
        const geoCone   = new THREE.ConeGeometry( 0.05, 0.05, 6 );
        const geoCly    = new THREE.CylinderGeometry( 0.05, 0.05, 0.1, 6 );

        const q_z_180   = quat.setAxisAngle( [0,0,0,1], [0,0,1], Math.PI );
        const q_z_90    = quat.setAxisAngle( [0,0,0,1], [0,0,1], Math.PI*0.5 );
        const q_z_N90   = quat.setAxisAngle( [0,0,0,1], [0,0,1], Math.PI*-0.5 );
        const q_z_30    = quat.setAxisAngle( [0,0,0,1], [0,0,1], 30 * Math.PI / 180 );
        
        this.slots.add( 'hip', 'hips' );
        this.slots.add( 'spine', 'spine' );
        this.slots.add( 'spine1', 'spine1' );
        this.slots.add( 'chest', 'spine2' );
        this.slots.add( 'shoulder_l', 'shoulder_l' );
        this.slots.add( 'shoulder_r', 'shoulder_r' );
        this.slots.add( 'neck', 'neck' );
        this.slots.add( 'head', 'head' );

        //this.slots.attach( 'hip', new THREE.Mesh( geoCone, mat ), q_z_180, [0,0.05,0], [1,2.5,1] );
        this.slots.attach( 'hip', new THREE.Mesh( geoTorus, mat ), q_z_30, [0,0.05,0], [0.9, 0.9, 2 ] );
        this.slots.attach( 'spine', new THREE.Mesh( geoCone, mat ), q_z_180, [0,0.05,0], [1,2.5,1] );
        this.slots.attach( 'spine1', new THREE.Mesh( geoCone, mat ), q_z_180, [0,0.05,0], [1,2.5,1] );
        this.slots.attach( 'chest', new THREE.Mesh( geoTorus, mat ), null, [0,0.085,0], [1.4,1.4,3] );
        this.slots.attach( 'shoulder_l', new THREE.Mesh( geoCone, mat ), q_z_N90, [0.07,0,0], [0.8,2,0.8]);
        this.slots.attach( 'shoulder_r', new THREE.Mesh( geoCone, mat ), q_z_90, [-0.07,0,0], [0.8,2,0.8] );
        this.slots.attach( 'neck', new THREE.Mesh( geoBox, mat ), null, [0,0.06,0], [0.8, 1.5, 0.8 ] );
        this.slots.attach( 'head', new THREE.Mesh( geoBox, mat ), null, [0,0.06,0], [2.9, 2.9, 2.9 ] );
    }

    _createLimb( name, pIdx, ipos, aryLen, irot ){
        const pos   = ipos.slice( 0 );
        const bones = [];
        let len;
        let b;

        for( let i=0; i < aryLen.length; i++ ){
            len     = aryLen[ i ];
            b       = this.arm.addBone( name+'_'+i, pIdx, (i==0 && irot)? irot:null, pos );
            b.len   = len;

            pos[0]  = 0;
            pos[1]  = len;
            pos[2]  = 0;
            pIdx    = b.idx;

            bones.push( b );
        }

        return bones;
    }

    _setupRig(){
        const r     = this.rig;
        const arm   = this.arm;
        const pose  = this.pose;
        
        const FWD   = [0,0,1];
        const UP    = [0,1,0];
        const DN    = [0,-1,0];
        const R     = [-1,0,0];
        const L     = [1,0,0];
        const BAK   = [0,0,-1];
        
        r.hip = r.add( arm, 'hip', ['hips'] );
        r.hip.bindAltDirections( pose, FWD, UP );
        r.hip.setSolver( new HipSolver().initData( pose, r.hip ) );

        r.spine = r.add( arm, 'spine', ['spine','spine1','spine2'] );
        r.spine.bindAltDirections( pose, UP, FWD );
        r.spine.setSolver( new SwingTwistEndsSolver().initData( pose, r.spine ) );

        r.head = r.add( arm, 'head', ['head'] );
        r.head.bindAltDirections( pose, FWD, UP );
        r.head.setSolver( new SwingTwistSolver().initData( pose, r.head ) );

        r.legL = r.add( arm, 'legL', ['legL_0', 'legL_1', 'legL_2', 'legL_3', 'legL_4', 'legL_5', 'legL_6', 'legL_7', 'legL_8', 'legL_9'] );
        r.legL.bindAltDirections( pose, DN, FWD );
        r.legL.setSolver( new ArcSinSolver().initData( pose, r.legL ) );

        r.legR = r.add( arm, 'legR', ['legR_0', 'legR_1', 'legR_2'] );
        r.legR.bindAltDirections( pose, DN, FWD );
        r.legR.setSolver( new ZSolver().initData( pose, r.legR ) );

        r.armL = r.add( arm, 'armL', ['armL_0', 'armL_1', 'armL_2'] );
        r.armL.bindAltDirections( pose, L, BAK );
        r.armL.setSolver( new TrapezoidSolver().initData( pose, r.armL ) );

        r.armR = r.add( arm, 'armR', ['armR_0', 'armR_1', 'armR_2', 'armR_3', 'armR_4'] );
        r.armR.bindAltDirections( pose, R, BAK );
        r.armR.setSolver( new ArcSolver().initData( pose, r.armR ) );
        return this;
       
    }

    toScene( app ){
        super.toScene( app );
        for( let o of this.slots.getAllObjects() ){
            app.add( o );
        }
    }
}

export default IKRig;