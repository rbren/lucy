var REQUEST = require('request');

var LUCY_HOST = 'http://54.213.18.26';
var LUCY_PORT = 3000;
var LUCY_URL = LUCY_HOST + ':' + LUCY_PORT;
var LUCY_VERSION = '0.1.0';

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

var buildBody = function(email, password, payload) {
  return {
    email: email,
    password: password,
    lucy_version: LUCY_VERSION,
    payload: payload,
  };
}

exports.publish = function(email, password, pkgDef, tarball) {
  REQUEST({
       method: 'POST',
       preambleCRLF: true,
       postambleCRLF: true,
       uri: LUCY_URL + '/publish',
       multipart: [{
             'content-type': 'application/json',
             body: JSON.stringify(buildBody(email, password, pkgDef)),
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
    body: buildBody(loginInfo.email, loginInfo.password, {}),
    method: 'POST',
  }, handleResponse())
}

exports.define = function(email, password, defn) {
  REQUEST({
        url: LUCY_URL + '/define',
        json: true,
        body: buildBody(email, password, defn),
        method: 'POST',
 }, handleResponse());
}

exports.getPackage = function(email, password, packageName, writeStream, onDone) {
  REQUEST({
    url: LUCY_URL + '/getPackage',
    json: true,
    body: buildBody(email, password, packageName), 
    method: 'POST',
  }, handleResponse(onDone, true)).pipe(writeStream);
}
