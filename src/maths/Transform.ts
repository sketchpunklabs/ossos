import { vec3, quat } from 'gl-matrix';

class Transform{

    //#region MAIN
    rot = quat.create();
    pos = vec3.create();
    scl = vec3.fromValues( 1, 1, 1 );

    constructor()
    constructor( tran: Transform )
    constructor( rot: quat, pos: vec3, scl: vec3 )
    constructor( rot ?: quat | Transform, pos ?: vec3, scl ?: vec3 ){
        if( rot instanceof Transform ){
            this.copy( rot );
        }else if( rot && pos && scl ){
            this.set( rot, pos, scl );
        }
    }
    //#endregion ////////////////////////////////////////////////////////


    //#region SETTERS / GETTERS

    reset() : this{
        quat.set( this.rot, 0, 0, 0, 1 );
        vec3.set( this.pos, 0, 0, 0 );
        vec3.set( this.scl, 1, 1, 1 );
        return this;
    }

    copy( t: Transform ) : this{
        quat.copy( this.rot, t.rot );
        vec3.copy( this.pos, t.pos );
        vec3.copy( this.scl, t.scl );
        return this;
    }

    set( r ?: quat, p ?: vec3, s ?: vec3 ) : this{
        if( r )	quat.copy( this.rot, r );
        if( p )	vec3.copy( this.pos, p );
        if( s )	vec3.copy( this.scl, s );
        return this;
    }

    setPos( v: vec3 ): this{ vec3.copy( this.pos, v ); return this; }
    setRot( v: quat ): this{ quat.copy( this.rot, v ); return this; }
    setScl( v: vec3 ): this{ vec3.copy( this.scl, v ); return this; }
    setUniformScale( v: number ) : this{
        this.scl[0] = v;
        this.scl[1] = v;
        this.scl[2] = v;
        return this;
    }

    clone() : Transform{ return new Transform( this ); }

    //#endregion ////////////////////////////////////////////////////////

    //#region OPERATORS

    // Computing Transforms, Parent -> Child
    mul( tran: Transform ) : this
    mul( cr: quat, cp: vec3, cs ?: vec3 ) : this
    mul( cr: quat | Transform, cp ?: vec3, cs ?: vec3 ) : this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // If just passing in Tranform Object
        if( cr instanceof Transform ){
            cp = cr.pos;
            cs = cr.scl;
            cr = cr.rot;
        }

        if( cr && cp ){
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // POSITION - parent.position + ( parent.rotation * ( parent.scale * child.position ) )
            
            //this.pos.add( Vec3.mul( this.scl, cp ).transformQuat( this.rot ) );
            
            const tmp : vec3 = [0,0,0];   // Avoid Create a Float32Array for tmp.
            vec3.mul( tmp, this.scl, cp );
            vec3.transformQuat( tmp, tmp, this.rot );
            vec3.add( this.pos, this.pos, tmp );

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // SCALE - parent.scale * child.scale
            //if( cs ) this.scl.mul( cs );
            if( cs ) vec3.mul( this.scl, this.scl, cs );
            
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // ROTATION - parent.rotation * child.rotation
            // this.rot.mul( cr );
            quat.mul( this.rot, this.rot, cr );
        }

