var Repository = require('git-cli').Repository;
var FS = require('fs');
var EJS = require('ejs');
var GLOB = require('glob');
var PATH = require('path');
var EXEC = require('child_process').exec;
var MKPATH = require('mkpath');

var AUTH = require('./auth.js');
var SERVER = require('./server.js');

var NO_VALIDATE = false;

var FILES_TO_PROCESS = [];
var FILES_PROCESSED = [];
var SRC_DIR = '/tmp/lucytmp';
var DEP_SRC_DIR = '/dep';
var DEST_DIR = process.cwd();

var getPackageDef = function(onDone) {
  FS.readFile(SRC_DIR + '/package.json', function(err, data) {
    var packageDef = {};
    try {
      packageDef = JSON.parse(data);
    } catch (e) {
      console.log('Error parsing package.json');
      throw e; 
    }
    onDone(packageDef);
  });
}

var getType = function(thing) {
  if (Array.isArray(thing)) {
    return 'array';
  } else {
    return typeof thing;
  }
}

var validateConfig = function(sample, config, key) {
  if (NO_VALIDATE) {return}
  var sType = getType(sample);
  var cType = getType(config);
  if (sample && !config) {
    return {err: "Missing from config JSON", key:key};
  } else if (cType !== sType) {
    return {err: "Expected type " + sType + " but found " + cType, key:key};
  } else if (cType === 'array') {
    for (var i = 0; i < config.length; ++i) {
      var innerErr = validateConfig(sample[0], config[i], key);
      if (innerErr) {
        innerErr.key += '[' + i + ']';
        return innerErr;
      }
    }
  } else if (sType === 'object') {
    for (var pKey in sample) {
      var innerErr = validateConfig(sample[pKey], config[pKey], pKey);
      if (innerErr) {
        if (key) {
          innerErr.key = key + '.' + innerErr.key;
        }
        return innerErr;
      }
    }
  }
}

var buildCode = function(packageDef, definition, config, onDone) {
  var validateError = validateConfig(definition.sample_input, config);
  if (validateError) {
    return onDone("Config error for key:\n" + validateError.key + "\n" + validateError.err);
  }
  buildDependencies(packageDef, config, function() {
    console.log('++built deps')
    renderAndCopyFiles(packageDef, config, function() {
      console.log('++copied and rendered');
      runJsScripts(packageDef, config, function() {
        console.log('++ran JS scripts');
        onDone();
      });
    });
  });
}

var buildDependencies = function(packageDef, config, onDone) {
  var deps = packageDef.dependencies;
  if (!deps) {
    return onDone();
  }
  var depKeys = Object.keys(deps);
  if (!depKeys || depKeys.length === 0) {
    return onDone();
  }

  var i = 0;
  SRC_DIR += DEP_SRC_DIR;

  var buildNextDependency = function() {
    if (++i == depKeys.length) {
      SRC_DIR = SRC_DIR.substring(0, SRC_DIR.length - DEP_SRC_DIR.length);
      onDone();
    } else {
      buildDependency(depKeys, deps, i, buildNextDependency);
    }
  };

  buildDependency(depKeys, deps, i, buildNextDependency);
}

var buildDependency = function(depKeys, deps, i, onDone) {
  runForPackage(depKeys[i], deps[depKeys[i]], onDone); 
}

var runJsScripts = function(packageDef, config, onDone) {
  var scripts = packageDef.js_scripts;
  if (!scripts || scripts.length == 0) {
    return onDone();
  }
  var i = -1;
  var runNextScript = function(err) {
    if (err) {
      throw err; 
    }
    if (++i == scripts.length) {
      return onDone();
    }
    var filename = SRC_DIR + '/' + packageDef.js_scripts[i];
    require(filename).run({srcDir: SRC_DIR, destDir: DEST_DIR}, config, runNextScript);
  }
  runNextScript();
}

var renderAndCopyFiles = function(packageDef, config, onDone) {
  if (!packageDef.files) {
    return;
  }
  alterSourcePaths(packageDef.files);
  expandGlobs(packageDef.files, function(maps) {
    FILES_TO_PROCESS = maps;
    FILES_PROCESSED = [];
    processFilesInQueue(config, onDone);
  });
}

var getPath = function(file) {
  var slash = file.lastIndexOf('/');
  return slash === -1 ? '' : file.substring(0, slash);
}

var renderFile = function(map, config, onDone) {
    FS.readFile(map.from, {encoding: 'utf8'}, function(err, data) {
      if (err) {
        console.log('error reading file:' + map.from);
        throw err; 
      }
      var rendered = "";
      try {
        rendered = EJS.render(data, config);
      } catch (e) {
        console.log("Failed to render " + map.from + "\n" + e);
        throw e; 
      }
      MKPATH(getPath(map.to), function(err) {
        // Ignore EEXIST, writeFile will fail for other errs.
        FS.writeFile(map.to, rendered, function(err) {
          if (err) {throw err}
          onDone(map.to);
        });
     });
    });
}

