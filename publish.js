var EXEC = require('child_process').exec;
var FS = require('fs');
var HTTP = require('http');
var REQUEST = require('request');
var USER_INPUT = require('./userInput.js');

exports.run = function(args) {
  console.log('publishing:' + JSON.stringify(args));
  var dir = args[0];
  if (!dir) {
    dir = '.';
  }
  USER_INPUT.login(function(email, password) {
    sendPackage(dir, email, password);
  }
}

var sendPackage = function(dir, email, password) {
  FS.readFile(dir + '/package.json', 'utf8', function(err, data) {
    if (err) {throw err}
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.log('error parsing package.json');
      throw e;
    }
    var lucyConfigError = validateLucyPackage(data);
    if (lucyConfigError) {
      throw lucyConfigError;
    }
    var tarName = '.lucytmp.tgz';
    EXEC('tar czf ' + tarName + ' ' + dir, function(err, stdout, stderr) {
      if (err) {throw err}
      console.log('stdout:' + stdout);
      console.log('stderr:' + stderr);
      var readStream = FS.createReadStream(tarName);
      readStream.setEncoding('binary');
      FS.readFile(tarName, {encoding: 'binary'}, function(err, data) {
        if (err) {throw err}
        REQUEST({
           method: 'POST',
           preambleCRLF: true,
           postambleCRLF: true,
           uri: 'http://54.213.18.26:3000/publish',
           multipart: [{
             'content-type': 'application/json',
             body: JSON.stringify({email: email, password: password}),
           }, {
             'content-type': 'application/octet-stream',
             body: data,
           }]
        }, function(err, res, body) {
          console.log('got response:' + body);
        });
      });
    });
  });
}

var validateLucyPackage = function(pkg) {
  if (!pkg.name) {
    return new Error('No name specified in package.json');
  }
  if (!pkg.version) {
    return new Error('No version specified in package.json');
  }
}

