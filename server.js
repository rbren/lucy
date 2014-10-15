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
  var versions = [];
  for (var i = 0; i < PACKAGE_LIST.length; ++i) {
    var name = PACKAGE_LIST[i];
    REQUEST.get("http://search.maven.org/solrsearch/select?a=" + name + "&q=" + name, function(err, searchResp, body) {
      body = JSON.parse(body);
      var results = body["response"]["docs"];
      var name = body["responseHeader"]["params"]["a"];
      console.log("got res");
      for (var j = 0; j < results.length; ++j) {
        console.log("found a:" + results[j]["a"]);
        if (results[j]["a"] === name) {
          versions[versions.length] = {
              artifact: results[j]["a"],
              latestVersion: results[j]["latestVersion"],
          };
          break;
        }
      }
      if (versions.length === PACKAGE_LIST.length) {
        console.log('adding versions:' + versions.length);
        res.render('deps', {versions: versions});
      }
    });
  }
});

app.listen(3500);

var sanitizePath = function(path) {
  // Get rid of weird chars
  path = path.replace(/[^\w\.\/]/g, '');
  // Get rid of traversals
  path = path.replace(/\.\./g, '');
  return path;
}


