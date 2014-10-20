var REQUEST = require('request');
var FS = require('fs');

var LUCY_HOST = 'http://54.213.18.26';
var LUCY_PORT = 3000;
var LUCY_URL = LUCY_HOST + ':' + LUCY_PORT;

var handleResponse = function(callback) {
  return function(err, res, body) {
    if (err) { 
      console.log('Error connecting to Lucy\'s servers:' + JSON.stringify(err) + '::' + JSON.stringify(res));
    } else {
      console.log(body);
    }
    if (callback) {
      callback(res, body);
    }
  }
}

exports.publish = function(email, password, pkgDef, tarball) {
  FS.writeFile('publishtmp.tgz', tarball, {encoding: 'binary'});
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
        url: GLOBAL.LUCY_URL + '/define',
        json: true,
        body: {email: email, password: password, payload: data},
        method: 'POST',
 }, handleResponse());
}

exports.getPackage = function(email, password, packageName, onData) {
  REQUEST({
    url: LUCY_URL + '/getPackage',
    json: true,
    body: {email: email, password: password, payload: packageName},
    method: 'POST',
  }, handleResponse(onData));
}
