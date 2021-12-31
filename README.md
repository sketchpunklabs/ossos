# ossos

[![npm](https://img.shields.io/badge/Npm-install-blue?style=flat-square&logo=npm)](https://www.npmjs.com/package/ossos)
[![twitter](https://img.shields.io/badge/Twitter-profile-blue?style=flat-square&logo=twitter)](https://twitter.com/SketchpunkLabs)
[![youtube](https://img.shields.io/badge/Youtube-subscribe-red?style=flat-square&logo=youtube)](https://youtube.com/c/sketchpunklabs)
[![Ko-Fi](https://img.shields.io/badge/Ko_Fi-donate-orange?style=flat-square&logo=youtube)](https://ko-fi.com/sketchpunk)
[![Patreon](https://img.shields.io/badge/Patreon-donate-red?style=flat-square&logo=youtube)](https://www.patreon.com/sketchpunk)


### Character Animation Library ###
This project is working toward a complete character skinning & animation library for the web. First most, this library is focused on being independent from any rendering engine with examples of how to use it in webgl based engines like threejs. The one big focus is recreating the IK Rig & IK Animations type system that was demoed several years ago from Ubisoft's GDC talk on IK Rigs. With many game engines like Unity and Unreal developing their own IK Rig like systems, this project helps fill the void for web based engines like threejs, babylon, etc. Hopefully with enough help we can create something just as good as the big boys, maybe even better since its free & open source.

### Setup ###

```
npm install
npm run dev
```

### Usage ###

This example is the basic boiler plate example of how to pull mesh & skeletal data from a GLTF2 file then using a custom THREE.JS Material to render mesh that can be posed or animated.

```javascript
const gltf = await Gltf2.fetch( '../_res/models/nabba/nabba.gltf' );

//--------------------------------
// Setup Armature
const arm  = new Armature();
for( let j of gltf.getSkin().joints ){
    arm.addBone( j.name, j.parentIndex, j.rotation, j.position, j.scale );
}

//--------------------------------
// Setup Skinning : Matrix
arm.bind( SkinMTX, 0.07 ); 
const mat = SkinMTXMaterial( 'cyan', arm.getSkinOffsets()[0] ); 

//--------------------------------
// Load Mesh
const mesh  = Gltf2Util.loadMesh( gltf, null, mat );
App.add( mesh );
```
---
## Current Features ##
* Armature System built around 'Bones' instead of 'Joints'
* Several Skinning Plugins
  * `Matrices` : Typical Skinning, easiest to use in GLSL
  * `Dual Quaternions` : For better bending of vertices, typically used in places like Disney. It can only handle Rotation & Translation, scaling individual bones don't work.
  * `DQ Transform` : Experimental & unique to this library. It uses Transform instead of matrices or dualquats to handle the transformation hierarchy & bind pose. When the data is prepared for shader use the worldspace transform gets converted to Dual Quaternions to handle rotation & translation along with an extra buffer that contains scale. The hopes of this hybrid approach is to get the quality of DQ while still being able to scaled individual bones like when using matrix skinning.
* Bone Springs ( Rotation & Translation )
* Basic Animator based on Tracks
* Basic Animation Retargeting for similar skeletal meshes
* IK Rigs - Basic Biped
* IK Animation Retargeting using IK Rigs
* IK Solvers - Aim/SwingTwist, SwingTwistEnds, Limb
* GLTF2 Asset Parsing for cherry picking what you need to load.
* Several examples using ThreeJS for rendering
  * Some extra fun examples like converting animations to Data Textures
  * Running Full Skinned animation on the GPU with GLSL Example
  * Using Instancing & Data Texture to animate a collection of randomly placed & rotated meshes.

---
## Future Plans ##
- [x] Rewrite IK Rigs
- [x] Port over starting IK Solvers ( Aim / SwingTwist, Limb, SwingTwistEnds )
- [x] Rewrite IK Animation Retargeting
- [ ] Port over extra single pass IK Solvers ( Z, Piston, Arc, ArcSin, Trapezoid, Spring )
- [ ] Create an implementation of FABIK
- [ ] Create solver based on Catenary Curve
- [ ] Port over Trianglution Solver ( Alternative to CCD )
- [ ] Port over Natural CCD ( Extended version of CCD )
- [x] Complete FullBody IK Prototype
- [ ] Revisit FullBody IK, Make it mores stable & user friendly
- [ ] Figure out how to implement VRIK
- [ ] Bone Slots / Attachments
- [ ] Actions or State Machine based Animator
- [ ] Build Examples in other Rendering Engines like BabylonJS
- [ ] Remake Auto Skinning ( Need WebGPU compute shaders for this )
- [ ] Bone Constraints
- [ ] Procedural Animation ProtoTyping
- [ ] Far Future - Create & Share animations with a Web Editor Tool

---
## Nice To Have ##
There are some things I've been wanting for my prototyping for awhile. Here's a list of things if people want to donate Or create for the project for a negotiable sum.

* `Project Character ( Ossos-Chan? )`
  * **Purpose** : A nice character to prototype with for everyone. Can also end up being the project mascot. Being female with some features like hair, cat ears & tail is something that will be used for working with bone springs. If the parts are detachable then it can work into the Slots/Attachments future prototype feature.
  * **Thoughs** :
    * Would like a female with detachable cat ears & tail
    * Prefer stylized designs ( Really digging the Art Direction of Arcane )
    * Just a base mesh, does not need to be skinned or textured

* `Collection of Mobility Animations`
  * **Purpose** : Less data overall if not baked which gives me a chance to experiment with different interpolations for animation beyond just linear / cubic. Would be a nice thing to have for the community to use as a starting point for their projects.
  * **Thoughs** :
      * Something that looks nice & blends well together, doesn't look choppy
      * Walk, Run, Idle, Crawl, Jump. Maybe Flying & Swimming
      * Prefer not to be baked
