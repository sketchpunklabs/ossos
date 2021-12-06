import Accessor from "./Accessor";

export class Mesh{
    index      : number | null      = null; // Index in Mesh Collection
    name       : string | null      = null; // Mesh Name
    primitives : Array<Primitive>   = [];   // Mesh is made up of more then one Primative
    
    position   : number[] | null = null; // Node's Position
    rotation   : number[] | null = null; // Node's Rotation
    scale      : number[] | null = null; // Node's Scale
}

export class Primitive{
    materialName    : string | null   = null;
    materialIdx     : number | null   = null;

    indices         : Accessor | null = null;
    position        : Accessor | null = null;
    normal          : Accessor | null = null;
    tangent         : Accessor | null = null;
    texcoord_0      : Accessor | null = null;
    texcoord_1      : Accessor | null = null;
    color_0         : Accessor | null = null;
    joints_0        : Accessor | null = null;
    weights_0       : Accessor | null = null;
}
