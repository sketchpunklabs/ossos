import*as THREE from'three';import {Group,PlaneGeometry,Mesh,BufferGeometry,BufferAttribute,MeshBasicMaterial,DoubleSide}from'three';class Vec3 extends Array {
  static UP = [0, 1, 0];
  static DOWN = [0, -1, 0];
  static LEFT = [-1, 0, 0];
  static RIGHT = [1, 0, 0];
  static FORWARD = [0, 0, 1];
  static BACK = [0, 0, -1];
  constructor(v, y, z) {
    super(3);
    if (v instanceof Vec3 || v instanceof Float32Array || v instanceof Array && v.length == 3) {
      this[0] = v[0];
      this[1] = v[1];
      this[2] = v[2];
    } else if (typeof v === "number" && typeof y === "number" && typeof z === "number") {
      this[0] = v;
      this[1] = y;
      this[2] = z;
    } else if (typeof v === "number") {
      this[0] = v;
      this[1] = v;
      this[2] = v;
    } else {
      this[0] = 0;
      this[1] = 0;
      this[2] = 0;
    }
  }
  get len() {
    return Math.sqrt(this[0] ** 2 + this[1] ** 2 + this[2] ** 2);
  }
  get lenSqr() {
    return this[0] ** 2 + this[1] ** 2 + this[2] ** 2;
  }
  clone() {
    return new Vec3(this);
  }
  copy(a) {
    this[0] = a[0];
    this[1] = a[1];
    this[2] = a[2];
    return this;
  }
  fromAdd(a, b) {
    this[0] = a[0] + b[0];
    this[1] = a[1] + b[1];
    this[2] = a[2] + b[2];
    return this;
  }
  fromSub(a, b) {
    this[0] = a[0] - b[0];
    this[1] = a[1] - b[1];
    this[2] = a[2] - b[2];
    return this;
  }
  fromNorm(v) {
    let mag = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
    if (mag == 0)
      return this;
    mag = 1 / mag;
    this[0] = v[0] * mag;
    this[1] = v[1] * mag;
    this[2] = v[2] * mag;
    return this;
  }
  fromScaleThenAdd(scale, a, b) {
    this[0] = a[0] * scale + b[0];
    this[1] = a[1] * scale + b[1];
    this[2] = a[2] * scale + b[2];
    return this;
  }
  fromQuat(q, v) {
    const qx = q[0], qy = q[1], qz = q[2], qw = q[3], vx = v[0], vy = v[1], vz = v[2], x1 = qy * vz - qz * vy, y1 = qz * vx - qx * vz, z1 = qx * vy - qy * vx, x2 = qw * x1 + qy * z1 - qz * y1, y2 = qw * y1 + qz * x1 - qx * z1, z2 = qw * z1 + qx * y1 - qy * x1;
    this[0] = vx + 2 * x2;
    this[1] = vy + 2 * y2;
    this[2] = vz + 2 * z2;
    return this;
  }
  fromCross(a, b) {
    const ax = a[0], ay = a[1], az = a[2], bx = b[0], by = b[1], bz = b[2];
    this[0] = ay * bz - az * by;
    this[1] = az * bx - ax * bz;
    this[2] = ax * by - ay * bx;
    return this;
  }
  fromLerp(a, b, t) {
    const ti = 1 - t;
    this[0] = a[0] * ti + b[0] * t;
    this[1] = a[1] * ti + b[1] * t;
    this[2] = a[2] * ti + b[2] * t;
    return this;
  }
  add(a) {
    this[0] += a[0];
    this[1] += a[1];
    this[2] += a[2];
    return this;
  }
  sub(v) {
    this[0] -= v[0];
    this[1] -= v[1];
    this[2] -= v[2];
    return this;
  }
  mul(v) {
    this[0] *= v[0];
    this[1] *= v[1];
    this[2] *= v[2];
    return this;
  }
  div(v) {
    this[0] /= v[0];
    this[1] /= v[1];
    this[2] /= v[2];
    return this;
  }
  scale(v) {
    this[0] *= v;
    this[1] *= v;
    this[2] *= v;
    return this;
  }
  norm() {
    let mag = Math.sqrt(this[0] ** 2 + this[1] ** 2 + this[2] ** 2);
    if (mag != 0) {
      mag = 1 / mag;
      this[0] *= mag;
      this[1] *= mag;
      this[2] *= mag;
    }
    return this;
  }
  scaleThenAdd(scale, a) {
    this[0] += a[0] * scale;
    this[1] += a[1] * scale;
    this[2] += a[2] * scale;
    return this;
  }
  min(a) {
    this[0] = Math.min(this[0], a[0]);
    this[1] = Math.min(this[1], a[1]);
    this[2] = Math.min(this[2], a[2]);
    return this;
  }
  max(a) {
    this[0] = Math.max(this[0], a[0]);
    this[1] = Math.max(this[1], a[1]);
    this[2] = Math.max(this[2], a[2]);
    return this;
  }
  static len(a) {
    return Math.sqrt(a[0] ** 2 + a[1] ** 2 + a[2] ** 2);
  }
  static lenSqr(a) {
    return a[0] ** 2 + a[1] ** 2 + a[2] ** 2;
  }
  static dist(a, b) {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
  }
  static distSqr(a, b) {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  }
  static dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  static projectScale(from, to) {
    const denom = this.dot(to, to);
    return denom < 1e-6 ? 0 : this.dot(from, to) / denom;
  }
  static angle(a, b) {
    const d = this.dot(a, b), c = new Vec3().fromCross(a, b);
    return Math.atan2(Vec3.len(c), d);
  }
}class Mat4 extends Array {
  constructor() {
    super(16);
    this[0] = 1;
    this[1] = 0;
    this[2] = 0;
    this[3] = 0;
    this[4] = 0;
    this[5] = 1;
    this[6] = 0;
    this[7] = 0;
    this[8] = 0;
    this[9] = 0;
    this[10] = 1;
    this[11] = 0;
    this[12] = 0;
    this[13] = 0;
    this[14] = 0;
    this[15] = 1;
  }
  fromInvert(mat) {
    const a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3], a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7], a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11], a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det)
      return this;
    det = 1 / det;
    this[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    this[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    this[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    this[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    this[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    this[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    this[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    this[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    this[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    this[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    this[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    this[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    this[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    this[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    this[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    this[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return this;
  }
  mul(b) {
    const a00 = this[0], a01 = this[1], a02 = this[2], a03 = this[3], a10 = this[4], a11 = this[5], a12 = this[6], a13 = this[7], a20 = this[8], a21 = this[9], a22 = this[10], a23 = this[11], a30 = this[12], a31 = this[13], a32 = this[14], a33 = this[15];
    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    this[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    this[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    this[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    this[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    this[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    this[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    this[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    this[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    this[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    this[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    this[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    this[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    this[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    this[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    this[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    this[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return this;
  }
  pmul(b) {
    const a00 = b[0], a01 = b[1], a02 = b[2], a03 = b[3], a10 = b[4], a11 = b[5], a12 = b[6], a13 = b[7], a20 = b[8], a21 = b[9], a22 = b[10], a23 = b[11], a30 = b[12], a31 = b[13], a32 = b[14], a33 = b[15];
    let b0 = this[0], b1 = this[1], b2 = this[2], b3 = this[3];
    this[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    this[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    this[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    this[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = this[4];
    b1 = this[5];
    b2 = this[6];
    b3 = this[7];
    this[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    this[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    this[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    this[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = this[8];
    b1 = this[9];
    b2 = this[10];
    b3 = this[11];
    this[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    this[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    this[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    this[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = this[12];
    b1 = this[13];
    b2 = this[14];
    b3 = this[15];
    this[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    this[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    this[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    this[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return this;
  }
  transformVec3(v, out) {
    const x = v[0], y = v[1], z = v[2];
    out = out || v;
    out[0] = this[0] * x + this[4] * y + this[8] * z + this[12];
    out[1] = this[1] * x + this[5] * y + this[9] * z + this[13];
    out[2] = this[2] * x + this[6] * y + this[10] * z + this[14];
    return out;
  }
  transformVec4(v, out) {
    const x = v[0], y = v[1], z = v[2], w = v[3];
    out = out || v;
    out[0] = this[0] * x + this[4] * y + this[8] * z + this[12] * w;
    out[1] = this[1] * x + this[5] * y + this[9] * z + this[13] * w;
    out[2] = this[2] * x + this[6] * y + this[10] * z + this[14] * w;
    out[3] = this[3] * x + this[7] * y + this[11] * z + this[15] * w;
    return out;
  }
}class Ray {
  posStart = new Vec3();
  posEnd = new Vec3();
  direction = new Vec3();
  vecLength = new Vec3();
  fromEndPoints(a, b) {
    this.posStart.copy(a);
    this.posEnd.copy(b);
    this.vecLength.fromSub(b, a);
    this.direction.fromNorm(this.vecLength);
    return this;
  }
  fromScreenProjection(x, y, w, h, projMatrix, camMatrix) {
    const nx = x / w * 2 - 1;
    const ny = 1 - y / h * 2;
    const invMatrix = new Mat4().fromInvert(projMatrix).pmul(camMatrix);
    const clipNear = [nx, ny, -1, 1];
    const clipFar = [nx, ny, 1, 1];
    invMatrix.transformVec4(clipNear);
    invMatrix.transformVec4(clipFar);
    for (let i = 0; i < 3; i++) {
      clipNear[i] /= clipNear[3];
      clipFar[i] /= clipFar[3];
    }
    this.posStart.copy(clipNear);
    this.posEnd.copy(clipFar);
    this.vecLength.fromSub(this.posEnd, this.posStart);
    this.direction.fromNorm(this.vecLength);
    return this;
  }
  posAt(t, out = [0, 0, 0]) {
    out[0] = this.vecLength[0] * t + this.posStart[0];
    out[1] = this.vecLength[1] * t + this.posStart[1];
    out[2] = this.vecLength[2] * t + this.posStart[2];
    return out;
  }
  directionAt(len, out = [0, 0, 0]) {
    out[0] = this.direction[0] * len + this.posStart[0];
    out[1] = this.direction[1] * len + this.posStart[1];
    out[2] = this.direction[2] * len + this.posStart[2];
    return out;
  }
  clone() {
    const r = new Ray();
    r.posStart.copy(this.posStart);
    r.posEnd.copy(this.posEnd);
    r.direction.copy(this.direction);
    r.vecLength.copy(this.vecLength);
    return r;
  }
  transformMat4(m) {
    this.fromEndPoints(
      m.transformVec3(this.posStart, [0, 0, 0]),
      m.transformVec3(this.posEnd, [0, 0, 0])
    );
    return this;
  }
}class EventDispatcher {
  _evt = new EventTarget();
  on(evtName, fn) {
    this._evt.addEventListener(evtName, fn);
    return this;
  }
  off(evtName, fn) {
    this._evt.removeEventListener(evtName, fn);
    return this;
  }
  once(evtName, fn) {
    this._evt.addEventListener(evtName, fn, { once: true });
    return this;
  }
  emit(evtName, data) {
    this._evt.dispatchEvent(
      !data ? new Event(evtName, { bubbles: false, cancelable: true, composed: false }) : new CustomEvent(evtName, { detail: data, bubbles: false, cancelable: true, composed: false })
    );
    return this;
  }
}class MouseHandlers {
  _stopClick = false;
  _isActive = false;
  _actions;
  enabled = true;
  constructor(elm, actions = null) {
    this._actions = actions;
    elm.addEventListener("click", this.onClick);
    elm.addEventListener("pointerdown", this.onPointerDown);
    elm.addEventListener("pointermove", this.onPointerMove);
    elm.addEventListener("pointerup", this.onPointerUp);
  }
  onClick = (e) => {
    if (!this.enabled)
      return;
    if (this._stopClick) {
      e.stopImmediatePropagation();
      this._stopClick = false;
      return;
    }
    if (this._actions?.click)
      this._actions.click(e, eventLocalPos(e));
  };
  onPointerDown = (e) => {
    if (this._actions?.down && this.enabled) {
      const coord = eventLocalPos(e);
      if (this._actions.down(e, coord)) {
        e.preventDefault();
        e.stopPropagation();
        this._stopClick = true;
        this._isActive = true;
      }
    }
  };
  onPointerMove = (e) => {
    if (this._actions?.move && this.enabled) {
      const pos = eventLocalPos(e);
      if (this._isActive) {
        e.target.releasePointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
      }
      this._actions.move(e, pos);
    }
  };
  onPointerUp = (e) => {
    if (!this.enabled)
      return;
    if (this._isActive) {
      e.target.releasePointerCapture(e.pointerId);
      this._isActive = false;
      if (this._actions?.up)
        this._actions.up(e, eventLocalPos(e));
    }
  };
}
function eventLocalPos(e) {
  const rect = e.target.getBoundingClientRect();
  return [
    e.clientX - rect.x,
    e.clientY - rect.y
  ];
}class NearSegmentResult {
  segPosition = [0, 0, 0];
  rayPosition = [0, 0, 0];
  distanceSq = 0;
  distance = 0;
}
function nearSegment(ray, p0, p1, results) {
  const u = new Vec3(p1).sub(p0);
  const v = ray.vecLength;
  const w = new Vec3(p0).sub(ray.posStart);
  const a = Vec3.dot(u, u);
  const b = Vec3.dot(u, v);
  const c = Vec3.dot(v, v);
  const d = Vec3.dot(u, w);
  const e = Vec3.dot(v, w);
  const D = a * c - b * b;
  let tU = 0;
  let tV = 0;
  if (D < 1e-6) {
    tU = 0;
    tV = b > c ? d / b : e / c;
  } else {
    tU = (b * e - c * d) / D;
    tV = (a * e - b * d) / D;
  }
  if (tU < 0 || tU > 1 || tV < 0 || tV > 1)
    return null;
  if (results) {
    const ti = 1 - tU;
    results.segPosition[0] = p0[0] * ti + p1[0] * tU;
    results.segPosition[1] = p0[1] * ti + p1[1] * tU;
    results.segPosition[2] = p0[2] * ti + p1[2] * tU;
    ray.posAt(tV, results.rayPosition);
    results.distanceSq = Vec3.distSqr(results.segPosition, results.rayPosition);
    results.distance = Math.sqrt(results.distanceSq);
  }
  return [tU, tV];
}class LineMovement {
  steps = 0;
  incNeg = true;
  anchor = new Vec3();
  dragPos = new Vec3();
  offset = new Vec3();
  range = 5e3;
  origin = new Vec3();
  direction = new Vec3();
  segStart = new Vec3();
  segEnd = new Vec3();
  result = new NearSegmentResult();
  gizmo = null;
  events;
  constructor(et) {
    this.events = et;
  }
  _reset() {
    this.steps = 0;
    this.range = 5e3;
    this.incNeg = true;
    this.offset.copy([0, 0, 0]);
  }
  setOffset(v) {
    this.offset.copy(v);
    return this;
  }
  setAnchor(v) {
    this.anchor.copy(v);
    return this;
  }
  setDirection(v) {
    this.direction.copy(v);
    return this;
  }
  setOrigin(v) {
    this.origin.copy(v);
    this.anchor.copy(v);
    return this;
  }
  recompute() {
    this.segStart.fromScaleThenAdd(this.range, this.direction, this.origin);
    if (this.incNeg)
      this.segEnd.fromScaleThenAdd(-this.range, this.direction, this.origin);
    else
      this.segEnd.copy(this.origin);
  }
  setSegment(start, end) {
    this.origin.copy(start);
    this.anchor.copy(start);
    this.segStart.copy(start);
    this.segEnd.copy(end);
    return this;
  }
  setGizmo(g) {
    this._reset();
    this.gizmo = g;
    this.gizmo.onLineInit(this);
    return this;
  }
  onUp() {
    this.gizmo?.onLineUpdate(this, true);
    return this;
  }
  onMove(ray) {
    if (nearSegment(ray, this.segStart, this.segEnd, this.result)) {
      if (this.steps === 0)
        this.dragPos.fromAdd(this.result.segPosition, this.offset);
      else {
        const dir = new Vec3(this.result.segPosition).add(this.offset).sub(this.anchor);
        let dist = Vec3.len(dir);
        dir.norm();
        dist = Math.round(dist / this.steps) * this.steps;
        this.dragPos.fromScaleThenAdd(dist, dir, this.anchor);
      }
      this.gizmo?.onLineUpdate(this, false);
      return true;
    }
    return false;
  }
}class ShapePointsMesh extends THREE.Points {
  _defaultShape = 1;
  _defaultSize = 6;
  _defaultColor = 65280;
  _cnt = 0;
  _verts = [];
  _color = [];
  _config = [];
  _dirty = false;
  constructor(initSize = 20) {
    super(
      _newShapePointsMeshGeometry(
        new Float32Array(initSize * 3),
        new Float32Array(initSize * 3),
        new Float32Array(initSize * 2),
        false
      ),
      newShapePointsMeshMaterial()
    );
    this.geometry.setDrawRange(0, 0);
    this.onBeforeRender = () => {
      if (this._dirty)
        this._updateGeometry();
    };
  }
  reset() {
    this._cnt = 0;
    this._verts.length = 0;
    this._color.length = 0;
    this._config.length = 0;
    this.geometry.setDrawRange(0, 0);
    return this;
  }
  add(pos, color = this._defaultColor, size = this._defaultSize, shape = this._defaultShape) {
    this._verts.push(pos[0], pos[1], pos[2]);
    this._color.push(...glColor$1(color));
    this._config.push(size, shape);
    this._cnt++;
    this._dirty = true;
    return this;
  }
  setColorAt(idx, color) {
    const c = glColor$1(color);
    idx *= 3;
    this._color[idx] = c[0];
    this._color[idx + 1] = c[1];
    this._color[idx + 2] = c[2];
    this._dirty = true;
    return this;
  }
  setPosAt(idx, pos) {
    idx *= 3;
    this._verts[idx] = pos[0];
    this._verts[idx + 1] = pos[1];
    this._verts[idx + 2] = pos[2];
    this._dirty = true;
    return this;
  }
  getPosAt(idx) {
    idx *= 3;
    return [
      this._verts[idx + 0],
      this._verts[idx + 1],
      this._verts[idx + 2]
    ];
  }
  _updateGeometry() {
    const geo = this.geometry;
    const bVerts = geo.attributes.position;
    const bColor = geo.attributes.color;
    const bConfig = geo.attributes.config;
    if (this._verts.length > bVerts.array.length || this._color.length > bColor.array.length || this._config.length > bConfig.array.length) {
      if (this.geometry)
        this.geometry.dispose();
      this.geometry = _newShapePointsMeshGeometry(this._verts, this._color, this._config);
      this._dirty = false;
      return;
    }
    bVerts.array.set(this._verts);
    bVerts.count = this._verts.length / 3;
    bVerts.needsUpdate = true;
    bColor.array.set(this._color);
    bColor.count = this._color.length / 3;
    bColor.needsUpdate = true;
    bConfig.array.set(this._config);
    bConfig.count = this._config.length / 2;
    bConfig.needsUpdate = true;
    geo.setDrawRange(0, bVerts.count);
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    this._dirty = false;
  }
}
function _newShapePointsMeshGeometry(aVerts, aColor, aConfig, doCompute = true) {
  const bVerts = new THREE.Float32BufferAttribute(aVerts, 3);
  const bColor = new THREE.Float32BufferAttribute(aColor, 3);
  const bConfig = new THREE.Float32BufferAttribute(aConfig, 2);
  bVerts.setUsage(THREE.DynamicDrawUsage);
  bColor.setUsage(THREE.DynamicDrawUsage);
  bConfig.setUsage(THREE.DynamicDrawUsage);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", bVerts);
  geo.setAttribute("color", bColor);
  geo.setAttribute("config", bConfig);
  if (doCompute) {
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
  }
  return geo;
}
function glColor$1(hex, out = [0, 0, 0]) {
  const NORMALIZE_RGB = 1 / 255;
  out[0] = (hex >> 16 & 255) * NORMALIZE_RGB;
  out[1] = (hex >> 8 & 255) * NORMALIZE_RGB;
  out[2] = (hex & 255) * NORMALIZE_RGB;
  return out;
}
function newShapePointsMeshMaterial() {
  return new THREE.RawShaderMaterial({
    depthTest: false,
    transparent: true,
    uniforms: { u_scale: { value: 20 } },
    vertexShader: `#version 300 es
    in	vec3	position;
    in	vec3	color;
    in	vec2	config;
    
    uniform 	mat4	modelViewMatrix;
    uniform 	mat4	projectionMatrix;
    uniform 	float	u_scale;

    out 	    vec3	fragColor;
    flat out    int     fragShape;
    
    void main(){
        vec4 wPos 	        = modelViewMatrix * vec4( position.xyz, 1.0 );
        
        fragColor			= color;
        fragShape			= int( config.y );

        gl_Position			= projectionMatrix * wPos;
        gl_PointSize		= config.x * ( u_scale / -wPos.z );

        // Get pnt to be World Space Size
        //gl_PointSize = view_port_size.y * projectionMatrix[1][5] * 1.0 / gl_Position.w;
        //gl_PointSize = view_port_size.y * projectionMatrix[1][1] * 1.0 / gl_Position.w;
    }`,
    fragmentShader: `#version 300 es
    precision mediump float;

    #define PI	3.14159265359
    #define PI2	6.28318530718

    in   vec3       fragColor;
    flat in int     fragShape;
    out  vec4		outColor;

    float circle(){ 
        vec2 coord      = gl_PointCoord * 2.0 - 1.0; // v_uv * 2.0 - 1.0;
        float radius    = dot( coord, coord );
        float dxdy      = fwidth( radius );
        return smoothstep( 0.90 + dxdy, 0.90 - dxdy, radius );
    }
    
    float ring( float inner ){ 
        vec2 coord      = gl_PointCoord * 2.0 - 1.0;
        float radius    = dot( coord, coord );
        float dxdy      = fwidth( radius );
        return  smoothstep( inner - dxdy, inner + dxdy, radius ) - 
                smoothstep( 1.0 - dxdy, 1.0 + dxdy, radius );
    }
    
    float diamond(){
        // http://www.numb3r23.net/2015/08/17/using-fwidth-for-distance-based-anti-aliasing/
        const float radius = 0.5;
    
        float dst   = dot( abs(gl_PointCoord-vec2(0.5)), vec2(1.0) );
        float aaf   = fwidth( dst );
        return 1.0 - smoothstep( radius - aaf, radius, dst );
    }
    
    float poly( int sides, float offset, float scale ){
        // https://thebookofshaders.com/07/
        vec2 coord = gl_PointCoord * 2.0 - 1.0;
        
        coord.y += offset;
        coord *= scale;
    
        float a = atan( coord.x, coord.y ) + PI; 	// Angle of Pixel
        float r = PI2 / float( sides ); 			// Radius of Pixel
        float d = cos( floor( 0.5 + a / r ) * r-a ) * length( coord );
        float f = fwidth( d );
        return smoothstep( 0.5, 0.5 - f, d );
    }

    // signed distance to a n-star polygon with external angle en
    float sdStar( float r, int n, float m ){ // m=[2,n]
        vec2 p = vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y ) * 2.0 - 1.0;

        // these 4 lines can be precomputed for a given shape
        float an = 3.141593/float(n);
        float en = 3.141593/m;
        vec2  acs = vec2(cos(an),sin(an));
        vec2  ecs = vec2(cos(en),sin(en)); // ecs=vec2(0,1) and simplify, for regular polygon,
    
        // reduce to first sector
        float bn = mod(atan(p.x,p.y),2.0*an) - an;
        p = length(p)*vec2(cos(bn),abs(sin(bn)));
    
        // line sdf
        p -= r*acs;
        p += ecs*clamp( -dot(p,ecs), 0.0, r*acs.y/ecs.y);

        float dist = length(p)*sign(p.x);
        float f = fwidth( dist );

        return smoothstep( 0.0, 0.0 - f, dist );
    }
    

    void main(){
        float alpha = 1.0;

        if( fragShape == 1 ) alpha = circle();
        if( fragShape == 2 ) alpha = diamond();
        if( fragShape == 3 ) alpha = poly( 3, 0.2, 1.0 );	// Triangle
        if( fragShape == 4 ) alpha = poly( 5, 0.0, 0.65 );  // Pentagram
        if( fragShape == 5 ) alpha = poly( 6, 0.0, 0.65 );	// Hexagon
        if( fragShape == 6 ) alpha = ring( 0.2 );
        if( fragShape == 7 ) alpha = ring( 0.7 );
        if( fragShape == 8 ) alpha = sdStar( 1.0, 3, 2.3 );
        if( fragShape == 9 ) alpha = sdStar( 1.0, 6, 2.5 );
        if( fragShape == 10 ) alpha = sdStar( 1.0, 4, 2.4 );
        if( fragShape == 11 ) alpha = sdStar( 1.0, 5, 2.8 );

        outColor = vec4( fragColor, alpha );
    }`
  });
}class DynLineMesh extends THREE.LineSegments {
  _defaultColor = 65280;
  _cnt = 0;
  _verts = [];
  _color = [];
  _config = [];
  _dirty = false;
  constructor(initSize = 20) {
    super(
      _newDynLineMeshGeometry(
        new Float32Array(initSize * 2 * 3),
        new Float32Array(initSize * 2 * 3),
        new Float32Array(initSize * 2 * 1),
        false
      ),
      newDynLineMeshMaterial()
    );
    this.geometry.setDrawRange(0, 0);
    this.onBeforeRender = () => {
      if (this._dirty)
        this._updateGeometry();
    };
  }
  reset() {
    this._cnt = 0;
    this._verts.length = 0;
    this._color.length = 0;
    this._config.length = 0;
    this.geometry.setDrawRange(0, 0);
    return this;
  }
  add(p0, p1, color0 = this._defaultColor, color1 = null, isDash = false) {
    this._verts.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2]);
    this._color.push(...glColor(color0), ...glColor(color1 != null ? color1 : color0));
    if (isDash) {
      const len = Math.sqrt(
        (p1[0] - p0[0]) ** 2 + (p1[1] - p0[1]) ** 2 + (p1[2] - p0[2]) ** 2
      );
      this._config.push(0, len);
    } else {
      this._config.push(0, 0);
    }
    this._cnt++;
    this._dirty = true;
    return this;
  }
  _updateGeometry() {
    const geo = this.geometry;
    const bVerts = geo.attributes.position;
    const bColor = geo.attributes.color;
    const bConfig = geo.attributes.config;
    if (this._verts.length > bVerts.array.length || this._color.length > bColor.array.length || this._config.length > bConfig.array.length) {
      if (this.geometry)
        this.geometry.dispose();
      this.geometry = _newDynLineMeshGeometry(this._verts, this._color, this._config);
      this._dirty = false;
      return;
    }
    bVerts.array.set(this._verts);
    bVerts.count = this._verts.length / 3;
    bVerts.needsUpdate = true;
    bColor.array.set(this._color);
    bColor.count = this._color.length / 3;
    bColor.needsUpdate = true;
    bConfig.array.set(this._config);
    bConfig.count = this._config.length / 1;
    bConfig.needsUpdate = true;
    geo.setDrawRange(0, bVerts.count);
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    this._dirty = false;
  }
}
function _newDynLineMeshGeometry(aVerts, aColor, aConfig, doCompute = true) {
  const bVerts = new THREE.Float32BufferAttribute(aVerts, 3);
  const bColor = new THREE.Float32BufferAttribute(aColor, 3);
  const bConfig = new THREE.Float32BufferAttribute(aConfig, 1);
  bVerts.setUsage(THREE.DynamicDrawUsage);
  bColor.setUsage(THREE.DynamicDrawUsage);
  bConfig.setUsage(THREE.DynamicDrawUsage);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", bVerts);
  geo.setAttribute("color", bColor);
  geo.setAttribute("config", bConfig);
  if (doCompute) {
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
  }
  return geo;
}
function glColor(hex, out = [0, 0, 0]) {
  const NORMALIZE_RGB = 1 / 255;
  out[0] = (hex >> 16 & 255) * NORMALIZE_RGB;
  out[1] = (hex >> 8 & 255) * NORMALIZE_RGB;
  out[2] = (hex & 255) * NORMALIZE_RGB;
  return out;
}
function newDynLineMeshMaterial() {
  return new THREE.RawShaderMaterial({
    depthTest: false,
    transparent: true,
    uniforms: {
      dashSeg: { value: 1 / 0.07 },
      dashDiv: { value: 0.4 }
    },
    vertexShader: `#version 300 es
    in	vec3    position;
    in	vec3    color;
    in	float   config;
    
    uniform     mat4    modelViewMatrix;
    uniform     mat4    projectionMatrix;
    uniform     float   u_scale;

    out 	    vec3    fragColor;
    out         float   fragLen;
    
    void main(){
        vec4 wPos 	        = modelViewMatrix * vec4( position, 1.0 );
        
        fragColor			= color;
        fragLen			    = config;

        gl_Position			= projectionMatrix * wPos;
    }`,
    fragmentShader: `#version 300 es
    precision mediump float;

    uniform float dashSeg;
    uniform float dashDiv;

    in  vec3    fragColor;
    in  float   fragLen;
    out vec4    outColor;

    void main(){
        float alpha = 1.0;
        if( fragLen > 0.0 ) alpha = step( dashDiv, fract( fragLen * dashSeg ) );
        outColor = vec4( fragColor, alpha );
    }`
  });
}class LineMovementRender extends Group {
  _anchor = new ShapePointsMesh();
  _pnt = new ShapePointsMesh();
  _ln = new DynLineMesh();
  constructor() {
    super();
    this._pnt.add([0, 0, 0], 65280, 3);
    this._anchor.add([0, 0, 0], 16777215, 3);
    this.add(this._pnt);
    this.add(this._ln);
    this.add(this._anchor);
    this.visible = false;
  }
  render(action) {
    this._pnt.position.fromArray(action.dragPos);
  }
  postRender(_action) {
    this.visible = false;
  }
  preRender(action) {
    this._pnt.position.fromArray(action.anchor);
    this._anchor.position.fromArray(action.anchor);
    this._ln.reset();
    this._ln.add(action.segStart, action.segEnd, 7368816);
    this.visible = true;
  }
}function intersectPlane(ray, planePos, planeNorm) {
  const denom = Vec3.dot(ray.vecLength, planeNorm);
  if (denom <= 1e-6 && denom >= -1e-6)
    return null;
  const v = [
    planePos[0] - ray.posStart[0],
    planePos[1] - ray.posStart[1],
    planePos[2] - ray.posStart[2]
  ];
  const t = Vec3.dot(v, planeNorm) / denom;
  return t >= 0 ? t : null;
}class Quat extends Array {
  constructor(v) {
    super(4);
    if (v instanceof Quat || v instanceof Float32Array || v instanceof Array && v.length == 4) {
      this[0] = v[0];
      this[1] = v[1];
      this[2] = v[2];
      this[3] = v[3];
    } else {
      this[0] = 0;
      this[1] = 0;
      this[2] = 0;
      this[3] = 1;
    }
  }
  copy(a) {
    this[0] = a[0];
    this[1] = a[1];
    this[2] = a[2];
    this[3] = a[3];
    return this;
  }
  fromAxisAngle(axis, rad) {
    const half = rad * 0.5;
    const s = Math.sin(half);
    this[0] = axis[0] * s;
    this[1] = axis[1] * s;
    this[2] = axis[2] * s;
    this[3] = Math.cos(half);
    return this;
  }
  fromAxes(xAxis, yAxis, zAxis) {
    const m00 = xAxis[0], m01 = xAxis[1], m02 = xAxis[2], m10 = yAxis[0], m11 = yAxis[1], m12 = yAxis[2], m20 = zAxis[0], m21 = zAxis[1], m22 = zAxis[2], t = m00 + m11 + m22;
    let x, y, z, w, s;
    if (t > 0) {
      s = Math.sqrt(t + 1);
      w = s * 0.5;
      s = 0.5 / s;
      x = (m12 - m21) * s;
      y = (m20 - m02) * s;
      z = (m01 - m10) * s;
    } else if (m00 >= m11 && m00 >= m22) {
      s = Math.sqrt(1 + m00 - m11 - m22);
      x = 0.5 * s;
      s = 0.5 / s;
      y = (m01 + m10) * s;
      z = (m02 + m20) * s;
      w = (m12 - m21) * s;
    } else if (m11 > m22) {
      s = Math.sqrt(1 + m11 - m00 - m22);
      y = 0.5 * s;
      s = 0.5 / s;
      x = (m10 + m01) * s;
      z = (m21 + m12) * s;
      w = (m20 - m02) * s;
    } else {
      s = Math.sqrt(1 + m22 - m00 - m11);
      z = 0.5 * s;
      s = 0.5 / s;
      x = (m20 + m02) * s;
      y = (m21 + m12) * s;
      w = (m01 - m10) * s;
    }
    this[0] = x;
    this[1] = y;
    this[2] = z;
    this[3] = w;
    return this;
  }
  fromLook(dir, up = [0, 1, 0]) {
    const zAxis = new Vec3(dir).norm();
    const xAxis = new Vec3().fromCross(up, zAxis).norm();
    const yAxis = new Vec3().fromCross(zAxis, xAxis).norm();
    const m00 = xAxis[0], m01 = xAxis[1], m02 = xAxis[2], m10 = yAxis[0], m11 = yAxis[1], m12 = yAxis[2], m20 = zAxis[0], m21 = zAxis[1], m22 = zAxis[2], t = m00 + m11 + m22;
    let x, y, z, w, s;
    if (t > 0) {
      s = Math.sqrt(t + 1);
      w = s * 0.5;
      s = 0.5 / s;
      x = (m12 - m21) * s;
      y = (m20 - m02) * s;
      z = (m01 - m10) * s;
    } else if (m00 >= m11 && m00 >= m22) {
      s = Math.sqrt(1 + m00 - m11 - m22);
      x = 0.5 * s;
      s = 0.5 / s;
      y = (m01 + m10) * s;
      z = (m02 + m20) * s;
      w = (m12 - m21) * s;
    } else if (m11 > m22) {
      s = Math.sqrt(1 + m11 - m00 - m22);
      y = 0.5 * s;
      s = 0.5 / s;
      x = (m10 + m01) * s;
      z = (m21 + m12) * s;
      w = (m20 - m02) * s;
    } else {
      s = Math.sqrt(1 + m22 - m00 - m11);
      z = 0.5 * s;
      s = 0.5 / s;
      x = (m20 + m02) * s;
      y = (m21 + m12) * s;
      w = (m01 - m10) * s;
    }
    this[0] = x;
    this[1] = y;
    this[2] = z;
    this[3] = w;
    return this;
  }
  mul(q) {
    const ax = this[0], ay = this[1], az = this[2], aw = this[3], bx = q[0], by = q[1], bz = q[2], bw = q[3];
    this[0] = ax * bw + aw * bx + ay * bz - az * by;
    this[1] = ay * bw + aw * by + az * bx - ax * bz;
    this[2] = az * bw + aw * bz + ax * by - ay * bx;
    this[3] = aw * bw - ax * bx - ay * by - az * bz;
    return this;
  }
  pmul(q) {
    const ax = q[0], ay = q[1], az = q[2], aw = q[3], bx = this[0], by = this[1], bz = this[2], bw = this[3];
    this[0] = ax * bw + aw * bx + ay * bz - az * by;
    this[1] = ay * bw + aw * by + az * bx - ax * bz;
    this[2] = az * bw + aw * bz + ax * by - ay * bx;
    this[3] = aw * bw - ax * bx - ay * by - az * bz;
    return this;
  }
  norm() {
    let len = this[0] ** 2 + this[1] ** 2 + this[2] ** 2 + this[3] ** 2;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
      this[0] *= len;
      this[1] *= len;
      this[2] *= len;
      this[3] *= len;
    }
    return this;
  }
}class PlaneMovement {
  dragPos = new Vec3();
  dragDir = new Vec3();
  dragAngle = 0;
  steps = 0;
  scale = 1;
  origin = new Vec3();
  xAxis = new Vec3(1, 0, 0);
  yAxis = new Vec3(0, 1, 0);
  zAxis = new Vec3(0, 0, 1);
  rotation = new Quat();
  gizmo = null;
  events;
  constructor(et) {
    this.events = et;
  }
  _reset() {
    this.steps = 0;
    this.scale = 1;
  }
  setOrigin(v) {
    this.origin.copy(v);
    return this;
  }
  setQuatDir(q) {
    this.xAxis.fromQuat(q, [1, 0, 0]);
    this.yAxis.fromQuat(q, [0, 1, 0]);
    this.zAxis.fromQuat(q, [0, 0, 1]);
    this.rotation.copy(q);
    return this;
  }
  setAxes(x, y, z) {
    this.xAxis.copy(x);
    this.yAxis.copy(y);
    this.zAxis.copy(z);
    this.rotation.fromAxes(x, y, z);
    return this;
  }
  setScale(s) {
    this.scale = s;
    return this;
  }
  setGizmo(g) {
    this._reset();
    this.gizmo = g;
    this.gizmo.onPlaneInit(this);
    return this;
  }
  onUp() {
    this.gizmo?.onPlaneUpdate(this, true);
  }
  onMove(ray) {
    const t = intersectPlane(ray, this.origin, this.zAxis);
    if (t == null)
      return false;
    if (this.steps === 0)
      ray.posAt(t, this.dragPos);
    else {
      ray.posAt(t, this.dragPos);
      this.dragPos.sub(this.origin);
      const xDist = Math.round(Vec3.projectScale(this.dragPos, this.xAxis) / this.steps) * this.steps;
      const yDist = Math.round(Vec3.projectScale(this.dragPos, this.yAxis) / this.steps) * this.steps;
      this.dragPos.copy(this.origin).scaleThenAdd(xDist, this.xAxis).scaleThenAdd(yDist, this.yAxis);
    }
    this.dragDir.fromSub(this.dragPos, this.origin).norm();
    this.dragAngle = Vec3.angle(this.yAxis, this.dragDir);
    if (Vec3.dot(this.dragDir, this.xAxis) > 0)
      this.dragAngle = -this.dragAngle;
    this.gizmo?.onPlaneUpdate(this, false);
    return true;
  }
}function AngleViewMaterials() {
  const mat = new THREE.RawShaderMaterial({
    depthTest: true,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {
      radArc: { type: "float", value: 45 * Math.PI / 180 },
      radAngle: { type: "float", value: 0 }
    },
    extensions: {
      derivatives: true
    },
    vertexShader: `#version 300 es
        in	vec3    position;
        in  vec3    normal;
        in	vec2    uv;
        
        uniform     mat4    modelMatrix;
        uniform     mat4    viewMatrix;
        uniform     mat4    projectionMatrix;

        out vec3    fragWPos;  // World Space Position
        out vec3    fragNorm;
        out vec2    fragUV;
        
        // ################################################################

        void main(){
            vec4 wPos 	        = modelMatrix * vec4( position, 1.0 );  // World Space
            vec4 vPos           = viewMatrix * wPos;               // View Space
            
            fragUV              = uv;
            fragWPos            = wPos.xyz;
            fragNorm            = ( modelMatrix * vec4( normal, 0.0 ) ).xyz;

            gl_Position			= projectionMatrix * vPos;
        }`,
    fragmentShader: `#version 300 es
        precision mediump float;

        in  vec3    fragWPos;
        in  vec3    fragNorm;
        in  vec2    fragUV;
        out vec4    outColor;

        uniform float radArc;
        uniform float radAngle;

        // ################################################################

        float ring( vec2 coord, float outer, float inner ){ 
            float radius = dot( coord, coord );
            float dxdy   = fwidth( radius );
            return  smoothstep( inner - dxdy, inner + dxdy, radius ) - 
                    smoothstep( outer - dxdy, outer + dxdy, radius );
        }

        float circle( vec2 coord, float outer ){ 
            float radius = dot( coord, coord );
            float dxdy   = fwidth( radius );
            return 1.0 - smoothstep( outer - dxdy, outer + dxdy, radius );
        }

        // https://www.shadertoy.com/view/XtXyDn
        float arc( vec2 uv, vec2 up, float angle, float radius, float thick ){
            float hAngle = angle * 0.5;

            // vector from the circle origin to the middle of the arc
            float c  = cos( hAngle );
            
            // smoothing perpendicular to the arc
            float d1 = abs( length( uv ) - radius ) - thick;
            float w1 = 1.5 * fwidth( d1 ); // proportional to how much d1 change between pixels
            float s1 = smoothstep( w1 * 0.5, -w1 * 0.5, d1 ); 

            // smoothing along the arc
            float d2 = dot( up, normalize( uv ) ) - c;
            float w2 = 1.5 * fwidth( d2 ); // proportional to how much d2 changes between pixels
            float s2 = smoothstep( w2 * 0.5, -w2 * 0.5, d2 ); 

            // mix perpendicular and parallel smoothing
            return s1 * ( 1.0 - s2 );
        }

        // ################################################################

        void main(){
            vec2  uv    = fragUV * 2.0 - 1.0;  // Remap 0:1 to -1:1
            // vec3 norm   = normalize( fragNorm );
            // outColor    = vec4( norm, 1.0 );

            float mask  = 0.0;
            float radOffset = radians( 90.0 );
            // float radAngle  = radians( 0.0 ) + radOffset;
            // float radArc    = radians( 90.0 );

            float radDir    = radAngle + radOffset + radArc * 0.5;
            vec2  centerDir = vec2( cos( radDir ), sin( radDir ) );

            mask = arc( uv, centerDir, radArc, 0.60, 0.25 );
            mask = max( mask, ring( uv, 0.98, 0.85 ) );
            mask = max( mask, circle( uv, 0.08 ) );
            
            outColor.rgb = vec3( mask );
            outColor.a   = mask;
        }`
  });
  Object.defineProperty(mat, "degAngle", {
    set: (v) => {
      mat.uniforms.radAngle.value = v * Math.PI / 180;
    }
  });
  Object.defineProperty(mat, "degArc", {
    set: (v) => {
      mat.uniforms.radArc.value = v * Math.PI / 180;
    }
  });
  Object.defineProperty(mat, "radArc", {
    set: (v) => {
      mat.uniforms.radArc.value = v;
    }
  });
  return mat;
}class AngleMovementRender extends Group {
  _pnt = new ShapePointsMesh();
  _ln = new DynLineMesh();
  mesh;
  mat;
  constructor() {
    super();
    this.visible = false;
    this.mat = AngleViewMaterials();
    const geo = new PlaneGeometry(2, 2);
    this.mesh = new Mesh(geo, this.mat);
    this.add(this.mesh);
    this.add(this._ln);
    this.add(this._pnt);
  }
  render(action) {
    this._pnt.reset().add(action.dragPos, 16777215, 5, 2);
    this._ln.reset().add(action.origin, action.dragPos, 16777215);
    this.mat.radArc = action.dragAngle;
  }
  postRender() {
    this.visible = false;
  }
  preRender(action) {
    this.mesh.position.fromArray(action.origin);
    this.mesh.quaternion.fromArray(action.rotation);
    this.mesh.scale.setScalar(action.scale);
    this.visible = true;
  }
}class Gizmos {
  ray = new Ray();
  events = new EventDispatcher();
  mouse;
  canvas;
  scene;
  camera;
  list = [];
  dragGizmo = null;
  dragAction = null;
  activeGizmo = null;
  actions = {
    line: { handler: new LineMovement(this.events), renderer: new LineMovementRender() },
    angle: { handler: new PlaneMovement(this.events), renderer: new AngleMovementRender() }
  };
  constructor(renderer, camera, scene) {
    this.canvas = renderer.domElement;
    this.camera = camera;
    this.scene = scene;
    this.mouse = new MouseHandlers(this.canvas, { down: this.onDown, move: this.onMove, up: this.onUp });
    scene.add(this.actions.line.renderer);
    scene.add(this.actions.angle.renderer);
  }
  add(g) {
    this.list.push(g);
    this.scene.add(g);
    return this;
  }
  updateCameraScale() {
    const pos = this.camera.position.toArray();
    for (const g of this.list) {
      if (g.visible)
        g.onCameraScale(pos);
    }
  }
  _updateRay(pos) {
    const rect = this.canvas.getBoundingClientRect();
    const camProj = this.camera.projectionMatrix.toArray();
    const camWorld = this.camera.matrixWorld.toArray();
    this.ray.fromScreenProjection(pos[0], pos[1], rect.width, rect.height, camProj, camWorld);
  }
  onDown = (_e, pos) => {
    this._updateRay(pos);
    let minDist = Infinity;
    let minGizmo = null;
    let minAction = "";
    let action = null;
    let dist;
    let g;
    for (g of this.list) {
      if (g.visible && (action = g.onDown(this.ray, this))) {
        dist = Vec3.distSqr(g.state.position, this.ray.posStart);
        if (dist < minDist) {
          minGizmo = g;
          minAction = action;
          minDist = dist;
        }
      }
    }
    if (minGizmo) {
      if (this.activeGizmo !== minGizmo) {
        this.activeGizmo = minGizmo;
        this.events.emit("activeGizmo", { gizmo: minGizmo, name: minGizmo.constructor.name });
      }
      if (minAction !== "none") {
        this.dragGizmo = minGizmo;
        this.dragGizmo.onDragStart();
        this.dragAction = this.actions[minAction];
        this.dragAction.handler.setGizmo(minGizmo);
        this.dragAction.renderer.preRender(this.dragAction.handler);
        this.events.emit("dragStart");
      }
      return true;
    }
    return false;
  };
  onUp = () => {
    if (this.dragGizmo) {
      this.dragAction.handler.onUp();
      this.dragAction.renderer.postRender();
      this.dragAction = null;
      this.dragGizmo.onDragEnd();
      this.dragGizmo.onUp();
      this.dragGizmo = null;
      this.events.emit("dragStop");
    }
  };
  onMove = (_e, pos) => {
    this._updateRay(pos);
    if (this.dragGizmo) {
      this.dragAction.handler.onMove(this.ray);
      this.dragAction.renderer.render(this.dragAction.handler);
    } else {
      for (const g of this.list) {
        if (g.visible)
          g.onHover(this.ray);
      }
    }
  };
}function intersectSphere(ray, origin, radius, results) {
  const radiusSq = radius * radius;
  const rayToCenter = new Vec3(origin).sub(ray.posStart);
  const tProj = Vec3.dot(rayToCenter, ray.direction);
  const oppLenSq = Vec3.lenSqr(rayToCenter) - tProj * tProj;
  if (oppLenSq > radiusSq)
    return false;
  if (results) {
    if (oppLenSq == radiusSq) {
      results.tMin = tProj;
      results.tMax = tProj;
      ray.directionAt(tProj, results.posEntry);
      results.posExit[0] = results.posEntry[0];
      results.posExit[1] = results.posEntry[1];
      results.posExit[2] = results.posEntry[2];
      return true;
    }
    const oLen = Math.sqrt(radiusSq - oppLenSq);
    const t0 = tProj - oLen;
    const t1 = tProj + oLen;
    if (t1 < t0) {
      results.tMin = t1;
      results.tMax = t0;
    } else {
      results.tMin = t0;
      results.tMax = t1;
    }
    ray.directionAt(t0, results.posEntry);
    ray.directionAt(t1, results.posExit);
  }
  return true;
}class StateProxy {
  static new(data = {}) {
    return new Proxy(data, new StateProxy(data));
  }
  data;
  events = new EventTarget();
  constructor(data) {
    this.data = data;
  }
  update(struct, emitChange = false) {
    Object.assign(this.data, struct);
    if (emitChange)
      this.emit("change", null);
    return this;
  }
  get(target, prop, receiver) {
    if (prop === "$")
      return this;
    return Reflect.get(target, prop, receiver);
  }
  set(target, prop, value) {
    if (prop === "$")
      return false;
    if (Reflect.get(target, prop) !== value) {
      Reflect.set(target, prop, value);
      this.emit(prop + "Change", value);
      this.emit("change", { prop, value });
    }
    return true;
  }
  on(evtName, fn) {
    this.events.addEventListener(evtName, fn);
    return this;
  }
  off(evtName, fn) {
    this.events.removeEventListener(evtName, fn);
    return this;
  }
  once(evtName, fn) {
    this.events.addEventListener(evtName, fn, { once: true });
    return this;
  }
  emit(evtName, data) {
    this.events.dispatchEvent(new CustomEvent(evtName, { detail: data, bubbles: false, cancelable: true, composed: false }));
    return this;
  }
}class TranslateGizmo extends Group {
  _ln = new DynLineMesh();
  _hitPos = new Vec3();
  _xAxis = new Vec3([1, 0, 0]);
  _yAxis = new Vec3([0, 1, 0]);
  _zAxis = new Vec3([0, 0, 1]);
  _axes = [this._xAxis, this._yAxis, this._zAxis];
  _result = new NearSegmentResult();
  _camScale = 1;
  _range = 0.1;
  _selAxis = -1;
  _isDirty = false;
  state = StateProxy.new({
    scaleFactor: 6,
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    target: null
  });
  constructor() {
    super();
    const proxy = this.state.$;
    proxy.on("change", this.onStateChange);
    this.add(this._ln);
    this.render();
  }
  onStateChange = (e) => {
    switch (e.detail.prop) {
      case "rotation": {
        this._xAxis.fromQuat(this.state.rotation, [1, 0, 0]);
        this._yAxis.fromQuat(this.state.rotation, [0, 1, 0]);
        this._zAxis.fromQuat(this.state.rotation, [0, 0, 1]);
        this.render();
        break;
      }
      case "target": {
        if (e.detail.value) {
          const pos = e.detail.value.position.toArray();
          this.state.$.update({ position: pos }, false);
          this.position.fromArray(pos);
        }
        break;
      }
      case "position":
        this.position.fromArray(this.state.position);
        this.state.target?.position.fromArray(this.state.position);
        break;
    }
  };
  forceScale(scl) {
    this._camScale = scl;
    this._xAxis.norm().scale(scl);
    this._yAxis.norm().scale(scl);
    this._zAxis.norm().scale(scl);
    this.render();
  }
  onCameraScale(camPos) {
    const scl = Vec3.dist(camPos, this.state.position) / this.state.scaleFactor;
    if (scl !== this._camScale)
      this.forceScale(scl);
  }
  onHover(ray) {
    const hit = this._isHit(ray);
    if (this._isDirty) {
      this._isDirty = false;
      this.render();
    }
    return hit;
  }
  onDown(ray) {
    return this._isHit(ray) ? "line" : null;
  }
  onUp() {
    this._selAxis = -1;
    this._isDirty = false;
    this.render();
  }
  onDragStart() {
  }
  onDragEnd() {
  }
  onLineInit(action) {
    action.steps = 0;
    action.incNeg = true;
    const tmp = new Vec3(this.state.position).sub(this._hitPos);
    action.setOffset(tmp);
    action.setDirection(this._axes[this._selAxis]);
    action.setOrigin(this.state.position);
    action.recompute();
  }
  onLineUpdate(action, isDone) {
    const pos = action.dragPos.slice();
    this.state.position = pos;
    action.events.emit("translate", { position: pos, gizmo: this, isDone });
  }
  _isHit(ray) {
    const origin = this.state.position;
    const v = new Vec3();
    const rng = this._range * this._camScale;
    let sel = -1;
    let min = Infinity;
    let axis;
    if (intersectSphere(ray, origin, this._camScale)) {
      for (let i = 0; i < 3; i++) {
        axis = this._axes[i];
        v.fromScaleThenAdd(1, axis, origin);
        if (nearSegment(ray, origin, v, this._result)) {
          if (this._result.distance > rng || this._result.distance >= min)
            continue;
          sel = i;
          min = this._result.distance;
          this._hitPos.copy(this._result.segPosition);
        }
      }
    }
    if (this._selAxis !== sel)
      this._isDirty = true;
    this._selAxis = sel;
    return min !== Infinity;
  }
  render() {
    const sel = this._selAxis;
    this._ln.reset();
    this._ln.add([0, 0, 0], this._xAxis, sel === 0 ? 16777215 : 255);
    this._ln.add([0, 0, 0], this._yAxis, sel === 1 ? 16777215 : 65280);
    this._ln.add([0, 0, 0], this._zAxis, sel === 2 ? 16777215 : 16711680);
  }
}class Util3JS {
  static geoBuffer(props) {
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(props.vertices, 3));
    if (props.indices)
      geo.setIndex(new BufferAttribute(props.indices, 1));
    if (props.normal)
      geo.setAttribute("normal", new BufferAttribute(props.normal, 3));
    if (props.uv)
      geo.setAttribute("uv", new BufferAttribute(props.uv, 2));
    return geo;
  }
}function tearShape(radius = 1, steps = 24, power = 8, pull = 0.4) {
  const hStep = steps / 2;
  const inc = Math.PI * 2 / steps;
  const arc = [];
  let v = [0, 0, 0];
  let rad;
  let r;
  let i;
  for (i = 0; i <= hStep; i++) {
    rad = inc * i + Math.PI * 0.5;
    r = i <= hStep ? (1 - i / hStep) ** power * pull + radius : radius;
    planeCircle([0, 0, 0], [1, 0, 0], [0, 1, 0], rad, r, v);
    arc.push(v.slice());
  }
  const verts = [];
  for (v of arc) {
    verts.push(v[0], v[1], 0.1);
  }
  for (i = arc.length - 2; i > 0; i--) {
    v = arc[i];
    verts.push(-v[0], v[1], 0.1);
  }
  for (v of arc) {
    verts.push(v[0], v[1], -0.1);
  }
  for (i = arc.length - 2; i > 0; i--) {
    v = arc[i];
    verts.push(-v[0], v[1], -0.1);
  }
  const indices = [];
  let ii;
  let b;
  let c;
  for (let i2 = 0; i2 < steps; i2++) {
    ii = i2 + steps;
    c = (i2 + 1) % steps;
    b = (i2 + 1) % steps + steps;
    indices.push(i2, ii, b, b, c, i2);
  }
  return {
    vertices: new Float32Array(verts),
    indices: new Uint16Array(indices)
  };
}
function planeCircle(center, xAxis, yAxis, angle, radius, out) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  out[0] = center[0] + radius * cos * xAxis[0] + radius * sin * yAxis[0];
  out[1] = center[1] + radius * cos * xAxis[1] + radius * sin * yAxis[1];
  out[2] = center[2] + radius * cos * xAxis[2] + radius * sin * yAxis[2];
  return out;
}class TwistGizmo extends Group {
  _shape;
  _mat;
  _xDir = new Vec3([1, 0, 0]);
  _yDir = new Vec3([0, 1, 0]);
  _zDir = new Vec3([0, 0, 1]);
  _isOver = false;
  state = StateProxy.new({
    rotation: [0, 0, 0, 1],
    position: [0, 0, 0],
    scale: 1
  });
  constructor() {
    super();
    const proxy = this.state.$;
    proxy.on("change", this.onStateChange);
    const geo = Util3JS.geoBuffer(tearShape());
    geo.computeVertexNormals();
    this._mat = new MeshBasicMaterial({ side: DoubleSide, color: 16777215 });
    this._shape = new Mesh(geo, this._mat);
    this.add(this._shape);
  }
  onStateChange = (e) => {
    switch (e.detail.prop) {
      case "rotation": {
        this._xDir.fromQuat(this.state.rotation, [1, 0, 0]);
        this._yDir.fromQuat(this.state.rotation, [0, 1, 0]);
        this._zDir.fromQuat(this.state.rotation, [0, 0, 1]);
        this._render();
        break;
      }
      case "position":
        this.position.fromArray(this.state.position);
        break;
      case "scale":
        this.scale.setScalar(this.state.scale);
        break;
    }
  };
  onHover(ray) {
    const hit = this._isHit(ray);
    if (this._isOver !== hit) {
      this._isOver = hit;
      this._render();
    }
    return hit;
  }
  onDown(ray) {
    const hit = this._isHit(ray);
    return hit ? "angle" : null;
  }
  onUp() {
    this._isOver = false;
    this._render();
  }
  onDragStart() {
    this.visible = false;
  }
  onDragEnd() {
    this.visible = true;
  }
  onCameraScale() {
  }
  onPlaneInit(action) {
    action.setOrigin(this.state.position).setQuatDir(this.state.rotation).setScale(this.state.scale);
  }
  onPlaneUpdate(action, isDone) {
    const q = new Quat().fromAxisAngle(action.zAxis, action.dragAngle).mul(action.rotation);
    if (isDone)
      this.state.rotation = q;
    action.events.emit("twist", { rotation: q, yaxis: action.dragDir.slice(), gizmo: this, isDone });
  }
  _render() {
    const color = this._isOver ? 16777215 : 10066329;
    this._mat.color.set(color);
    this.quaternion.fromArray(this.state.rotation);
  }
  _isHit(ray) {
    return intersectSphere(ray, this.state.position, this.state.scale);
  }
}function intersectAABB(ray, min, max) {
  const tMin = new Vec3(min).sub(ray.posStart);
  const tMax = new Vec3(max).sub(ray.posStart);
  tMin.div(ray.direction);
  tMax.div(ray.direction);
  const t1 = new Vec3(tMin).min(tMax);
  const t2 = new Vec3(tMin).max(tMax);
  const tNear = Math.max(t1[0], t1[1], t1[2]);
  const tFar = Math.min(t2[0], t2[1], t2[2]);
  return tNear < tFar ? [tNear, tFar] : null;
}function nearPoint(ray, p, distLimit = 0.1) {
  const v = new Vec3(p).sub(ray.posStart).mul(ray.vecLength);
  const t = (v[0] + v[1] + v[2]) / Vec3.lenSqr(ray.vecLength);
  if (t < 0 || t > 1)
    return null;
  const lenSqr = Vec3.distSqr(ray.posAt(t, v), p);
  return lenSqr <= distLimit * distLimit ? t : null;
}class Point {
  pos = new Vec3();
  color = 10066329;
  shape = 1;
  size = 1;
  userData = null;
  constructor(p, color, size, shape) {
    this.pos.copy(p);
    if (color !== void 0)
      this.color = color;
    if (size !== void 0)
      this.size = size;
    if (shape !== void 0)
      this.shape = shape;
  }
}
class PointsGizmo extends Group {
  state = StateProxy.new({
    position: [0, 0, 0],
    hoverColor: 65280,
    selectColor: 16776960,
    minDistance: 0.1,
    color: 10066329,
    size: 2,
    shape: 1
  });
  _mesh = new ShapePointsMesh();
  _points = [];
  _min = new Vec3();
  _max = new Vec3();
  _hoverIdx = -1;
  _phoverIdx = -1;
  _selIdx = -1;
  _pselIdx = -1;
  _down = false;
  constructor() {
    super();
    this.add(this._mesh);
  }
  get selectedIndex() {
    return this._selIdx;
  }
  addPoint(pos, props = {}) {
    const pnt = new Point(
      pos,
      props.color !== void 0 ? props.color : this.state.color,
      props.size !== void 0 ? props.size : this.state.size,
      props.shape !== void 0 ? props.shape : this.state.shape
    );
    if (props.userData)
      pnt.userData = props.userData;
    this._points.push(pnt);
    return pnt;
  }
  setPosition(idx, pos, autoRender) {
    const p = this._points[idx];
    if (p) {
      p.pos.copy(pos);
      if (autoRender)
        this._render();
    }
    return this;
  }
  deselect() {
    if (this._selIdx === -1)
      return;
    this._selIdx = -1;
    this._pselIdx = -1;
    this._render();
    return this;
  }
  update() {
    this._render();
    return this;
  }
  onHover(ray) {
    const hit = this._isHit(ray, true);
    if (this._phoverIdx !== this._hoverIdx) {
      this._render();
    }
    return hit;
  }
  onDown(ray, g) {
    const hit = this._isHit(ray, false);
    if (this._pselIdx !== this._selIdx) {
      this._render();
      g.events.emit("pointSelected", {
        index: this._selIdx,
        point: this._selIdx === -1 ? null : this._points[this._selIdx]
      });
    }
    return hit ? "none" : null;
  }
  onUp() {
  }
  onCameraScale() {
  }
  onDragStart() {
  }
  onDragEnd() {
  }
  _render() {
    this._mesh.reset();
    this._min.copy([Infinity, Infinity, Infinity]);
    this._max.copy([-Infinity, -Infinity, -Infinity]);
    let p;
    for (let i = 0; i < this._points.length; i++) {
      p = this._points[i];
      this._min.min(p.pos);
      this._max.max(p.pos);
      this._mesh.add(
        p.pos,
        i === this._hoverIdx ? this.state.hoverColor : i === this._selIdx ? this.state.selectColor : p.color,
        p.size,
        p.shape
      );
    }
    this._min.sub([0.5, 0.5, 0.5]);
    this._max.add([0.5, 0.5, 0.5]);
    this._mesh._updateGeometry();
  }
  _isHit(ray, isHover) {
    if (intersectAABB(ray, this._min, this._max)) {
      const pos = [0, 0, 0];
      let hit;
      let p;
      let dist = 0;
      let minDist = Infinity;
      let minIdx = Infinity;
      let minPos = null;
      for (let i = 0; i < this._points.length; i++) {
        p = this._points[i];
        hit = nearPoint(ray, p.pos, this.state.minDistance);
        if (hit === null)
          continue;
        ray.posAt(hit, pos);
        dist = Vec3.distSqr(pos, ray.posStart);
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
          minPos = pos.slice();
        }
      }
      if (minIdx !== Infinity) {
        if (isHover) {
          this._phoverIdx = this._hoverIdx;
          this._hoverIdx = minIdx;
        } else {
          this._pselIdx = this._selIdx;
          this._selIdx = minIdx === this._selIdx ? -1 : minIdx;
          this.state.position = minPos;
        }
        return true;
      }
    }
    if (isHover) {
      this._phoverIdx = this._hoverIdx;
      this._hoverIdx = -1;
    } else {
      this._pselIdx = this._selIdx;
    }
    return false;
  }
}export{Gizmos,PointsGizmo,TranslateGizmo,TwistGizmo};