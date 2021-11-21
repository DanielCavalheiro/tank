precision highp float;

varying vec3 fNormal;
varying vec4 fColor;

void main() {
    vec3 c = fNormal + vec3(1.0, 1.0, 1.0);
    gl_FragColor = fColor;
}