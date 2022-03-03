import CharacterRig, { Gltf2, UtilArm } from '../lib/CharacterRig.js';
import * as THREE from 'three';

class ToruRig extends CharacterRig{
    constructor(){ super(); }

    async loadAsync( config=null ){
        const url  = '../_res/models/toru/';
        const gltf = await Gltf2.fetch( url + 'toru.gltf' );

        this._parseArm( gltf, true )   // Create Armature
            ._autoRig()                // Auto BipedRig

        console.log( this.arm );
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.boneView ) this._boneView( config );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.mesh != false ){
            let base = 'cyan';

            if( config?.tex != false ){
                if( config?.tex != false ) base = await this._texture( url + 'MKDM001_Toru.png' );
            } 

            this._skinnedMesh( gltf, base, config );
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( config?.springs != false ){
            const skirt_ops = 2.0;
            const skirt_damp = 0.5;
            
            this._boneSprings();   
            this.springs
                .addPosChain( 'breastl', [ 'Breast.L' ], 2.5, 0.01 )
                .addPosChain( 'breastr', [ 'Breast.R' ], 2.5, 0.01 )

                .addRotChain( 'Hair_FL', [ 'Hair_FL' ], 2.5, 0.4 )
                .addRotChain( 'Hair_FR', [ 'Hair_FR' ], 2.5, 0.4 )

                .addRotChain( 'Bow_L', [ 'Bow_L' ], 2.5, 0.4 )
                .addRotChain( 'Bow_R', [ 'Bow_R' ], 2.5, 0.4 )

                .addRotChain( 'tail', ['Tail_01','Tail_02','Tail_03','Tail_04'], 2, 0.6 )
                .addRotChain( 'ptailr', ['Hair_R_01','Hair_R_02','Hair_R_03','Hair_R_04'], 2.5, 0.5 )
                .addRotChain( 'ptaill', ['Hair_L_01','Hair_L_02','Hair_L_03','Hair_L_04'], 2.5, 0.5 )

                .addRotChain( 'Skirt_F', ['Skirt_F_01','Skirt_F_02','Skirt_F_03'], skirt_ops, skirt_damp )
                .addRotChain( 'Skirt_FL', ['Skirt_FL_01','Skirt_FL_02','Skirt_FL_03'], skirt_ops, skirt_damp )
                .addRotChain( 'Skirt_FR', ['Skirt_FR_01','Skirt_FR_02','Skirt_FR_03'], skirt_ops, skirt_damp )
                .addRotChain( 'Skirt_L', ['Skirt_L_01','Skirt_L_02','Skirt_L_03'], skirt_ops, skirt_damp )
                .addRotChain( 'Skirt_R', ['Skirt_R_01','Skirt_R_02','Skirt_R_03'], skirt_ops, skirt_damp )
                .addRotChain( 'Skirt_B', ['Skirt_B_01','Skirt_B_02','Skirt_B_03'], skirt_ops, skirt_damp )
                .addRotChain( 'Skirt_BL', ['Skirt_BL_01','Skirt_BL_02','Skirt_BL_03'], skirt_ops, skirt_damp )
                .addRotChain( 'Skirt_BR', ['Skirt_BR_01','Skirt_BR_02','Skirt_BR_03'], skirt_ops, skirt_damp )
            ;

            this.springs.setRestPose( this.pose ); // Set the resting pose of the springs
        }
//         26: {"Bow_L" => 26}
//         27: {"Bow_R" => 27}

// 1: {"Skirt_B_01" => 1}
// 2: {"Skirt_B_02" => 2}
// 3: {"Skirt_B_03" => 3}
// 4: {"Skirt_BL_01" => 4}
// 5: {"Skirt_BL_02" => 5}
// 6: {"Skirt_BL_03" => 6}
// 7: {"Skirt_BR_01" => 7}
// 8: {"Skirt_BR_02" => 8}
// 9: {"Skirt_BR_03" => 9}

// 10: {"Skirt_F_01" => 10}
// 11: {"Skirt_F_02" => 11}
// 12: {"Skirt_F_03" => 12}
// 13: {"Skirt_FL_01" => 13}
// 14: {"Skirt_FL_02" => 14}
// 15: {"Skirt_FL_03" => 15}
// 16: {"Skirt_FR_01" => 16}
// 17: {"Skirt_FR_02" => 17}
// 18: {"Skirt_FR_03" => 18}
// 19: {"Skirt_L_01" => 19}
// 20: {"Skirt_L_02" => 20}
// 21: {"Skirt_L_03" => 21}
// 22: {"Skirt_R_01" => 22}
// 23: {"Skirt_R_02" => 23}
// 24: {"Skirt_R_03" => 24}



        return this;
    }
}

export default ToruRig;