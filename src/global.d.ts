type Nullable<T> = T | null | undefined;
// type NonNull<T>  = Exclude< T, null | undefined >;

type Vec3Like   = [number, number, number]      | Float32Array | Array<number> | number[];
type Vec4Like   = [number,number,number,number] | Float32Array | Array<number>;
type ConstVec3  = Readonly< Vec3Like >;

type QuatLike   = [number,number,number,number] | Float32Array | Array<number>;
type ConstQuat  = Readonly< QuatLike >