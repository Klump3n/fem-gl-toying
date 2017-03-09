/*
 * fem-gl-toying -- getting to terms with WebGL and JavaScript
 * Copyright (C) 2017 Matthias Plock <matthias.plock@bam.de>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 * @fileOverview
 * Contains an object that sets the view matrix and keeps track of mouse-dragging events.
 * @name setView.js
 * @author Matthias Plock <matthias.plock@bam.de>
 * @license GLPv3
 */

/**
 * Creates an object which holds the modelView matrix, viewMatrix and
 * projectionMatrix. Has functions to manipulate the modelView matrix,
 * viewMatrix (indirectly via the camera matrix) and projectionMatrix.
 * @Param {HTML5_canvas} gl - The HTML canvas element.
 * @param {float} fovIn - [OPTIONAL] Field Of View -- The angle with which
 * we perceive objects.
 * @param {float} aspectIn - [OPTIONAL] Aspect ratio of the canvas.
 * @param {float} zNearIn - [OPTIONAL] The closest distance at which we
 * can see objects in our frustum.
 * @param {float} zFarIn - [OPTIONAL] - The furthest distance at which we
 * can see objects in our frustum.
 * @returns {} Nothing.
 */
function ModelMatrix(gl, fovIn, aspectIn, zNearIn, zFarIn) {

    var that = this;            // Export this.

    this.modelView = twgl.m4.identity();
    this.worldMatrix = twgl.m4.identity();
    this.worldState = twgl.m4.identity();

    this.viewMatrix = twgl.m4.identity();
    this.camMatrix = twgl.m4.identity();
    this.projectionMatrix = twgl.m4.identity();

    /**
     * Create the frustum of our view.
     * @param {float} fovIn - [OPTIONAL] Field Of View -- The angle with which
     * we perceive objects.
     * @param {float} aspectIn - [OPTIONAL] Aspect ratio of the canvas.
     * @param {float} zNearIn - [OPTIONAL] The closest distance at which we
     * can see objects in our frustum.
     * @param {float} zFarIn - [OPTIONAL] - The furthest distance at which we
     * can see objects in our frustum.
     */
    this.setFrustum = function(fovIn, aspectIn, zNearIn, zFarIn) {

        this.fov = 30 * Math.PI / 180 || fovIn;
        this.aspect = gl.canvas.clientWidth/gl.canvas.clientHeight || aspectIn;
        this.zNear = 1 || zNearIn;
        this.zFar = 2000 || zFarIn;

        /** Calculate the perspective matrix. */
        this.projectionMatrix = twgl.m4.perspective(this.fov, this.aspect, this.zNear, this.zFar);
        this.modelView = twgl.m4.multiply(this.modelView, this.projectionMatrix);
    };


    /**
     * Creates a viewMatrix by inverting the camera matrix,
     * then updates the modelView.
     * @param {vec3} viewerPosition - The position of the viewer.
     * @param {vec3} targetPosition - The position of the target.
     * @param {vec3} upVector - A vector that points upwards.
     */
    this.placeCamera = function(viewerPosition, targetPosition, upVector) {
        this.camMatrix = twgl.m4.lookAt(viewerPosition, targetPosition, upVector);
        this.viewMatrix = twgl.m4.inverse(this.camMatrix);
        this.modelView = twgl.m4.multiply(this.modelView, this.viewMatrix);
    };

    /**
     * Update the modelView matrix.
     * @returns {mat4} The modelView matrix.
     */
    this.updateView = function() {
        this.modelView = twgl.m4.multiply(
            this.modelView,
            twgl.m4.rotationX(dx/1000)
        );
        this.modelView = twgl.m4.multiply(
            this.modelView,
            twgl.m4.rotationY(dy/1000)
        );

        return this.modelView;
    };

    /** Variables for tracking the mouse movement and dragging events. */
    var nowPointer = 0;
    var x = 0;
    var y = 0;
    var prevPointer = 0;
    var prevx = 0;
    var prevy = 0;
    var dx = 0;
    var dy = 0;
    var dragging = false;
    var x_center = gl.canvas.clientWidth / 2;
    var y_center = gl.canvas.clientHeight /2;
    var timer;


    /**
     * Callback function for a mouse-button-down event. Sets dragging
     * to true and adds two eventListeners (one for mouse movement and
     * one for the release of the mouse button).
     * @param {} event
     */
    function doMouseDown(event){
        if (dragging) {
            return;
        };
        dragging = true;
        document.addEventListener("mousemove", doMouseMove, true);
        document.addEventListener("mouseup", doMouseUp, false);
        prevPointer = [event.clientX, event.clientX];
        prevx = event.clientX;
        prevy = event.clientY;
    }

    /**
     * Callback function for a mouse-move event. If the mouse-button
     * has not been pressed nothing will happen. If dragging is true
     * it will calculate a velocity of the mouse movement.
     * @param {} event
     */
    function doMouseMove(event){
        if (!dragging) {
            return;
        }

        prevPointer = [prevx, prevy];
        nowPointer = [event.clientX, event.clientX];
        // ROTATETHEMATRIX;
        console.log(nowPointer);
        prevPointer = nowPointer;
        // Change this to a spherical thing...
        clearTimeout(timer);

        x = event.clientX;
        y = event.clientY;
        dx = x - prevx;
        dy = y - prevy;
        prevx = x;
        prevy = y;

        // Wait 10ms until you set dx and dy to 0
        // If we define a function that rotates our object just by dx and call this from inside this function then we dont need this crap. Define a unit circle and so on... In that reference frame we can do our calculations.
        // 
        timer = setTimeout(function(){
            dx = 0;
            dy = 0;
        }, 10);

        // Pseudocode
        // prev = some_v2
        // now = current_v2
        // someFuncThatRotates(prev, now)
    }

    /**
     * Callback function for a mouse-button-release event. If the
     * mouse-button is released it will delete the two eventListeners for
     * mouse-movement and mouse-button-release and disable dragging.
     * @param {} event
     */
    function doMouseUp(event){
        if (!dragging) {
            return;
        }
        document.removeEventListener("mousemove", doMouseMove, false);
        document.removeEventListener("mouseup", doMouseUp, false);
        dx = 0;
        prevx = 0;
        dy = 0;

        prevy = 0;
        dragging = false;
    }


    /**
     * Returns the norm of the difference between two given vectors. If only
     * one vector is supplied it will calculate the norm of the given vector.
     * @param {2D_FLOAT32_ARRAY} first_vector
     * @param {2D_FLOAT32_ARRAY} second_vector - [OPTIONAL]
     * @returns {2D_FLOAT32_ARRAY} The norm of the difference between the
     * given vectors.
     */
    function vec2norm(first_vector, second_vector) {
        var x0 = first_vector[0];
        var y0 = first_vector[1];
        var x1 = second_vector[0] || 0;
        var y1 = second_vector[1] || 0;

        return Math.sqrt(Math.pow(x0-x1, 2)) + Math.pow(y0-y1, 2);
    }

    /** Initialise the eventListener for mouse-button-pressing */
    gl.canvas.addEventListener("mousedown", doMouseDown, false);
    this.setFrustum(fovIn, aspectIn, zNearIn, zFarIn);
}
