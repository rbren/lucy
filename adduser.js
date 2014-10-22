var AUTH = require('./auth.js');
var SERVER = require('./server.js');

exports.run = function(args) {
  AUTH.signup(function(email, password) {
    SERVER.addUser({email: email, password: password});
  });
}

