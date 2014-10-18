#!/usr/bin/env node

var repoLoc = "https://github.com/bobby-brennan/hello-lucy.git";
var destDir = 'lucy-tmp';

var Repository = require('git-cli').Repository;
var FS = require('fs');
var EJS = require('ejs');
var GLOB = require('glob');
var PATH = require('path');
var EXEC = require('exec');

var ignoreFile = function(file) {
  return file.match('/$') || file.match('.*README.md');
}

var FILES_TO_RENDER = [];
var FILES_RENDERED = [];

var renderAllFiles = function(onDone) {
  console.log("rendering:" + FILES_TO_RENDER.length);
  for (var i = 0; i < FILES_TO_RENDER.length; ++i) {
    var oldFilename = FILES_TO_RENDER[i];
    console.log('file:' + oldFilename);
    var newFilename = oldFilename.substring(destDir.length + 1);
    FS.readFile(oldFilename, 'utf8', function(err, data) {
      if (err) {
        console.log('err:' + oldFilename + JSON.stringify(err));
        throw err;
      }
      console.log('got data:' + data);
      var rendered = "";
      try {
        rendered = EJS.render(data, {name: "Lucy"});
      } catch (e) {
        throw "Failed to render!" + e;
      }
      FS.writeFile(newFilename, rendered, 'utf8', function() {
        console.log("wrote file:" + newFilename);
        FILES_RENDERED.push(newFilename);
        if (FILES_TO_RENDER.length === FILES_RENDERED.length) {
          onDone();
        }
      });
    });
  }
}

var cloneAndRun = function() {
  Repository.clone(repoLoc, destDir, function(err, repo) {
    GLOB(destDir + '/**', {mark: true}, function(err, files) {
      for (var i = 0; i < files.length; ++i) {
        if (!ignoreFile(files[i])) {
          FILES_TO_RENDER.push(files[i]);
        }
      }
      renderAllFiles(function() {
        console.log('deleting tmp dir');
        recursiveRmdir(destDir);
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

var userArgs = process.argv.slice(2);
var command = userArgs[0].toLowerCase();
var cmdArgs = userArgs.slice(1);
if (!command) {
  console.log('usage: lucy <cmd> <args>');
  process.exit(1);
} else if (command === 'build') {
  require('./build.js').run(cmdArgs);
} else if (command === 'publish') {
  require('./publish.js').run(cmdArgs);
} else if (command === 'adduser') {
  require('./addUser.js').run(cmdArgs);
} else {
  console.log('unsupported command:' + command);
}
