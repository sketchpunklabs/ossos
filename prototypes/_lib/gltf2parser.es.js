const GLB_MAGIC = 1179937895;
const GLB_JSON = 1313821514;
const GLB_BIN = 5130562;
const GLB_VER = 2;
const GLB_MAGIC_BIDX = 0;
const GLB_VERSION_BIDX = 4;
const GLB_JSON_TYPE_BIDX = 16;
const GLB_JSON_LEN_BIDX = 12;
const GLB_JSON_BIDX = 20;
async function parseGLB(res) {
  const arybuf = await res.arrayBuffer();
  const dv = new DataView(arybuf);
  if (dv.getUint32(GLB_MAGIC_BIDX, true) != GLB_MAGIC) {
    console.error("GLB magic number does not match.");
    return null;
  }
  if (dv.getUint32(GLB_VERSION_BIDX, true) != GLB_VER) {
    console.error("Can only accept GLB of version 2.");
    return null;
  }
  if (dv.getUint32(GLB_JSON_TYPE_BIDX, true) != GLB_JSON) {
    console.error("GLB Chunk 0 is not the type: JSON ");
    return null;
  }
  const json_len = dv.getUint32(GLB_JSON_LEN_BIDX, true);
  const chk1_bidx = GLB_JSON_BIDX + json_len;
  if (dv.getUint32(chk1_bidx + 4, true) != GLB_BIN) {
    console.error("GLB Chunk 1 is not the type: BIN ");
    return null;
  }
  const bin_len = dv.getUint32(chk1_bidx, true);
  const bin_idx = chk1_bidx + 8;
  const txt_decoder = new TextDecoder("utf8");
  const json_bytes = new Uint8Array(arybuf, GLB_JSON_BIDX, json_len);
  const json_text = txt_decoder.decode(json_bytes);
  const json = JSON.parse(json_text);
  const bin = arybuf.slice(bin_idx);
  if (bin.byteLength != bin_len) {
    console.error("GLB Bin length does not match value in header.");
    return null;
  }
  return [json, bin];
}

const ComponentTypeMap = {
  5120: [1, Int8Array, "int8", "BYTE"],
  5121: [1, Uint8Array, "uint8", "UNSIGNED_BYTE"],
  5122: [2, Int16Array, "int16", "SHORT"],
  5123: [2, Uint16Array, "uint16", "UNSIGNED_SHORT"],
  5125: [4, Uint32Array, "uint32", "UNSIGNED_INT"],
  5126: [4, Float32Array, "float", "FLOAT"]
};
const ComponentVarMap = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

class Accessor {
  componentLen = 0;
  elementCnt = 0;
  byteOffset = 0;
  byteSize = 0;
  boundMin = null;
  boundMax = null;
  type = null;
  data = null;
  fromBin(accessor, bufView, bin) {
    const [
      compByte,
      compType,
      typeName
    ] = ComponentTypeMap[accessor.componentType];
    if (!compType) {
      console.error("Unknown Component Type for Accessor", accessor.componentType);
      return this;
    }
    this.componentLen = ComponentVarMap[accessor.type];
    this.elementCnt = accessor.count;
    this.byteOffset = (accessor.byteOffset || 0) + (bufView.byteOffset || 0);
    this.byteSize = this.elementCnt * this.componentLen * compByte;
    this.boundMin = accessor.min ? accessor.min.slice(0) : null;
    this.boundMax = accessor.max ? accessor.max.slice(0) : null;
    this.type = typeName;
    if (bin) {
      const size = this.elementCnt * this.componentLen;
      this.data = new compType(bin, this.byteOffset, size);
    }
    return this;
  }
}

