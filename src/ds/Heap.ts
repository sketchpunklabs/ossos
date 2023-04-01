// function IsMaxCompare( a, b ){ return ( a > b ); }
// function IsMinCompare( a, b ){ return ( a < b ); }

export type THeapItemCompare<T> = ( a:T, b:T )=> boolean;

export default class Heap<T>{
    // #region MAIN
    items       : Array<T> = [];
    compare     : THeapItemCompare<T>;

    constructor( fnCompare:THeapItemCompare<T> ){
        this.compare = fnCompare;
    }
    // #endregion

    // #region GETTERS
    get length():number { return this.items.length; }
    // #endregion

    // #region METHODS
    
    /** Add item to the heap which will then get stored into the correct spot */
    add( n: T ): this{
        const idx = this.items.length;
        this.items.push( n );

        if( idx !== 0 ) this.bubbleUp( idx );
        return this;
    }

    /** Remove item from heap, if no index is set then it pops off the first item */
    remove( idx = 0 ): this{
        if( this.items.length === 0 ) return this;

        // We remove an item by swopping it with the LAST
        // item on the list.
        const i        = this.items.length - 1;  // Last Index
        const lastItem = this.items.pop();       // Remove Last Item

        // If we ended up deleting the last one or there was nothing there
        // we are done. Undefined check is needed by typescript guard checking
        if( idx === i || lastItem === undefined ) return this;                

        // If the item removed wasn't the last one on the list,
        // then place the last item in the spot that we want to delete. 
        // From there bubble down the item so its placed properly in the tree.
        this.items[ idx ] = lastItem;
        this.bubbleDown( idx );
        return this;
    }
    // #endregion

    // #region SHIFTING

    /** Will move item down the tree by swopping the parent with one 
        of it's 2 children when conditions are met */
    bubbleDown( idx: number ): this{
        const ary = this.items;
        const len = ary.length; // Used for bound checking
        const itm = ary[ idx ]; // Item being moved around
        let   lft = 0;          // Index to LEFT Child
        let   rit = 0;          // Index to RIGHT Child
        let   mov = -1;         // Index of item to be moved

        while( idx < len ){
            // Compute Children Indices
            lft = idx * 2 + 1;
            rit = idx * 2 + 2;
            mov = -1;

            // Check if item should be moved to its LEFT child position
            if( lft < len && this.compare( ary[lft], itm ) ) mov = lft;

            // Check if item should be moved to its RIGHT child position
            // if already moving to LEFT child, check if RIGHT is the
            // better position based on Min/Max Compare
            if( rit < len && this.compare( ary[rit], itm ) ){
                if( mov === -1 || this.compare( ary[rit], ary[lft] ) ) mov = rit;
            }

            // If item isn't suitable for either LEFT or RIGHT position, we're done.
            if( mov === -1 ) break;

            [ ary[idx], ary[mov] ] =   // Swop
            [ ary[mov], ary[idx] ];

            idx = mov;  // Save for next iteration
        }
        return this;
    }

    /** Will move item up the tree by swopping with it's parent if conditions are met */
    bubbleUp( idx: number ): this{
        const ary = this.items;
        let pidx: number;

        while( idx > 0 ){
            pidx = Math.floor( ( idx-1 ) / 2 );
            if( !this.compare( ary[ idx ], ary[ pidx ] ) ) break;
            
            [ ary[idx], ary[pidx] ] =   // Swop
            [ ary[pidx], ary[idx] ];

            idx = pidx;                 // Move up for next iteration
        }

        return this;
    }
    // #endregion
}