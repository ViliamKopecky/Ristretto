var fs = require('fs');
var process = require('child_process');
var connect = require('connect');
var http = require('http');
var colors = require('colors');
var socketio = require('socket.io');
var FileWatcher = require('./filewatcher');
var path = require('path');

var config = {};
if(fs.existsSync('mixturette.json'))
	config = JSON.parse(fs.readFileSync('mixturette.json'));

var host = config.host || '0.0.0.0';
var port = config.port || 3332;
var socketio_port = config.socketio_port || 3331;

if(socketio_port === port)
	socketio_port = port+1;

var app = connect()
	.use(connect.favicon(config.www_dir + '/img/favicon.ico'))
	.use(connect.logger('dev'))
	.use(connect.static(config.www_dir))
	.use(function(req, res) {
	var path = req.originalUrl.substr(1);

	var parts = path.split('\/');
	var last = parts.pop();
	if(last === '') {
		parts.push('index');
		path = parts.join('/');
	}

	var hostname = req.headers.host.split(':').shift();
	var appendScript = '<script src="//'+hostname+':'+socketio_port+'/socket.io/socket.io.js"></script><script>(function(){var socket = io.connect("//'+hostname+':'+socketio_port+'");socket.on("connect", function () {socket.on("reload", function () {window.location.reload();});});})();</script>';

	var php = process.spawn('php', [__dirname + '/app/index.php', '-l', path]);

	php.stdout.setEncoding('UTF-8');

	php.stdout.on('data', function(data){
		res.write(data);
	});

	php.stderr.on('data', function(data){
		res.write(data);
	});

	php.on('exit', function(code){
		setTimeout(function(){
			res.end(appendScript);
		}, 30);
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
socket_server.listen(socketio_port);

console.log('[%s]', 'web '+host+':'+port);
console.log('[%s]', 'sockets '+host+':'+socketio_port);

var dirtyState = false;
var compilations = 0;
var reloadConnections = function() {
	if(dirtyState && compilations === 0) {
		var count = 0;
		for(var k in connections) {
			connections[k].emit('reload');
			count++;
		}
		console.log('RELOADING', count, (count > 1) ? 'PAGES' : 'PAGE');
		dirtyState = false;
	}
};
setInterval(reloadConnections, 100);

(function() {
	var files = {
		//	'input.less': 'output.css'
	};

	files[config.www_dir + '/less/screen.less'] = config.www_dir + '/css/screen.css';

	var interval = 100; // ms
	var dirty = true;

	var compile = function(input, output) {
		compilations++;
		dirtyState = true;
		process.exec('lessc -x ' + input + ' > ' + output, function(error, stdout, stderr) {
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

	fw.add(config.www_dir+"/less/**");
	fw.on('change', function(filename){
		compileAll();
	});

	compileAll();
})();

(function() {
	var ignore = [".git"];

	var interval = 100; // ms

	var check = function(file) {
		var filename = file.split('\/').pop().split('\\').pop();
		if(ignore.indexOf(filename) === -1) {
			dirtyState = true;
			console.log("CHANGED: %s".yellow, file);
		}
	};

	var fw = new FileWatcher();

	fw.add(config.www_dir+"/**");
	fw.add(config.latte_dir+"/**");
	fw.add(config.model_dir+"/**");

	fw.on('change', check);
})();