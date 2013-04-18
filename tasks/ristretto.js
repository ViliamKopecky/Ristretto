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
    var latte = require('../php/compile-latte'),
        express = require('express'),
        app = express(),
        server = require('http').createServer(app),
        io = require('socket.io').listen(server);

    server.listen(options.port, function(){
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
        var url = 'http://'+req.host+':'+options.port+'/socket.io/socket.io.js';
        require('request')(url, function(error, response, body){
          var socketio = body;
          var client = fs.readFileSync(__dirname + '/../client/ristretto.js').toString().replace('<%= host %>', req.host+':'+options.port);
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
        body += '<script src="//'+req.host+':'+options.port+'/ristretto.js"></script>';
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

    var url = 'http://localhost:'+options.port+'/reload-'+type;

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