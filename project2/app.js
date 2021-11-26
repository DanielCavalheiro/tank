import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../libs/utils.js";
import { ortho, lookAt, flatten, vec4, rotateY, translate, mult, inverse, scalem, mat4 } from "../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multScale, multTranslation, popMatrix, pushMatrix, multDeformX, multDeformY, multDeformZ} from "../libs/stack.js";

import * as SPHERE from '../libs/sphere.js';
import * as CUBE from '../libs/cube.js';

/** @type WebGLRenderingContext */
let gl;

let time = 0;           // Global simulation time in days
let speed = 1/60.0;     // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running
let eye, at, up;

const VP_DISTANCE = 50;
const TILE_LENGHT=20;
const FLOOR_SIZE=30;

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
    
    mode = gl.TRIANGLES; 

    eye= [VP_DISTANCE,VP_DISTANCE,VP_DISTANCE];
    at=[0,0,0];
    up=[0,1,0];
   
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
            case '1':
                eye=[VP_DISTANCE,0,0];
                at=[0,0,0];
                up=[0,1,0];
                break;
            case '2':
                eye=[0, VP_DISTANCE,0];
                at=[0,0,0];
                up=[-1,0,0];
                break;
            case '3':
                eye=[0,0, VP_DISTANCE];
                at=[0,0,0];
                up=[0,1,0];
                break;
            case '4':
                eye= [VP_DISTANCE,VP_DISTANCE,VP_DISTANCE];
                at=[0,0,0];
                up=[0,1,0];
                break;
            case '+':
                mProjection=mult(mProjection, scalem( 1.05, 1.05, 1.05 ));
                break;
            case '-':
                mProjection=mult(mProjection, scalem( 1/1.05, 1/1.05, 1/1.05 ));
                break;
        }
    }

    gl.clearColor(0.23, 0.48, 0.97, 1.0);
    CUBE.init(gl);
    SPHERE.init(gl);
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
        const uLocation = gl.getUniformLocation(program,"color");
        gl.uniform4fv(uLocation,flatten(vec4(1.0, 1.0, 0.0, 1.0)));
        multScale([10,10,30]);
        multTranslation([0,0,0]);
        multDeformY(30);
        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a sphere representing the sun
        CUBE.draw(gl, program, mode);
    }

    function redTile(){
        const uLocation = gl.getUniformLocation(program,"color");
        gl.uniform4fv(uLocation,flatten(vec4(0.04,0.94,0.1,1.0)));
        multScale([TILE_LENGHT,TILE_LENGHT/20,TILE_LENGHT]);
        uploadModelView();
        CUBE.draw(gl,program,mode);
    }

    function greyTile(){
        const uLocation = gl.getUniformLocation(program,"color");
        gl.uniform4fv(uLocation,flatten(vec4(0.1,0.47,0.13,0.35)));
        multScale([TILE_LENGHT, TILE_LENGHT/20 ,TILE_LENGHT]);
        uploadModelView();
        CUBE.draw(gl,program,mode);
    }

    function floor(){
        multTranslation([-FLOOR_SIZE/2*TILE_LENGHT, -TILE_LENGHT/2, -FLOOR_SIZE/2*TILE_LENGHT]);
        for (let i = 0; i < FLOOR_SIZE; i++) {
            multTranslation([0, 0, TILE_LENGHT]);
            
            pushMatrix();
            if(i%2==0){
                pushMatrix();
                greyTile()
                popMatrix();
                multTranslation([TILE_LENGHT, 0, 0]);
            }
               
            for (let j = 0; j < FLOOR_SIZE/2; j++) {
                pushMatrix();
                redTile();
                popMatrix()
                multTranslation([TILE_LENGHT, 0, 0])
                
                pushMatrix();
                greyTile()
                popMatrix();
                multTranslation([TILE_LENGHT, 0, 0])
            }
            
            if(i%2==1){
                pushMatrix();
                redTile();
                popMatrix()
            }
            popMatrix();
        }
    }



    function render()
    {
        if(animation) time += speed;
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    
        loadMatrix(lookAt(eye, at, up));

        pushMatrix();
        floor();
        popMatrix();
        Sun();
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))