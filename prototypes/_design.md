
### Armature System
- Armature
  - compositePose / mergedPose : Pose
  - skeletons : Array< {Skeleton, poseType} > // Use Bind or T
    - Maybe instead of adding skeleton, use pose instead so no need to  know pose type to use
  - recreatePose() // Create new merged posed
  - updateSkin( pose )
  - anchorJoints : { name, transform, skel, pJoint }

- Skeleton
  - pSkeleton       : { skel:Skeleton, joint?:JointInfo }; // Save this info in Armature?
  - rootTransform   : Transform
  - offsetTransform : Transform
  - bindJoints      : Array<JointInfo>
  - tJoints        ?: Array<JointInfo>
  - bindPose        : ()=>Pose
  - tPose           : ()=>Pose
  - skin           ?: Skin

- JointInfo
  - transform // Local Spaced transform
    - bindTransform // Maybe store both in one info but not work if constraints need to be different between either
    - tTransform
  - index     // Skin Index, not pose index
  - pindex    // ...
  - rootMotion  : bool  ( used for root motion )
  - name
  - constraint

- Pose
  - skeleton
  - offsetTransform
  - rootTransform
  - joints : Array<Joint>
  - calcWorldSpace( bone )
  - calcWorldSpaceRot( bone )
  - recomputeWorldSpace()
  - clone()

- Joint
  - type    : skin | anchor | 
  - info    : JointInfo
  - local   : transform
  - world   : transform
  - index   : Int  // pose index, not skin index 
  - pindex  : Int  // ...


How to merge various skeletons with pose cloning working?
- Need for skinnable support where each skeleton are a seperate skinned about
- Should be dynamic to add & remove skeletons
  - May need to regenerate pose for rigs
- When merging skeletons may need a in between bones to appky an offset transform
- New feature can be used to add attachment bones for hands, head, back, etc.


### ANIMATION
- Build in an accumulator as a way to run animations at a framerate.
- Try to apply animation additives to animation at different accumulator times
  - Use local space offsets for better results, the change from base transform
  - Add Scalar on additives to control how much of an additive to add to base animation

```
fixed_dt = 1 / 30 // 30 updates per second
MAX TIME = 0.25
renderLoop( dt ){
    accumulator += dt;
    if( accumulator > MAX_TIME ) accumulator = MAX_TIME;

    while( accumulator > fixed_dt ){
        updateSprings( fixed_dt );
        accumulator -= fixed_dt;
    }


    // lerping prop won't work correctly there are character animation
    // running at the same time. Gemini says to try to do additive animations
    // Have the Base Pose from animatiom updated every 30 some frames
    // Lerp the spring bones only, then apply those spring bones
    // to the lerped base animation.
    t = accumulator / fixed_dt
    // lerp( prevPose, nextPose, t );

    bspring = lerp( prevSprings, nextSprings, t )

    for( b of basePose ){
        if( b is springed ) b.rot *= bpring.rot
    }
}
```

### IK Systems
- Solver
 - Pass in Bind/T Pose as a reset
 - Pass in Work Pose
 - Pass in Properties

- IK Target
  - Target Position
  - Target Direction
  - Pole Position
  - Pole Direction

- IKSplineTarget

- Chain
  - Bones / Joints
    - Bones will not be directly connected
    - Dont store bind position

- Rig
  - Skeleton
  - Pose
  - ik sets ( like legs, arms, etc )
    - chain
    - ik target
    - ik solver
    - ik constraint
  - springs
    - chain
    - Perform Springs in LocalSpace, this code can convert WorldSpace Position to localSpace in a Trainsform
      const ptran = pose.getWorldTransform(b.pindex);
        ptran.pos
          .fromSub(v, ptran.pos)
          .transformQuat(ptran.rot.invert())
          .mul(ptran.scl.invert());
