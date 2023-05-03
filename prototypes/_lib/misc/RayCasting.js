import * as THREE from 'three';
import { Vec3 } from '../../../src/index';


export default class RayCasting{
    // #region MAIN
    caster       = new THREE.Raycaster();
    pos          = new THREE.Vector2();
    ndc          = new THREE.Vector2();
    viewSize     = new THREE.Vector2();
    camera       = null;
    renderer     = null;
    isMouseDown  = false;
    onMouseDown  = null;  // ( e, RayCasting )
    onMouseHover = null;
    onMouseUp    = null;
    enabled      = true;

    constructor( camera, renderer ){
        this.camera   = camera;
        this.renderer = renderer;
    }
    // #endregion

    // #region EVENTS HANDLERS
    _onPointerDown = ( e )=>{
        if( !this.enabled ) return;

        this.isMouseDown = true;
        if( this.onMouseDown ){
            this.updateCoord( e );
            this.updateRay();
            this.onMouseDown( e, this );
        }
    };

    _onPointerMove = ( e )=>{
        if( !this.enabled ) return;

        if( !this.isMouseDown && this.onMouseHover ){
            this.updateCoord( e );
            this.updateRay();
            this.onMouseHover( e, this );
        }
    };

    _onPointerUp  = ()=>{ this.isMouseDown = false; };
    // #endregion

    // #region PUBLIC METHODS
    enable(){
        const can = this.renderer.domElement;
        can.addEventListener( 'pointerdown', this._onPointerDown );
        can.addEventListener( 'pointermove', this._onPointerMove );
        can.addEventListener( 'pointerup',   this._onPointerUp );
        return this;
    }

    disable(){
        const can = this.renderer.domElement;
        can.removeEventListener( 'pointerdown', this._onPointerDown );
        can.removeEventListener( 'pointermove', this._onPointerMove );
        can.removeEventListener( 'pointerup',   this._onPointerUp );
        return this;
    }

    inObjects( ary, checkChildren=false ){
        return this.caster.intersectObjects( ary, checkChildren );
    }

    getRaySegment(){
        const org = this.caster.ray.origin;
        const dir = this.caster.ray.direction;
        const far = this.camera.far;
        return [
            [ org.x, org.y, org.z ],
            [
                org.x + dir.x * far,
                org.y + dir.y * far,
                org.z + dir.z * far,
            ]
        ];
    }
    // #endregion

    // #region PRIVATE METHODS
    updateCoord( e ){
        // Compute position over the canvas with its top/left corner as origin
        const box  = this.renderer.domElement.getBoundingClientRect();
        this.pos.x = e.clientX - box.x;
        this.pos.y = e.clientY - box.y;

        // Compute NDC screen coordinate of mouse over canvas
        this.renderer.getSize( this.viewSize );
        this.ndc.x =  ( this.pos.x / this.viewSize.x ) * 2 - 1;
        this.ndc.y = -( this.pos.y / this.viewSize.y ) * 2 + 1;
    }

    updateRay(){
        this.caster.setFromCamera( this.ndc, this.camera );
        return this;
    }
    // #endregion
}

export function nearPoint( rayStart, rayEnd, p ){
    /* closest_point_to_line3D
    let dx	= bx - ax,
        dy	= by - ay,
        dz	= bz - az,
        t	= ( (px-ax)*dx + (py-ay)*dy + (pz-az)*dz ) / ( dx*dx + dy*dy + dz*dz ) ; */
    // const v = vec3.sub( p, ray.posStart, [0,0,0] );
    // vec3.mul( v, ray.vecLength );

    const vLen  = new Vec3().fromSub( rayEnd, rayStart );
    const v     = new Vec3()
        .fromSub( p, rayStart )
        .mul( vLen );


    // const t = ( v[0] + v[1] + v[2] ) / vec3.lenSq( ray.vecLength );
    const t = ( v[0] + v[1] + v[2] ) / vLen.lenSqr;

    if( t < 0 || t > 1 ) return null;                   // Over / Under shoots the Ray Segment
    // const lenSqr = vec3.lenSq( ray.posAt( t, v ), p );  // Distance from point to nearest point on ray.
    // return ( lenSqr <= (distLimit*distLimit) )? t : null;
    
    return [
        rayStart[ 0 ] + vLen[ 0 ] * t,
        rayStart[ 1 ] + vLen[ 1 ] * t,
        rayStart[ 2 ] + vLen[ 2 ] * t,
    ];
}
