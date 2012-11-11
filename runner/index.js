var fs = require('fs');
var exec = require('child_process').exec;
var connect = require('connect');
var http = require('http');
var colors = require('colors');
var socketio = require('socket.io');
var FileWatcher = require('./filewatcher');
var path = require('path');

var port = 3332;
var socket_port = 3331;

var appendScript = '<script src="//localhost:'+socket_port+'/socket.io/socket.io.js"></script><script>(function(){var socket = io.connect("//localhost:'+socket_port+'");socket.on("connect", function () {socket.on("reload", function () {window.location.reload();});});})();</script>';

var app = connect()
	.use(connect.favicon(__dirname + '/../data/img/favicon.ico'))
	.use(connect.logger('dev'))
	.use(connect.static(__dirname + '/../data'))
	.use(function(req, res) {
	var path = req.originalUrl.substr(1);

	if(path === '') {
		path = 'index';
	}

	exec('php "' + __dirname + '/app/index.php" ' + path, function(error, stdout, stderr) {
		if(stderr) console.log('ERROR: %s'.red, stderr);
		if(!error) res.end(stdout + appendScript);
	});
});

var server = http.createServer(app);
var socket_server = http.createServer();

var io = socketio.listen(socket_server);

io.set('log level', 1);

var connections = {};

io.sockets.on('connection', function (socket) {
	var cid = Math.random()+"";
	connections[cid] = socket;
	socket.on('disconnect', function(){
		delete(connections[cid]);
	});
});

server.listen(port);
socket_server.listen(socket_port);

console.log('[%s]', 'enjoy localhost:'+port);

var dirtyState = false;
var compilations = 0;
var reloadConnections = function() {
	if(dirtyState && compilations === 0) {
		for(var k in connections) {
			connections[k].emit('reload');
		}
		dirtyState = false;
	}
};
setInterval(reloadConnections, 100);

(function() {
	var watch_dir = __dirname + '/../data/less';

	var files = {
		//	'input.less': 'output.css'
	};

	files[__dirname + '/../data/less/screen.less'] = __dirname + '/../data/css/screen.css';

	var interval = 100; // ms
	var dirty = true;

	var compile = function(input, output) {
		compilations++;
		dirtyState = true;
		exec('lessc -x ' + input + ' > ' + output, function(error, stdout, stderr) {
			if(stdout) console.log('%s', stdout);
			if(stderr) console.log('ERROR: %s'.red, stderr);
			if(!error) console.log('LESS COMPILED | %s'.yellow, new Date().toLocaleTimeString());
			compilations--;
			compilations = Math.max(0, compilations);
		});
	};

	var compileAll = function() {
			for(var key in files) {
				compile(key, files[key]);
			}
		};

	var fw = new FileWatcher();

	fw.add(path.relative(process.env.PWD, watch_dir)+"/**");
	fw.on('change', function(filename){
		compileAll();
	});
})();

(function() {
	var ignore = [".git"];

	var dir = __dirname + '/../data';

	var interval = 100; // ms

	var check = function(file) {
		var filename = file.split('\/').pop().split('\\').pop();
		if(ignore.indexOf(filename) === -1) {
			dirtyState = true;
			console.log("CHANGED: %s".yellow, file);
		}
	};

	var fw = new FileWatcher();

	fw.add(path.relative(process.env.PWD, dir)+"/**");
	fw.on('change', check);
})();