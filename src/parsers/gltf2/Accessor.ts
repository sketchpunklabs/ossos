import { TTypeArray }                           from "./types";
import { ComponentTypeMap, ComponentVarMap }    from "./structs";

type TBufferView = { byteOffset ?: number };
type TAccessor   = { 
    componentType   : number, 
    type            : number,
    count           : number,
    byteOffset     ?: number,
    min            ?: Array<number>,
    max            ?: Array<number>,
};

class Accessor{
    componentLen    = 0;
    elementCnt      = 0;
    byteOffset      = 0;
    byteSize        = 0;
    boundMin : Array<number> | null = null;
    boundMax : Array<number> | null = null;
    type     : string | null = null;
    data     : TTypeArray | null = null;

    constructor( accessor: TAccessor, bufView: TBufferView, bin: ArrayBuffer ){
        const [ compByte,                                                   // Type Byte Size
                compType,
                typeName ]  = ComponentTypeMap[ accessor.componentType ];   // Ref to TypeArray

        if( !compType ){ console.error( "Unknown Component Type for Accessor", accessor.componentType ); return; }

        this.componentLen = ComponentVarMap[ accessor.type ];               // How many Components in Value
        this.elementCnt   = accessor.count;                                 // Like, How many Vector3s exist?
        this.byteOffset   = ( accessor.byteOffset || 0 ) + ( bufView.byteOffset || 0 );
        this.byteSize     = this.elementCnt * this.componentLen * compByte;
        this.boundMin     = ( accessor.min )? accessor.min.slice( 0 ) : null;
        this.boundMax     = ( accessor.max )? accessor.max.slice( 0 ) : null;
        this.type         = typeName; //accessor.type;

        if( bin ){
            const size = this.elementCnt * this.componentLen;
            this.data  = new compType( bin, this.byteOffset, size );
        }
    }
}

export default Accessor;