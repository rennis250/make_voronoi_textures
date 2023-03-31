#version 410

precision highp float;

in vec4 vcolor;
out vec4 fragColor;

uniform float screenWidth;
uniform float screenHeight;

uniform sampler2D tex;

vec2 iResolution = vec2(screenWidth, screenHeight);

const float threshold = 0.03;
const int MinCountNeeded = 2;

void main() {
	vec2 uv = gl_FragCoord.xy / iResolution.xy;
	if (uv.x == 0.0 || uv.x == 1.0 || uv.y == 0.0 || uv.y == 1.0) {
		fragColor = texture(tex, uv);
	} else {
		vec3 t = vec3(0.0);

	    vec3 c0 = texelFetch(tex, ivec2(gl_FragCoord.xy), 0).rgb;
	    vec3 c1 = texelFetch(tex, ivec2(gl_FragCoord.xy) + ivec2(-1,0), 0).rgb;
	    vec3 c2 = texelFetch(tex, ivec2(gl_FragCoord.xy) + ivec2(1,0), 0).rgb;
	    vec3 c3 = texelFetch(tex, ivec2(gl_FragCoord.xy) + ivec2(1,-1), 0).rgb;
	    vec3 c4 = texelFetch(tex, ivec2(gl_FragCoord.xy) + ivec2(-1,-1), 0).rgb;
	    vec3 c5 = texelFetch(tex, ivec2(gl_FragCoord.xy) + ivec2(-1,1), 0).rgb;
	    vec3 c6 = texelFetch(tex, ivec2(gl_FragCoord.xy) + ivec2(1,1), 0).rgb;
	    vec3 c7 = texelFetch(tex, ivec2(gl_FragCoord.xy) + ivec2(0,1), 0).rgb;
	    vec3 c8 = texelFetch(tex, ivec2(gl_FragCoord.xy) + ivec2(0,-1), 0).rgb;

	    t += c1;
	    t += c2;
	    t += c3;
	    t += c4;
	    t += c5;
	    t += c6;
	    t += c7;
	    t += c8;

	    vec3 d1 = c0 - c1;
	    vec3 d2 = c0 - c2;
	    vec3 d3 = c0 - c3;
	    vec3 d4 = c0 - c4;
	    vec3 d5 = c0 - c5;
	    vec3 d6 = c0 - c6;
	    vec3 d7 = c0 - c7;
	    vec3 d8 = c0 - c8;

	    float e[8] = float[8](sqrt(d1.r*d1.r + d1.g*d1.g + d1.b*d1.b),
	    				sqrt(d2.r*d2.r + d2.g*d2.g + d2.b*d2.b),
	    				sqrt(d3.r*d3.r + d3.g*d3.g + d3.b*d3.b),
	    				sqrt(d4.r*d4.r + d4.g*d4.g + d4.b*d4.b),
	    				sqrt(d5.r*d5.r + d5.g*d5.g + d5.b*d5.b),
	   	 				sqrt(d6.r*d6.r + d6.g*d6.g + d6.b*d6.b),
	 		    		sqrt(d7.r*d7.r + d7.g*d7.g + d7.b*d7.b),
						sqrt(d8.r*d8.r + d8.g*d8.g + d8.b*d8.b));

		int count = 0;
	 	for (int x = 0; x < 8; x++) {
	 		if (e[x] < threshold) {
	 			count += 1;
	 		}
	 	}

	 	if (count < MinCountNeeded) {
    		fragColor = vec4(t/8.0, 1.0);
	 	} else {
	 		fragColor = vec4(c0, 1.0);
	 	}
	}
}
