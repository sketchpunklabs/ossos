
export default class Heap<T,C>{
    items       : Array<T> = [];
    getIdentity : ( i: number )=>C;
}

/*


class QueueItem{
    duration = 0;
    elapsed_time = 0;
    remaining_time = 0;
    animator : TAnimator;
}

const aq = new AnimationQueue();

aq.enqueue( duration, LerpPosition( a, b, obj ) );

interface TAnimator = {
    onUpdate( t:number, et:number, duration );
}

class LerpPosition: TAnimator
    aPos = []
    bPos = []
    obj  = obj
    onUpdate( t, ellapseTime, duration ){
        this.obj.position.fromArray( vec3.lerp( [0,0,0], this.aPos, this.bPos, t ) );
    }
*/