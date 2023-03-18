import type Bone            from './Bone';
import type Transform       from '../maths/Transform';
import type Quat            from '../maths/Quat';

export default interface ISkeleton{
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // PROPERTIES
    bones   : Array< Bone >;
    offset  : Transform;

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // METHODS
    getBone( o: string | number ): Bone | null;
    getBones( ary: Array< string | number > ): Array< Bone >;

    getWorldRotation( boneId: string | number, out?: Quat ): Quat;
    getWorldTransform( boneId: string | number, out?: Transform ): Transform;

    updateWorld(): this;
}