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

    this.targetCameraVector = twgl.v3.create(0, 0, 0);
    this.worldTranslation = twgl.v3.create(0, 0, 0);

    that.rotPhi = twgl.m4.identity();
    that.rotTheta = twgl.m4.identity();
    that.altRot = twgl.m4.identity();
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

        this.projectionMatrix = twgl.m4.identity();

        this.fov = 30 * Math.PI / 180 || fovIn;
        this.aspect = gl.canvas.clientWidth/gl.canvas.clientHeight || aspectIn;
        this.zNear = 1 || zNearIn;
        this.zFar = 2000 || zFarIn;

        /** Calculate the perspective matrix. */
        this.projectionMatrix = twgl.m4.perspective(this.fov, this.aspect, this.zNear, this.zFar);
    };

    /**
     * Creates a viewMatrix by inverting the camera matrix,
     * then updates the modelView.
     * @param {vec3} viewerPosition - The position of the viewer.
     * @param {vec3} targetPosition - The position of the target.
     * @param {vec3} upVector - A vector that points upwards.
     */
    this.placeCamera = function(viewerPosition, targetPosition, upVector) {

        this.viewMatrix = twgl.m4.identity();
        this.camMatrix = twgl.m4.identity();

        this.viewerPosition = viewerPosition;
        this.targetPosition = targetPosition;
        this.upVector = upVector;

        // Store this for later (definition of rotational axis).
        this.targetCameraVector = twgl.v3.subtract(viewerPosition, targetPosition);
        this.targetCameraVector = twgl.v3.normalize(this.targetCameraVector);

        this.camMatrix = twgl.m4.lookAt(viewerPosition, targetPosition, upVector);
        this.viewMatrix = twgl.m4.inverse(this.camMatrix);
    };

    /**
     * Update the viewer position.
     * @param {vec3} viewerPosition - The position of the viewer.
     * @param {vec3} targetPosition - The position of the target.
     * @param {vec3} upVector - A vector that points upwards.
     */
    this.updateCamera = function(viewerPosition, targetPosition, upVector) {
        this.camMatrix = twgl.m4.lookAt(viewerPosition, targetPosition, upVector);
        this.viewMatrix = twgl.m4.inverse(this.camMatrix);
    };

    /**
     * Translates the world by a given vector.
     * @param {vec3} translate
     */
    this.translateWorld = function(translate ) {
        this.worldTranslation = translate;
        this.worldMatrix = twgl.m4.translate(this.worldMatrix, translate);
    };


    /**
     * Update the modelView matrix.
     * @returns {mat4} The modelView matrix.
     */
    this.updateView = function() {
        this.modelView = twgl.m4.multiply(this.projectionMatrix, this.viewMatrix);
        this.modelView = twgl.m4.multiply(this.modelView, this.worldMatrix);
        this.modelView = twgl.m4.translate(this.modelView, twgl.v3.negate(this.worldTranslation));
        // this.modelView = twgl.m4.multiply(this.modelView, this.rotPhi);
        // this.modelView = twgl.m4.multiply(this.modelView, this.rotTheta);
        this.modelView = twgl.m4.multiply(this.modelView, this.altRot);
        this.modelView = twgl.m4.translate(this.modelView, this.worldTranslation);


        this.resetZoom();
        /**
         * this.worldState gives the state of the coordinate system.
         * Matrix organisation is as follows
         * w0 w4 w8  w12 -- x-axis, 3 coordinates and 1 translation
         * w1 w5 w9  w13 -- y-axis, 3 coordinates and 1 translation
         * w2 w6 w10 w14 -- z-axis, 3 coordinates and 1 translation
         * w3 w7 w11 w15
         */
        this.worldState = twgl.m4.multiply(twgl.m4.inverse(this.projectionMatrix), this.modelView);
        return this.modelView;
    };

    /** Variables for tracking the mouse movement and dragging events. */
    var x_center = gl.canvas.clientWidth / 2;
    var x_prev = 0,
        x_now = 0,
        dx = 0;
    var y_center = gl.canvas.clientHeight /2;
    var y_prev = 0,
        y_now = 0,
        dy = 0;

    var dragging = false;
    var translating_model = false;

    var phi = 0;
    var dphi = 0;
    var theta = 0;
    var dtheta = 0;
    var thetaAxis = twgl.v3.create(0, 0, 0);

    /**
     * Callback function for a mouse-button-down event. Sets dragging
     * to true and adds two eventListeners (one for mouse movement and
     * one for the release of the mouse button).
     * @param {} event
     */
    function doMouseDown(event){
        if (dragging || translating_model) {
            return;
        }

        if (!event.ctrlKey) {
            dragging = true;
        }

        if (event.ctrlKey) {
            translating_model = true;
        }

        document.addEventListener("mousemove", doMouseMove, true);
        document.addEventListener("mouseup", doMouseUp, false);

        prevx = event.clientX;
        prevy = event.clientY;

        // Create an orthogonal vector to eye vector and up vector
        thetaAxis = twgl.v3.cross(that.targetCameraVector, that.upVector);
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

        // Get current coordinates
        x_now = event.clientX - x_center;
        y_now = y_center - event.clientY;
        dx = x_now - x_prev;
        dy = y_now - y_prev;

        quat = quaternionRot(
            x_now, y_now,
            x_prev, y_prev,
            radius=1000,
            x_axis=twgl.v3.normalize(twgl.v3.cross(that.targetCameraVector, that.upVector)),
            y_axis=twgl.v3.normalize(twgl.v3.negate(that.upVector)),
            z_axis=twgl.v3.normalize(twgl.v3.negate(that.targetCameraVector))
        );
        that.altRot = twgl.m4.multiply(quat, that.altRot);
        // Invert up-and-down dragging logic when we face the back
        var front = (Math.abs(phi) < Math.PI/2);
        if (!front) {
            dy = - dy;
        }

        // Set interval
        dphi = 10/gl.canvas.clientWidth * dx;
        dtheta = 10/gl.canvas.clientHeight * dy;

        phi = phi + dphi;
        theta = theta + dtheta;

        // Clamp the angles
        if (phi < -Math.PI) {
            phi = Math.PI;
        } else if (phi > Math.PI) {
            phi = -Math.PI;
        };

        if (theta > Math.PI/2) {
            theta = Math.PI/2;
        }
        else if (theta < -Math.PI/2) {
            theta = -Math.PI/2;
        };

        // Note: at some point I would like to do this with quaternios
        // or euler angles...
        // http://math.hws.edu/graphicsbook/demos/c7/rotators.html
        // Set the rotations
        that.rotPhi = twgl.m4.axisRotation(that.upVector, phi);
        that.rotTheta = twgl.m4.axisRotation(thetaAxis, theta);
        // console.log('rotPhi', that.rotPhi);
        // console.log('rotTheta', that.rotTheta);
        console.log('quatRot', that.altRot);

        // Update coordinates
        x_prev = x_now;
        y_prev = y_now;
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

    function quaternionRot(x_1, y_1, x_2, y_2, radius, x_axis, y_axis, z_axis){
        // Experimental rotations with quaternions.

        // Define a sphere. Return the z-coordinate on a sphere.
        function z_on_sphere(x, y) {
            return Math.sqrt(radius*radius - x*x - y*y);
        }
        var v1 = [x_1, y_1, z_on_sphere(x_1, y_1)];
        v1 = twgl.v3.normalize(v1);
        var v2 = [x_2, y_2, z_on_sphere(x_2, y_2)];
        v2 = twgl.v3.normalize(v2);

        var angle = Math.acos(twgl.v3.dot(v1, v2));
        var axis  = twgl.v3.cross(v1, v2);
        axis = twgl.v3.normalize(axis);
        if (isNaN(angle)){
            angle = 0;
            axis = twgl.v3.create(1, 0, 0); // Direction does not matter, angle is 0 anyway.
        }
        var qw = Math.cos(angle/2),
            qx = twgl.v3.dot(axis, twgl.v3.normalize(x_axis))*Math.sin(angle/2),
            qy = twgl.v3.dot(axis, twgl.v3.normalize(y_axis))*Math.sin(angle/2),
            qz = twgl.v3.dot(axis, twgl.v3.normalize(z_axis))*Math.sin(angle/2);

        var rotMatrixQuat = twgl.m4.identity();
        rotMatrixQuat[0] = 1 - 2*(qy*qy + qz*qz);
        rotMatrixQuat[1] = 2*(qx*qy + qw*qz);
        rotMatrixQuat[2] = 2*(qx*qz - qw*qy);
        rotMatrixQuat[3] = 0;
        rotMatrixQuat[4] = 2*(qx*qy - qw*qz);
        rotMatrixQuat[5] = 1 - 2*(qx*qx + qz*qz);
        rotMatrixQuat[6] = 2*(qw*qx + qy*qz);
        rotMatrixQuat[7] = 0;
        rotMatrixQuat[8] = 2*(qw*qy + qx*qz);
        rotMatrixQuat[9] = 2*(qy*qz - qw*qx);
        rotMatrixQuat[10] = 1 - 2*(qx*qx + qy*qy);
        return rotMatrixQuat;
    }

    var delta;
    function doMouseWheel(event){
        delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
    }

    this.resetZoom = function() {
        delta = 0;
    };

    /** Initialise the eventListener for mouse-button-pressing */
    gl.canvas.addEventListener("mousedown", doMouseDown, false);
    gl.canvas.addEventListener("DOMMouseScroll", doMouseWheel, false);

    this.setFrustum(fovIn, aspectIn, zNearIn, zFarIn);
}
