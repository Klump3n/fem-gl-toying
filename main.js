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

function grabCanvas(canvasElementName) {
    // Select the canvas element from the html
    var webGlCanvas = document.getElementById(canvasElementName);

    // Create a webGl2 context if possible
    var gl = twgl.getContext(webGlCanvas);

    // Check if WebGL 2.0, if not throw error
    function isWebGL2(gl) {
        return gl.getParameter(gl.VERSION).indexOf("WebGL 2.0") == 0;
    }
    if (isWebGL2(gl) != true) {
        console.log("No WebGL2");
        Error("No WebGL2");
    }

    return gl;
}

// This is called with established context and shaders loaded
function glRoutine(gl, vs, fs, ts, cs) {
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    var arrays = {
        a_position: {
            numComponents: 3,
            data: ts.split(',') // Split data on comma
        },
        a_color: {
            numComponents: 3,
            type: gl.UNSIGNED_BYTE,
            normalized: true,
            data: new Uint8Array(
                cs.split(',')   // Split data on comma
            )}
    };

    var modelMatrix = new ModelMatrix(gl);

    var camPos = [1, 0, -500];
    var tarPos = [0, 0, 0];
    var up = [0, 0, 1];
    modelMatrix.placeCamera(camPos, tarPos, up);

    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    var uniforms = {
        u_transform: twgl.m4.identity() // mat4
    };

	  gl.enable(gl.CULL_FACE);
	  gl.enable(gl.DEPTH_TEST);

    var now = 0,
        then = 0,
        dt = 0;

    var rotationSpeed = 60;    // Degrees per second

    var transformationMatrix = twgl.m4.identity();

    function drawScene(now) {

        dt = (now - then)*.001;    // Conversion to seconds
        var dist = dt*Math.PI/180;  // in radiant

        // Update the model view
        uniforms.u_transform = modelMatrix.updateView(0);

        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, bufferInfo);

        window.requestAnimationFrame(drawScene);

        // Advance the time after drawing the frame
        then = now;

    }
    drawScene(now);
}

function main() {
    // Init WebGL.
    var gl = grabCanvas("webGlCanvas");

    // Promise to load the data from file.
    var trianglePromise = getDataSourcePromise("data/f_bare.triangles");
    var colorPromise = getDataSourcePromise("data/f_bare.colors");
    var vertexShaderPromise = getDataSourcePromise("shaders/vertexShader.glsl.c");
    var fragmentShaderPromise = getDataSourcePromise("shaders/fragmentShader.glsl.c");

    // Once all the promises are resolved...
    Promise.all(
        [
            trianglePromise,      // 0
            colorPromise,         // 1
            vertexShaderPromise,  // 2
            fragmentShaderPromise // 3
        ]
        // ... then ...
    ).then(function(value) {
        // ... assign data to variables and ...
        var triangleSource = value[0];
        var colorSource = value[1];
        var vertexShaderSource = value[2];
        var fragmentShaderSource = value[3];

        // ... call the GL routine (i.e. do the graphics stuff)
        glRoutine(gl,
                  vertexShaderSource, fragmentShaderSource,
                  triangleSource, colorSource // Let's see if we can't to this globally?
                 );
    });
};
