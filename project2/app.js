import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../libs/utils.js";
import { ortho, lookAt, flatten, vec4, rotateY, translate, mult, inverse, scalem, mat4, rotateZ } from "../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multScale, multTranslation, popMatrix, pushMatrix, multDeformX, multDeformY, multDeformZ, multRotationX, multRotationZ} from "../libs/stack.js";

import * as SPHERE from '../libs/sphere.js';
import * as CUBE from '../libs/cube.js';
import * as CYLINDER from "../libs/cylinder.js";
import * as TORUS from "../libs/torus.js";

/** @type WebGLRenderingContext */
let gl;

let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let eye, at, up;
let cannonAngle=0, cannonAngle2=0;
let move=0;

const VP_DISTANCE = 30;

//Primitive dimensions constantes-----------------------------------------------------------------------------------------

//Floor
const TILE_LENGHT=20;
const FLOOR_SIZE=30;

//Tank Body
//BottomComponent
const BODY_BC_LENGHT=15;
const BODY_BC_WITDH=8;
const BODY_BC_HEIGHT=6;
const BODY_BC_CONNECT=6;
//Top Component
const BODY_TC_LENGHT=17
const BODY_TC_WITDH=10
const BODY_TC_HEIGHT=4
const BODY_TC_CONNECT=6
//Wheels
const NUMBER_WHEELS=8;
//constante temporaria ??????????????????????????????????????????????
const WHEEL_RADIUS=4;
const WHEEL_WIDTH=7;

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);

    mode = gl.TRIANGLES; 

    eye= [VP_DISTANCE/10,VP_DISTANCE/10,VP_DISTANCE/10];
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
            case 'w':
                if(cannonAngle2>-45)
                    cannonAngle2-=1;
                break;
            case 's':
                if(cannonAngle2<20)
                    cannonAngle2+=1;
                break;
            case 'a':
             cannonAngle+=1;
                break;
            case 'd':
             cannonAngle-=1;
                break;    
            case "ArrowUp":
                move+=1;
                break;
            case "ArrowDown":
                move-=1;
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
                eye= [VP_DISTANCE/10,VP_DISTANCE/10,VP_DISTANCE/10];
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
    CYLINDER.init(gl);
    TORUS.init(gl);
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

    function mainBody()
    {
        const uLocation = gl.getUniformLocation(program,"color");
        gl.uniform4fv(uLocation,flatten(vec4(1.0, 1.0, 0.0, 1.0)));
        pushMatrix();
        multScale([8,4,30]); 
        multDeformY(30);
        multTranslation([0,0,0]);
        // Send the current modelview matrix to the vertex shader
        uploadModelView();
        CUBE.draw(gl, program, mode);
        multDeformY(-30);
        multDeformY(-30);
        multTranslation([-1,0,0]);
        uploadModelView();
        CUBE.draw(gl,program,mode);
        popMatrix();


        gl.uniform4fv(uLocation,flatten(vec4(0.0, 1.0, 1.0, 1.0)));
        pushMatrix();
        multScale([8,4,30]);
        rotateZ(180); 
        multDeformY(-30);
        multTranslation([0,1,0]);
        // Send the current modelview matrix to the vertex shader
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multScale([8,4,30]);
        rotateZ(180);
        multDeformY(30);
        multTranslation([-1,1,0]);
        uploadModelView();
        CUBE.draw(gl,program,mode);
        popMatrix();

    }

    function hatchAndCannon(){
        pushMatrix();
        hatch();
        popMatrix();
        pushMatrix();
            multRotationX(cannonAngle2);
            cannon();
        popMatrix();

    }

    function hatch(){
        const uLocation = gl.getUniformLocation(program,"color");
        gl.uniform4fv(uLocation,flatten(vec4(1.0, 0.0, 1.0, 1.0)));
        multScale([8,8,8]);
        multTranslation([-0.5,0.7,-0.2]);
        uploadModelView();
        SPHERE.draw(gl,program,mode);
    }

    function cannon(){
        multScale([4,4,20]);
        multRotationX(90);
        multTranslation([-2,0.5,-4]);
        uploadModelView();
        CYLINDER.draw(gl,program,mode);
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

    function bodyComponentBottom(){
        const uLocation = gl.getUniformLocation(program,"color");
        gl.uniform4fv(uLocation,flatten(vec4(0.5, 0.5, 0.0, 1.0)));
        multScale([BODY_BC_WITDH,BODY_BC_HEIGHT,BODY_BC_LENGHT]);
        multDeformY(10);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }
    function bodyBottom(){
        pushMatrix();
            multTranslation([0,0,BODY_BC_CONNECT])
            bodyComponentBottom();
        popMatrix();
        pushMatrix();
            multRotationY(180);
            multTranslation([0,0,BODY_BC_CONNECT])
            bodyComponentBottom();
        popMatrix();
    }

    function bodyComponentTop(){
        const uLocation = gl.getUniformLocation(program,"color");
        gl.uniform4fv(uLocation,flatten(vec4(1.0, 1.0, 0.0, 1.0)));
        multScale([BODY_TC_WITDH,BODY_TC_HEIGHT,BODY_TC_LENGHT]);
        multDeformY(-15);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function bodyTop(){
        pushMatrix();
            multTranslation([0,0,BODY_TC_CONNECT]);
            bodyComponentTop();
        popMatrix();
        pushMatrix();
            multRotationY(180);
            multTranslation([0,0,BODY_TC_CONNECT]);
            bodyComponentTop();
        popMatrix();
    }

    function bodyConnecter(){
        const uLocation = gl.getUniformLocation(program,"color");
        gl.uniform4fv(uLocation,flatten(vec4(0.75, 0.75, 0.0, 1.0)));
        multScale([BODY_TC_WITDH, 1, 33.5]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function body(){
        pushMatrix();
            bodyBottom();
        popMatrix();
        
        pushMatrix();
            multTranslation([0,BODY_BC_HEIGHT/2-0.5,0]);
            bodyConnecter();
        popMatrix();

        multTranslation([0,BODY_BC_HEIGHT-1,0]);
        pushMatrix();
            bodyTop();
        popMatrix();

    }

    //TODO, I ll do this tomorrow
    function drawWheels(){
        for(let i = 0; i<NUMBER_WHEELS/2;i++){
            pushMatrix();
                multTranslation([BODY_BC_WITDH/2,-BODY_BC_HEIGHT/2,BODY_BC_LENGHT/2+1.5-i*(BODY_BC_LENGHT*2/NUMBER_WHEELS/2)]);
                wheel();
            popMatrix();
            pushMatrix();
                multTranslation([-BODY_BC_WITDH/2,-BODY_BC_HEIGHT/2,BODY_BC_LENGHT/2+1.5-i*(WHEEL_RADIUS*2)]);
                wheel();
            popMatrix();
        }
    }

    function wheel(){
        const uLocation = gl.getUniformLocation(program,"color");
        gl.uniform4fv(uLocation,flatten(vec4(0.0, 0.0, 0.0, 1.0)));
        multScale([WHEEL_WIDTH,BODY_BC_LENGHT*2/NUMBER_WHEELS/2,BODY_BC_LENGHT*2/NUMBER_WHEELS/2]);
        multRotationZ(90);
        uploadModelView();
        TORUS.draw(gl, program, mode);
    }

    function render()
    {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    
        loadMatrix(lookAt(eye, at, up));

        pushMatrix();
            floor();
        popMatrix();
        
        multTranslation([0,0,move]);
        pushMatrix();
        
        pushMatrix();
            body();
        popMatrix();
        pushMatrix();
            drawWheels();
        popMatrix();
        popMatrix();

        
        // pushMatrix();
        //     mainBody();
        // popMatrix();
        // pushMatrix();
        //     multRotationY(cannonAngle);
        //     hatchAndCannon();
        // popMatrix();
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))