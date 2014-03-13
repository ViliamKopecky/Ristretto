exports.startup = function(config, done) {
  var fs = require('fs');
  var http = require('http');
  var express = require('express');
  var sockjs = require('sockjs');
  var php_script = require('./php_script');

  var client_sockjs_filepath = __dirname + '/../bower_components/sockjs/sockjs.js';
  var client_snippet_filepath = __dirname + '/../client/ristretto.js';

  var error_divider = '<!--ristretto error starts-->';

  var app = express();

  // sockjs

  var reloader = sockjs.createServer();

  var clients = {};

  var broadcast = function(message) {
    for(key in clients) {
        if(clients.hasOwnProperty(key)) {
            clients[key].write(message);
        }
    }
  };

  reloader.on('connection', function(conn) {
    clients[conn.id] = conn;

    conn.on('close', function() {
        delete clients[conn.id];
    });
  });

  app.configure(function(){

    app.get('/ristretto.js', function(req, res){
      res.header('Content-Type', 'text/javascript;charset=utf8');
      var snippet = fs.readFileSync(client_sockjs_filepath).toString('utf8') + fs.readFileSync(client_snippet_filepath).toString('utf8');
      snippet = snippet.split('{$port}').join(config.port);
      res.send(200, snippet);
    });

    app.get('/rstrt-reload', function(req, res){
      broadcast('reload-page');
      res.send(200);
    });

    app.get('/rstrt-reload-stylesheets', function(req, res){
      broadcast('reload-stylesheets');
      res.send(200);
    });

    app.get('/model/:file', function(req, res){
      var path = fs.realpathSync(config.model_dir + '/' + req.params.file);
      if(fs.existsSync(path)) {
        fs.readFile(path, function(err, data){
          res.set('Content-Type', 'text/json;charset=utf8');
          php_script.neon2json(config, path, function(data){
            res.send(data);
          });
        });
      }
    });

    app.use(express.static(config.www_dir));

    app.use(function(req, res, next){
      php_script.latte2html(config, ':'+req.path, function(data){
        var index = data.indexOf(error_divider);
        if(index > -1) {
          data = data.substr(index+error_divider.length);
        }
        res.header('Content-Type', 'text/html;charset=utf8');
        res.write(data);
        res.write('<script>(function(){var s=document.createElement("script");s.setAttribute("src", "http://"+location.hostname+":'+config.port+'/ristretto.js");document.getElementsByTagName("body")[0].appendChild(s);void(s);})();</script>');
        res.end();
      });
    });

  });

  var server = http.Server(app);

  reloader.installHandlers(server, { prefix: '/rstrt' });

  server.listen(config.port, '::', function(){
    if(typeof done === 'function') {
      done();
    }
  });
};