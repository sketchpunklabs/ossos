import Vec3 from '../maths/Vec3';
import Quat, { ConstQuat } from '../maths/Quat';

export default class BoneAxes{
    x = new Vec3( 1, 0, 0 ); // Right
    y = new Vec3( 0, 1, 0 ); // Up      - Point
    z = new Vec3( 0, 0, 1 ); // Forward - Twist

    rotInvQuat( q: ConstQuat ): this{
        const qi = new Quat( q ).invert();
        this.x.fromQuat( qi, this.x );
        this.y.fromQuat( qi, this.y );
        this.z.fromQuat( qi, this.z );
        return this;
    }
}
