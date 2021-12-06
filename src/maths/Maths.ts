
class Maths{

    // Special Modulus that can take in Negative Number 
    // and Loop Around as the result
    static mod( a: number, b: number ) : number{	
        const v = a % b;
        return ( v < 0 )? b + v : v;
    }

}

export default Maths;