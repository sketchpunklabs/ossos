export default class Test{
    name : string = '';

    constructor( x:string ){
        if( x ) this.name = x;
    }
}

/* IDEAL OUTPUT SHOULD BE
class Test{
    name = '';
    constructor( x ){
        if( x ) this.name = x;
    }
}
*/