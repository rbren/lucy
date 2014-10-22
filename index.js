#!/usr/bin/env node

var showHelp = function() {
  console.log('LUCY\n\n');
  console.log('Usage: lucy <command> <args>\n\n');
  console.log('lucy adduser');
  console.log();
  console.log('lucy build <definition>:<target>[@version] <path/to/config.json>');
  console.log('OR');
  console.log('lucy build <definition>:<directory> <path/to/config.json>');
  console.log();
  console.log('lucy define <path/to/definition.json>');
  console.log();
  console.log('lucy publish <definition>[@version] <path/to/tarball/or/root/dir>');
  console.log();
}

var userArgs = process.argv.slice(2);
var command = userArgs[0].toLowerCase();
var cmdArgs = userArgs.slice(1);
if (!command) {
  console.log('usage: lucy <cmd> <args>');
  process.exit(1);
} else if (command === 'help') {
  showHelp();
} else if (command === 'build' ||
           command === 'define' ||
           command === 'publish' ||
           command === 'adduser') {
  try {
    if (require('./' + command + '.js').run(cmdArgs)) {
      console.log("returned error, showing help");
      showHelp();
    }
  } catch (e) {
    console.log('Exception while running:' + JSON.stringify(e));
    process.exit(1);
  }
} else {
  console.log('unsupported command:' + command);
}

