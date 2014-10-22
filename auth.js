var READ = require('read');
var CRYPTO = require('crypto');
var EXEC = require('child_process').exec;

var getEmail = function(onDone, ignoreCache) {
  var prompt = 'E-mail adddress';
  var cached = process.env["LUCYUSER"];
  if (cached && !ignoreCache) {
    prompt += ' (' + cached + ')';
  }
  prompt += ':';
  READ({prompt: prompt, silent: false}, function(er, email) {
    if (er) throw er;
    onDone(email ? email : cached);
  });
}

var getPassword = function(isConfirm, onDone, ignoreCache) {
  var cached = process.env.LUCYPASS;
  if (cached && !ignoreCache) {
    console.log('Using password stored in $LUCYPASS');
    return onDone(getSha1(cached));
  }
  READ({ prompt: isConfirm ? 'Confirm password:' : 'Password:', silent: true }, function(er, password) {
    if (er) throw er;
    var sha1 = getSha1(password);
    onDone(sha1);
  });
}

var LOGIN_MSG = '\nYou\'ll need to log in to do that. If you don\'t already have an account, run:\n' +
    '    lucy adduser\n\nTip: cache your credentials in $LUCYUSER and $LUCYPASS environment variables\n';

exports.login = function(onDone) {
  if (!process.env["LUCYUSER"]) {
    console.log(LOGIN_MSG);
  }
  getEmail(function(email) {
    getPassword(false, function(password) {
      onDone(email, password);
    });
  })
}

exports.signup = function(onDone) {
  getEmail(function(email) {
    getPassword(false, function(password) {
      getPassword(true, function(conf) {
        if (password !== conf) {
          throw new Error('Passwords don\'t match. Please try again.');
        }
        onDone(email, password);
      }, true);
    }, true);
  }, true);
}

var getSha1 = function(str) {
  var SHA1 = CRYPTO.createHash('sha1');
  SHA1.update(str);
  return SHA1.digest('hex');
}
