var EXEC = require('child_process').exec;
var FS = require('fs');

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
    EXEC('tar cvzf ' + tarName + ' ' + dir, function(err, stdout, stderr) {
      if (err) {throw err}
      console.log('stdout:' + stdout);
      console.log('stderr:' + stderr);
    });
  });
}
