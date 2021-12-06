import { TTypeArrayCon } from "./types";

// ByteSize : TypeArray : JS Type name, Gltf Type name
export const ComponentTypeMap : Record<number, [number, TTypeArrayCon, string, string ]>= { 
    5120: [ 1, Int8Array,    "int8",    "BYTE" ],
    5121: [ 1, Uint8Array,   "uint8",   "UNSIGNED_BYTE" ],
    5122: [ 2, Int16Array,   "int16",   "SHORT" ],
    5123: [ 2, Uint16Array,  "uint16",  "UNSIGNED_SHORT" ],
    5125: [ 4, Uint32Array,  "uint32",  "UNSIGNED_INT" ],
    5126: [ 4, Float32Array, "float",   "FLOAT" ],
};

export const ComponentVarMap : Record<string, number> = {  // Component Length of Each Var Type
    SCALAR  : 1,
    VEC2    : 2,
    VEC3    : 3,
    VEC4    : 4,
    MAT2    : 4,
    MAT3    : 9,
    MAT4    : 16,
};