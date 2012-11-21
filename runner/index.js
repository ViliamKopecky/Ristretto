console.log([
' ____  _     _            _   _',
'|  _ \\(_)___| |_ _ __ ___| |_| |_ ___',
'| |_) | / __| __| \'__\/ _ \\ __| __\/ _ \\',
'|  _ <| \\__ \\ |_| | |  __\/ |_| || (_) |',
'|_| \\_\\_|___\/\\__|_|  \\___|\\__|\\__\\___/', ''].join("\n"));

var fs = require('fs');
var cp = require('child_process');
var http = require('http');
var path = require('path');

var config = {};
if(fs.existsSync('ristretto.json'))
	config = JSON.parse(fs.readFileSync('ristretto.json'));

config.append_script = fs.readFileSync(__dirname + '/reload_snippet.html') || '';
config.latte_dir = config.latte_dir || config.www_dir;

var host = config.host || '0.0.0.0';
var port = config.port || 2012;

var action = process.argv[2];

if(['update', 'install', 'init'].indexOf(action) !== -1) {
	var commands = [];
	commands.push({
		'label': 'Updating Composer',
		'cwd': __dirname,
		'cmd': 'php composer.phar update'
	});
	commands.push({
		'label': 'Updating NPM',
		'cwd': __dirname,
		'cmd': 'npm update'
	});
	if(fs.existsSync(config.www_dir)) {
		commands.push({
			'label': 'Updating Bower',
			'cwd': config.www_dir,
			'cmd': 'bower update'
		});
	}

	var update_next = function() {
		var cmd = commands.shift();
		if(!cmd) return;

		var update = cp.exec('cd "'+cmd.cwd+'" && '+cmd.cmd, function(err, stdout, stderr){
			console.log('# DONE: %s', cmd.label);
			console.log('');
			update_next();
		});

		console.log('# %s', cmd.label);

		update.stdout.setEncoding('UTF-8');
		update.stderr.setEncoding('UTF-8');

		update.stdout.pipe(process.stdout);

		update.stderr.pipe(process.stderr);

		update.on('exit', function(data){
		});
	};
	update_next();
} else {

	var FileWatcher = require('./filewatcher');
	var express = require('express');
	var colors = require('colors');
	var which = require('which');

	var app = express();
	var server = app.listen(port);
	var io = require('socket.io').listen(server);

	io.set('log level', 1);

	console.log('[%s]', host+':'+port);

	app.configure(function(){
		var favicon = config.www_dir + '/img/favicon.ico';
		if(!fs.existsSync(favicon))
			favicon = __dirname + '/favicon.ico';
		if(fs.existsSync(favicon))
			app.use(express.favicon(favicon));
		app.use(express.logger('dev'));
		app.use(express['static'](config.www_dir));
		app.use(express.bodyParser());
		app.use(express.methodOverride());
	});

	app.use(function(req, res) {
		var path = req.originalUrl.substr(1);

		var parts = path.split('\/');
		var last = parts.pop();

		var hostname = req.headers.host.split(':').shift();

		if(last === '') {
			parts.push('index');
			path = parts.join('/');
		}

		var cmd;
		var append_script;
		if(path === 'model.js') {
			cmd = [__dirname + '/app/index.php', '-m'];
			append_script = '';
		} else {
			cmd = [__dirname + '/app/index.php', '-l', path];
			append_script = config.append_script.toString().split('{{url}}').join('http://'+hostname+':'+port+'/');
		}

		var php = cp.spawn('php', cmd);

		php.stdout.setEncoding('UTF-8');

		php.stdout.on('data', function(data){
			res.write(data);
		});

		php.stderr.on('data', function(data){
			res.write(data);
		});

		php.on('exit', function(code){
			setTimeout(function(){
				// to-do: check if html
				res.end(append_script);
			}, 30);
		});
	});

	var connections = {};
	var last_cid = 0;
	io.sockets.on('connection', function (socket) {
		var cid = last_cid++;
		connections[cid] = socket;
		socket.on('disconnect', function(){
			delete(connections[cid]);
		});
	});

	var dirtyStylesheets = false;
	var dirtyContent = false;
	var compilations = 0;



	var compile = function(pwd, command, params, cb, out) {

		console.log('STARTED [%s]'.yellow, command+' '+params.join(' '));
		if(out !== true)
			compilations++;
		var exec = cp.spawn(which.sync(command), params, { cwd: fs.realpathSync(pwd), evn: process.env });

		exec.stdout.pipe(process.stdout);
		exec.stderr.pipe(process.stderr);

		exec.on('exit', function() {
			console.log('FINISHED [%s]'.yellow, command+params.join(' '));
			setTimeout(function(){
				if(out !== true)
					compilations--;
				compilations = Math.max(0, compilations);
				if(cb)
					cb();
			}, 20);
		});

	};


	var checkDirty = function() {
		if(compilations === 0) {
			if(dirtyContent) {
				reloadConnections('reload');
			} else if(dirtyStylesheets) {
				reloadConnections('reload stylesheets');
			}
			dirtyContent = false;
			dirtyStylesheets = false;
		}
	};
	var reloadConnections = function(type) {
		var count = 0;
		for(var k in connections) {
			connections[k].emit(type);
			count++;
		}
		console.log('RELOADING (%s)', type, count, (count > 1) ? 'PAGES' : 'PAGE');
	};
	setInterval(checkDirty, 100);


	var addBuilder = function(pwd, watch, commands) {
		var interval = 100; // ms
		var dirty = true;

		var compileAll = function() {
			var j;
			for(var k in commands) {
				for(j in commands[k]) {
					compile(pwd, j, commands[k][j]);
				}
			}
		};

		var fw = new FileWatcher();

		var reloadDirs = function() {
			for(var k in watch) {
				fw.add(watch[k]);
			}
			compileAll();
		};

		reloadDirs();
		fw.on('change', function(file){
			compileAll();
			fs.stat(file, function(err, stat){
				if(stat.isDirectory()) {
					reloadDirs();
				}
			});
		});

	};
	if(config.build)
		config.build.forEach(function(val){
			addBuilder(process.cwd(), val.watch, val.exec);
		});

	if(config.run)
		config.run.forEach(function(val){
			for(var k in val) {
				compile(process.cwd(), k, val[k], false, true);
			}
		});

	(function() {
		var ignore = ['.git'];

		var stylesheets = ['css', 'less', 'styl', 'stylus', 'sass', 'scss'];

		var interval = 100; // ms

		var check = function(file) {
			var filename = file.split('\/').pop().split('\\').pop();
			var ext = filename.split('.').pop();
			if(ignore.indexOf(filename) === -1) {
				if(stylesheets.indexOf(ext) === -1) {
					dirtyContent = true;
				} else {
					dirtyStylesheets = true;
				}
				console.log("CHANGED: %s".yellow, file);
			}
			fs.stat(file, function(err, stat){
				if(stat.isDirectory()) {
					reloadDirs();
				}
			});
		};

		var fw = new FileWatcher();

		var reloadDirs = function() {
			fw.add(config.www_dir+"/**");

			if(fs.existsSync(config.latte_dir))
				fw.add(config.latte_dir+"/**");

			if(config.model_dir && fs.existsSync(config.model_dir))
				fw.add(config.model_dir+"/**");
		};
		reloadDirs();

		fw.on('change', check);
	})();
}