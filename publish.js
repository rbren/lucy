var EXEC = require('child_process').exec;
var FS = require('fs');
var HTTP = require('http');
var REQUEST = require('request');

exports.run = function(args) {
  console.log('publishing:' + JSON.stringify(args));
  var dir = args[0];
  if (!dir) {
    dir = '.';
  }
  FS.readFile(dir + '/package.json', 'utf8', function(err, data) {
    if (err) {throw err}
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.log('error parsing package.json');
      throw e;
    }
    var tarName = dir + '.tgz';
    EXEC('tar czf ' + tarName + ' ' + dir, function(err, stdout, stderr) {
      if (err) {throw err}
      console.log('stdout:' + stdout);
      console.log('stderr:' + stderr);
      var readStream = FS.createReadStream(tarName);
      readStream.setEncoding('binary');
      readStream.pipe(REQUEST.post({
          url: 'http://54.213.18.26:3000/publish',
          'content-type': 'application/octet-stream'
      }, function(err, res, body) {
        console.log('got response:' + body);
      }));
    });
  });
}

