var Repository = require('git-cli').Repository;
var FS = require('fs');
var EJS = require('ejs');
var GLOB = require('glob');
var PATH = require('path');
var EXEC = require('child_process').exec;
var AUTH = require('./auth.js');
var SERVER = require('./server.js');

var ignoreFile = function(file) {
  return file.match(/\.tgz$/) || file.match('/$') || file.match('.*README.md');
}

var FILES_TO_PROCESS = [];
var FILES_PROCESSED = [];
var DEST_DIR = '.lucytmp';

var renderAllFiles = function(config, onDone) {
  console.log('render and kill');
  FILES_TO_PROCESS = [];
  FILES_PROCESSED = [];
  GLOB(DEST_DIR + '/**', {mark: true}, function(err, files) {
      for (var i = 0; i < files.length; ++i) {
        if (!ignoreFile(files[i])) {
          var from  = files[i];
          var to = from.substring(dirPrefix.length);
          FILES_TO_PROCESS.push({from: from, to: to, method: 'render'});
        }
      }
      processFilesInQueue(config, onDone); 
  });
}

var renderAndCopyFiles = function(config, onDone) {
  FS.readFile(DEST_DIR + '/package.json', function(err, data) {
    var packageDef = {};
    try {
      packageDef = JSON.parse(data);
    } catch (e) {
      console.log('Error parsing package.json');
      throw e;
    }
    if (!packageDef.files) {
      console.log('No files to copy/render');
      return onDone();
    }
    alterSourcePaths(packageDef.files);
    FILES_TO_PROCESS = packageDef.files;
    FILES_PROCESSED = [];
    processFilesInQueue(config, onDone);
  });
}

var renderFile = function(map, config, onDone) {
    console.log('rendering:' + JSON.stringify(map));
    FS.readFile(map.from, {encoding: 'utf8'}, function(err, data) {
      if (err) {
        console.log('error reading file:' + map.from);
        throw err;
      }
      console.log('rendering:' + data);
      var rendered = "";
      try {
        rendered = EJS.render(data, config);
      } catch (e) {
        throw "Failed to render!" + e;
      }
      FS.writeFile(map.to, rendered, function(err) {
        if (err) {throw err}
        console.log('wrote file:' + map.to);
        onDone(map.to);
      });
    });
}

var copyFile = function(map, onDone) {
  console.log('copying:' + JSON.stringify(map));
  FS.readFile(map.from, function(err, data) {
    if (err) {throw err}
    FS.writeFile(map.to, data, function(err) {
      if (err) {throw err}
      onDone(map.to);
    });
  });
}

var processFilesInQueue = function(config, onDone) {
  for (var i = 0; i < FILES_TO_PROCESS.length; ++i) {
    var onDone = function(newFile) {
      FILES_PROCESSED.push(newFile);
      if (FILES_PROCESSED.length === FILES_TO_PROCESS.length) {
        onDone();
      }
    };
    if (FILES_TO_PROCESS[i].method === 'render') {
      renderFile(FILES_TO_PROCESS[i], config, onDone);
    } else {
      copyFile(FILES_TO_PROCESS[i], onDone);
    }
  }
}

var alterSourcePaths = function(maps) {
  for (var i = 0; i < maps.length; ++i) {
    maps[i].from = DEST_DIR + '/' + maps[i].from;
  }
}

var TAR_FILENAME = DEST_DIR + '/package.tgz';
var runForPackage = function(packageName, config) {
  AUTH.login(function(email, password) {
    var maybeHandleErr = function(err) {
      if (err) {
        recursiveRmdir(DEST_DIR);
        throw err;
      }
    }
    FS.mkdir(DEST_DIR, function (err) {
      maybeHandleErr(err);
      var writeStream = FS.createWriteStream(TAR_FILENAME, {encoding: 'binary'});
      SERVER.getPackage(email, password, packageName, writeStream, function(err, data) {
        maybeHandleErr(err);
        EXEC('tar xzf ' + TAR_FILENAME + ' -C ' + DEST_DIR + '/', function(err, stdout, stderr) {
          maybeHandleErr(err);
          renderAndCopyFiles(config, function() {
            recursiveRmdir(DEST_DIR);
          });
        });
      });
    });
  });
}

var runForRepo = function(repoLoc, config) {
  Repository.clone(repoLoc, DEST_DIR, function(err, repo) {
    renderAndCopyFiles(config, function() {
      recursiveRmdir(DEST_DIR);
    });
  });
}

var recursiveRmdir = function(dirName) {
  console.log('rmdir:' + dirName);
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
  FS.readFile(config, function(err, data) {
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
