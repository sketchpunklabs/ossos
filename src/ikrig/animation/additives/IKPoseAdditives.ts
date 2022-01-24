import BipedIKPose      from "../BipedIKPose";
import IIKPoseAdditive  from "../support/IIKPoseAdditive";

class Additive{
    key : string;
    add : IIKPoseAdditive;
    constructor( k: string, add: IIKPoseAdditive ){
        this.key = k
        this.add = add;
    }
}

class IKPoseAddtives{
    items : Array< Additive > = [];

    add( key: string, add: IIKPoseAdditive ): this{
        this.items.push( new Additive( key, add ) );
        return this
    }

    apply( src: BipedIKPose ): void{
        let a: Additive;
        for( a of this.items ) a.add.apply( a.key, src );
    }
}

export default IKPoseAddtives;