        return this;
    }

    // Computing Transforms in reverse, Child - > Parent
    pmul( tran: Transform ) : this
    pmul( pr: quat, pp: vec3, ps: vec3 ) : this
    pmul( pr: quat | Transform, pp ?: vec3, ps ?: vec3 ) : this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // If just passing in Tranform Object
        if( pr instanceof Transform ){
            pp = pr.pos;
            ps = pr.scl;
            pr = pr.rot;
        }

        if( !pr || !pp || !ps ) return this;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // POSITION - parent.position + ( parent.rotation * ( parent.scale * child.position ) )
        // The only difference for this func, We use the IN.scl & IN.rot instead of THIS.scl * THIS.rot
        // Consider that this Object is the child and the input is the Parent.
        //this.pos.mul( ps ).transformQuat( pr ).add( pp );

        const tmp : vec3 = [0,0,0];   // Avoid Create a Float32Array for tmp.
        vec3.mul( tmp, this.pos, ps );
        vec3.transformQuat( tmp, tmp, pr );
        vec3.add( this.pos, tmp, pp );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SCALE - parent.scale * child.scale
        //if( ps ) this.scl.mul( ps );
        if( ps ) vec3.mul( this.scl, this.scl, ps );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // ROTATION - parent.rotation * child.rotation
        //this.rot.pmul( pr ); // Must Rotate from Parent->Child, need PMUL
        quat.mul( this.rot, pr, this.rot );

        return this
    }

    addPos( cp: vec3, ignoreScl=false ) : this{
        //POSITION - parent.position + ( parent.rotation * ( parent.scale * child.position ) )
        //if( ignoreScl )	this.pos.add( Vec3.fromQuat( this.rot, cp ) );
        //else 			    this.pos.add( Vec3.mul( cp, this.scl ).transformQuat( this.rot ) );

        if( ignoreScl ){
            vec3.add(
                this.pos,
                this.pos,
                vec3.transformQuat( [0,0,0], cp, this.rot )
            );
        }else{
            const tmp : vec3 = [0,0,0];
            vec3.mul( tmp, cp, this.scl )
            vec3.add( 
                this.pos,
                this.pos,
                vec3.transformQuat( tmp, tmp, this.rot )
            );
        }

        return this;
    }

    //#endregion ////////////////////////////////////////////////////////

    //#region FROM OPERATORS
    fromMul( tp: Transform, tc: Transform ) : this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // POSITION - parent.position + ( parent.rotation * ( parent.scale * child.position ) )
        //const v = Vec3.mul( tp.scl, tc.pos ).transformQuat( tp.rot ); // parent.scale * child.position;
        //this.pos.fromAdd( tp.pos, v );

        const tmp : vec3 = [0,0,0];
        vec3.mul( tmp, tp.scl, tc.pos );
        vec3.transformQuat( tmp, tmp, tp.rot )
        vec3.add( this.pos, tp.pos, tmp );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SCALE - parent.scale * child.scale
        //this.scl.fromMul( tp.scl, tc.scl );
        vec3.mul( this.scl, tp.scl, tc.scl );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // ROTATION - parent.rotation * child.rotation
        //this.rot.fromMul( tp.rot, tc.rot );
        quat.mul( this.rot, tp.rot, tc.rot );

        return this;
    }

    fromInvert( t: Transform ) : this{
        // Invert Rotation
        //this.rot.fromInvert( t.rot );
        quat.invert( this.rot, t.rot );

        // Invert Scale
        //this.scl.fromInvert( t.scl );
        vec3.inverse( this.scl, t.scl );

        // Invert Position : rotInv * ( invScl * -Pos )
        //this.pos
        //    .fromNegate( t.pos )
        //    .mul( this.scl )
        //    .transformQuat( this.rot );

        const tmp : vec3 = [0,0,0];
        vec3.negate( tmp, t.pos );
        vec3.mul( tmp, tmp, this.scl );
        vec3.transformQuat( this.pos, tmp, this.rot );

        return this;
    }
    //#endregion ////////////////////////////////////////////////////////

    //#region TRANSFORMATION
    transformVec3( v: vec3, out ?: vec3 ) : vec3{
        //GLSL - quatMulVec3( model.rotation, a_position.xyz * model.scale ) + model.position;
        //return (out || v)
        //    .fromMul( v, this.scl )
        //    .transformQuat( this.rot )
        //    .add( this.pos );

        const tmp : vec3 = [0,0,0];
        vec3.mul( tmp, v, this.scl );
        vec3.transformQuat( tmp, tmp, this.rot );

        return vec3.add( ( out || v ), tmp, this.pos );
    }
    //#endregion ////////////////////////////////////////////////////////

    //#region STATICS
    static mul( tp: Transform, tc: Transform ) : Transform{ return new Transform().fromMul( tp, tc ); }
    static invert( t: Transform ) : Transform{ return new Transform().fromInvert( t ); }

    static fromPos( v: vec3 ) : Transform
    static fromPos( x: number, y: number, z: number ) : Transform
    static fromPos( x: number | vec3, y ?: number, z ?: number ) : Transform{        
        const t = new Transform();

        /*
        if( x instanceof vec3 || x instanceof Array || x instanceof Float32Array ){
            t.pos.copy( x );
        }else if( x != undefined && y != undefined && z != undefined ){
            t.pos.xyz( x, y, z );
        }
        */

        if( x instanceof Float32Array || x instanceof Array ){
            vec3.copy( t.pos, x );
        }else if( x != undefined && y != undefined && z != undefined ){
            vec3.set( t.pos, x, y, z );
        }

        return t;
    }
    //#endregion ////////////////////////////////////////////////////////
}

export default Transform;