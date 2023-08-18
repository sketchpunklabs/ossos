// https://iquilezles.org/articles/simpleik/

// vec2 solve( vec2 p, float r1, float r2 )
// {
//     float h = dot(p,p);
//     float w = h + r1*r1 - r2*r2;
//     float s = max(4.0*r1*r1*h - w*w,0.0);
//     return (w*p + vec2(-p.y,p.x)*sqrt(s)) * 0.5/h;
// }