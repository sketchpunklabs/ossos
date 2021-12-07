# ossos
[![twitter](https://img.shields.io/badge/Twitter-profile-blue?style=flat-square&logo=twitter)](https://twitter.com/SketchpunkLabs)
[![youtube](https://img.shields.io/badge/Youtube-subscribe-red?style=flat-square&logo=youtube)](https://youtube.com/c/sketchpunklabs)
[![Ko-Fi](https://img.shields.io/badge/Ko_Fi-donate-orange?style=flat-square&logo=youtube)](https://ko-fi.com/sketchpunk)
[![Patreon](https://img.shields.io/badge/Patreon-donate-red?style=flat-square&logo=youtube)](https://www.patreon.com/sketchpunk)


### Character Animation Library ###
This project focus is to allow animating 3D character in web application, games, metaverses, etc that are rendered in WebGL / WebGPU. Some of the big goals is to create something that is independent from any rendering engine while trying to be more collaborative in its design the betterment of the web. The biggest inspiration for me and one of the main goals is to achieve something similar to Ubisoft's GDC Talk & Demo of their IK Rigs animation system.

I like to look at this as being the IMGUI of Character Animations :)

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
* GLTF2 Asset Parsing for cherry picking what you need to load.
* Several examples using ThreeJS for rendering
  * Some extra fun examples like converting animations to Data Textures
  * Running Full Skinned animation on the GPU with GLSL Example
  * Using Instancing & Data Texture to animate a collection of randomly placed & rotated meshes.

---
## Future Plans ##
- [ ] Rebuilding IK Rigs as a new version for this project
- [ ] Port over my Single Pass IK Solvers ( Aim, Limb, Z, Piston, Arc, ArcSin, Trapezoid, Spring )
- [ ] Rebuild IK Animation Retargeting for this project
- [ ] Complete FullBody IK Prototype
- [ ] Port over Trianglution Solver ( Alternative to CCD )
- [ ] Port over Natural CCD ( Extended version of CCD )
- [ ] Create an implementation of FABIK
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
  
* `IK Bot`
  * **Purpose** : Something to use for procedural generation & animation prototyping. Having the arm/leg made as pieces can allow me to create chains of various sizes procedurally to play with various IK solvers.
  * **Inspiration** : https://twitter.com/WokkieG/status/1429130029422743561?s=20
  * **Thoughs** :
      * Round Robot so its easy to just place limbs anywhere and really play with things
      * Instead of arms, create two types of "Bones" that can be connected in chains. One with a ball joint, the other with a hinge joint. This can help with demoing future constraints prototypes
      * Ball joint base for connecting chain to the round body
      * Some sort of Hand or Feet part to attach at the end of the chain
      * Does not need to be skinned or textured
      * Some hard edges in the design would be cool

