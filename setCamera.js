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

    var that = this;            // WHAT. THE. FUCK.

    this.modelView = twgl.m4.identity();
    this.worldMatrix = twgl.m4.identity();
    this.worldState = twgl.m4.identity();

    this.targetCameraVector = twgl.v3.create(0, 0, 0);
    this.worldTranslation = twgl.v3.create(0, 0, 0);

    that.rotPhi = twgl.m4.identity();
    that.rotTheta = twgl.m4.identity();

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

        this.viewerPosition = viewerPosition;
        this.targetPosition = targetPosition;
        this.upVector = upVector;

        // Store this for later (definition of rotational axis).
        this.targetCameraVector = twgl.v3.subtract(viewerPosition, targetPosition);
        this.targetCameraVector = twgl.v3.normalize(this.targetCameraVector);

        this.viewMatrix = twgl.m4.identity();
        this.camMatrix = twgl.m4.identity();

        this.camMatrix = twgl.m4.lookAt(viewerPosition, targetPosition, upVector);
        this.viewMatrix = twgl.m4.inverse(this.camMatrix);
    };

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
        // this.modelView = twgl.m4.multiply(this.projectionMatrix, this.viewMatrix);
        // this.modelView = twgl.m4.multiply(this.modelView, this.worldMatrix);
        // this.modelView = twgl.m4.translate(this.modelView, twgl.v3.negate(this.worldTranslation));
        // this.modelView = twgl.m4.multiply(this.modelView, this.rotPhi);
        // this.modelView = twgl.m4.multiply(this.modelView, this.rotTheta);
        // this.modelView = twgl.m4.translate(this.modelView, this.worldTranslation);
        // Works.

        this.modelView = twgl.m4.multiply(this.projectionMatrix, this.viewMatrix);
        this.modelView = twgl.m4.multiply(this.modelView, this.worldMatrix);
        // this.modelView = twgl.m4.multiply(this.modelView, this.camMatrix);
        this.modelView = twgl.m4.translate(this.modelView, twgl.v3.negate(this.worldTranslation));
        this.modelView = twgl.m4.multiply(this.modelView, this.rotPhi);
        this.modelView = twgl.m4.multiply(this.modelView, this.rotTheta);
        this.modelView = twgl.m4.translate(this.modelView, this.worldTranslation);

        /**
         * this.worldState gives the state of the coordinate system.
         * Matrix organisation is as follows
         * w0 w4 w8  w12 -- x-axis, 3 coordinates and 1 translation
         * w1 w5 w9  w13 -- y-axis, 3 coordinates and 1 translation
         * w2 w6 w10 w14 -- z-axis, 3 coordinates and 1 translation
         * w3 w7 w11 w15
         */
        // this.worldState = twgl.m4.multiply(this.camMatrix, twgl.m4.inverse(this.projectionMatrix));
        // this.worldState = twgl.m4.multiply(this.worldState, this.modelView);

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
        if (dragging) {
            return;
        };
        dragging = true;
        document.addEventListener("mousemove", doMouseMove, true);
        document.addEventListener("mouseup", doMouseUp, false);
        x_prev = event.clientX - x_center;
        y_prev = y_center - event.clientY;

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

        x_now = event.clientX - x_center;
        y_now = y_center - event.clientY;
        dx = x_now - x_prev;
        dy = y_now - y_prev;

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
        }

        if (theta > Math.PI/2) {
            theta = Math.PI/2;
        }
        else if (theta < -Math.PI/2) {
            theta = -Math.PI/2;
        }

        console.log(that.worldState);

        // Set the rotations
        that.rotPhi = twgl.m4.axisRotation(that.upVector, phi);
        that.rotTheta = twgl.m4.axisRotation(thetaAxis, theta);

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


    /**
     * Returns the norm of the difference between two given vectors. If only
     * one vector is supplied it will calculate the norm of the given vector.
     * @param {2D_FLOAT_ARRAY} first_vector
     * @param {2D_FLOAT_ARRAY} second_vector - [OPTIONAL]
     * @returns {FLOAT} The norm of the difference between the
     * given vectors.
     */
    function vec2norm(first_vector, second_vector) {
        var x0 = first_vector[0];
        var y0 = first_vector[1];
        second_vector = second_vector || [0, 0];
        var x1 = second_vector[0];
        var y1 = second_vector[1];

        return Math.sqrt((x0-x1)*(x0-x1) + (y0-y1)*(y0-y1));
    }

    /**
     * Return the skalar product of two vectors.
     * @param {2D_FLOAT_ARRAY} first_vector
     * @param {2D_FLOAT_ARRAY} second_vector
     * @returns {FLOAT} The skalar product of two vectors.
     */
    function vec2prod(first_vector, second_vector) {
        var x0 = first_vector[0];
        var y0 = first_vector[1];
        var x1 = second_vector[0];
        var y1 = second_vector[1];

        return x0*x1 + y0*y1;
    }

    /**
     * Returns the angle between two vectors.
     * @param {2D_FLOAT_ARRAY} first_vector
     * @param {2D_FLOAT_ARRAY} second_vector
     * @returns {FLOAT} The angle between two vectors.
     */
    function vec2angle(first_vector, second_vector) {
        var first_norm = vec2norm(first_vector);
        var second_norm = vec2norm(second_vector);
        var norm_prod = first_norm * second_norm;
        if (norm_prod > 0) {
            return Math.acos(vec2prod(first_vector, second_vector) / norm_prod);
        }
        else {
            return 0;
        }

    }
    /** Initialise the eventListener for mouse-button-pressing */
    gl.canvas.addEventListener("mousedown", doMouseDown, false);
    this.setFrustum(fovIn, aspectIn, zNearIn, zFarIn);
}