var copyFile = function(map, onDone) {
  FS.readFile(map.from, function(err, data) {
    MKPATH(getPath(map.to), function(err) {
      // Ignore EEXIST, writeFile will fail for other errs.
      FS.writeFile(map.to, data, function(err) {
        if (err) {throw err}
        onDone(map.to);
      });
    });
  });
}

var processFilesInQueue = function(config, onDone) {
  if (FILES_TO_PROCESS.length == 0) {
    return onDone();
  }
  for (var i = 0; i < FILES_TO_PROCESS.length; ++i) {
    var onDoneWithFile = function(newFile) {
      FILES_PROCESSED.push(newFile);
      if (FILES_PROCESSED.length === FILES_TO_PROCESS.length) {
        console.log('Created ' + FILES_PROCESSED.length + ' new files');
        onDone();
      }
    };
    try {
      if (FILES_TO_PROCESS[i].method === 'render') {
        renderFile(FILES_TO_PROCESS[i], config, onDoneWithFile);
      } else {
        copyFile(FILES_TO_PROCESS[i], onDoneWithFile);
      }
    } catch (e) {
      console.log('error ' + FILES_TO_PROCESS[i].method + 'ing file ' + FILES_TO_PROCESS[i].from);
      throw e;
    }
  }
}

var expandGlobs = function(maps, onDone) {
  var newMaps = [];
  var numGlobbed = 0;

  var gatherGlob = function(glob, onDone) {
    GLOB(glob.from, {}, function(err, files) {
      if (err) {throw err}
      var globbed = [];
      for (var i = 0; i < files.length; ++i) {
        globbed.push({
          from: files[i],
          to: files[i].replace(SRC_DIR, DEST_DIR),
          method: glob.method
        });
      }
     onDone(globbed);
    })
  }

  for (var i = 0; i < maps.length; ++i) {
    gatherGlob(maps[i], function(results) {
      newMaps = newMaps.concat(results);
      if (++numGlobbed === maps.length) {
        onDone(newMaps);
      }
    });
  }
}

var alterSourcePaths = function(maps) {
  for (var i = 0; i < maps.length; ++i) {
    if (!maps[i].method) {
      maps[i].method = 'render';
    }
    if (!maps[i].to) {
      maps[i].to = maps[i].from;
    }
    maps[i].from = SRC_DIR + '/' + maps[i].from;
  }
}

var TAR_FILENAME = SRC_DIR + '/package.tgz';
var runForPackage = function(packageName, config, onDone) {
  maybeLogIn(function(email, password) {
    var maybeHandleErr = function(err, dontLog) {
      if (err) {
        recursiveRmdir(SRC_DIR);
        if (err.code === 'EEXIST') {
          runForPackage(packageName, config, onDone);
          return true;
        } else {
          if (dontLog) {
            throw new Error();
          } else {
            console.log('Error while building:' + JSON.stringify(err));
            throw err;
          }
        }
      }
    }
    FS.mkdir(SRC_DIR, function (err) {
      if (maybeHandleErr(err)) {return}
      var writeStream = FS.createWriteStream(TAR_FILENAME, {encoding: 'binary'});
      SERVER.getPackageAndDefinition(email, password, packageName, writeStream, function(err, definition) {
        maybeHandleErr(err, true);
        var tarCmd = 'tar xzf ' + TAR_FILENAME + ' -C ' + SRC_DIR + '/';
        EXEC(tarCmd, function(err, stdout, stderr) {
          maybeHandleErr(err);
          getPackageDef(function(packageDef) {
            buildCode(packageDef, definition, config, function(err) {
              maybeHandleErr(err);
              recursiveRmdir(SRC_DIR);
              if (onDone) {onDone();}
            });
          });
        });
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

var EMAIL, PASSWORD;

var maybeLogIn = function(onDone) {
  if (!EMAIL || !PASSWORD) {
    AUTH.login(function(email, pass) {
      EMAIL = email;
      PASSWORD = pass;
      onDone(email, pass);
    });
  } else {
    onDone(EMAIL, PASSWORD);
  }
}

exports.run = function(args) {
  var source = args[0];
  var config = args[1];
  NO_VALIDATE = args[2] && args[2].toLowerCase() === '--force';
  if (!source || !config) {
    return true;
  }

  var parsed;
  try {
    parsed = JSON.parse(config);
  } catch (e) {
    // Ignore
  }
  if (parsed) {
    if (runFromSource(source, parsed)) {
      console.log('Couldn\'t parse source:' + source);
      throw new Error();
    }
  } else {
    FS.readFile(config, function(err, data) {
      if (err) {
        console.log('error reading from config:' + config);
        throw err; 
      }
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.log('error parsing config JSON:' + config);
        throw e;
      }
      if (runFromSource(source, data)) {
        console.log('Couldn\'t parse source:' + source);
        throw new Error();
      }
    });
  }
}

var runFromSource = function(source, config) {
  // TODO: add switch for different source types
  if (true) {
    var colon = source.indexOf(':');
    if (colon === -1) {
      source += ':' + source;
    }
    runForPackage(source, config);
  } else {
    return 1;
  }
}
