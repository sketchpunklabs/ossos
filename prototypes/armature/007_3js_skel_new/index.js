// #region IMPORTS
import useThreeWebGL2, {
  THREE,
  useDarkScene,
  useVisualDebug,
} from "../../_lib/useThreeWebGL2.js"
import Util from "../../_lib/misc/Util.js"
import { Armature } from "../../../src/index"
import { vec3, quat } from "gl-matrix"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

// These are type imports inside comments (they have no effect on runtime JS)
/**
@import { Bone as OssosBone } from "../../../src/index"
@import { Skeleton, SkinnedMesh } from "three"
@import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"
*/

// #endregion

// #region MAIN
let App = useDarkScene(useThreeWebGL2())
let Debug

window.addEventListener("load", async () => {
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Setup
  App.sphericalLook(30, 30, 3, [0, 1, 0])
  Debug = await useVisualDebug(App)

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  const gltf = await GLTFLoaderAsync("/prototypes/_res/models/nabba/nabba.gltf")
  const grp = gltf.scene
  App.scene.add(grp)

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // This @type comment is a type cast
  const skinMesh = /** @type {SkinnedMesh} */ (grp.children[0].children[0])
  const skel = skinMesh.skeleton
  const arm = armatureFromSkeleton(skel)
  Util.debugBones(arm.poses.bind.bones, Debug, 0.07, 1.3)

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Pose Armature
  const pose = arm.newPose() // TODO - Dont like ".newPose()", new Pose( arm ) works but would like a shortcut

  /**
   * @param {string} bName
   * @param {number} xDeg
   */
  const xLocal = (bName, xDeg) => {
    const q = quat.setAxisAngle([0, 0, 0, 0], [1, 0, 0], (xDeg * Math.PI) / 180)
    const qb = NonNull(pose.getBone(bName)).local.rot
    quat.mul(qb, q, qb) // FIXME type def is not wide enough to accept a Quat as argument here.
  }

  xLocal("Head", -45)
  xLocal("Thigh_R", -45)
  xLocal("Shin_R", -45)
  xLocal("Foot_R", -45)
  xLocal("Thigh_L", 45)
  xLocal("Shin_L", -45)
  xLocal("Foot_L", -45)

  NonNull(pose.getBone("Hips")).local.pos[1] = 1.2 // Move Body Up
  NonNull(pose.getBone("Hips")).local.pos[2] -= 1.0 // ... Back

  // NOTE: Only needed for debugging bones, else no need to compute worldspace 4 this instance
  pose.updateWorld()
  Util.debugBones(pose.bones, Debug, 0.07, 1.3, true)

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Copy final pose back to 3JS Skeleton to perform the
  // final rendering. 90% of the time animation/posing is
  // just rotation data with the exception of Root/Hip bones
  // which will often include position data.
  // Very rarely is scale used on any bone. For silly loading
  // animations scale can be set at the Root/Hip but in that
  // sort of thing it's better to set scale on the model & not the bone.
  for (const b of pose.bones) {
    const sb = skel.bones[b.index]
    sb.quaternion.fromArray(b.local.rot)

    switch (sb.name) {
      case "Hips":
      case "Root":
        sb.position.fromArray(b.local.pos)
        break
    }
  }

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  App.renderLoop()
})
// #endregion

/**
 * Wrap ThreeJS's GLTFLoader in a promise to use Async/Await functionality
 * @param {string} url
 * @returns {Promise<GLTF>}
 */
function GLTFLoaderAsync(url) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(url, resolve, undefined, reject)
  })
}

/**
 * Build an Ossos Armature from a ThreeJS Skeleton
 * @param {Skeleton} skel
 */
function armatureFromSkeleton(skel) {
  const arm = new Armature()

  /** @type {OssosBone} */
  let b

  for (const sb of skel.bones) {
    b = arm.addBone({
      name: sb.name,
      parent: sb.parent instanceof THREE.Bone ? sb.parent.name : undefined,
    })

    b.local.rot.copy(sb.quaternion.toArray())
    b.local.pos.copy(sb.position.toArray())
    b.local.scl.copy(sb.scale.toArray())
  }

  arm.bind(0.1)
  return arm
}

/**
 * Assert that `thing` is not `null | undefined` to non-null.
 *
 * In JavaScript files we can use this in lieu of the non-null assertion
 * operator (`!`) that we otherwise can use in TypeScript files.
 *
 * @template {any} T
 * @param {T} item - Item you want to check is non-null.
 */
function NonNull(item) {
  if (item === null || item === undefined) throw "Item is null or undefined."
  return item
}
