var Repository = require('git-cli').Repository;
var FS = require('fs');
var EJS = require('ejs');
var GLOB = require('glob');
var PATH = require('path');
var EXEC = require('child_process').exec;
var AUTH = require('./auth.js');
var SERVER = require('./server.js');

var ignoreFile = function(file) {
  return file.match('/$') || file.match('.*README.md');
}

var FILES_TO_RENDER = [];
var FILES_RENDERED = [];

var renderAllFiles = function(config, dirPrefix, onDone) {
  for (var i = 0; i < FILES_TO_RENDER.length; ++i) {
    var oldFilename = FILES_TO_RENDER[i];
    var newFilename = oldFilename.substring(dirPrefix.length);
    FS.readFile(oldFilename, 'utf8', function(err, data) {
      if (err) {
        console.log('error reading file:' + oldFilename);
        throw err;
      }
      var rendered = "";
      try {
        rendered = EJS.render(data, config);
      } catch (e) {
        throw "Failed to render!" + e;
      }
      FS.writeFile(newFilename, rendered, 'utf8', function() {
        FILES_RENDERED.push(newFilename);
        if (FILES_TO_RENDER.length === FILES_RENDERED.length) {
          onDone();
        }
      });
    });
  }
}

var DEST_DIR = '.lucytmp';
var TAR_FILENAME = DEST_DIR + '/package.tgz';
var runForPackage = function(packageName, config) {
  AUTH.login(function(email, password) {
    var maybeHandleErr = function(err) {
      //recursiveRmdir(DEST_DIR);
      if (err) throw err;
    }
    FS.mkdir(DEST_DIR, function (err) {
      maybeHandleErr(err);
      SERVER.getPackage(email, password, packageName, function(err, data) {
        maybeHandleErr(err);
        console.log('got package!');
        FS.writeFile(TAR_FILENAME, data, {encoding: 'binary'}, function (err) {
           maybeHandleErr(err);
          console.log('wrote tar');
          EXEC('tar xzf ' + TAR_FILENAME, function(err, stdout, stderr) {
            maybeHandleErr(err);
            console.log('untarred');
            renderAllFiles(config, DEST_DIR + '/', function() {
              recursiveRmdir(DEST_DIR);
            });
          });
        });
      });
    });
  });
}

var runForRepo = function(repoLoc, config) {
  Repository.clone(repoLoc, DEST_DIR, function(err, repo) {
    GLOB(DEST_DIR + '/**', {mark: true}, function(err, files) {
      for (var i = 0; i < files.length; ++i) {
        if (!ignoreFile(files[i])) {
          FILES_TO_RENDER.push(files[i]);
        }
      }
      renderAllFiles(config, DEST_DIR + '/', function() {
        recursiveRmdir(DEST_DIR);
      });
    });
  });
}

var recursiveRmdir = function(dirName) {
  var list = FS.readdirSync(dirName);
  for (var i = 0; i < list.length; i++) {
    var filename = PATH.join(dirName, list[i]);
    var stat = FS.statSync(filename);
    if (filename == "." || filename == "..") {
      // pass these files
    } else if(stat.isDirectory()) {
      // rmdir recursively
      recursiveRmdir(filename);
    } else {
      // rm fiilename
      FS.unlinkSync(filename);
    }
  }
  FS.rmdirSync(dirName);
}

exports.run = function(args) {
  var source = args[0];
  var config = args[1];
  if (!source || !config) {
    return true;
  }
  FS.readFile(config, 'utf8', function(err, data) {
    if (err) {
      console.log('error reading from config:' + config);
      throw err;
    }
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.log('error parsing config JSON');
      throw e;
    }
    if (runFromSource(source, data)) {
      console.log('Couldn\'t parse source:' + source);
    }
  });
}

var runFromSource = function(source, config) {
  if (source.lastIndexOf('.git') == source.length - 4) {
    console.log('running from git repo:' + sourceStr);
    runForRepo(source, data);
  } else if (true) {
    var colon = source.indexOf(':');
    if (colon === -1) {
      source += colon + source;
    }
    runForPackage(source, config);
  } else {
    return 1;
  }
}