class Attrib {
  byteOffset = 0;
  componentLen = 0;
  boundMin = null;
  boundMax = null;
  constructor(accID, json) {
    const accessor = json.accessors[accID];
    this.componentLen = ComponentVarMap[accessor.type];
    this.byteOffset = accessor.byteOffset;
    this.boundMin = accessor.min ? accessor.min.slice(0) : null;
    this.boundMax = accessor.max ? accessor.max.slice(0) : null;
  }
}
class InterleavedBuffer {
  data = null;
  elementCnt = 0;
  componentLen = 0;
  byteStride = 0;
  byteSize = 0;
  position = null;
  normal = null;
  tangent = null;
  texcoord_0 = null;
  texcoord_1 = null;
  color_0 = null;
  joints_0 = null;
  weights_0 = null;
  constructor(attr, json, bin) {
    const accessor = json.accessors[attr.POSITION];
    const bView = json.bufferViews[accessor.bufferView];
    this.elementCnt = accessor.count;
    this.byteStride = bView.byteStride;
    this.byteSize = bView.byteLength;
    this.componentLen = this.byteStride / 4;
    this.position = new Attrib(attr.POSITION, json);
    if (attr.NORMAL != void 0)
      this.normal = new Attrib(attr.NORMAL, json);
    if (attr.TANGENT != void 0)
      this.tangent = new Attrib(attr.TANGENT, json);
    if (attr.TEXCOORD_0 != void 0)
      this.texcoord_0 = new Attrib(attr.TEXCOORD_0, json);
    if (attr.TEXCOORD_1 != void 0)
      this.texcoord_1 = new Attrib(attr.TEXCOORD_1, json);
    if (attr.JOINTS_0 != void 0)
      this.joints_0 = new Attrib(attr.JOINTS_0, json);
    if (attr.WEIGHTS_0 != void 0)
      this.weights_0 = new Attrib(attr.WEIGHTS_0, json);
    if (attr.COLOR_0 != void 0)
      this.color_0 = new Attrib(attr.COLOR_0, json);
    if (bin) {
      this.data = new Float32Array(bin, bView.byteOffset || 0, this.elementCnt * this.componentLen);
    }
  }
}

class Draco {
  mod;
  decoder;
  mesh;
  faceCnt = 0;
  vertCnt = 0;
  constructor(mod) {
    this.mod = mod;
    this.decoder = new this.mod.Decoder();
  }
  dispose() {
    this.mod.destroy(this.decoder);
    if (this.mesh)
      this.mod.destroy(this.mesh);
    this.mod = null;
  }
  loadMesh(bin, offset, len) {
    const slice = new Int8Array(bin, offset, len);
    const buf = new this.mod.DecoderBuffer();
    buf.Init(slice, slice.byteLength);
    this.mesh = new this.mod.Mesh();
    this.decoder.DecodeBufferToMesh(buf, this.mesh);
    this.mod.destroy(buf);
    this.faceCnt = this.mesh.num_faces();
    this.vertCnt = this.mesh.num_points();
    return this;
  }
  loadPrimitive(prim, dAttr, gAttr, json) {
    if (dAttr.POSITION != void 0)
      prim.position = this.parseAttribute(dAttr.POSITION, gAttr.POSITION, json);
    if (dAttr.NORMAL != void 0)
      prim.normal = this.parseAttribute(dAttr.NORMAL, gAttr.NORMAL, json);
    if (dAttr.TEXCOORD_0 != void 0)
      prim.texcoord_0 = this.parseAttribute(dAttr.TEXCOORD_0, gAttr.TEXCOORD_0, json);
    const tAry = new Uint32Array(this.faceCnt * 3);
    const dAry = new this.mod.DracoUInt32Array();
    let ii;
    for (let i = 0; i < this.faceCnt; i++) {
      this.decoder.GetFaceFromMesh(this.mesh, i, dAry);
      ii = i * 3;
      tAry[ii + 0] = dAry.GetValue(0);
      tAry[ii + 1] = dAry.GetValue(1);
      tAry[ii + 2] = dAry.GetValue(2);
    }
    this.mod.destroy(dAry);
    prim.indices = new Accessor();
    prim.indices.componentLen = 1;
    prim.indices.elementCnt = this.faceCnt;
    prim.indices.byteSize = tAry.byteLength;
    prim.indices.data = tAry;
    prim.indices.type = "UNSIGNED_INT";
    this.mod.destroy(this.mesh);
    this.mesh = void 0;
    this.faceCnt = 0;
    this.vertCnt = 0;
  }
  parseAttribute(dIdx, gIdx, json) {
    const accessor = json.accessors[gIdx];
    const id = this.decoder.GetAttributeByUniqueId(this.mesh, dIdx);
    const out = new Accessor();
    const compByte = ComponentTypeMap[accessor.componentType][0];
    const dType = ComponentTypeMap[accessor.componentType][3];
    out.componentLen = ComponentVarMap[accessor.type];
    out.elementCnt = accessor.count;
    out.byteSize = out.elementCnt * out.componentLen * compByte;
    out.boundMin = accessor.min ? accessor.min.slice(0) : null;
    out.boundMax = accessor.max ? accessor.max.slice(0) : null;
    out.type = ComponentTypeMap[accessor.componentType][2];
    out.data = this.decodeAttributeData(id, dType, out.componentLen * this.vertCnt);
    return out;
  }
  decodeAttributeData(id, type, len) {
    let tAry;
    let dAry;
    switch (type) {
      case "BYTE":
        tAry = new Uint8Array(len);
        dAry = new this.mod.DracoInt8Array();
        this.decoder.GetAttributeInt8ForAllPoints(this.mesh, id, dAry);
        return dAry;
      case "UNSIGNED_BYTE":
        tAry = new Int16Array(len);
        dAry = new this.mod.DracoUInt8Array();
        this.decoder.GetAttributeUInt8ForAllPoints(this.mesh, id, dAry);
        break;
      case "SHORT":
        tAry = new Int16Array(len);
        dAry = new this.mod.DracoInt16Array();
        this.decoder.GetAttributeInt16ForAllPoints(this.mesh, id, dAry);
        break;
      case "UNSIGNED_SHORT":
        tAry = new Uint16Array(len);
        dAry = new this.mod.DracoUInt16Array();
        this.decoder.GetAttributeUInt16ForAllPoints(this.mesh, id, dAry);
        break;
      case "UNSIGNED_INT":
        tAry = new Uint32Array(len);
        dAry = new this.mod.DracoUInt32Array();
        this.decoder.GetAttributeUInt32ForAllPoints(this.mesh, id, dAry);
        break;
      case "FLOAT":
        tAry = new Float32Array(len);
        dAry = new this.mod.DracoFloat32Array();
        this.decoder.GetAttributeFloatForAllPoints(this.mesh, id, dAry);
        break;
    }
    for (let i = 0; i < len; i++)
      tAry[i] = dAry.GetValue(i);
    this.mod.destroy(dAry);
    return tAry;
  }
}

