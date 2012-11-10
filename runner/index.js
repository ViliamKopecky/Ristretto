var fs = require('fs');
var exec = require('child_process').exec;
var connect = require('connect');
var http = require('http');
var colors = require('colors');
var socketio = require('socket.io');

var appendScript = '<script src="/socket.io/socket.io.js"></script><script>(function(){var socket = io.connect("/");socket.on("connect", function () {socket.on("reload", function () {window.location.reload();});});})();</script>';

var app = connect()
	.use(connect.favicon(__dirname + '/../img/favicon.ico'))
	.use(connect.logger('dev'))
	.use(connect.static(__dirname + '/..'))
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

var io = socketio.listen(server);

var connections = {};

io.sockets.on('connection', function (socket) {
	var cid = Math.random()+"";
	connections[cid] = socket;
	socket.on('disconnect', function(){
		delete(connections[cid]);
	});
});

server.listen(3332);

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
setInterval(reloadConnections, 150);

(function() {
	var watch_dir = __dirname + '/../less';

	var files = {
		//	'input.less': 'output.css'
	};

	files[__dirname + '/../less/screen.less'] = __dirname + '/../css/screen.css';

	var interval = 100; // ms
	var dirty = true;

	var compile = function(input, output) {
		compilations++;
		exec('lessc -x ' + input + ' > ' + output, function(error, stdout, stderr) {
			if(stdout) console.log('%s', stdout);
			if(stderr) console.log('ERROR: %s'.red, stderr);
			if(!error) console.log('LESS COMPILED | %s'.yellow, new Date().toLocaleTimeString());
			compilations--;
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

(function() {
	var ignore = [".git"];

	var dir = __dirname + '/..';
	var watch_dirs = [
		dir,
		dir + '/css',
		dir + '/js',
		dir + '/img',
		dir + '/model',
		dir + '/runner',
		dir + '/runner/app',
		dir + '/components'
	];

	var interval = 100; // ms

	var check = function(type, filename) {
		if(ignore.indexOf(filename) === -1) {
			dirtyState = true;
			console.log("CHANGED: %s".yellow, filename);
		} else {
			console.log("CHANGED and ignored: %s".yellow, filename);
		}
	};

	for(var i in watch_dirs) {
		if(fs.existsSync(watch_dirs[i]))
			fs.watch(watch_dirs[i], check);
	}
})();