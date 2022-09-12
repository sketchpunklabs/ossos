# ossos

[![npm](https://img.shields.io/badge/Npm-install-blue?style=flat-square&logo=npm)](https://www.npmjs.com/package/ossos)
[![twitter](https://img.shields.io/badge/Twitter-profile-blue?style=flat-square&logo=twitter)](https://twitter.com/SketchpunkLabs)
[![youtube](https://img.shields.io/badge/Youtube-subscribe-red?style=flat-square&logo=youtube)](https://youtube.com/c/sketchpunklabs)
[![Ko-Fi](https://img.shields.io/badge/Ko_Fi-donate-orange?style=flat-square&logo=youtube)](https://ko-fi.com/sketchpunk)
[![Patreon](https://img.shields.io/badge/Patreon-donate-red?style=flat-square&logo=youtube)](https://www.patreon.com/sketchpunk)



## Character Animation Library ###
<img align="right" width="160" src="/_images/Epic_MegaGrants_Recipient_logo.png?raw=true">
This project is working toward a complete character skinning & animation library for the web. First most, this library is focused on being independent from any rendering engine with examples of how to use it in webgl based engines like threejs. The one big focus is recreating the IK Rig & IK Animations type system that was demoed several years ago from Ubisoft's GDC talk on IK Rigs. With many game engines like Unity and Unreal developing their own IK Rig like systems, this project helps fill the void for web based engines like threejs, babylon, etc. Hopefully with enough help we can create something just as good as the big boys, maybe even better since its free & open source.

<br><img align='center' src="https://media-exp1.licdn.com/dms/image/C4D22AQEAyhN1Srt_2g/feedshare-shrink_2048_1536/0/1646282533489?e=2147483647&v=beta&t=6ajBcu44vaRavbj3df4kI4towfkjHJUqnKywxqP8WiE" />

### Setup ###

```
npm install
npm run dev
```

**[ NOTE ]** To be able to run the example, you'll need to go into /examples/_res/ and follow the instructions to clone the resource repo. The files are quite large, so they are kept in a seperate repo to keep this project as light weight as possible.

## Usage ###

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
* IK Rigs
  * Biped ( Human )
  * Quadruped *( Prototype Phase )*
* IK Animation Retargeting using IK Rigs
* IK Solvers
  * Aim / SwingTwist
  * SwingTwist - Ends
  * SwingTwist - Chain
  * Limb
  * Arc
  * ArcSin
  * Fabrik
  * Natural CCD
  * Piston
  * Spring 
  * Trapezoid
  * ZSolver
  * Catenary / Rope
* GLTF2 Asset Parsing for cherry picking what you need to load.
* A few examples using BabylonJS for rendering
* Several examples using ThreeJS for rendering
  * Some extra fun examples like converting animations to Data Textures
  * Running Full Skinned animation on the GPU with GLSL Example
  * Using Instancing & Data Texture to animate a collection of randomly placed & rotated meshes
* Ready Player Me Example : Parsing, TPose Generation & Auto IK Rigging
* Bone Slots : A way to programmically attach assets to bones
* IK Animation Additives


---
## Future Plans ##
- [x] Rewrite IK Rigs
- [x] Port over starting IK Solvers ( Aim / SwingTwist, Limb, SwingTwistEnds )
- [x] Rewrite IK Animation Retargeting
- [x] Port over extra single pass IK Solvers ( Z, Piston, Arc, ArcSin, Trapezoid, Spring )
- [x] Create an implementation of FABIK
- [x] Create solver based on Catenary Curve
- [ ] Port over Trianglution Solver ( Alternative to CCD )
- [x] Port over Natural CCD ( Extended version of CCD )
- [x] Complete FullBody IK Prototype
- [ ] Revisit FullBody IK, Make it mores stable & user friendly
- [ ] Figure out how to implement VRIK
- [x] Bone Slots / Attachments
- [ ] Actions or State Machine based Animator
- [x] Build Examples in other Rendering Engines like BabylonJS
- [ ] Remake Auto Skinning ( Need WebGPU compute shaders for this )
- [ ] Bone Constraints
- [ ] Procedural Animation ProtoTyping
- [ ] Far Future - Create & Share animations with a Web Editor Tool
