var EXEC = require('child_process').exec;
var FS = require('fs');
var HTTP = require('http');
var REQUEST = require('request');
var READ = require('read');


exports.run = function(args) {
  console.log('publishing:' + JSON.stringify(args));
  var dir = args[0];
  if (!dir) {
    dir = '.';
  }
  console.log('You\'ll need to log in to publish. If you don\'t already have an account, run lucy adduser');
  READ({prompt: 'E-mail address:', silent: false}, function(er, email) {
    READ({ prompt: 'Password: ', silent: true }, function(er, password) {
      sendPackage(dir, email, password);
    });
  })
}

var stdin = process.openStdin()
// Get a password from the console, printing stars while the user types
var getPassword = function(onDone) {
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.setRawMode(true);  
  password = ''
  process.stdin.on('data', function (char) {
    char = char + ""

    switch (char) {
    case "\n": case "\r": case "\u0004":
      // They've finished typing their password
      process.stdin.setRawMode(false)
      console.log("\nyou entered: "+password)
      stdin.pause()
      onDone(password);
      break
    case "\u0003":
      // Ctrl C
      console.log('Cancelled')
      process.exit()
      break
    default:
      // More passsword characters
      process.stdout.write('*')
      password += char
      break
    }
  });
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
      /*
      readStream.pipe(REQUEST.post({
          url: 'http://bbrennan:secret@54.213.18.26:3000/publish',
          'content-type': 'application/octet-stream',
          headers: {
            'AuthEmail': email,
            'AuthPassword': password
          }
      }, function(err, res, body) {
        console.log('got response:' + body);
      }).form({username: 'bobby@bbrennan.info', password: 'secret'}));
      */
    });
  });
}

