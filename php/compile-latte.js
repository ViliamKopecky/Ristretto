'use strict';
var spawn = require('child_process').spawn;

var compile_latte = module.exports = function(template, options, data_cb, done_cb) {
	var body = '';
	var command = spawn('php',
		[
			'compile-latte.php',
			template,
			JSON.stringify(options)
		],
		{
			cwd: __dirname,
			env: process.env
		}
	);
	command.stderr.setEncoding('UTF-8');	
	command.stdout.on('data', function(data){
		body += data;
		if(data_cb) {
			data_cb(data, body);
		}
	});
	command.stderr.on('data', function(data){
		console.warn(data);
	});
	command.on('exit', function (code, signal) {
		if(done_cb) {
			done_cb(body);
		}
	});
};