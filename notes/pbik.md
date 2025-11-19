# PBIK

1. PBD  - Position Based Dynamics
2. XPBD - Extended Position Based Dynamics

### Github
- Full Body IK : https://github.com/Vaei/FBIK
- https://github.com/yoharol/PBD_Taichi/
- 3JS Physics Engine : https://github.com/markeasting/THREE-XPBD
- PBD : https://github.com/Scrawk/Position-Based-Dynamics/tree/master/Assets/PositionBasedDynamics/Scripts
  - Has constraints & collisions


### Info 
- https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Plugins/PBIK#classes
- https://matthias-research.github.io/pages/publications/posBasedDyn.pdf
- https://matthias-research.github.io/pages/publications/XPBD.pdf
- Tutorial on PBD : https://www.youtube.com/watch?v=jrociOAYqxA

- PBD : https://carmencincotti.com/2022-07-11/position-based-dynamics/
- PBD Sim Loop : https://carmencincotti.com/2022-08-01/the-pbd-simulation-loop/
- XPBD : https://carmencincotti.com/2022-08-08/xpbd-extended-position-based-dynamics/
- XPBD Dist Constraint : https://carmencincotti.com/2022-08-22/the-distance-constraint-of-xpbd/
- XPBD Isometric Bending Constraint : https://carmencincotti.com/2022-08-29/the-isometric-bending-constraint-of-xpbd/
- XPBD Bending Constraint : https://carmencincotti.com/2022-09-05/the-most-performant-bending-constraint-of-xpbd/
- XPBD Spatial hash map
  - https://carmencincotti.com/2022-10-31/spatial-hash-maps-part-one/
  - https://carmencincotti.com/2022-11-07/spatial-hash-maps-part-two/
  - https://carmencincotti.com/2022-11-14/coding-spatial-hash-tables/
  - https://carmencincotti.com/2022-11-21/cloth-self-collisions/


### A & C Shapes
- S and C Shapes : https://www.linkedin.com/posts/petarpehchevski3d_controlrig-ue5-unrealengine-activity-7393307356727525376-cpIX?utm_source=share&utm_medium=member_desktop&rcm=ACoAABCBdyUBKZI3Bi-E7poUb5-kzZgKKi5j0RA

The formula is this: 
For C curve = VectorToAdd = UpVector * sin(pi * RatioValue) * StrengthValue

UpVector - direction in which we want to push the joints
RatioValue - This is a 0 - 1 range. Each joint will have a different value. If there's 5 joints, joint1 = 0, joint2 = 0.25, joint3 = 0.5, joint4 = 0.75 and joint5 = 1. If you do this in a for loop, you can determine the ratio value by doing: Index / (NumberOfElements - 1)

so Sin of pi (3.14) gives us 0. Sin of 0 gives us 0. Sin of 1.57 (or half of pi) is 1. 
So what we do is for each joint, what happens is this:
Joints 1: Sin ( 3.14 * 0) = Sin (0) = 0 
Joints 2: Sin ( 3.14 * 0.25) = Sin ( 0.78) = 0.707
Joints 3: Sin ( 3.14 * 0.5) = 0 = Sin (1.57) = 1
Joints 4: Sin ( 3.14 * 0.75) = 0 = Sin (2.35) = 0.707 
Joints 5: Sin ( 3.14 * 1) = 0 = Sin (3.14) = 0

