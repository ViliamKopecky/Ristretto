/*
 * grunt-ristretto
 *
 * Copyright (c) 2013 Viliam Kopecky
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var fs = require('fs'),
      path = require('path');

  var allow_publish = function(dir) {
    var meta = dir + '/.ristretto.json';

    var allow_write = false;

    if(grunt.file.exists(dir)) { // publish dir/file exists
      if(grunt.file.isDir(dir)) { // is directory
        if(grunt.file.exists(meta)) { // contains ristretto metadata
          allow_write = true;
        } else { // does not contain ristretto metadata
          if(grunt.file.expand([dir+'/**.*']).length === 0) { // directory is empty
            allow_write = true;
          } else { // directory is not empty, but doesn't contain ristretto metadata
            grunt.log.error('Publish direrctory "'+dir+'" is not empty.');
          }
        }
      } else { // publish dir is not a directory
        grunt.log.error('File '+dir+' already exists and is not a directory.');
      }
    } else { // publish dir doesn't exist
      grunt.file.mkdir(dir);
      allow_write = true;
    }
    return allow_write;
  };

  var publish = function(options, done) {
    var latte = require('../php/compile-latte');

    var params = {
      latte_dir: fs.realpathSync(options.latte_dir)
    };

    if(options.model_dir && fs.existsSync(options.model_dir)) {
      params.model_dir = fs.realpathSync(options.model_dir);
    }

    var dest = options.publish_dir + '/';
    dest = dest.replace('//', '/');
    var meta_file = dest + 'ristretto.json';

    if(!allow_publish(dest)) {
      done();
      return;
    }

    grunt.file.delete(dest);

    var files = grunt.file.expand({ cwd: params.latte_dir }, ['**/*.latte']);

    var published = 0;

    var next = function(){
      if(published === files.length) {
        grunt.file.write(meta_file, JSON.stringify({ 'published_by': 'Ristretto', 'timestamp': (new Date()).getTime() }));
        return done();
      }
      var filepath = files[published];

      latte(filepath, params, null, function(body){
        var write = dest + filepath.substr(0, filepath.length - 'latte'.length) + 'html';
        grunt.file.write(write, body);
        published++;
        next();
      });
    };

    next();
  };


  var startupServer = function(options, cb) {
    var latte = require('../php/compile-latte'),
        express = require('express'),
        app = express(),
        server = require('http').createServer(app),
        io = require('socket.io').listen(server);

    server.listen(options.port, '0.0.0.0', function(){
      grunt.log.ok('Ristretto running on port: '+options.port);
      if(cb) {
        cb();
      }
    });

    var snippet = null;

    app.get('/ristretto.js', function (req, res) {
      res.type('text/javascript');
      if(snippet) {
        res.send(200, snippet);
      } else {
        var url = 'http://127.0.0.1:'+options.port+'/socket.io/socket.io.js';
        require('request')(url, function(error, response, body){
          var socketio = body;
          var client = fs.readFileSync(__dirname + '/../client/ristretto.js').toString().replace('<%= port %>', options.port);

          snippet = socketio + "\n;" + client;
          res.send(200, snippet);
        });
      }
    });

    app.get('/reload-pages', function (req, res) {
      broadcast('reload');
      res.send(200, 'OK');
    });

    app.get('/reload-stylesheets', function (req, res) {
      broadcast('reload stylesheets');
      res.send(200, 'OK');
    });


    app.use(express.static(options.www_dir));

    app.use(function(req, res, next) {
      var params = {
        latte_dir: fs.realpathSync(options.latte_dir)
      };
      if(options.model_dir && fs.existsSync(options.model_dir)) {
        params.model_dir = fs.realpathSync(options.model_dir);
      }
      res.status(200);
      latte(req.path, params, function(data){
        res.write(data);
      }, function(body){
        res.write('<script>(function(){var s=document.createElement("script");s.setAttribute("src", "//"+location.hostname+":'+options.port+'/ristretto.js");document.getElementsByTagName("body")[0].appendChild(s);void(s);})();</script>');
        res.end();
      });
    });

    var connections = {};

    var broadcast = function(event, data) {
      for(var k in connections) {
        connections[k].emit(event, data);
      }
    };

    io.set('log level', 0);
    io.sockets.on('connection', function (socket) {
      var cid = 'cid_'+(new Date()).getTime();
      connections[cid] = socket;
      socket.on('disconnect', function(){
        delete(connections[cid]);
      });
    });
  };

  var reload = function(options, type, cb) {
    type = type || 'pages';

    var url = 'http://127.0.0.1:'+options.port+'/reload-'+type;

    require('request')(url, function(){
      if(cb) {
        cb();
      }
    });
  };

  grunt.registerMultiTask('ristretto', 'Autoreloading', function() {
    var done = this.async();

    var options = this.options({
      port: 2013,
      www_dir: 'www',
      publish_dir: 'publish',
      latte_dir: 'www',
      model_dir: null
    });

    switch(this.target) {
      case 'server':
        startupServer(options, done);
        break;
      case 'publish':
        publish(options, done);
        break;
      default:
        reload(options, this.target, done);
    }

    });
};