
// https://github.com/BobbyAnguelov/Esoterica/blob/main/Code/Engine/Animation/AnimationEvent.h
/*
- Maybe have a way where we can have an onEnter and onExit of event if duration is not 0
-- Maybe the animator keeps track which events have been 'entered' so it can tell when to exit
- Animator at each tick checks if frame triggers an event.
-- Might need to track previous frame time & current incase it steps over an event if we
only check the range of the event trigger.
*/
export class AnimationEvent{
    id          : string = window.crypto.randomUUID();
    startTime   : number = 0;
    duration    : number = 0;

    get IsImmediateEvent(): boolean { return ( this.duration === 0 ); }
    get IsDurationEvent(): boolean { return ( this.duration > 0 ); }
}

// https://github.com/BobbyAnguelov/Esoterica/blob/main/Code/Engine/Animation/AnimationRootMotion.h
export class RootMotion{
    // Get the delta between the first & last frame for position
}

export class SyncTrack{
    // https://github.com/BobbyAnguelov/Esoterica/blob/main/Code/Engine/Animation/AnimationSyncTrack.h
    // https://github.com/BobbyAnguelov/Esoterica/blob/main/Code/Engine/Animation/AnimationSyncTrack.cpp
}

// https://github.com/BobbyAnguelov/Esoterica/blob/main/Code/Engine/Animation/AnimationBlender.h
// https://github.com/BobbyAnguelov/Esoterica/blob/main/Code/Engine/Animation/AnimationFrameTime.h


// https://github.com/BobbyAnguelov/Esoterica/blob/main/Code/Engine/Animation/AnimationPose.h
// Has Pose types, wonder if its worth having


// const body = new Armature( BoneData );
// const head = new Armature( FaceRigData );

// head.linkTo( body.getBone( 'neck') );

BoneTransfers( ( bone, obj )=>{
    obj.position.fromArray( bone.world.pos );
    obj.quaternion.fromArray( bone.world.rot );
    obj.scale.fromArray( bone.world.scl );
});

bt.link( pose.getBone( 'skin'), obj3D );

bt.updateAll();