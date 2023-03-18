import Vec3, { TVec3, ConstVec3 } from './Vec3';
import Quat, { TQuat, ConstQuat } from './Quat';

// https://gabormakesgames.com/blog_transforms_transforms.html
// https://gabormakesgames.com/blog_transforms_transform_world.html

export default class Transform{

    // #region MAIN
    rot	= new Quat();
    pos	= new Vec3( 0 );
    scl = new Vec3( 1 );

    constructor()
    constructor( tran: Transform )
    constructor( rot: TQuat, pos: ConstVec3, scl: ConstVec3 )
    constructor( rot ?: TQuat | Transform, pos ?: ConstVec3, scl ?: ConstVec3 ){
        if( rot instanceof Transform ){
            this.copy( rot );
        }else if( rot && pos && scl ){
            this.set( rot, pos, scl );
        }
    }
    // #endregion

    // #region SETTERS / GETTERS
    reset() : this{
        this.rot.identity();
        this.pos.xyz( 0, 0, 0 );
        this.scl.xyz( 1, 1, 1 );
        return this;
    }

    copy( t: Readonly<Transform> ): this{
        this.rot.copy( t.rot );
        this.pos.copy( t.pos );
        this.scl.copy( t.scl );
        return this;
    }

    set( r ?: ConstQuat, p ?: ConstVec3, s ?: ConstVec3 ): this{
        if( r )	this.rot.copy( r );
        if( p )	this.pos.copy( p );
        if( s )	this.scl.copy( s );
        return this;
    }

    clone() : Transform{ return new Transform( this ); }
    // #endregion

    // #region OPERATORS

    // Computing Transforms, Parent -> Child
    mul( tran: Transform ) : this
    mul( cr: ConstQuat, cp: TVec3, cs ?: TVec3 ) : this
    mul( cr: ConstQuat | Transform, cp ?: TVec3, cs ?: TVec3 ) : this{
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
            this.pos.add( new Vec3().fromMul( this.scl, cp ).transformQuat( this.rot ) );

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // SCALE - parent.scale * child.scale
            if( cs ) this.scl.mul( cs );

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // ROTATION - parent.rotation * child.rotation
            this.rot.mul( cr );
        }

        return this;
    }

    // Computing Transforms in reverse, Child - > Parent
    pmul( tran: Transform ) : this
    pmul( pr: ConstQuat, pp: TVec3, ps: TVec3 ) : this
    pmul( pr: ConstQuat | Transform, pp ?: TVec3, ps ?: TVec3 ) : this{
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
        this.pos.mul( ps ).transformQuat( pr ).add( pp );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SCALE - parent.scale * child.scale
        if( ps ) this.scl.mul( ps );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // ROTATION - parent.rotation * child.rotation
        this.rot.pmul( pr ); // Must Rotate from Parent->Child, need PMUL
        return this
    }

    addPos( cp: TVec3, ignoreScl=false ) : this{
        //POSITION - parent.position + ( parent.rotation * ( parent.scale * child.position ) )
        if( ignoreScl )	this.pos.add( new Vec3().fromQuat( this.rot, cp ) );
        else 			this.pos.add( new Vec3().fromMul( cp, this.scl ).transformQuat( this.rot ) );
        return this;
    }

    // #endregion

    // #region FROM OPERATORS
    fromMul( tp: Transform, tc: Transform ) : this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // POSITION - parent.position + (  ( parent.scale * child.position ) * parent.rotation )
        const v = new Vec3()
            .fromMul( tp.scl, tc.pos ) // parent.scale * child.position
            .transformQuat( tp.rot );  // * parent.rotation
        this.pos.fromAdd( tp.pos, v ); // parent.position +

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SCALE - parent.scale * child.scale
        this.scl.fromMul( tp.scl, tc.scl );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // ROTATION - parent.rotation * child.rotation
        this.rot.fromMul( tp.rot, tc.rot );

        return this;
    }

    fromInvert( t: Transform ) : this{
        // Invert Rotation
        this.rot.fromInvert( t.rot );

        // Invert Scale
        this.scl.fromInvert( t.scl );

        // Invert Position : rotInv * ( invScl * -Pos )
        this.pos
            .fromNegate( t.pos )
            .mul( this.scl )
            .transformQuat( this.rot );

        return this;
    }
    // #endregion

    // #region TRANSFORMATION
    transformVec3( v: Vec3, out ?: Vec3 ): Vec3{
        // GLSL - vecQuatRotation(model.rotation, a_position.xyz * model.scale) + model.position;
        return (out || v)
            .fromMul( v, this.scl )
            .transformQuat( this.rot )
            .add( this.pos );

        // out = out || v;
        // vec3.mul( v, this.scl, out );
        // vec3.transformQuat( out, this.rot );
        // vec3.add( out, this.pos );
        // return out;
    }
    // #endregion

}