import type Bone            from './Bone';
import type { Transform }   from '../maths/transform';

export default interface ISkeleton{
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // PROPERTIES
    bones   : Array< Bone >;
    offset  : Transform;

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // METHODS
    getBone( o: string | number ): Bone | null;
    updateWorld(): this;
}