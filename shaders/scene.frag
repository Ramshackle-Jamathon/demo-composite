precision mediump float;

uniform float uGlobalTime;
uniform vec2 uResolution;
uniform sampler2D uWebcamTexture;
uniform float uSobelStep;
uniform float uColorInterpolateStep;
uniform float uMixStep;

varying vec2 vTexCoords;


// Filmic tone mapping:
// http://filmicgames.com/archives/75
vec3 toneMap(in vec3 c) {
	c = pow(c,vec3(2.0));
	vec3 x = max(vec3(0.0),c-vec3(0.004));
	c = (x*(6.2*x+.5))/(x*(6.2*x+1.7)+0.06);
	return c;
}

// Solid color with a little bit of normal :-)
vec3 getColor(vec3 normal) {
	return mix(vec3(1.0),abs(normal),uColorInterpolateStep); 
}

// Basic sobel filter implementation
// Jeroen Baert - jeroen.baert@cs.kuleuven.be
float intensity(in vec4 color){
	return sqrt((color.x*color.x)+(color.y*color.y)+(color.z*color.z));
}

vec3 sobel(float stepx, float stepy, vec2 center){
	// get samples around pixel
	float tleft = intensity(texture2D(uWebcamTexture,center + vec2(-stepx,stepy)));
	float left = intensity(texture2D(uWebcamTexture,center + vec2(-stepx,0)));
	float bleft = intensity(texture2D(uWebcamTexture,center + vec2(-stepx,-stepy)));
	float top = intensity(texture2D(uWebcamTexture,center + vec2(0,stepy)));
	float bottom = intensity(texture2D(uWebcamTexture,center + vec2(0,-stepy)));
	float tright = intensity(texture2D(uWebcamTexture,center + vec2(stepx,stepy)));
	float right = intensity(texture2D(uWebcamTexture,center + vec2(stepx,0)));
	float bright = intensity(texture2D(uWebcamTexture,center + vec2(stepx,-stepy)));

	// Sobel masks (see http://en.wikipedia.org/wiki/Sobel_operator)
	//        1 0 -1     -1 -2 -1
	//    X = 2 0 -2  Y = 0  0  0
	//        1 0 -1      1  2  1

	// You could also use Scharr operator:
	//        3 0 -3        3 10   3
	//    X = 10 0 -10  Y = 0  0   0
	//        3 0 -3        -3 -10 -3

	float x = tleft + 2.0*left + bleft - tright - 2.0*right - bright;
	float y = -tleft - 2.0*top - tright + bleft + 2.0 * bottom + bright;
	float color = sqrt((x*x) + (y*y));
	return vec3(color,color,color);
}


void main()
{
	vec4 tex = normalize(texture2D(uWebcamTexture, vTexCoords));
	vec3 tone = toneMap(getColor(tex.xyz));
	vec3 color = sobel(uSobelStep/uResolution.x, uSobelStep/uResolution.y, vTexCoords);
	vec3 final = mix(tone,color,uMixStep);
	gl_FragColor = vec4(toneMap(getColor(final)),1.0);
}
