import { vec3, quat, mat4 } from 'gl-matrix';

// https://gabormakesgames.com/blog_transforms_transforms.html
// https://gabormakesgames.com/blog_transforms_transform_world.html

export class Transform{
    // #region MAIN
    rot : quat = [0,0,0,1];
    pos : vec3 = [0,0,0];
    scl : vec3 = [1,1,1];
    constructor( rot ?: quat, pos ?: vec3, scl ?: vec3  ){
        if( rot ) quat.copy( this.rot, rot );
        if( pos ) vec3.copy( this.pos, pos );
        if( scl ) vec3.copy( this.scl, scl );
    }
    // #endregion

    // #region SETTERS
    copy( a: Transform ): this{
        this.pos[ 0 ] = a.pos[ 0 ];
        this.pos[ 1 ] = a.pos[ 1 ];
        this.pos[ 2 ] = a.pos[ 2 ];
    
        this.scl[ 0 ] = a.scl[ 0 ];
        this.scl[ 1 ] = a.scl[ 1 ];
        this.scl[ 2 ] = a.scl[ 2 ];
    
        this.rot[ 0 ] = a.rot[ 0 ];
        this.rot[ 1 ] = a.rot[ 1 ];
        this.rot[ 2 ] = a.rot[ 2 ];
        this.rot[ 3 ] = a.rot[ 3 ];
        return this;
    }
    // #endregion

    // #region OPS

    mul( t: Transform ): this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // POSITION - parent.position + ( parent.rotation * ( parent.scale * child.position ) )
        const tmp : vec3 = [0,0,0]; 
        vec3.mul( tmp, this.scl, t.pos );
        vec3.transformQuat( tmp, tmp, this.rot );
        vec3.add( this.pos, this.pos, tmp );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SCALE - parent.scale * child.scale
        vec3.mul( this.scl, this.scl, t.scl );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // ROTATION - parent.rotation * child.rotation
        quat.mul( this.rot, this.rot, t.rot );

        return this;
    }

    pmul( t: Transform ): this{
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // POSITION - parent.position + ( parent.rotation * ( parent.scale * child.position ) )
        // The only difference for this func, We use the IN.scl & IN.rot instead of THIS.scl * THIS.rot
        // Consider that this Object is the child and the input is the Parent.

        const tmp : vec3 = [0,0,0];
        vec3.mul( tmp, this.pos, t.scl );
        vec3.transformQuat( tmp, tmp, t.rot );
        vec3.add( this.pos, tmp, t.pos );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SCALE - parent.scale * child.scale
        vec3.mul( this.scl, this.scl, t.scl );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // ROTATION - parent.rotation * child.rotation
        // Must Rotate from Parent->Child, need PMUL
        quat.mul( this.rot, t.rot, this.rot );

        return this
    }

    // #endregion
};

export class transform{

    // #region MISC
    static create( rot ?: quat, pos ?: vec3, scl ?: vec3 ): Transform{
        return new Transform( rot, pos, scl );
        // return { 
        //     rot : ( rot )? [ rot[0], rot[1], rot[2], rot[3] ] : [0,0,0,1],
        //     pos : ( pos )? [ pos[0], pos[1], pos[2] ]         : [0,0,0],
        //     scl : ( scl )? [ scl[0], scl[1], scl[2] ]         : [1,1,1],
        // };
    }

    static clone( t: Transform ) : Transform{ 
        return new Transform( t.rot, t.pos, t.scl );
        // return { 
        //     rot : [ t.rot[0], t.rot[1], t.rot[2], t.rot[3] ],
        //     pos : [ t.pos[0], t.pos[1], t.pos[2] ],
        //     scl : [ t.scl[0], t.scl[1], t.scl[2] ],
        // };
    }

    static copy( out: Transform, a: Transform ): Transform{
        out.pos[ 0 ] = a.pos[ 0 ];
        out.pos[ 1 ] = a.pos[ 1 ];
        out.pos[ 2 ] = a.pos[ 2 ];
    
        out.scl[ 0 ] = a.scl[ 0 ];
        out.scl[ 1 ] = a.scl[ 1 ];
        out.scl[ 2 ] = a.scl[ 2 ];
    
        out.rot[ 0 ] = a.rot[ 0 ];
        out.rot[ 1 ] = a.rot[ 1 ];
        out.rot[ 2 ] = a.rot[ 2 ];
        out.rot[ 3 ] = a.rot[ 3 ];
        return out;
    }
    
    static reset( out: Transform ): Transform {
        out.pos[ 0 ] = 0;
        out.pos[ 1 ] = 0;
        out.pos[ 2 ] = 0;
    
        out.scl[ 0 ] = 1;
        out.scl[ 1 ] = 1;
        out.scl[ 2 ] = 1;
    
        out.rot[ 0 ] = 0;
        out.rot[ 1 ] = 0;
        out.rot[ 2 ] = 0;
        out.rot[ 3 ] = 1;
        return out;
    }
    
