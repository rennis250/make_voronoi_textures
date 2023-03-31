#version 410

precision highp float;

in vec4 vcolor;
out vec4 fragColor;

uniform float iFrame;

uniform float screenWidth;
uniform float screenHeight;

vec2 iResolution = vec2(screenWidth, screenHeight);

uniform sampler2D tex;

const vec4 voronoi1A = vec4(0.93176,0.89313,0.10941,0.76277);
const vec4 voronoi1B = vec4(0.68884,0.90398,0.92266,0.71637);
const vec4 voronoi1C = vec4(0.9104,0.036248,-0.11624,0.96085);

const vec4 voronoi2A = vec4(0.49453,0.57418,0.06441,0.78934);
const vec4 voronoi2B = vec4(0.91605,0.52319,0.48874,0.90404);
const vec4 voronoi2C = vec4(0.53319,0.024871,-0.072983,0.5219);

const vec4 voronoi3A = vec4(0.76811,0.81092,0.09763,0.89578);
const vec4 voronoi3B = vec4(0.83772,0.79417,0.7984,0.87028);
const vec4 voronoi3C = vec4(0.79529,0.035946,-0.11647,0.73551);

const vec4 voronoi4A = vec4(0.84239,0.81217,0.099742,0.74072);
const vec4 voronoi4B = vec4(0.84325,0.80406,0.81845,0.77628);
const vec4 voronoi4C = vec4(0.82462,0.032456,-0.11129,0.86428);

const vec4 illum1A = vec4(2.0087,3.1212,0.024136,7.4986);
const vec4 illum1B = vec4(4.7531,1.832,2.9682,5.5527);
const vec4 illum1C = vec4(2.6485,0.11626,-0.0061696,10.439);

const vec4 illum2A = vec4(2.9496,2.7573,0.021068,5.1004);
const vec4 illum2B = vec4(6.6062,2.3123,2.792,7.669);
const vec4 illum2C = vec4(3.3424,0.053118,0.036399,3.7761);

const vec4 illum3A = vec4(2.7095,3.1051,0.016165,10.232);
const vec4 illum3B = vec4(6.7716,2.6771,3.4691,9.6594);
const vec4 illum3C = vec4(3.065,0.014483,0.053846,5.0792);

const vec4 illum4A = vec4(1.7222,2.2575,0.032129,3.9492);
const vec4 illum4B = vec4(5.4682,1.4795,2.4325,5.6502);
const vec4 illum4C = vec4(2.0975,0.057776,0.017091,7.2286);

const float coeff2rgb[36] = float[36](
-0.20371,-0.61662,1.0017,0.063817,0.1185,0.72094,-1.9517,-0.16371,1.5872,-1.2182,-0.81215,1.2476,
0.22864,-0.90359,-1.7675,-0.46729,0.62736,1.1478,-0.45431,0.57508,-0.0031588,0.3678,-0.37462,0.20348,
0.90378,-0.84626,-1.3769,1.0945,-0.45844,0.070268,-0.0049294,0.32235,-0.28357,-0.87155,-0.70403,0.014051
);

struct Spectrum {
  vec4 a;
  vec4 b;
  vec4 c;
};

vec3 spect2rgb(in Spectrum spect) {
    float spectFull[12] = float[12](spect.a.x, spect.a.y, spect.a.z, spect.a.w,
                                  spect.b.x, spect.b.y, spect.b.z, spect.b.w,
                                  spect.c.x, spect.c.y, spect.c.z, spect.c.w);

    float v1 = coeff2rgb[0]*spectFull[0] +
        coeff2rgb[1]*spectFull[1] +
        coeff2rgb[2]*spectFull[2] +
        coeff2rgb[3]*spectFull[3] +
        coeff2rgb[4]*spectFull[4] +
        coeff2rgb[5]*spectFull[5] +
        coeff2rgb[6]*spectFull[6] +
        coeff2rgb[7]*spectFull[7] +
        coeff2rgb[8]*spectFull[8] +
        coeff2rgb[9]*spectFull[9] +
        coeff2rgb[10]*spectFull[10] +
        coeff2rgb[11]*spectFull[11];

    float v2 = coeff2rgb[12]*spectFull[0] +
        coeff2rgb[13]*spectFull[1] +
        coeff2rgb[14]*spectFull[2] +
        coeff2rgb[15]*spectFull[3] +
        coeff2rgb[16]*spectFull[4] +
        coeff2rgb[17]*spectFull[5] +
        coeff2rgb[18]*spectFull[6] +
        coeff2rgb[19]*spectFull[7] +
        coeff2rgb[20]*spectFull[8] +
        coeff2rgb[21]*spectFull[9] +
        coeff2rgb[22]*spectFull[10] +
        coeff2rgb[23]*spectFull[11];

    float v3 = coeff2rgb[24]*spectFull[0] +
        coeff2rgb[25]*spectFull[1] +
        coeff2rgb[26]*spectFull[2] +
        coeff2rgb[27]*spectFull[3] +
        coeff2rgb[28]*spectFull[4] +
        coeff2rgb[29]*spectFull[5] +
        coeff2rgb[30]*spectFull[6] +
        coeff2rgb[31]*spectFull[7] +
        coeff2rgb[32]*spectFull[8] +
        coeff2rgb[33]*spectFull[9] +
        coeff2rgb[34]*spectFull[10] +
        coeff2rgb[35]*spectFull[11];

    return vec3(v1, v2, v3);
}

#define HASHSCALE3 vec3(.1031, .1030, .0973)

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * HASHSCALE3);
  p3 += dot(p3, p3.yzx + 19.19);
  return fract(vec2((p3.x + p3.y)*p3.z, (p3.x + p3.z)*p3.y));
}

// return distance, and cell id
vec2 voronoi( in vec2 x )
{
    vec2 n = floor( x );
    vec2 f = fract( x );

    vec3 m = vec3( 8.0 );
    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ )
    {
        vec2  g = vec2( float(i), float(j) );
        vec2  o = hash22( n + g );
      //vec2  r = g - f + o;
        vec2  r = g - f + (0.5+0.5*sin(6.2831*o));
        float d = dot( r, r );
        if( d<m.x )
            m = vec3( d, o );
    }

    return vec2( sqrt(m.x), m.y+m.z );
}

void main() {
    vec2 uv = 2.0 * gl_FragCoord.xy / iResolution.y;
    float aspect = iResolution.x / iResolution.y;
    uv -= vec2(aspect, 1.0);

    vec2 c = voronoi(10.0*uv);

    Spectrum color = Spectrum(vec4(0.0), vec4(0.0), vec4(0.0));

    vec4 da;
    vec4 db;
    vec4 dc;
    if (c.y > 0.6) {
        da = voronoi2A;
        db = voronoi2B;
        dc = voronoi2C;
    } else {
        da = voronoi3A;
        db = voronoi3B;
        dc = voronoi3C;
    }

    // colorize
    color.a = 0.5 + 0.5*cos( c.y*6.2831 + vec4(1.2,1.0,2.0,0.5) )*da;
    color.a *= illum4A;
    //color.a *= 2.0;

    color.b = 0.5 + 0.5*cos( c.y*6.2831 + vec4(1.2,1.0,2.0,0.5) )*db;
    color.b *= illum4B;
    //color.b *= 2.0;

    color.c = 0.5 + 0.5*cos( c.y*6.2831 + vec4(1.2,1.0,2.0,0.5) )*dc;
    color.c *= illum4C;

    fragColor = vec4(spect2rgb(color), 1.0)*0.1;
}
