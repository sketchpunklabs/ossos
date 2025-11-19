# iTaSC - Instantaneous Task Specification using Constraints

### Info
- https://developer.blender.org/docs/features/animation/ik/
- https://docs.blender.org/api/current/bpy.types.Itasc.html
- https://www.orocos.org/wiki/orocos/itasc-wiki/itasc-quick-start.html
- LOTS OF CONSTRAINTS - https://docs.blender.org/manual/en/2.83/animation/constraints/index.html#tracking


### Blender Code
- Entry : https://github.com/blender/blender/blob/main/source/blender/ikplugin/intern/itasc_plugin.cc
  - iksolver_execute_tree() > execute_posetree() which creates the IK solver using IK_CreateSolver() returns instance of IK_QSolver which contains IK_QJacobianSolve which gets passed into IK_Solve in execute_posetree

  - Constraints in : https://github.com/blender/blender/tree/main/intern/itasc
  - Solver : https://github.com/blender/blender/blob/main/intern/iksolver/intern/IK_QJacobianSolver.cpp


## Jacobian Types
- Pseudo-Inverse
  - becomes unstable near sigularitites ( when there is a lost of 1deg of freedom )
- Transpose Method
  - Avoids inversion issues at singularities
  - Slower
  - Rough approximation
- Damped Least Squares (DLS) / Levenburg - Marquardt Method
  - Limits velocities to handle singularities, trading position accuracy for stability
  - Stable with sigularities
  - Basically lerps pseudo-inverse when dampfactor = 0 and gradient decent when dampFactor is large
  - Introduces small tracking error, may not reach goal precisely, need careful tuning
- Selectively Damped Least Squares (SDLS)
  - Variation on DLS, damps motion near zero
- Optimized DLS
  - dynamically compute optimal dampfactor to limit tracking error


## Jacobian
- https://www.youtube.com/watch?v=2_cdDGwnl80
  - https://github.com/SpehleonLP/IK-Guide

- https://www.youtube.com/watch?v=h2YM0CDzDl4&list=PLZaGkBteQK3HQFSWDM7-yRQWTd86DeDIY&index=10

- Looks promising with various code samples: https://github.com/JasonHEngineering/Inverse-Kinematics
  - https://jashuang1983.wordpress.com/inverse-kinematics-robotics-jacobian/