    static fromMat4( out: Transform, m: mat4 ): Transform{
        mat4.getRotation(    out.rot, m );
        mat4.getScaling(     out.scl, m );
        mat4.getTranslation( out.pos, m );
        quat.normalize( out.rot, out.rot );
        return out;
    }
    // #endregion

// #region OPs
static mul( out: Transform, a: Transform, b: Transform ){
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // POSITION : parent.position + ( parent.rotation * ( parent.scale * child.position ) )
    const pos: vec3 = [
        a.scl[ 0 ] * b.pos[ 0 ],
        a.scl[ 1 ] * b.pos[ 1 ],
        a.scl[ 2 ] * b.pos[ 2 ],
    ];
    
    vec3.transformQuat( pos, pos, a.rot );

    out.pos[ 0 ] = a.pos[ 0 ] + pos[ 0 ];
    out.pos[ 1 ] = a.pos[ 1 ] + pos[ 1 ];
    out.pos[ 2 ] = a.pos[ 2 ] + pos[ 2 ];

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // SCALE : parent.scale * child.scale
    out.scl[ 0 ] = a.scl[ 0 ] * b.scl[ 0 ];
    out.scl[ 1 ] = a.scl[ 1 ] * b.scl[ 1 ];
    out.scl[ 2 ] = a.scl[ 2 ] * b.scl[ 2 ];

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ROTATION : parent.rotation * child.rotation
    quat.mul( out.rot, a.rot, b.rot );

    return out;
}

static addPos( out: Transform, a: Transform, pos: vec3 ): Transform{
    // POSITION : parent.position + ( parent.rotation * ( parent.scale * child.position ) )
    
    const v: vec3 = [
        pos[ 0 ] * a.scl[ 0 ],
        pos[ 1 ] * a.scl[ 1 ],
        pos[ 2 ] * a.scl[ 2 ],
    ];

    vec3.transformQuat( out.pos, v, a.rot );
    out.pos[ 0 ] += a.pos[ 0 ];
    out.pos[ 1 ] += a.pos[ 1 ];
    out.pos[ 2 ] += a.pos[ 2 ];

    if( a !== out ){
        vec3.copy( out.scl, a.scl );
        quat.copy( out.rot, a.rot );
    }

    return out;
}

static invert( out: Transform, a: Transform ): Transform{
    // Invert Rotation
    quat.invert( out.rot, a.rot );

    // Invert Scale
    vec3.inverse( out.scl, a.scl );

    // Invert Position : rotInv * ( invScl * -Pos )
    const p: vec3 = [
        out.scl[ 0 ] * -a.pos[ 0 ],
        out.scl[ 1 ] * -a.pos[ 1 ],
        out.scl[ 2 ] * -a.pos[ 2 ],
    ];
    
    vec3.transformQuat( out.pos, p, out.rot );
    return out;
}

// static preMulChain( out, ...ary ){
//     const t = clone( ary[ ary.length - 1 ] );
    
//     for( let i = ary.length - 2; i >= 0; i-- ){
//         mul( t, ary[ i ], t );
//     }

//     copy( out, t );
//     return out;
// }
// #endregion

// #region TRANSFORM
static transformVec3( out: vec3, t: Transform, v: vec3 ): vec3{
    // GLSL - vecQuatRotation( model.rotation, a_position.xyz * model.scale ) + model.position;

    out[ 0 ] = t.scl[ 0 ] * v[ 0 ];
    out[ 1 ] = t.scl[ 1 ] * v[ 1 ];
    out[ 2 ] = t.scl[ 2 ] * v[ 2 ];

    vec3.transformQuat( out, out, t.rot );

    out[ 0 ] += t.pos[ 0 ];
    out[ 1 ] += t.pos[ 1 ];
    out[ 2 ] += t.pos[ 2 ];
    return out;
}

static toLocalVec3( out: vec3, t: Transform, v: vec3 ): vec3{
    vec3.sub( out, v, t.pos );                      // Subtract from Parent's WS Position
    vec3.div( out, out, t.scl );                    // Divide by Parent's WS Scale

    const inv = quat.invert( [0,0,0,1], t.rot );    // Rotate by Parent's WS Inverse Rotation
    vec3.transformQuat( out, out, inv );
    return out;
}
// #endregion

}


/*
	World Space Position to Local Space.
	V	.copy( gBWorld.eye_lid_upper_mid_l.pos ) // World Space Postion
	 	.add( [0, -0.05 * t, 0 ] )	// Change it
		.sub( gBWorld.eye_l.pos )	// Subtract from Parent's WS Position
		.div( gBWorld.eye_l.scl )	// Div by Parent's WS Scale
		.transform_quat( gBWorld.eye_l.rot_inv );	// Rotate by Parent's WS Inverse Rotation

	get_world_transform( tf=null ){
		tf = tf || new Transform();
		tf.copy( this.local );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( this.parent != null ){ 
			// Parents Exist, loop till reaching the root
			let n = this;
			while( n.parent != null ){
				n = n.parent; 
				tf.add_rev( n.local );  // mul( local, )
			}
		}
		return tf;
	}

		// Computing Transforms in reverse, Child - > Parent
		add_rev( pr, pp, ps = null ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// POSITION - parent.position + ( parent.rotation * ( parent.scale * child.position ) )
			// The only difference for this func, We use the IN.scl & IN.rot instead of THIS.scl * THIS.rot
			// Consider that this Object is the child and the input is the Parent.
			this.pos.mul( ps ).transform_quat( pr ).add( pp );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// SCALE - parent.scale * child.scale
			if( ps ) this.scl.mul( ps );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// ROTATION - parent.rotation * child.rotation
			this.rot.pmul( pr ); // Must Rotate from Parent->Child, need PMUL

			return this
		}
*/