import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../libs/utils.js";
import { ortho, lookAt, flatten, vec4, rotateY, translate, mult, inverse } from "../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multScale, multTranslation, popMatrix, pushMatrix} from "../libs/stack.js";

import * as SPHERE from '../libs/sphere.js';
import * as CUBE from '../libs/cube.js';

/** @type WebGLRenderingContext */
let gl;

let time = 0;           // Global simulation time in days
let speed = 1/60.0;     // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running

const VP_DISTANCE = 50;

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);

    mode = gl.LINES; 

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeydown = function(event) {
        switch(event.key) {
            case 'W':
                mode = gl.LINES; 
                break;
            case 'S':
                mode = gl.TRIANGLES;
                break;
        }
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    CUBE.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    
    window.requestAnimationFrame(render);


    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function Sun()
    {
        // Don't forget to scale the sun, rotate it around the y axis at the correct speed
        multScale([10,10,10]);

        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a sphere representing the sun
        SPHERE.draw(gl, program, mode);
    }

    function floor(){
        const uLocation = gl.getUniformLocation(program,"color");
        gl.uniform4fv(uLocation,flatten(vec4(1.0,1.0,1.0,1.0)));
        multScale([5,5,5]);
        for(let i = 0; i<64;i+=2){
            uploadModelView();
            CUBE.draw(gl,program,mode);
        }
        gl.uniform4fv(uLocation,vec4(0.86,0.07,0.07,1.0));
        for(let i = 1; i<64;i+=2){
            uploadModelView();
            multTranslation([1,1,1]);
            CUBE.draw(gl,program,mode);
        }

    }

    function render()
    {
        if(animation) time += speed;
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    
        loadMatrix(lookAt([0,VP_DISTANCE,VP_DISTANCE], [0,0,0], [0,1,0]));

        floor();
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))