class Mesh {
  index = null;
  name = null;
  primitives = [];
  position = null;
  rotation = null;
  scale = null;
  morphTargets = null;
}
class Primitive {
  materialName = null;
  materialIdx = null;
  indices = null;
  position = null;
  normal = null;
  tangent = null;
  texcoord_0 = null;
  texcoord_1 = null;
  color_0 = null;
  joints_0 = null;
  weights_0 = null;
  interleaved = null;
}

class Skin {
  index = null;
  name = null;
  joints = [];
  position = null;
  rotation = null;
  scale = null;
}
class SkinJoint {
  name = null;
  index = null;
  parentIndex = null;
  bindMatrix = null;
  position = null;
  rotation = null;
  scale = null;
}

const ETransform = {
  Rot: 0,
  Pos: 1,
  Scl: 2
};
const ELerp = {
  Step: 0,
  Linear: 1,
  Cubic: 2
};
class Track {
  static Transform = ETransform;
  static Lerp = ELerp;
  transform = ETransform.Pos;
  interpolation = ELerp.Step;
  jointIndex = 0;
  timeStampIndex = 0;
  keyframes;
  static fromGltf(jointIdx, target, inter) {
    const t = new Track();
    t.jointIndex = jointIdx;
    switch (target) {
      case "translation":
        t.transform = ETransform.Pos;
        break;
      case "rotation":
        t.transform = ETransform.Rot;
        break;
      case "scale":
        t.transform = ETransform.Scl;
        break;
    }
    switch (inter) {
      case "LINEAR":
        t.interpolation = ELerp.Linear;
        break;
      case "STEP":
        t.interpolation = ELerp.Step;
        break;
      case "CUBICSPLINE":
        t.interpolation = ELerp.Cubic;
        break;
    }
    return t;
  }
}
class Animation {
  name = "";
  timestamps = [];
  tracks = [];
  constructor(name) {
    if (name)
      this.name = name;
  }
}

class Texture {
  index = -1;
  name = "";
  mime = "";
  uri = "";
  blob = null;
  static fromIndex(idx, parser) {
    const tex = new Texture();
    tex.index = idx;
    const info = parser.json.textures[idx];
    const src = parser.json.images[info.source];
    tex.name = src.name;
    tex.mime = src.mimeType;
    if (src.uri)
      tex.uri = src.uri;
    if (src.bufferView != null) {
      const bv = parser.json.bufferViews[src.bufferView];
      const bAry = new Uint8Array(parser.bin, bv.byteOffset, bv.byteLength);
      tex.blob = new Blob([bAry], { type: src.mimeType });
    }
    return tex;
  }
}

