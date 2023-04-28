import { AxesHelper }        from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';



export default function useTransformMultiControl( tjs, cnt=1 ){
    const onDragChange = e=>{
        const idx = e.target.userData.idx;
        tjs.camCtrl.enabled = !e.value;
    
        if( e.value && self.onStart )      self.onStart( idx );
        else if( !e.value && self.onStop ) self.onStop( idx );
    };

    const onChange = (e)=>{
        const giz = e.target;
        const o   = giz.object;
        const idx = e.target.userData.idx;
    
        if(! (o && giz.dragging) ) return;
        
        switch( giz.mode ){
            case 'translate':
                if( self.onMove )   self.onMove( idx, o.position.toArray() );
                break;
    
            case 'rotate':
                if( self.onRotate ) self.onRotate( idx, o.quaternion.toArray() );
                break;
        }
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const items = [];

    for( let i=0; i < cnt; i++ ){
        const gizmo = new TransformControls( tjs.camera, tjs.renderer.domElement );
        gizmo.setSpace( 'local' );
        gizmo.userData.idx = i;
        gizmo.addEventListener( 'dragging-changed', onDragChange );
        gizmo.addEventListener( 'change', onChange );

        tjs.scene.add( gizmo );
        items.push( gizmo );
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const self  = {
        items    : items,
        onRotate : null,
        onMove   : null,
        onStart  : null,
        onStop   : null,

        attach      : (i,o)=>items[i].attach( o ),
        detach      : (i)=>items[i].gizmo.attach( null ),

        setPos      : (i,p)=>{
            const giz = items[ i ];
            if( giz.object ) giz.object.position.fromArray( p );
            return self;
        },

        useAxes     : ( s=0.5, i=-1 )=>{
            if( i === -1 ){
                for( const g of items ){
                    const axes = new AxesHelper();
                    axes.scale.setScalar( s );
                    tjs.scene.add( axes );
                    g.attach( axes );
                }
            }else{
                const axes = new AxesHelper();
                axes.scale.setScalar( s );
                tjs.scene.add( axes );
                items[ i ].attach( axes );
            }
            return self;
        },
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    return self;
}