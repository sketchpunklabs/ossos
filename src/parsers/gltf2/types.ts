export type TTypeArray     = Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array;
export type TTypeArrayCon  = Int8ArrayConstructor | Uint8ArrayConstructor | Int16ArrayConstructor | 
                             Uint16ArrayConstructor | Uint32ArrayConstructor | Float32ArrayConstructor;


export type JSONValue =
    | string
    | number
    | boolean
    | { [x: string]: JSONValue }
    | Array<JSONValue>;