class PoseJoint {
  index;
  rot;
  pos;
  scl;
  constructor(idx, rot, pos, scl) {
    this.index = idx;
    this.rot = rot;
    this.pos = pos;
    this.scl = scl;
  }
}
class Pose {
  name = "";
  joints = [];
  constructor(name) {
    if (name)
      this.name = name;
  }
  add(idx, rot, pos, scl) {
    this.joints.push(new PoseJoint(idx, rot, pos, scl));
  }
}

class Material {
  index = -1;
  name = "";
  metallic = 0;
  roughness = 0;
  baseTexture = null;
  baseColor = null;
  constructor(mat, parser) {
    this.name = mat.name || window.crypto.randomUUID();
    if (mat.pbrMetallicRoughness) {
      if (mat.pbrMetallicRoughness.baseColorFactor) {
        this.baseColor = mat.pbrMetallicRoughness.baseColorFactor;
      }
      if (mat.pbrMetallicRoughness.baseColorTexture) {
        this.baseTexture = Texture.fromIndex(mat.pbrMetallicRoughness.baseColorTexture.index, parser);
      }
      this.metallic = mat.pbrMetallicRoughness.metallicFactor || 0;
      this.roughness = mat.pbrMetallicRoughness.roughnessFactor || 0;
    }
  }
}

