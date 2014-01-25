exports.startup = function(config, done) {
  var fs = require('fs');
  var express = require('express');
  var faye = require('faye');
  var php_script = require('./php_script');

  var client_snippet_filepath = __dirname + '/../client/ristretto.js';

  var error_divider = '<!--ristretto error starts-->';

  bayeux = new faye.NodeAdapter({ 
    mount: '/faye', 
    timeout: 45 
  }); 

  var client = bayeux.getClient();

  var app = express();

  app.configure(function(){

    app.use(function(req, res, done){
      if(!(/^\/faye/).test(req.path)) {
        // console.log('#', req.path);
      } else {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Pragma');
      }
      done();
    });

    app.get('/ristretto.js', function(req, res){
      res.header('Content-Type', 'text/javascript;charset=utf8');
      var snippet = fs.readFileSync(client_snippet_filepath).toString('utf8');
      snippet = snippet.split('{$port}').join(config.port);
      res.send(200, snippet);
    });

    app.get('/reload', function(req, res){
      client.publish('/reload', { type: 'page' });
      res.send(200);
    });

    app.get('/reload-stylesheets', function(req, res){
      client.publish('/reload', { type: 'stylesheets'});
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
      if(!(/^\/faye/).test(req.path)) { // to-do: solve Faye's problem
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
      } else {
        next();
      }
    });

    app.use(bayeux);
  });

  app.listen(config.port, '0.0.0.0', function() {
    if(typeof done === 'function') {
      done();
    }
  });
};