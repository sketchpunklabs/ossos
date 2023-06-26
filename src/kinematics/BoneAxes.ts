import Vec3                 from '../maths/Vec3';
import Quat, { ConstQuat }  from '../maths/Quat';

export default class BoneAxes{
    // x = new Vec3( 1, 0, 0 ); // Right
    // y = new Vec3( 0, 1, 0 ); // Up      - Point
    // z = new Vec3( 0, 0, 1 ); // Forward - Twist

    ortho = new Vec3( Vec3.LEFT );      // X
    swing = new Vec3( Vec3.UP );        // Y
    twist = new Vec3( Vec3.FORWARD );   // Z

    applyQuatInv( q: ConstQuat ): this{
        const qi = new Quat( q ).invert();
        this.ortho.transformQuat( qi );
        this.swing.transformQuat( qi );
        this.twist.transformQuat( qi );
        return this;
    }

    useBoneFace(){
        this.ortho.copy( Vec3.RIGHT );
        this.twist.copy( Vec3.UP );
        this.swing.copy( Vec3.FORWARD );
        return this;
    }
}
