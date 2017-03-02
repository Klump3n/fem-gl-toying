/**
 * @fileOverview
 * Contains an object that sets the view matrix and keeps track of mouse-dragging events.
 * @name setView.js
 * @author Matthias Plock
 * @license TBD
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

    this.modelView = twgl.m4.identity();
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
     * Creates a viewMatrix by inverting the camera matrix.
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
    var x = 0,
        y = 0,
        prevx = 0,
        prevy = 0,
        dx = 0,
        dy = 0,
        dragging = false;


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
        document.addEventListener("mousemove", doMouseMove, false);
        document.addEventListener("mouseup", doMouseUp, false);
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
        // Change this to a spherical thing... 
        x = event.clientX;
        y = event.clientY;
        dx = x - prevx;
        dy = y - prevy;
        prevx = x;
        prevy = y;
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

    /** Initialise the eventListener for mouse-button-pressing */
    gl.canvas.addEventListener("mousedown", doMouseDown, false);
    this.setFrustum(fovIn, aspectIn, zNearIn, zFarIn);
}
