var READ = require('read');

exports.getEmail = function(onDone) {
  READ({prompt: 'E-mail address:', silent: false}, function(er, email) {
    if (er) throw er;
    onDone(email);
  });
}

exports.getPassword = function(onDone) {
  READ({ prompt: 'Password:', silent: true }, function(er, password) {
    if (er) throw er;
    onDone(password);
  });
}

exports.confirmPassword = function(onDone) {
  READ({ prompt: 'Confirm password:', silent: true }, function(er, password) {
    if (er) throw er;
    onDone(password);
  });
}

var LOGIN_MSG = 'You\'ll need to log in to publish. If you don\'t already have an account, run:\nlucy adduser';
exports.login = function(onDone) {
  console.log(LOGIN_MSG);
  exports.getEmail(function(email) {
    exports.getPassword(function(password) {
      onDone(email, password);
    });
  })
}

exports.signup = function(onDone) {
  exports.getEmail(function(email) {
    exports.getPassword(function(password) {
      exports.confirmPassword(function(conf) {
        if (password !== conf) {
          throw new Error('Passwords don\'t match. Please try again.');
        }
        onDone(email, password);
      });
    });
  });
}

