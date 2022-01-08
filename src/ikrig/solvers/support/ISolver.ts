import type Pose        from '../../../armature/Pose';
import type { IKChain } from '../..';

export interface ISolver{
    resolve( chain: IKChain, pose: Pose, debug?:any ): void;
}