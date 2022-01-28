// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#glb-file-format-specification-general

const GLB_MAGIC	            = 0x46546C67;   // Simple number test to see if its a GLB
const GLB_JSON	            = 0x4E4F534A;   // Chunk Type for JSON
const GLB_BIN	            = 0x004E4942;   // Chunk Type for Binary
const GLB_VER               = 2;            // Version Number
const GLB_MAGIC_BIDX        = 0;            // Byte Index for magic Uint32 magic value
const GLB_VERSION_BIDX      = 4;            // Byte Index for version Uint32 Value
const GLB_JSON_TYPE_BIDX    = 16;           // Byte Index for Chunk0 Type 
const GLB_JSON_LEN_BIDX     = 12;           // Byte Index for Chunk0 ByteLength ( Start of Header )
const GLB_JSON_BIDX         = 20;           // Byte Index for the start of Chunk0

async function parseGLB( res: Response ): Promise<[JSON, ArrayBuffer] | null> {
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const arybuf    = await res.arrayBuffer();
    const dv        = new DataView( arybuf );

    if( dv.getUint32( GLB_MAGIC_BIDX, true ) != GLB_MAGIC ){    console.error( 'GLB magic number does not match.' );    return null; }
    if( dv.getUint32( GLB_VERSION_BIDX, true ) != GLB_VER ){    console.error( 'Can only accept GLB of version 2.' );   return null; }
    if( dv.getUint32( GLB_JSON_TYPE_BIDX, true ) != GLB_JSON ){ console.error( 'GLB Chunk 0 is not the type: JSON ');   return null; }

    const json_len    = dv.getUint32( GLB_JSON_LEN_BIDX, true );    // Byte Length of Chunk0-JSON
    const chk1_bidx   = GLB_JSON_BIDX + json_len;	                // Byte Index for Chunk1's Header ( Also Chunk1's ByteLength )

     // TODO: This isn't actually required, can have GLTF without Binary Chunk
    if( dv.getUint32( chk1_bidx + 4, true ) != GLB_BIN ){       console.error( 'GLB Chunk 1 is not the type: BIN ' );return null; }
    
    const bin_len = dv.getUint32( chk1_bidx, true );    // Get Length of Binary Chunk
    const bin_idx = chk1_bidx + 8;                      // Skip the 2 INT header values to get the byte index start of BIN

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // PARSE JSON
    const txt_decoder   = new TextDecoder( 'utf8' );                            // JSON is encoded with uf8
    const json_bytes    = new Uint8Array( arybuf, GLB_JSON_BIDX, json_len );    // Slice the Byte Array to just have the JSON Chunk
    const json_text     = txt_decoder.decode( json_bytes );                     // Decode Byte Array Slice
    const json          = JSON.parse( json_text );                              // Parse Text to JSON Objects

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // PARSE BIN - TODO, Not efficent to slice the array buffer
    // Ideally better to save start index as a starting offset
    // & fix the parser to tack that value onto every accessor call

    const bin = arybuf.slice( bin_idx );
    if( bin.byteLength != bin_len ){ console.error( 'GLB Bin length does not match value in header.' ); return null; }

    return [ json, bin ];
}

export default parseGLB;