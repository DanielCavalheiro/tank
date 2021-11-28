precision highp float;

varying vec3 fNormal;
varying vec3 fColor;

void main() {
    //vec3 c = fNormal + vec3(1.0, 1.0, 1.0);
    gl_FragColor = vec4(fColor+fNormal*fColor*0.1,1.0);
}