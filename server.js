var http = require("http");
var https = require("https");
var REQUEST = require("request");
var express = require('express');
var mysql = require('mysql');
var URL_PARSER = require('url');
var BODY_PARSER = require('body-parser');

var app = express();
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs');

app.use(BODY_PARSER.json());
app.use(BODY_PARSER.urlencoded());

app.get("/res/*", function(req, res) {
  var path = sanitizePath(req.url);
  res.sendFile(__dirname + path);
});

var PACKAGE_LIST = [
  "jsoup",
  "guice",
  "stax",
  "guava",
  "stanford-corenlp",
  "gson",
  "joda-time",
];

app.get("*", function(req, res) {
  console.log('get!' + req.url);
});

app.listen(5000);

var sanitizePath = function(path) {
  // Get rid of weird chars
  path = path.replace(/[^\w\.\/]/g, '');
  // Get rid of traversals
  path = path.replace(/\.\./g, '');
  return path;
}


