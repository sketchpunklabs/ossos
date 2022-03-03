export class GlobalMove{
    static init_x   = 0;
    static init_y   = 0;
    static callback = 0;

    static begin( e, cb ){
        this.init_x     = e.clientX;
        this.init_y     = e.clientY;
        this.callback   = cb;
        document.addEventListener( 'mousemove', this.mousemove );
        document.addEventListener( 'mouseup', this.mouseup );
    }

    static mousemove( e ){
        const x  = e.clientX;
        const y  = e.clientY;
        const dx = x - GlobalMove.init_x;
        const dy = y - GlobalMove.init_y;

        if( GlobalMove.callback ) GlobalMove.callback( [x,y], [dx,dy] );
    }

    static mouseup( e ){
        document.removeEventListener( 'mousemove', this.mousemove );
        document.removeEventListener( 'mouseup', this.mouseup );
        GlobalMove.callback = null;
    }
}

export class CollapseContent{
    static open( container, content ){
        // When in an open state, remove style properties since they'll get in the way
        // if elements are added dynamically into the content area.
        container.addEventListener( 'transitionend',()=>{
            container.style.removeProperty( 'height' );
            container.style.removeProperty( 'overflow' );
            //this._contentArea.scrollIntoView( { behavior: 'smooth', block: 'nearest' } );
        }, { once: true } );

        const box               = content.getBoundingClientRect();
        container.style.height  = box.height + 'px';
    }

    static close( container, content ){
        const box                   = content.getBoundingClientRect();
        container.style.overflow	= 'hidden';
        container.style.height      = box.height + 'px';    // Set Height as a starting point for transition

        // Then set the true height on a delay
        window.setTimeout( ()=>( container.style.height = '0px' ), 50 );
    }
}
