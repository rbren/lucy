var EXEC = require('child_process').exec;
var FS = require('fs');
var HTTP = require('http');
var REQUEST = require('request');
var AUTH = require('./auth.js');
var SERVER = require('./server.js');

exports.run = function(args) {
  var dir = args[0];
  if (!dir) {
    dir = '.';
  }
  console.log('publishing:' + dir);
  AUTH.login(function(email, password) {
    sendPackage(dir, email, password);
  });
}

var sendPackage = function(dir, email, password) {
  FS.readFile(dir + '/package.json', 'utf8', function(err, pkgDef) {
    if (err) {throw err}
    try {
      pkgDef = JSON.parse(pkgDef);
    } catch (e) {
      console.log('error parsing package.json');
      throw e;
    }
    var tarName = '/tmp/.lucytmp.tgz';
    var tarCmd = 'tar czf ' + tarName + ' -C' + dir + '.';
    console.log('Running tar cmd:' + tarCmd);
    EXEC('tar czf ' + tarName + ' -C ' + dir + ' .', function(err, stdout, stderr) {
      if (err) {throw err}
      var readStream = FS.createReadStream(tarName);
      readStream.setEncoding('binary');
      FS.readFile(tarName, {encoding: 'binary'}, function(err, data) {
        if (err) {throw err}
        SERVER.publish(email, password, pkgDef, data);
      });
    });
  });
}

