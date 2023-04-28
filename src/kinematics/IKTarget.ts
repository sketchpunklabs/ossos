import Vec3, { ConstVec3 } from '../maths/Vec3'

export default class IKTarget{
    pos: Vec3 = new Vec3();

    setPos( v: ConstVec3 ): this{ this.pos.copy( v ); return this; }
}