Then you multiply these numbers by the StrengthValue (let's say 20), and you then multiply the UpVector, which is a unit vector, by this scalar, and it'll offset that vector.

The formula for S curve = VectorToAdd = UpVector * sin(2 * pi * RatioValue + OscillationValue) * StrengthValue

The only difference here is the 2 * pi gives us a full rotation, and it basically produces an entire wave, so it goes in the negative (think 1 positive C curve followed up by 1 negative C curve). And the OsccilationValue is just the part that gives it the wiggle effect. 

Hope this helps. 

### Claude AI 
https://claude.ai/chat/b4c7e851-1e41-4d5b-aec1-f9ecf285e4d3

How It Works
1. Distance Constraints: Maintains bone lengths by iteratively correcting joint positions when they drift apart or compress
2. End Effector Constraint: Pulls the wrist toward the target position
3. Pole Constraint: Guides the elbow toward a desired direction to control the "twist" of the arm

Key PBD Concepts Demonstrated

- Inverse mass weighting: Joints with mass=0 are fixed (like the shoulder), while movable joints get corrected based on their mass
- Iterative refinement: More iterations = better constraint satisfaction
- Weighted corrections: You can tune how aggressively each constraint is applied
- Order matters: Typically solve structural constraints (bone lengths) before goal constraints (target reaching)

Tips for Implementation

- Start with 5-10 iterations and tune from there
- Target weight = 1.0 usually works well for the end effector
- Pole weight = 0.2-0.5 gives subtle guidance without fighting other constraints
- Add angle limit constraints to prevent unnatural joint bending
- Consider adding a preferred pose constraint that gently pulls joints toward a rest configuration

The beauty of PBD is you can add more constraints easily - just create another constraint solver function and call it in the iteration loop!

// Position-Based Dynamics IK Solver for 3-Joint Arm
// Solves for shoulder, elbow, wrist to reach target while maintaining bone lengths

struct Joint {
    Vector3 position
    Vector3 predictedPosition
    float mass  // 0 = infinite mass (fixed), > 0 = movable
}

struct BoneConstraint {
    int jointA, jointB
    float restLength
}

// Setup
joints = [shoulder, elbow, wrist]
shoulder.mass = 0  // Fixed in space
elbow.mass = 1
wrist.mass = 1

boneConstraints = [
    {jointA: 0, jointB: 1, restLength: upperArmLength},
    {jointA: 1, jointB: 2, restLength: forearmLength}
]

targetPosition = Vector3(x, y, z)
poleVector = Vector3(px, py, pz)  // Direction where elbow should point

// Main PBD IK Solve Function
function SolvePBD_IK(iterations, targetWeight, poleWeight):
    
    // 1. Prediction Phase (optional for IK, but included for completeness)
    for joint in joints:
        joint.predictedPosition = joint.position
    
    // 2. Constraint Solving Phase
    for iter in range(iterations):
        
        // 2a. Solve Distance Constraints (maintain bone lengths)
        for constraint in boneConstraints:
            SolveDistanceConstraint(constraint)
        
        // 2b. Solve End Effector Constraint (reach target)
        SolveEndEffectorConstraint(wrist, targetPosition, targetWeight)
        
        // 2c. Solve Pole Vector Constraint (elbow direction)
        SolvePoleConstraint(shoulder, elbow, wrist, poleVector, poleWeight)
    
    // 3. Update positions
    for joint in joints:
        joint.position = joint.predictedPosition


// Constraint Solver Functions

function SolveDistanceConstraint(constraint):
    j1 = joints[constraint.jointA]
    j2 = joints.jointB]
    
    delta = j2.predictedPosition - j1.predictedPosition
    currentLength = length(delta)
    
    if currentLength == 0:
        return
    
    difference = (currentLength - constraint.restLength) / currentLength
    
    // Calculate inverse masses (0 mass = infinite mass = immovable)
    w1 = (j1.mass == 0) ? 0 : 1.0 / j1.mass
    w2 = (j2.mass == 0) ? 0 : 1.0 / j2.mass
    totalInvMass = w1 + w2
    
    if totalInvMass == 0:
        return
    
    // Apply position corrections weighted by inverse mass
    correction = (difference / totalInvMass) * delta
    
    j1.predictedPosition += w1 * correction
    j2.predictedPosition -= w2 * correction


