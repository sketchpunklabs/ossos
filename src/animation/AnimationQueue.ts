import Heap from '../ds/Heap';

export type TAnimationTaskUpdate = ( task: AnimationTask )=>void;

export class AnimationTask{
    remainingTime   : number;
    elapsedTime     : number;
    duration        : number;
    onUpdate        : TAnimationTaskUpdate;
    constructor( durationSec: number, fnOnUpdate: TAnimationTaskUpdate  ){
        this.duration       = durationSec;
        this.remainingTime  = durationSec;
        this.elapsedTime    = 0;
        this.onUpdate       = fnOnUpdate;
    }
    get normTime():number { 
        return Math.min( 1, Math.max( 0, this.elapsedTime / this.duration ) ); 
    }
}


export default class AnimationQueue{
    // #region MAIN
    queue = new Heap< AnimationTask >( (a,b)=>(a.remainingTime < b.remainingTime) );
    // #endregion

    addTask( duration: number, fn: TAnimationTaskUpdate ){
        this.enqueue( new AnimationTask( duration, fn ) );
        return this;
    }

    enqueue( task:AnimationTask ): this{ this.queue.add( task ); return this; }
    // dequeue(){}

    update( dt:number ): void{
        if( this.queue.length === 0 ) return;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Execute all the animation tasks
        for( const task of this.queue.items ){
            
            // Update struct with new time information
            task.elapsedTime  += dt;
            task.remainingTime = task.duration - task.elapsedTime;

            // Execute with error capturing
            try{
                task.onUpdate( task );
            }catch( err ){
                const msg = ( err instanceof Error )? err.message : String( err );
                console.error( 'Error running an animation task:', msg );
            }
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Remove any animations that have run out of time.
        while( this.queue.length > 0 && this.queue.items[ 0 ].remainingTime <= 0 ){
            this.queue.remove();
        }
    }
}

