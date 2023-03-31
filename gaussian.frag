#version 410

precision highp float;

in vec4 vcolor;
out vec4 fragColor;

uniform float screenWidth;
uniform float screenHeight;

uniform sampler2D tex;

vec2 iResolution = vec2(screenWidth, screenHeight);

float normpdf(in float x, in float sigma) {
    return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma;
}

void main() {
    vec3 c = texture(tex, gl_FragCoord.xy / iResolution.xy).rgb;

    //declare stuff
    const int mSize = 11;
    const int kSize = (mSize-1)/2;
    float kernel[mSize];
    vec3 final_colour = vec3(0.0);

    //create the 1-D kernel
    float sigma = 0.5;
    float Z = 0.0;
    for (int j = 0; j <= kSize; ++j) {
        kernel[kSize+j] = kernel[kSize-j] = normpdf(float(j), sigma);
    }

    //get the normalization factor (as the gaussian has been clamped)
    for (int j = 0; j < mSize; ++j) {
        Z += kernel[j];
    }

    //read out the texels
    for (int i=-kSize; i <= kSize; ++i) {
        for (int j=-kSize; j <= kSize; ++j) {
            final_colour += kernel[kSize+j]*kernel[kSize+i]*texture(tex, (gl_FragCoord.xy+vec2(float(i),float(j))) / iResolution.xy).rgb;
        }
    }

    vec4 outColor = vec4(final_colour/(Z*Z), 1.0);
    fragColor = clamp(pow(outColor, vec4(1/2.2)), 0., 1.);
}
