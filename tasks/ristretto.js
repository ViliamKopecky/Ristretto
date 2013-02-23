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


  var startupServer = function(options, cb) {
    var latte = require('../php/latte-compiler'),
        express = require('express'),
        app = express(),
        server = require('http').createServer(app),
        io = require('socket.io').listen(server);

    server.listen(options.port, function(){
      if(cb) {
        cb();
      }
    });

    app.get('/ristretto.js', function (req, res) {
      var scripts = fs.readFileSync(__dirname + '/../node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.min.js');
      scripts += "\n" + fs.readFileSync(__dirname + '/../client/ristretto.js');
      res.end(200, scripts);
    });

    app.use(express.static(options.www_dir));

    app.use(function(req, res, next) {
      var params = {
        latte_dir: path.realpath(options.latte_dir)
      };
      if(options.model_dir) {
        params.model_dir = path.realpath(options.model_dir);
      }
      latte(req.path, params, function(body){
        body += '<script src="//'+req.host+'/ristretto.js"></script>';
        res.send(200, body);
      });
    });

    var connections = {};

    var broadcast = function(event, data) {
      for(var k in connections) {
        connections[k].emit(event, data);
      }
    };

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

    require('request')('http://localhost:'+options.port+'/reload-'+type, function(){
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
      latte_dir: 'www',
      model_dir: null
    });

    if(this.target === 'server') {
      startupServer(options, function(){
        done();
      });
    } else if(this.target === 'publish') {
      // to-do: implement
    } else {
      reload(options, this.target, function(){
        done();
      });
    }

    });
};