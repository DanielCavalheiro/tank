uniform mat4 mModelView;
uniform mat4 mProjection;

uniform vec4 color;

attribute vec4 vPosition;
attribute vec3 vNormal;

varying vec3 fNormal;
varying vec4 fColor;

void main() {
    gl_Position = mProjection * mModelView * vPosition;
    fNormal = vNormal;
    fColor= color;
}