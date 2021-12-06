export class Skin{
    index       : number | null    = null; // Index in Mesh Collection
    name        : string | null    = null; // Skin Name
    joints      : Array<SkinJoint> = [];   // Collection of Joints

    // Sometimes Skin Objects will have their own transform in nodes
    // Tends to come from FBX to GLTF conversion in blender.
    position    : number[] | null  = null; // Local Space Position
    rotation    : number[] | null  = null; // Local Space Rotation
    scale       : number[] | null  = null; // Local Space Scale
}

export class SkinJoint{
    name        : string | null = null; // Name of Joint
    index       : number | null = null; // Joint Index
    parentIndex : number | null = null; // Parent Joint Index, Null if its a Root Joint

    bindMatrix  : number[] | null  = null; // Inverted WorldSpace Transform
    position    : number[] | null  = null; // Local Space Position
    rotation    : number[] | null  = null; // Local Space Rotation
    scale       : number[] | null  = null; // Local Space Scale
}