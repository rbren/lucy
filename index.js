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
} else if (command === 'build') {
  require('./build.js').run(cmdArgs);
} else if (command === 'define') {
  require('./define.js').run(cmdArgs);
} else if (command === 'publish') {
  require('./publish.js').run(cmdArgs);
} else if (command === 'adduser') {
  require('./addUser.js').run(cmdArgs);
} else {
  console.log('unsupported command:' + command);
}

