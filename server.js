var REQUEST = require('request');

var LUCY_HOST = 'http://54.213.18.26';
var LUCY_PORT = 3000;
var LUCY_URL = LUCY_HOST + ':' + LUCY_PORT;

var handleResponse = function(callback, ignoreBody) {
  return function(err, res, body) {
    if (err) { 
      console.log('Error connecting to Lucy\'s servers:' + JSON.stringify(err) + '::' + JSON.stringify(res));
    } else if (!ignoreBody) {
      console.log(body);
    }
    if (callback) {
      callback(err, body);
    }
  }
}

exports.publish = function(email, password, pkgDef, tarball) {
  REQUEST({
       method: 'POST',
       preambleCRLF: true,
       postambleCRLF: true,
       uri: LUCY_URL + '/publish',
       multipart: [{
             'content-type': 'application/json',
             body: JSON.stringify({email: email, password: password, payload: pkgDef}),
       }, {
             'content-type': 'application/octet-stream',
             body: tarball,
       }]
  }, handleResponse());
}

exports.addUser = function(loginInfo) {
  REQUEST({
    url: LUCY_URL + '/signup',
    json: true,
    body: loginInfo,
    method: 'POST',
  }, handleResponse())
}

exports.define = function(email, password, defn) {
  REQUEST({
        url: LUCY_URL + '/define',
        json: true,
        body: {email: email, password: password, payload: defn},
        method: 'POST',
 }, handleResponse());
}

exports.getPackage = function(email, password, packageName, writeStream, onDone) {
  REQUEST({
    url: LUCY_URL + '/getPackage',
    json: true,
    body: {email: email, password: password, payload: packageName},
    method: 'POST',
  }, handleResponse(onDone, true)).pipe(writeStream);
}
