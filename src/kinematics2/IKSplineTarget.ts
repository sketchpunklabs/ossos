// #region IMPORTS
import type Pose            from '../armature/Pose'
import type { IKChain }     from './IKChain';

import Vec3                 from './../maths/Vec3';
import Transform            from './../maths/Transform';
// #endregion

interface SpineWrapper{
    at( t: number, pos: Vec3Like ): void;
    resolve(): void;

    get rootPos(): Vec3Like;
    set rootPos( v: Vec3Like );
    
    get polePos(): Vec3Like;
    set polePos( v: Vec3Like );

    get targetPos(): Vec3Like;
    set targetPos( v: Vec3Like );
}

export default class IKSplineTarget{
    // #region MAIN
    spline     !: SpineWrapper;     // Spline;
    pworld      = new Transform();  // Parent Bone WS Transform
    rworld      = new Transform();  // Root Bone WS Transform

    swing       = new Vec3();
    twist       = new Vec3();
    dist        = 0;                // Distance from Origin & Target Position

    twistRadA   = 0;                // Apply extra twist to start of spline
    twistRadB   = 0;                // Apply extra twist to end of spline

    constructor( s?: SpineWrapper ){
        if( s ) this.setSpline( s );
    }
    // #endregion

    // #region SETTERS
    setSpline( s:SpineWrapper ): this{
        this.spline = s;
        return this;
    }

    // @ts-ignore
    setPos( i: number, v: Vec3Like ): this{ this.spline.setPos( i, v ); return this; }
    setTargetPos( v: Vec3Like ): this{
        // @ts-ignore ts(2532) :: at(-1) is fine
        // this.spline.points.at(-1).setPos( v ); 
        this.spline.targetPos = v;
        return this; 
    }

    // HACK: To make it work like IKTarget
    setPositions( t: Vec3Like, p?: Vec3Like ): this{
        // @ts-ignore ts(2532) :: at(-1) is fine
        // this.spline.points.at(-1).setPos( t ); 
        this.spline.targetPos = t;

        // if( p ) this.spline.setPos( 1, p );
        if( p ) this.spline.polePos = p;
        return this; 
    }

    // HACK: To make it work like IKTarget
    setPolePos( v: Vec3Like ): this{
        // this.spline.setPos( 1, v );
        this.spline.polePos = v;
        return this; 
    }    
    
    // get startPos(){ return this.spline.points[0].pos; }
    // @ts-ignore ts(2532) :: at(-1) is fine
    // get endPos(){ return this.spline.points.at(-1).pos; }
    // #endregion

    // #region METHODS
    resolveTarget( chain: IKChain, pose: Pose ): void{
        const sp = this.spline;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get the World transform to the root's parent bone of the chain
        pose.getWorldTransform( chain.links[0].pindex, this.pworld );

        // Then add bone's LS bind transform to get its current unmodified world transform
        this.rworld.fromMul( this.pworld, chain.links[0].bind );

        // Set root's position as the start of the curve
        // sp.points[0].setPos( this.rworld.pos );
        sp.rootPos = this.rworld.pos;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute ik direction & dist
        // const aPnt = sp.points[0];
        // const bPnt = sp.points.at( -1 ) as Point;

        const aPnt = sp.rootPos;
        const bPnt = sp.targetPos;

        // this.swing.fromSub( bPnt.pos, aPnt.pos );
        this.swing.fromSub( bPnt, aPnt );
        this.dist = this.swing.len;
        this.swing.norm();

        // HACK - this won't work for all splines as there is no defined pole position in a spline
        // Twist is needed by look solver when target is beyond reach
        // const v = new Vec3().fromSub( sp.points[0].pos, sp.points[1].pos ).norm();
        const v = new Vec3().fromSub( sp.rootPos, sp.polePos ).norm();
        this.twist.fromReflect( v, this.swing );        // Refective vector as it should work better in this case to compute a pole vector
        v.fromCross( this.twist, this.swing );          // Start orthogonal fix
        this.twist.fromCross( this.swing, v ).norm();   // Realign twist to be ortho to swing

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Do any final updates
        this.spline.resolve();
    }
    // #endregion
}