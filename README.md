# fem-gl-toying
Toying around with WebGL to get the hang of JavaScript (importing data, promises and so on).

Displays some data that has been generated by [fem-gl-backend](https://github.com/Klump3n/fem-gl-backend).
Drag the mouse over the model to rotate, hold CTRL while mouse-drag to translate the model and use the mouse wheel to zoom in and out. Mostly rudimentary, but it kind of works.

Clone into a local folder and start a HTTP server in that folder (for example under Linux 
`python -m SimpleHTTPServer 8000` although that is not very fast) then direct your browser
to http://localhost:8000.

This relies on [twgl.js](https://github.com/greggman/twgl.js/) to keep the number 
of WebGL boilerplate lines low.

This has been merged into [fem-gl](https://github.com/Klump3n/fem-gl), so don't expect anything new here.
