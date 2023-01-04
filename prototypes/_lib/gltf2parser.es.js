var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
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
  constructor(accessor, bufView, bin) {
    __publicField(this, "componentLen", 0);
    __publicField(this, "elementCnt", 0);
    __publicField(this, "byteOffset", 0);
    __publicField(this, "byteSize", 0);
    __publicField(this, "boundMin", null);
    __publicField(this, "boundMax", null);
    __publicField(this, "type", null);
    __publicField(this, "data", null);
    const [
      compByte,
      compType,
      typeName
    ] = ComponentTypeMap[accessor.componentType];
    if (!compType) {
      console.error("Unknown Component Type for Accessor", accessor.componentType);
      return;
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
  }
}
class Attrib {
  constructor(accID, json) {
    __publicField(this, "byteOffset", 0);
    __publicField(this, "componentLen", 0);
    __publicField(this, "boundMin", null);
    __publicField(this, "boundMax", null);
    const accessor = json.accessors[accID];
    this.componentLen = ComponentVarMap[accessor.type];
    this.byteOffset = accessor.byteOffset;
    this.boundMin = accessor.min ? accessor.min.slice(0) : null;
    this.boundMax = accessor.max ? accessor.max.slice(0) : null;
  }
}
class InterleavedBuffer {
  constructor(attr, json, bin) {
    __publicField(this, "data", null);
    __publicField(this, "elementCnt", 0);
    __publicField(this, "componentLen", 0);
    __publicField(this, "byteStride", 0);
    __publicField(this, "byteSize", 0);
    __publicField(this, "position", null);
    __publicField(this, "normal", null);
    __publicField(this, "tangent", null);
    __publicField(this, "texcoord_0", null);
    __publicField(this, "texcoord_1", null);
    __publicField(this, "color_0", null);
    __publicField(this, "joints_0", null);
    __publicField(this, "weights_0", null);
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
class Mesh {
  constructor() {
    __publicField(this, "index", null);
    __publicField(this, "name", null);
    __publicField(this, "primitives", []);
    __publicField(this, "position", null);
    __publicField(this, "rotation", null);
    __publicField(this, "scale", null);
  }
}
class Primitive {
  constructor() {
    __publicField(this, "materialName", null);
    __publicField(this, "materialIdx", null);
    __publicField(this, "indices", null);
    __publicField(this, "position", null);
    __publicField(this, "normal", null);
    __publicField(this, "tangent", null);
    __publicField(this, "texcoord_0", null);
    __publicField(this, "texcoord_1", null);
    __publicField(this, "color_0", null);
    __publicField(this, "joints_0", null);
    __publicField(this, "weights_0", null);
    __publicField(this, "interleaved", null);
  }
}
class Skin {
  constructor() {
    __publicField(this, "index", null);
    __publicField(this, "name", null);
    __publicField(this, "joints", []);
    __publicField(this, "position", null);
    __publicField(this, "rotation", null);
    __publicField(this, "scale", null);
  }
}
class SkinJoint {
  constructor() {
    __publicField(this, "name", null);
    __publicField(this, "index", null);
    __publicField(this, "parentIndex", null);
    __publicField(this, "bindMatrix", null);
    __publicField(this, "position", null);
    __publicField(this, "rotation", null);
    __publicField(this, "scale", null);
  }
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
const _Track = class {
  constructor() {
    __publicField(this, "transform", ETransform.Pos);
    __publicField(this, "interpolation", ELerp.Step);
    __publicField(this, "jointIndex", 0);
    __publicField(this, "timeStampIndex", 0);
    __publicField(this, "keyframes");
  }
  static fromGltf(jointIdx, target, inter) {
    const t = new _Track();
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
};
let Track = _Track;
__publicField(Track, "Transform", ETransform);
__publicField(Track, "Lerp", ELerp);
class Animation {
  constructor(name) {
    __publicField(this, "name", "");
    __publicField(this, "timestamps", []);
    __publicField(this, "tracks", []);
    if (name)
      this.name = name;
  }
}
class Texture {
  constructor() {
    __publicField(this, "index", null);
    __publicField(this, "name", null);
    __publicField(this, "mime", null);
    __publicField(this, "blob", null);
  }
}
class PoseJoint {
  constructor(idx, rot, pos, scl) {
    __publicField(this, "index");
    __publicField(this, "rot");
    __publicField(this, "pos");
    __publicField(this, "scl");
    this.index = idx;
    this.rot = rot;
    this.pos = pos;
    this.scl = scl;
  }
}
class Pose {
  constructor(name) {
    __publicField(this, "name", "");
    __publicField(this, "joints", []);
    if (name)
      this.name = name;
  }
  add(idx, rot, pos, scl) {
    this.joints.push(new PoseJoint(idx, rot, pos, scl));
  }
}
class Gltf2Parser {
  constructor(json, bin) {
    __publicField(this, "json");
    __publicField(this, "bin");
    this.json = json;
    this.bin = bin || new ArrayBuffer(0);
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
  getMeshByName(n) {
    let o, i;
    for (i = 0; i < this.json.meshes.length; i++) {
      o = this.json.meshes[i];
      if (o.name == n)
        return [o, i];
    }
    return null;
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
  getMesh(id) {
    if (!this.json.meshes) {
      console.warn("No Meshes in GLTF File");
      return null;
    }
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
    if (m == null || mIdx == null) {
      console.warn("No Mesh Found", id);
      return null;
    }
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
      mesh.primitives.push(prim);
    }
    const nodes = this.getMeshNodes(mIdx);
    if (nodes == null ? void 0 : nodes.length) {
      if (nodes[0].translation)
        mesh.position = nodes[0].translation.slice(0);
      if (nodes[0].rotation)
        mesh.rotation = nodes[0].rotation.slice(0);
      if (nodes[0].scale)
        mesh.scale = nodes[0].scale.slice(0);
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
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
      joint.rotation = (_b = (_a = node == null ? void 0 : node.rotation) == null ? void 0 : _a.slice(0)) != null ? _b : null;
      joint.position = (_d = (_c = node == null ? void 0 : node.translation) == null ? void 0 : _c.slice(0)) != null ? _d : null;
      joint.scale = (_f = (_e = node == null ? void 0 : node.scale) == null ? void 0 : _e.slice(0)) != null ? _f : null;
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
      if ((_g = node == null ? void 0 : node.children) == null ? void 0 : _g.length) {
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
        skin.rotation = (_i = (_h = n == null ? void 0 : n.rotation) == null ? void 0 : _h.slice(0)) != null ? _i : null;
        skin.position = (_k = (_j = n == null ? void 0 : n.translation) == null ? void 0 : _j.slice(0)) != null ? _k : null;
        skin.scale = (_m = (_l = n == null ? void 0 : n.scale) == null ? void 0 : _l.slice(0)) != null ? _m : null;
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
    let mat = null;
    switch (typeof id) {
      case "number":
        if (id < json.materials.length) {
          mat = json.materials[id].pbrMetallicRoughness;
        }
        break;
      default:
        mat = json.materials[0].pbrMetallicRoughness;
        break;
    }
    return mat;
  }
  getTexture(id) {
    const js = this.json;
    const t = js.textures[id];
    const img = js.images[t.source];
    const bv = js.bufferViews[img.bufferView];
    const bAry = new Uint8Array(this.bin, bv.byteOffset, bv.byteLength);
    const tex = new Texture();
    tex.index = id;
    tex.name = img.name;
    tex.mime = img.mimeType;
    tex.blob = new Blob([bAry], { type: img.mimeType });
    return tex;
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
        if (tup !== null) {
          js = tup[0];
        }
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
      for (let skin of this.json.skins) {
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
        if (tup !== null) {
          js = tup[0];
        }
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
    if (bufView.byteStride) {
      const compLen = ComponentVarMap[accessor.type];
      const byteSize = ComponentTypeMap[accessor.componentType][0];
      if (bufView.byteStride !== compLen * byteSize) {
        console.error("UNSUPPORTED - Parsing Interleaved Buffer With Accessor Object");
        return null;
      }
    }
    return new Accessor(accessor, bufView, this.bin);
  }
  isAccessorInterleaved(accID) {
    const accessor = this.json.accessors[accID];
    const bufView = this.json.bufferViews[accessor.bufferView];
    if (bufView.byteStride) {
      const compLen = ComponentVarMap[accessor.type];
      const byteSize = ComponentTypeMap[accessor.componentType][0];
      return bufView.byteStride !== compLen * byteSize;
    }
    return false;
  }
  static async fetch(url) {
    const res = await fetch(url);
    if (!res.ok)
      return null;
    switch (url.slice(-4).toLocaleLowerCase()) {
      case "gltf":
        let bin;
        const json = await res.json();
        if (json.buffers && json.buffers.length > 0) {
          const path = url.substring(0, url.lastIndexOf("/") + 1);
          bin = await fetch(path + json.buffers[0].uri).then((r) => r.arrayBuffer());
        }
        return new Gltf2Parser(json, bin);
      case ".glb":
        const tuple = await parseGLB(res);
        return tuple ? new Gltf2Parser(tuple[0], tuple[1]) : null;
    }
    return null;
  }
}
export { Accessor, Animation, ELerp, ETransform, Mesh, Pose, Primitive, Skin, SkinJoint, Texture, Track, Gltf2Parser as default, parseGLB };
