import { vec3, quat } from 'gl-matrix'

class TypePool{
    static _vec3Pool : vec3[] = [];
    static _quatPool : quat[] = [];

    static vec3() : vec3{
        let v: vec3 | undefined = this._vec3Pool.pop();
        if( !v ) v = vec3.create();
        return v;
    }

    static quat() : quat{
        let v: quat | undefined = this._quatPool.pop();
        if( !v ) v = quat.create()
        return v;
    }

    static recycle_vec3( ...ary: vec3[] ): TypePool{
        let v: vec3;
        for( v of ary ) this._vec3Pool.push( vec3.set( v, 0, 0, 0 ) );
        return this;
    }

    static recycle_quat( ...ary: quat[] ): TypePool{
        let v: quat;
        for( v of ary ) this._quatPool.push( quat.set( v, 0, 0, 0, 1 ) );
        return this;
    }
}

export default TypePool;