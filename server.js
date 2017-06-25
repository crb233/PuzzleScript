
/*
 * Author: Curtis Bechtel (github.com/crb233)
 * Date: 25 June 2017
 * 
 * Builds and runs a local node.js server for testing purposes
 */

// initialize server with Express
var express = require('express');
var app = express();

// serve static pages
app.use(express.static('.'));

// if an invalid page was requested, redirect to editor.html
app.all('*', function(req, res) {
	res.redirect('./editor.html');
});

// set the server port
var port = 8080;
if (process.argv.length > 2 && ! isNaN(process.argv[2])) {
	var val = parseInt(process.argv[2]);
	if (0 <= val && val <= 65535) {
		port = val;
	}
}

// start the server
app.listen(port, function() {
	console.log('Server running on port ' + port + '...');
});

// add a command line listener
process.openStdin().addListener('data', function(d) {
	d = d.toString().trim();
	if (d == 'q') {
		process.exit();
	}
});

