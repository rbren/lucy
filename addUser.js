var REQUEST = require('request');
var HTTP = require('http');
var USER_INPUT = require('./userInput.js');

exports.run = function(args) {
  USER_INPUT.signup(function(email, password) {
    trySignup({email: email, password: password});
  });
}

var SIGNUP_PARAMS = {
  hostname: '54.213.18.26', 
  port: 3000,
  path: '/signup',
  method: 'POST',
}
/*
var trySignup = function(loginInfo) {
  var req = HTTP.request(SIGNUP_PARAMS, function(res) {
    res.on('data', function(data) {
      console.log('response:' + data);
    });
  });
  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  var sendData = JSON.stringify(loginInfo);
  console.log('sending:' + sendData);
  req.write(sendData);
  req.end();
}
*/

var trySignup = function(loginInfo) {
  REQUEST({
    url: 'http://54.213.18.26:3000/signup',
    json: true,
    body: loginInfo,
    method: 'POST',
  }, function (err, response, body) {
    console.log('resp:' + body);
  })
}