function SolveEndEffectorConstraint(endEffector, target, weight):
    if endEffector.mass == 0:
        return
    
    // Pull end effector toward target
    delta = target - endEffector.predictedPosition
    correction = delta * weight
    
    endEffector.predictedPosition += correction


function SolvePoleConstraint(root, middle, end, poleDirection, weight):
    if middle.mass == 0:
        return
    
    // Calculate the plane formed by the three joints
    toEnd = end.predictedPosition - root.predictedPosition
    toMiddle = middle.predictedPosition - root.predictedPosition
    
    // Project middle joint onto line between root and end
    chainLength = length(toEnd)
    if chainLength == 0:
        return
    
    chainDir = toEnd / chainLength
    projectedDist = dot(toMiddle, chainDir)
    projectedPoint = root.predictedPosition + chainDir * projectedDist
    
    // Current perpendicular direction
    perpendicular = middle.predictedPosition - projectedPoint
    perpLength = length(perpendicular)
    
    if perpLength == 0:
        return
    
    // Desired perpendicular direction (toward pole)
    desiredPerp = normalize(poleDirection)
    
    // Calculate correction to align with pole direction
    correction = (desiredPerp * perpLength) - perpendicular
    
    middle.predictedPosition += correction * weight


// Usage Example
function UpdateIK():
    // Run solver with 10 iterations
    // targetWeight: 1.0 = fully reach target, 0.5 = halfway
    // poleWeight: 0.3 = gentle pole constraint
    SolvePBD_IK(iterations=10, targetWeight=1.0, poleWeight=0.3)


// Optional: Add Joint Angle Limits
function SolveAngleLimitConstraint(root, middle, end, minAngle, maxAngle):
    v1 = normalize(middle.predictedPosition - root.predictedPosition)
    v2 = normalize(end.predictedPosition - middle.predictedPosition)
    
    currentAngle = acos(dot(v1, v2))
    
    if currentAngle < minAngle:
        targetAngle = minAngle
    else if currentAngle > maxAngle:
        targetAngle = maxAngle
    else:
        return  // Within limits
    
    // Rotate v2 to satisfy angle constraint
    axis = normalize(cross(v1, v2))
    angleDiff = targetAngle - currentAngle
    
    // Apply rotation correction (simplified)
    // In practice, use proper rotation matrix or quaternion
    correction = rotateAroundAxis(v2, axis, angleDiff * 0.5)
    
    end.predictedPosition = middle.predictedPosition + correction * forearmLength



WITH PREFFERED POSE CONSTRAINT

Three Approaches to Preferred Pose:
1. Simple Position-Based (Most Common)
delta = restPosition - currentPosition
correction = delta * weight

Directly pulls each joint toward its rest position. Simple and effective, but can look weird if the arm's root moves.

2. Angular-Based
Maintains the rest angles between bones rather than absolute positions. More robust when the character moves around, as it preserves the arm's natural bend.

3. Per-Joint Weighted

Allows different joints to have different "attraction strengths" to the rest pose. Useful for:
- Making the wrist weakly prefer rest pose (prioritize reaching target)
- Making the elbow more strongly prefer rest pose (avoid hyperextension)

Recommended Settings
For a typical arm IK:

preferredWeight = 0.02 - 0.1 (very subtle)
Apply it last in the constraint order
Use lower weights for end effectors, higher for middle joints

Why Use Preferred Pose?
- Prevents ambiguity: When a target is reachable in multiple ways, biases toward a natural pose
- Stabilizes flipping: Reduces sudden "elbow flips" between solutions
- Natural look: Keeps the arm in a realistic configuration
- Handles underconstraint: When the target is very close, the arm doesn't collapse weirdly

The key is keeping the weight low enough that it doesn't fight the target reaching, but strong enough to guide the solution toward natural poses!

// Position-Based Dynamics IK Solver for 3-Joint Arm
// Solves for shoulder, elbow, wrist to reach target while maintaining bone lengths

