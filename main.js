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
            data: ts.split(',')
        },
        a_color: {
            numComponents: 3,
            type: gl.UNSIGNED_BYTE,
            normalized: true,
            data: new Uint8Array(
                cs.split(',')
            )}
    };

    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    var uniforms = {
        u_transform: twgl.m4.identity() // mat4
    };

	  gl.enable(gl.CULL_FACE);
	  gl.enable(gl.DEPTH_TEST);

    // Set up out frustum
    var perspective = twgl.m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth/gl.canvas.clientHeight, 1, 2000);

    var camPos = [500, 30, -200];
    var tarPos = [0, 0, 0];
    var up = [0, 1, 0];

    var translationMatrix = twgl.m4.identity();
    var camMatrix = twgl.m4.lookAt(camPos, tarPos, up);
    var viewMatrix = twgl.m4.inverse(camMatrix);

    var now = 0,
        then = 0,
        dt = 0;

    var rotationSpeed = 60;    // Degrees per second

    function drawScene(now) {

        dt = (now - then)*.001;    // Conversion to seconds
        var dist = dt*Math.PI/180;  // in radiant

        uniforms.u_transform = twgl.m4.multiply(perspective, viewMatrix);

        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, bufferInfo);

        window.requestAnimationFrame(drawScene);

        // Advance the time after drawing the frame
        then = now;

        translationMatrix = twgl.m4.rotationX(rotationSpeed*dist);

        viewMatrix = twgl.m4.multiply(viewMatrix, translationMatrix);
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

main();
