export class Skin{
    joints : Array<SkinJoint> = [];   // Collection of Joints
}

export class SkinJoint{
    name        : string | null = null;     // Name of Joint
    index       : number = -1;              // Joint Index
    parentIndex : number = -1 ;             // Parent Joint Index, Null if its a Root Joint

    position    : number[] | null  = null;  // Local Space Position
    rotation    : number[] | null  = null;  // Local Space Rotation
}