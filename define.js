var FS = require('fs');
var REQUEST = require('request');
var AUTH = require('./auth.js');
var SERVER = require('./server.js');

exports.run = function(args) {
  var configFile = args[0];
  if (!configFile) {
    throw new Error('You must specify a config file with JSON');
  }
  FS.readFile(configFile, 'utf8', function (err, data) {
    if (err) {
      throw err;
    }
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.log('Error parsing JSON!');
      throw e;
    }
    AUTH.login(function(email, password) {
      SERVER.define(email, password, data);
    });
  }); 
}