struct Joint {
    Vector3 position
    Vector3 predictedPosition
    Vector3 restPosition  // Preferred/default pose position
    float mass  // 0 = infinite mass (fixed), > 0 = movable
}

struct BoneConstraint {
    int jointA, jointB
    float restLength
}

// Setup
joints = [shoulder, elbow, wrist]
shoulder.mass = 0  // Fixed in space
elbow.mass = 1
wrist.mass = 1

// Define rest/preferred pose (e.g., T-pose or relaxed arm)
shoulder.restPosition = Vector3(0, 0, 0)
elbow.restPosition = Vector3(0, -10, 2)  // Slightly forward
wrist.restPosition = Vector3(0, -20, 3)  // Slightly forward

boneConstraints = [
    {jointA: 0, jointB: 1, restLength: upperArmLength},
    {jointA: 1, jointB: 2, restLength: forearmLength}
]

targetPosition = Vector3(x, y, z)
poleVector = Vector3(px, py, pz)  // Direction where elbow should point

// Main PBD IK Solve Function
function SolvePBD_IK(iterations, targetWeight, poleWeight, preferredWeight):
    
    // 1. Prediction Phase (optional for IK, but included for completeness)
    for joint in joints:
        joint.predictedPosition = joint.position
    
    // 2. Constraint Solving Phase
    for iter in range(iterations):
        
        // 2a. Solve Distance Constraints (maintain bone lengths)
        for constraint in boneConstraints:
            SolveDistanceConstraint(constraint)
        
        // 2b. Solve End Effector Constraint (reach target)
        SolveEndEffectorConstraint(wrist, targetPosition, targetWeight)
        
        // 2c. Solve Pole Vector Constraint (elbow direction)
        SolvePoleConstraint(shoulder, elbow, wrist, poleVector, poleWeight)
        
        // 2d. Solve Preferred Pose Constraint (pull toward rest pose)
        SolvePreferredPoseConstraint(preferredWeight)
    
    // 3. Update positions
    for joint in joints:
        joint.position = joint.predictedPosition


// Constraint Solver Functions

function SolveDistanceConstraint(constraint):
    j1 = joints[constraint.jointA]
    j2 = joints.jointB]
    
    delta = j2.predictedPosition - j1.predictedPosition
    currentLength = length(delta)
    
    if currentLength == 0:
        return
    
    difference = (currentLength - constraint.restLength) / currentLength
    
    // Calculate inverse masses (0 mass = infinite mass = immovable)
    w1 = (j1.mass == 0) ? 0 : 1.0 / j1.mass
    w2 = (j2.mass == 0) ? 0 : 1.0 / j2.mass
    totalInvMass = w1 + w2
    
    if totalInvMass == 0:
        return
    
    // Apply position corrections weighted by inverse mass
    correction = (difference / totalInvMass) * delta
    
    j1.predictedPosition += w1 * correction
    j2.predictedPosition -= w2 * correction


function SolveEndEffectorConstraint(endEffector, target, weight):
    if endEffector.mass == 0:
        return
    
    // Pull end effector toward target
    delta = target - endEffector.predictedPosition
    correction = delta * weight
    
    endEffector.predictedPosition += correction


function SolvePoleConstraint(root, middle, end, poleDirection, weight):
    if middle.mass == 0:
        return
    
    // Calculate the plane formed by the three joints
    toEnd = end.predictedPosition - root.predictedPosition
    toMiddle = middle.predictedPosition - root.predictedPosition
    
    // Project middle joint onto line between root and end
    chainLength = length(toEnd)
    if chainLength == 0:
        return
    
    chainDir = toEnd / chainLength
    projectedDist = dot(toMiddle, chainDir)
    projectedPoint = root.predictedPosition + chainDir * projectedDist
    
    // Current perpendicular direction
    perpendicular = middle.predictedPosition - projectedPoint
    perpLength = length(perpendicular)
    
    if perpLength == 0:
        return
    
    // Desired perpendicular direction (toward pole)
    desiredPerp = normalize(poleDirection)
    
    // Calculate correction to align with pole direction
    correction = (desiredPerp * perpLength) - perpendicular
    
    middle.predictedPosition += correction * weight


