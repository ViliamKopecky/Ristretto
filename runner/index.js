var fs = require('fs');
var exec = require('child_process').exec;
var connect = require('connect');
var http = require('http');
var colors = require('colors');

(function() {
	var watch_dir = __dirname + '/../less';

	var files = {
		//	'input.less': 'output.css'
	};

	files[__dirname + '/../less/screen.less'] = __dirname + '/../css/screen.css';

	var interval = 100; // ms
	var dirty = true;

	var compile = function(input, output) {
			exec("lessc -x " + input + " > " + output, function(error, stdout, stderr) {
				if(stdout) console.log("%s", stdout);
				if(stderr) console.log("ERROR: %s", stderr);
				if(!error) console.log("LESS COMPILED | %s\r\n", new Date().toLocaleTimeString());
			});
		};

	var compileAll = function() {
			for(var key in files) {
				compile(key, files[key]);
			}
		};

	var check = function() {
			if(dirty) {
				dirty = false;
				compileAll();
			}
			setTimeout(check, interval);
		};

	fs.watch(watch_dir, function() {
		dirty = true;
	});

	// run checking
	check();
})();



var app = connect().use(connect.favicon(__dirname + '/../img/favicon.ico')).use(connect.logger('dev')).use(connect.static(__dirname + "/..")).use(function(req, res) {
	var path = req.originalUrl.substr(1);

	if(path === "") {
		path = "index";
	}

	exec("php \"" + __dirname + "/app/index.php\" " + path, function(error, stdout, stderr) {
		if(stdout) console.log(stdout);
		if(stderr) console.log("ERROR: " + stderr);
		if(!error) res.end(stdout);
	});
});

http.createServer(app).listen(3332);