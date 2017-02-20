function getXHRPromise(dataFile) {
    // Return a promise for XHR data
    return new Promise(function(resolve, reject) {
	      var xhr = new XMLHttpRequest;
	      xhr.responseType = 'text';
	      xhr.open('GET', dataFile, true);
	      xhr.onload = function() {
	          if (xhr.status === 200) {
		            // Tries to get the shader source
		            resolve(xhr.responseText);
	          } else {
		            // If unsuccessful return an error
		            reject(Error('getXHRPromise() - Could not load ' + dataFile));
	          }
	      };
	      xhr.onerror = function() {
	          // Maybe we have more severe problems. Also return an error then
	          reject(Error('getXHRPromise() - network issues'));
	      };
	      // Send the request
	      xhr.send();
    });
}


function getDataSourcePromise(dataPath){
    // Load the data from a file via xhr
    return new Promise(function(resolve, revoke) {
        // Var that will hold the loaded string
        var dataSource;

        // Promise to load data from XHR
        var dataPromise = getXHRPromise(dataPath);

        // Promise to assign the loaded data to the source variable
        var assignDataToVar = dataPromise.then(function(value) {
            console.log("Loading " + dataPath);
            dataSource = value;
        });

        // Once everything is loaded resolve the promise
        assignDataToVar.then(function() {
            resolve(dataSource);
        });
    });
}
