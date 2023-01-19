import { vec3, quat }  from 'gl-matrix'

export default class QuatEx{

    static polar( out: quat, lon: number, lat: number, up: vec3 = [0,1,0] ) : quat{
        lat = Math.max( Math.min( lat, 89.999999 ), -89.999999 ); // Clamp lat, going to 90+ makes things spring around.

        const phi       = ( 90 - lat ) * 0.01745329251; // PI / 180
        const theta     = lon * 0.01745329251;
        const phi_s	    = Math.sin( phi );
        const v: vec3   = [
            -( phi_s * Math.sin( theta ) ),
            Math.cos( phi ),
            phi_s * Math.cos( theta )
        ];

        return this.look( out, v, up );
    }

    static look( out:quat, dir: vec3, up: vec3 = [0,1,0] ) : quat {
        
        // Ported to JS from C# example at https://pastebin.com/ubATCxJY
        // TODO, if Dir and Up are equal, a roll happends. Need to find a way to fix this.
        const zAxis	= vec3.copy( [0,0,0], dir );            // Forward
        const xAxis = vec3.cross( [0,0,0], up, zAxis );     // Right
        const yAxis = vec3.cross( [0,0,0], zAxis, xAxis );  // Up

        vec3.normalize( xAxis, xAxis );
        vec3.normalize( yAxis, yAxis );
        vec3.normalize( zAxis, zAxis );

        //fromAxis - Mat3 to Quat
        const m00 = xAxis[0], m01 = xAxis[1], m02 = xAxis[2],
              m10 = yAxis[0], m11 = yAxis[1], m12 = yAxis[2],
              m20 = zAxis[0], m21 = zAxis[1], m22 = zAxis[2],
              t   = m00 + m11 + m22;

        let x: number, 
            y: number, 
            z: number, 
            w: number, 
            s: number;

        if(t > 0.0){
            s = Math.sqrt(t + 1.0);
            w = s * 0.5 ; // |w| >= 0.5
            s = 0.5 / s;
            x = (m12 - m21) * s;
            y = (m20 - m02) * s;
            z = (m01 - m10) * s;
        }else if((m00 >= m11) && (m00 >= m22)){
            s = Math.sqrt(1.0 + m00 - m11 - m22);
            x = 0.5 * s;// |x| >= 0.5
            s = 0.5 / s;
            y = (m01 + m10) * s;
            z = (m02 + m20) * s;
            w = (m12 - m21) * s;
        }else if(m11 > m22){
            s = Math.sqrt(1.0 + m11 - m00 - m22);
            y = 0.5 * s; // |y| >= 0.5
            s = 0.5 / s;
            x = (m10 + m01) * s;
            z = (m21 + m12) * s;
            w = (m20 - m02) * s;
        }else{
            s = Math.sqrt(1.0 + m22 - m00 - m11);
            z = 0.5 * s; // |z| >= 0.5
            s = 0.5 / s;
            x = (m20 + m02) * s;
            y = (m21 + m12) * s;
            w = (m01 - m10) * s;
        }

        out[ 0 ] = x;
        out[ 1 ] = y;
        out[ 2 ] = z;
        out[ 3 ] = w;
        return out;
    }

}