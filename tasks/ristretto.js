/*
 * grunt-ristretto
 *
 * Copyright (c) 2013 Viliam Kopecky
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var metafilename = '.ristretto.json';



  var fs = require('fs'),
      path = require('path');


  var version = grunt.file.readJSON(__dirname + '/../package.json').version;

  var allow_publish = function(dir, meta) {
    var allow_write = false;

    if(grunt.file.exists(dir)) { // publish dir/file exists
      if(grunt.file.isDir(dir)) { // is directory
        if(grunt.file.exists(meta)) { // contains ristretto metadata
          allow_write = true;
        } else { // does not contain ristretto metadata
          if(grunt.file.expand([dir+'/**.*']).length === 0) { // directory is empty
            allow_write = true;
          } else { // directory is not empty, but doesn't contain ristretto metadata
            grunt.warn('Publish direrctory "'+dir+'" is not empty.');
          }
        }
      } else { // publish dir is not a directory
        grunt.warn('File '+dir+' already exists and is not a directory.');
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
      latte_dir: fs.realpathSync(options.latte_dir),
      temp_dir: fs.realpathSync(options.temp_dir)
    };

    if(options.model_dir && grunt.file.exists(options.model_dir)) {
      params.model_dir = fs.realpathSync(options.model_dir);
    }

    var dest = options.publish_dir + '/';
    dest = dest.replace('//', '/');

    var meta = dest + metafilename;

    if(!allow_publish(dest, meta)) {
      done();
      return;
    }

    grunt.file.delete(dest);

    var files = grunt.file.expand({ cwd: params.latte_dir }, ['**/*.latte', '!**/@*.latte']);

    var published = 0;

    var next = function(){
      if(published === files.length) {
        grunt.file.write(meta, JSON.stringify({ 'published_by': 'Ristretto', 'timestamp': (new Date()).getTime() }));
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




  var startupServer = function(options, done) {
    var latte = require('../php/compile-latte');

    var express = require('express');
    var app = express();
    var server = require('http').createServer(app);
    var io = require('socket.io').listen(server);

    server.listen(options.port, '0.0.0.0', function(){
      grunt.log.ok('Ristretto running on port: '+options.port);
      if(typeof done === 'function') {
        done();
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
          var client = grunt.file.read(__dirname + '/../client/ristretto.js').toString().replace('<%= port %>', options.port);

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


    // latte compiler params
    var params = {
      latte_dir: fs.realpathSync(options.latte_dir),
      temp_dir: fs.realpathSync(options.temp_dir)
    };

    if(options.model_dir && grunt.file.exists(options.model_dir)) {
      params.model_dir = fs.realpathSync(options.model_dir);
    }

    // compile latte templates
    app.use(function(req, res, next) {
      res.status(200);
      latte(req.path, params, function(data){
        // progress
        res.write(data);
      }, function(body){
        // done
        res.write('<script>(function(){var s=document.createElement("script");s.setAttribute("src", "http://"+location.hostname+":'+options.port+'/ristretto.js");document.getElementsByTagName("body")[0].appendChild(s);void(s);})();</script>');
        res.end();
      });
    });


    // socket.io

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




  var reload = function(options, type, done) {
    if(type !== 'stylesheets') {
      type = 'pages';
    }

    var url = 'http://127.0.0.1:'+options.port+'/reload-'+type;

    require('request')(url, function(){
      if(typeof done === 'function') {
        done();
      }
    });
  };




  grunt.registerTask('ristretto', 'Running Ristretto server', function() {
    var done = this.async();
    var target = this.args[0] || 'default';

    var options = this.options({
      port: 2013,
      temp_dir: require('os').tmpdir()+'/ristretto-'+version,
      www_dir: 'www',
      publish_dir: 'publish',
      latte_dir: 'www',
      model_dir: null
    });

    if(!grunt.file.exists(options.temp_dir)) {
      grunt.file.mkdir(options.temp_dir);
      grunt.log.ok('Created directory', options.temp_dir);
    }

    switch(target) {
      case 'reload':
        reload(options, 'pages', done);
        break;
      case 'reloadStyles':
        reload(options, 'stylesheets', done);
        break;
      case 'publish':
        publish(options, done);
        break;
      default:
        startupServer(options, done);
    }

  });
};