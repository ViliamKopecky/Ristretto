/*
 * grunt-ristretto
 *
 * Copyright (c) 2013 Viliam Kopecky
 * Licensed under the MIT license.
 */

'use strict';

// show debug info on error
process.on('uncaughtException', function(err) {
    console.log(err.stack);
});

module.exports = function(grunt) {

  var fs = require('fs');
  var path = require('path');

  var metafilename = '.ristretto.json';



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
            allow_write = true; //grunt.warn('Publish direrctory "'+dir+'" is not empty.');
          }
        }
      } else { // publish dir is not a directory
        grunt.warn('File '+dir+' already exists and is not a directory.');
      }
    } else { // publish dir doesn't exist
      allow_write = true;
    }
    return allow_write;
  };




  var build_and_copy = function(options, params, dest, meta, done) {

    var php_script = require('../libs/php_script');

    var latte2html = php_script.latte2html;
    var neon2json = php_script.neon2json;

    var copy_files = grunt.file.expand({ cwd: params.www_dir }, ['**/*.*', '**/.*', '!**/*.latte', '!**/*.neon']);
    var neon_files = grunt.file.expand({ cwd: params.model_dir }, ['**/*.neon']);
    var latte_files = grunt.file.expand({ cwd: params.latte_dir }, ['**/*.latte', '!**/@*.latte']);

    var next_total = 1;
    var next = function() {
      if(next_total === 3) {
          grunt.file.write(meta, JSON.stringify({ 'published_by': 'Ristretto', 'timestamp': (new Date()).getTime() }));
          grunt.log.writeln('');
          grunt.log.ok('Publish finished', meta);
          grunt.log.writeln('  ', dest);
          return done();
      }
      next_total++;
    };

    var published_copy = 0;
    var next_copy = function(){
      if(published_copy === copy_files.length) {
        grunt.log.ok('Finished: Copy static files');
        next();
        return;
      }
      var filepath = copy_files[published_copy];

      if(grunt.file.isFile(params.www_dir + '/' + filepath)) {
        grunt.log.writeln('   Copy file', filepath);

        grunt.file.copy(params.www_dir + '/' + filepath, dest + filepath);
      }
      published_copy++;
      next_copy();
    };
    next_copy();

    var published_latte = 0;
    var next_latte = function(){
      if(published_latte === latte_files.length) {
        grunt.log.ok('Finished: Compile Latte files');
        next();
        return;
      }
      var filepath = latte_files[published_latte];
      grunt.log.writeln('   Compiling Latte file', filepath);

      latte2html(options, filepath, function(body){
        var write = dest + filepath.substr(0, filepath.length - 'latte'.length) + 'html';
        grunt.log.writeln('   Writing Latte file', filepath);
        grunt.file.write(write, body);
        published_latte++;
        next_latte();
      });
    };
    next_latte();

    var published_neon = 0;
    var next_neon = function(){
      if(published_neon === neon_files.length) {
        grunt.log.ok('Finished: Compile NE-ON files');
        next();
        return;
      }
      var filepath = neon_files[published_neon];
      grunt.log.writeln('   Compiling NE-ON file', filepath);

      var realpath = options.model_dir + '/' + filepath;

      realpath = fs.realpathSync(realpath);

      neon2json(options, realpath, function(body){
        var model_dest = dest;
        if(options.model_dir.indexOf(options.www_dir) === 0) {
          model_dest += options.model_dir.substr(options.www_dir.length+1);
        } else {
          model_dest += options.model_dir;
        }
        grunt.log.writeln('   Writing NE-ON file', filepath);
        var write = model_dest + '/' +filepath;
        grunt.file.write(write, body);
        published_neon++;
        next_neon();
      });
    };
    next_neon();
  };




  var publish = function(options, done) {
    var dest = options.publish_dir + '/';
    dest = dest.replace('//', '/');

    var meta = dest + metafilename;

    var params = {
      www_dir: fs.realpathSync(options.www_dir),
      latte_dir: fs.realpathSync(options.latte_dir),
      temp_dir: fs.realpathSync(options.temp_dir)
    };

    if(options.model_dir && grunt.file.exists(options.model_dir)) {
      params.model_dir = fs.realpathSync(options.model_dir);
    }

    if(!allow_publish(dest, meta)) {
      done();
      return;
    }

    var created = false;
    if(!grunt.file.exists(dest)) {
      created = true;
      grunt.file.mkdir(dest);
    }


    if(grunt.file.isPathInCwd(dest)) {
      grunt.file.delete(dest);
      build_and_copy(options, params, dest, meta, done);
    } else {
      console.log('');
      grunt.log.warn('You are publishing into directory outside of CWD. This action will overwrite its contents.');
      grunt.log.warn(dest);
      require('co-prompt').confirm("\n   Are you sure? [ NO | yes ]: ")(function(wut, ok) {
        if(ok) {
          var time = (new Date).getTime();
          var temp_dest = dest.replace(/\/*$/, '') + '-ristretto-' + time;

          if(grunt.file.exists(dest)) {
            if(created) {
              grunt.file.delete(dest, { force: true });
            } else {
              require('fs').renameSync(dest, temp_dest);
            }
          }

          grunt.log.ok('Original contents moved to:');
          grunt.log.ok(temp_dest);

          build_and_copy(options, params, dest, meta, done);
        } else {
          console.log('');
          grunt.log.ok('Publish aborted');
          done();
        }
      });
    }

  };




  grunt.registerTask('ristretto', 'Ristretto frontend prototyping system', function() {
    var options = this.options();
    var config = options.config;

    var version = config.ristretto_version = grunt.file.readJSON(__dirname + '/../package.json').version;

    if(typeof config.port === 'undefined') {
      config.port = 8000;
    }

    if(typeof config.www_dir === 'undefined') {
      config.www_dir = '.';
    }

    if(typeof config.model_dir === 'undefined') {
      config.model_dir = config.www_dir + '/model';
    }

    if(typeof config.latte_dir === 'undefined') {
      config.latte_dir = config.www_dir;
    }

    if(typeof config.publish_dir === 'undefined') {
      config.publish_dir = 'publish';
    }

    if(typeof config.temp_dir === 'undefined') {
      config.temp_dir = require('os').tmpdir() + '/ristretto-'+version;
    }

    if(grunt.file.exists(config.temp_dir)) {
      if(!grunt.file.isDir(config.temp_dir)) {
        grunt.log.error('Temporary dir path is not a directory: `' + config.temp_dir + '`.');
      }
    } else {
      grunt.file.mkdir(config.temp_dir);
    }

    
    var flags = this.flags;
    var done = this.async();

    var request = require('request');

    if(flags['reload'] || flags['pages']) {
      request('http://127.0.0.1:'+config.port+'/reload', function(){
        done();
      });
    return;
    } else if(flags['reload-stylesheets'] || flags['styles'] || flags['stylesheets']) {
      request('http://127.0.0.1:'+config.port+'/reload-stylesheets', function(){
        done();
      });
      return;
    } else if(flags['publish']) {
      publish(config, function(){
        done();
      });
    return;
    } else if(flags['startup']) {
      require('../libs/server').startup(config, function() {
        console.log('Ristretto running on 127.0.0.1:'+config.port);
        done();
      });
    return;
    }

  });

};