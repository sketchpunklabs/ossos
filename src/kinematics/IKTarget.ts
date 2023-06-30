import type Transform       from '../maths/Transform';
import Vec3, { ConstVec3 } from '../maths/Vec3'

export default class IKTarget{
    tmp        : Vec3      = new Vec3();    // Preallocate scratch variable
    pos        : Vec3      = new Vec3();    // Target Position
    dir        : Vec3      = new Vec3();    // Target Direction
    sqDistance : number    = 0;
    tarMode    : number    = 0;
    
    polePos    : Vec3      = new Vec3();
    poleDir    : Vec3      = new Vec3();
    poleMode   : number    = -1;

    setDir( v: ConstVec3 ): this{ this.dir.copy( v ); this.tarMode = 1; return this; }
    setPos( v: ConstVec3 ): this{ this.pos.copy( v ); this.tarMode = 0; return this; }
    setPolePos( v: ConstVec3 ): this{ this.polePos.copy( v ); this.poleMode = 1; return this; }
    setPoleDir( v: ConstVec3 ): this{ this.poleDir.copy( v ); this.poleMode = 0; return this; }

    isReachable( maxLen: number ): boolean{ return ( this.sqDistance <= maxLen**2 ); } 

    useRootTransform( t: Readonly<Transform> ): this{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Handle target position / direction

        switch( this.tarMode ){
            // ------------------------------
            // Point Target
            case 0:
                // Direction from root to target
                this.dir.fromSub( this.pos, t.pos )
                this.sqDistance = this.dir.lenSqr;
                this.dir.norm();
                break;
            
            // ------------------------------
            // Direction Target
            case 1:
                // console.warn( 'Direction target not implemented' );
                // pos = dir * scl + t.pos
                break;
        }


        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Update pole direction if available

        switch( this.poleMode ){
            // ------------------------------
            // Pole Direction
            case 0:
                this.poleDir.fromCross( 
                    this.tmp.fromCross( this.dir, this.poleDir ), 
                    this.dir
                ).norm();
            break;

            // ------------------------------
            // Pole Position
            case 1:
                this.poleDir.fromSub( this.polePos, t.pos );
                this.poleDir.fromCross( 
                    this.tmp.fromCross( this.dir, this.poleDir ), 
                    this.dir
                ).norm();
            break;
        }

        return this;
    }
}