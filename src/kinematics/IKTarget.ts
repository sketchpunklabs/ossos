import type Transform       from '../maths/Transform';
import Vec3, { ConstVec3 } from '../maths/Vec3'

export default class IKTarget{
    pos        : Vec3      = new Vec3();    // Target Position
    dir        : Vec3      = new Vec3();    // Target Direction
    sqDistance : number    = 0;
    
    polePos    : Vec3      = new Vec3();
    poleDir    : Vec3      = new Vec3(); 

    setPos( v: ConstVec3 ): this{ this.pos.copy( v ); return this; }
    setPolePos( v: ConstVec3 ): this{ this.polePos.copy( v ); return this; }

    isReachable( maxLen: number ): boolean{ return ( this.sqDistance <= maxLen**2 ); } 

    useRootTransform( t: Readonly<Transform> ): this{
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Direction from root to target
        this.dir.fromSub( this.pos, t.pos )
        this.sqDistance = this.dir.lenSqr;
        this.dir.norm();

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( !this.polePos.isZero ){
            this.poleDir.fromSub( this.polePos, t.pos );
            this.poleDir.fromCross( 
                Vec3.cross( this.dir, this.poleDir ), 
                this.dir
            ).norm();
        }

        return this;
    }
}