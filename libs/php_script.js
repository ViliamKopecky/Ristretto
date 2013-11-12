var spawn = require('child_process').spawn;

var php_script_cwd = __dirname + '/../php';
var php_script_filename = 'ristretto.php';

var run_php_script = exports.run_php_script = function(params, cb) {
  params.unshift('--html');
  params.unshift(php_script_filename);
  var exec = spawn('php', params, { cwd: php_script_cwd });
  var data = "";
  exec.stderr.setEncoding('utf8');
  exec.stderr.on('data', function(data){
    process.stderr.write(data);
  });
  exec.stdout.on('data', function(_data){
    data += _data;
  });
  exec.stdout.on('end', function(){
    if(typeof cb === 'function') {
      cb(data);
    }
  });
};

exports.neon2json = function(config, filepath, cb) {
  var params = [ '-c', config.config_path, '-n', filepath ];
  if(typeof config.ristretto_version === 'string') {
    params.push('-r');
    params.push(config.ristretto_version);
  }
  run_php_script(params, cb);
};

exports.latte2html = function(config, filepath, cb) {
  var params = [ '-c', config.config_path, '-l', filepath ];
  if(typeof config.ristretto_version === 'string') {
    params.push('-r');
    params.push(config.ristretto_version);
  }
  run_php_script(params, cb);
};