class Gltf2Parser {
  json;
  bin;
  path = "";
  _needsDraco = false;
  _extDraco = void 0;
  constructor(json, bin) {
    this.json = json;
    this.bin = bin || new ArrayBuffer(0);
    if (json.extensionsRequired) {
      this._needsDraco = json.extensionsRequired.indexOf("KHR_draco_mesh_compression") !== -1;
    }
  }
  get needsDraco() {
    return this._needsDraco;
  }
  useDraco(mod) {
    this._extDraco = new Draco(mod);
    return this;
  }
  dispose() {
    if (this._extDraco)
      this._extDraco.dispose();
  }
  getNodeByName(n) {
    let o, i;
    for (i = 0; i < this.json.nodes.length; i++) {
      o = this.json.nodes[i];
      if (o.name == n)
        return [o, i];
    }
    return null;
  }
  getMeshNames() {
    const json = this.json, rtn = [];
    let i;
    for (i of json.meshes)
      rtn.push(i.name);
    return rtn;
  }
  getMeshNodes(idx) {
    const out = [];
    let n;
    for (n of this.json.nodes) {
      if (n.mesh == idx)
        out.push(n);
    }
    return out;
  }
  getMeshByName(n) {
    let o, i;
    for (i = 0; i < this.json.meshes.length; i++) {
      o = this.json.meshes[i];
      if (o.name == n)
        return [o, i];
    }
    return null;
  }
  getMeshElement(id) {
    const json = this.json;
    let m = null;
    let mIdx = null;
    switch (typeof id) {
      case "string": {
        const tup = this.getMeshByName(id);
        if (tup !== null) {
          m = tup[0];
          mIdx = tup[1];
        }
        break;
      }
      case "number":
        if (id < json.meshes.length) {
          m = json.meshes[id];
          mIdx = id;
        }
        break;
      default:
        m = json.meshes[0];
        mIdx = 0;
        break;
    }
    return [m, mIdx];
  }
  getMesh(id) {
    if (!this.json.meshes) {
      console.warn("No Meshes in GLTF File");
      return null;
    }
    const [m, mIdx] = this.getMeshElement(id);
    if (m == null || mIdx == null) {
      console.warn("No Mesh Found", id);
      return null;
    }
    const json = this.json;
    const mesh = new Mesh();
    mesh.name = m.name;
    mesh.index = mIdx;
    let p, prim, attr;
    for (p of m.primitives) {
      attr = p.attributes;
      prim = new Primitive();
      if (p.material != void 0 && p.material != null) {
        prim.materialIdx = p.material;
        prim.materialName = json.materials[p.material].name;
      }
      if (this._needsDraco && p?.extensions?.KHR_draco_mesh_compression) {
        if (this._extDraco) {
          const draco = p.extensions.KHR_draco_mesh_compression;
          const bufView = this.json.bufferViews[draco.bufferView];
          this._extDraco.loadMesh(this.bin, bufView.byteOffset, bufView.byteLength);
          this._extDraco.loadPrimitive(prim, draco.attributes, attr, this.json);
        } else {
          console.error("Mesh is draco compressed but ext is not loaded.");
        }
      } else {
        if (p.indices != void 0)
          prim.indices = this.parseAccessor(p.indices);
        if (attr.POSITION && this.isAccessorInterleaved(attr.POSITION)) {
          prim.interleaved = new InterleavedBuffer(attr, this.json, this.bin);
        } else {
          if (attr.POSITION != void 0)
            prim.position = this.parseAccessor(attr.POSITION);
          if (attr.NORMAL != void 0)
            prim.normal = this.parseAccessor(attr.NORMAL);
          if (attr.TANGENT != void 0)
            prim.tangent = this.parseAccessor(attr.TANGENT);
          if (attr.TEXCOORD_0 != void 0)
            prim.texcoord_0 = this.parseAccessor(attr.TEXCOORD_0);
          if (attr.TEXCOORD_1 != void 0)
            prim.texcoord_1 = this.parseAccessor(attr.TEXCOORD_1);
          if (attr.JOINTS_0 != void 0)
            prim.joints_0 = this.parseAccessor(attr.JOINTS_0);
          if (attr.WEIGHTS_0 != void 0)
            prim.weights_0 = this.parseAccessor(attr.WEIGHTS_0);
          if (attr.COLOR_0 != void 0)
            prim.color_0 = this.parseAccessor(attr.COLOR_0);
        }
      }
      mesh.primitives.push(prim);
    }
    const nodes = this.getMeshNodes(mIdx);
    if (nodes?.length) {
      if (nodes[0].translation)
        mesh.position = nodes[0].translation.slice(0);
      if (nodes[0].rotation)
        mesh.rotation = nodes[0].rotation.slice(0);
      if (nodes[0].scale)
        mesh.scale = nodes[0].scale.slice(0);
    }
    if (m?.extras?.targetNames)
      mesh.morphTargets = m.extras.targetNames;
    return mesh;
  }
  getMorphTarget(id, targetName) {
    const [m, mIdx] = this.getMeshElement(id);
    if (m == null || mIdx == null) {
      console.warn("No Mesh Found", id);
      return null;
    }
    if (!m?.extras?.targetNames) {
      console.log("Mesh element does not have any target names");
      return null;
    }
    const mtIdx = m.extras.targetNames.indexOf(targetName);
    if (mtIdx === -1) {
      console.log("Morph target not found in mesh:", targetName);
      return null;
    }
    const mesh = new Mesh();
    mesh.name = targetName;
    mesh.index = mtIdx;
    let p, prim, attr;
    for (p of m.primitives) {
      if (!p.targets)
        continue;
      attr = p.targets[mtIdx];
      if (this._needsDraco && p?.extensions?.KHR_draco_mesh_compression) {
        console.error("getMorphTarget currently does not support draco compression");
        continue;
      }
      if (attr.POSITION && this.isAccessorInterleaved(attr.POSITION)) {
        console.error("getMorphTarget currently does not support interleaved data");
        continue;
      }
      prim = new Primitive();
      if (attr.POSITION != void 0)
        prim.position = this.parseAccessor(attr.POSITION);
      if (attr.NORMAL != void 0)
        prim.normal = this.parseAccessor(attr.NORMAL);
      mesh.primitives.push(prim);
    }
    return mesh;
  }
  getSkinNames() {
    const json = this.json, rtn = [];
    let i;
    for (i of json.skins)
      rtn.push(i.name);
    return rtn;
  }
  getSkinByName(n) {
    let o, i;
    for (i = 0; i < this.json.skins.length; i++) {
      o = this.json.skins[i];
      if (o.name == n)
        return [o, i];
    }
    return null;
  }
  getSkin(id) {
    if (!this.json.skins) {
      console.warn("No Skins in GLTF File");
      return null;
    }
    const json = this.json;
    let js = null;
    let idx = null;
    switch (typeof id) {
      case "string": {
        const tup = this.getSkinByName(id);
        if (tup !== null) {
          js = tup[0];
          idx = tup[1];
        }
        break;
      }
      case "number":
        if (id < json.skins.length) {
          js = json.meshes[id];
          idx = id;
        }
        break;
      default:
        js = json.skins[0];
        idx = 0;
        break;
    }
    if (js == null) {
      console.warn("No Skin Found", id);
      return null;
    }
    const bind = this.parseAccessor(js.inverseBindMatrices);
    if (bind && bind.elementCnt != js.joints.length) {
      console.warn("Strange Error. Joint Count & Bind Matrix Count dont match");
      return null;
    }
    let i, bi, ni, joint, node;
    const jMap = /* @__PURE__ */ new Map();
    const skin = new Skin();
    skin.name = js.name;
    skin.index = idx;
    for (i = 0; i < js.joints.length; i++) {
      ni = js.joints[i];
      node = json.nodes[ni];
      jMap.set(ni, i);
      joint = new SkinJoint();
      joint.index = i;
      joint.name = node.name ? node.name : "bone_" + i;
      joint.rotation = node?.rotation?.slice(0) ?? null;
      joint.position = node?.translation?.slice(0) ?? null;
      joint.scale = node?.scale?.slice(0) ?? null;
      if (bind && bind.data) {
        bi = i * 16;
        joint.bindMatrix = Array.from(bind.data.slice(bi, bi + 16));
      }
      if (joint.scale) {
        if (Math.abs(1 - joint.scale[0]) <= 1e-6)
          joint.scale[0] = 1;
        if (Math.abs(1 - joint.scale[1]) <= 1e-6)
          joint.scale[1] = 1;
        if (Math.abs(1 - joint.scale[2]) <= 1e-6)
          joint.scale[2] = 1;
      }
      skin.joints.push(joint);
    }
    let j;
    for (i = 0; i < js.joints.length; i++) {
      ni = js.joints[i];
      node = json.nodes[ni];
      if (node?.children?.length) {
        for (j = 0; j < node.children.length; j++) {
          bi = jMap.get(node.children[j]);
          if (bi != void 0)
            skin.joints[bi].parentIndex = i;
          else
            console.log("BI", bi, node);
        }
      }
    }
    if (skin.name) {
      const snode = this.getNodeByName(skin.name);
      if (snode) {
        const n = snode[0];
        skin.rotation = n?.rotation?.slice(0) ?? null;
        skin.position = n?.translation?.slice(0) ?? null;
        skin.scale = n?.scale?.slice(0) ?? null;
      }
    }
    return skin;
  }
  getMaterial(id) {
    if (!this.json.materials) {
      console.warn("No Materials in GLTF File");
      return null;
    }
    const json = this.json;
    let idx = -1;
    switch (typeof id) {
      case "number":
        if (id >= json.materials.length) {
          console.error("Material index out of bounds", id);
          break;
        }
        idx = id;
        break;
      case "string":
        for (let i = 0; i < json.materials.length; i++) {
          if (json.materials[i].name === id) {
            idx = i;
            break;
          }
        }
        break;
      default:
        idx = 0;
        break;
    }
    if (idx === -1) {
      console.error("Material not found ", id);
      return null;
    }
    const mat = new Material(json.materials[idx], this);
    mat.index = idx;
    return mat;
  }
  getAllMaterials() {
    const rtn = {};
    if (this.json.materials) {
      let mat;
      for (let i = 0; i < this.json.materials.length; i++) {
        mat = new Material(this.json.materials[i], this);
        mat.index = i;
        rtn[mat.name] = mat;
      }
    }
    return rtn;
  }
  getTexture(id) {
    return Texture.fromIndex(id, this);
  }
  getAnimationNames() {
    const json = this.json, rtn = [];
    let i;
    for (i of json.animations)
      rtn.push(i.name);
    return rtn;
  }
  getAnimationByName(n) {
    let o, i;
    for (i = 0; i < this.json.animations.length; i++) {
      o = this.json.animations[i];
      if (o.name == n)
        return [o, i];
    }
    return null;
  }
  getAnimation(id) {
    if (!this.json.animations) {
      console.warn("No Animations in GLTF File");
      return null;
    }
    const json = this.json;
    let js = null;
    switch (typeof id) {
      case "string": {
        const tup = this.getAnimationByName(id);
        if (tup !== null)
          js = tup[0];
        break;
      }
      case "number":
        if (id < json.animations.length) {
          js = json.animations[id];
        }
        break;
      default:
        js = json.animations[0];
        break;
    }
    if (js == null) {
      console.warn("No Animation Found", id);
      return null;
    }
    const NJMap = /* @__PURE__ */ new Map();
    const timeStamps = [];
    const tsMap = /* @__PURE__ */ new Map();
    const fnGetJoint = (nIdx) => {
      let jIdx = NJMap.get(nIdx);
      if (jIdx != void 0)
        return jIdx;
      for (const skin of this.json.skins) {
        jIdx = skin.joints.indexOf(nIdx);
        if (jIdx != -1 && jIdx != void 0) {
          NJMap.set(nIdx, jIdx);
          return jIdx;
        }
      }
      return -1;
    };
    const fnGetTimestamp = (sIdx) => {
      let aIdx = tsMap.get(sIdx);
      if (aIdx != void 0)
        return aIdx;
      const acc2 = this.parseAccessor(sIdx);
      if (acc2) {
        aIdx = timeStamps.length;
        timeStamps.push(acc2);
        tsMap.set(sIdx, aIdx);
        return aIdx;
      }
      return -1;
    };
    const anim = new Animation(js.name);
    anim.timestamps = timeStamps;
    let track;
    let ch;
    let jointIdx;
    let sampler;
    let acc;
    for (ch of js.channels) {
      jointIdx = fnGetJoint(ch.target.node);
      sampler = js.samplers[ch.sampler];
      track = Track.fromGltf(jointIdx, ch.target.path, sampler.interpolation);
      acc = this.parseAccessor(sampler.output);
      if (acc)
        track.keyframes = acc;
      track.timeStampIndex = fnGetTimestamp(sampler.input);
      anim.tracks.push(track);
    }
    return anim;
  }
  getPoseByName(n) {
    let o, i;
    for (i = 0; i < this.json.poses.length; i++) {
      o = this.json.poses[i];
      if (o.name == n)
        return [o, i];
    }
    return null;
  }
  getPose(id) {
    if (!this.json.poses) {
      console.warn("No Poses in GLTF File");
      return null;
    }
    const json = this.json;
    let js = null;
    switch (typeof id) {
      case "string": {
        const tup = this.getPoseByName(id);
        if (tup !== null)
          js = tup[0];
        break;
      }
      default:
        js = json.poses[0];
        break;
    }
    if (js == null) {
      console.warn("No Pose Found", id);
      return null;
    }
    const pose = new Pose(js.name);
    let jnt;
    for (jnt of js.joints) {
      pose.add(jnt.idx, jnt.rot, jnt.pos, jnt.scl);
    }
    return pose;
  }
  parseAccessor(accID) {
    const accessor = this.json.accessors[accID];
    const bufView = this.json.bufferViews[accessor.bufferView];
    if (!bufView)
      return null;
    if (bufView.byteStride) {
      const compLen = ComponentVarMap[accessor.type];
      const byteSize = ComponentTypeMap[accessor.componentType][0];
      if (bufView.byteStride !== compLen * byteSize) {
        console.error("UNSUPPORTED - Parsing Interleaved Buffer With Accessor Object");
        return null;
      }
    }
    return new Accessor().fromBin(accessor, bufView, this.bin);
  }
  isAccessorInterleaved(accID) {
    const accessor = this.json.accessors[accID];
    const bufView = this.json.bufferViews[accessor.bufferView];
    if (bufView && bufView.byteStride) {
      const compLen = ComponentVarMap[accessor.type];
      const byteSize = ComponentTypeMap[accessor.componentType][0];
      return bufView.byteStride !== compLen * byteSize;
    }
    return false;
  }
  /** @param {string} url */
  static async fetch(url) {
    const res = await fetch(url);
    if (!res.ok)
      return null;
    let parser = null;
    const path = url.substring(0, url.lastIndexOf("/") + 1);
    switch (url.slice(-4).toLocaleLowerCase()) {
      case "gltf": {
        let bin;
        const json = await res.json();
        if (json.buffers && json.buffers.length > 0) {
          bin = await fetch(path + json.buffers[0].uri).then((r) => r.arrayBuffer());
        }
        parser = new Gltf2Parser(json, bin);
        break;
      }
      case ".glb": {
        const tuple = await parseGLB(res);
        if (tuple)
          parser = new Gltf2Parser(tuple[0], tuple[1]);
        break;
      }
    }
    if (parser)
      parser.path = path;
    return parser;
  }
}

export { Accessor, Animation, ELerp, ETransform, Mesh, Pose, Primitive, Skin, SkinJoint, Texture, Track, Gltf2Parser as default, parseGLB };