function SolvePreferredPoseConstraint(weight):
    // Pull each movable joint toward its rest position
    for joint in joints:
        if joint.mass == 0:
            continue  // Skip fixed joints
        
        // Calculate direction toward rest pose
        delta = joint.restPosition - joint.predictedPosition
        
        // Apply weighted correction
        correction = delta * weight
        joint.predictedPosition += correction


// Alternative: Preferred Pose using Angular Constraints
function SolvePreferredPoseAngular(weight):
    // This maintains rest angles between bones rather than absolute positions
    // Useful when the arm's root position changes
    
    // Calculate current angle at elbow
    v1_current = normalize(elbow.predictedPosition - shoulder.predictedPosition)
    v2_current = normalize(wrist.predictedPosition - elbow.predictedPosition)
    
    // Calculate rest angle at elbow
    v1_rest = normalize(elbow.restPosition - shoulder.restPosition)
    v2_rest = normalize(wrist.restPosition - elbow.restPosition)
    
    currentAngle = acos(dot(v1_current, v2_current))
    restAngle = acos(dot(v1_rest, v2_rest))
    
    if abs(currentAngle - restAngle) < 0.01:  // Small threshold
        return
    
    // Calculate rotation needed to match rest angle
    axis = normalize(cross(v1_current, v2_current))
    angleDiff = (restAngle - currentAngle) * weight
    
    // Apply correction by rotating the end joint
    // This is a simplified version - real implementation uses proper rotation
    correction = rotateAroundAxis(v2_current, axis, angleDiff)
    
    forearmLength = length(wrist.restPosition - elbow.restPosition)
    wrist.predictedPosition = elbow.predictedPosition + correction * forearmLength


// Advanced: Per-Joint Weighted Preferred Pose
function SolvePreferredPoseWeighted():
    // Different joints can have different "stiffness" toward rest pose
    
    jointWeights = {
        shoulder: 0.0,  // Fixed, no need for preferred pose
        elbow: 0.1,     // Gentle pull toward rest
        wrist: 0.05     // Very gentle - prioritize reaching target
    }
    
    for i, joint in enumerate(joints):
        if joint.mass == 0:
            continue
        
        weight = jointWeights[joint.name]
        delta = joint.restPosition - joint.predictedPosition
        correction = delta * weight
        
        joint.predictedPosition += correction


// Usage Example
function UpdateIK():
    // Run solver with 10 iterations
    // targetWeight: 1.0 = fully reach target
    // poleWeight: 0.3 = gentle pole constraint
    // preferredWeight: 0.05 = very gentle pull toward rest pose
    SolvePBD_IK(iterations=10, targetWeight=1.0, poleWeight=0.3, preferredWeight=0.05)


// Optional: Add Joint Angle Limits
function SolveAngleLimitConstraint(root, middle, end, minAngle, maxAngle):
    v1 = normalize(middle.predictedPosition - root.predictedPosition)
    v2 = normalize(end.predictedPosition - middle.predictedPosition)
    
    currentAngle = acos(dot(v1, v2))
    
    if currentAngle < minAngle:
        targetAngle = minAngle
    else if currentAngle > maxAngle:
        targetAngle = maxAngle
    else:
        return  // Within limits
    
    // Rotate v2 to satisfy angle constraint
    axis = normalize(cross(v1, v2))
    angleDiff = targetAngle - currentAngle
    
    // Apply rotation correction (simplified)
    // In practice, use proper rotation matrix or quaternion
    correction = rotateAroundAxis(v2, axis, angleDiff * 0.5)
    
    end.predictedPosition = middle.predictedPosition + correction * forearmLength