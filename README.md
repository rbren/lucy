Lucy
====
Lucy is a tool for sharing, coordinating, and automating code in any language. Lucy works by feeding JSON into code templates, producing customized code that compiles and runs.
<br><br>
Lucy is just getting started, but you can keep up with the latest news and learn about what lucy can do here:<br>
http://lucybot.github.io/blog/
<br><br>
Want to get an early peek at everything lucy can do? <a href="http://lucybot.github.io/blog/">Join the beta</a>!

<br><br>
## Installation
You'll need nodejs to run lucy:<br>
https://github.com/joyent/node/wiki/installing-node.js-via-package-manager

```bash
sudo npm install -g lucy
lucy adduser
```
<br><br>
## Usage
### Build an existing package
```bash
lucy build definition:package config.json
```

### Push a new definition
<i>Note: define is currently only open to beta testers.  <a href="http://lucybot.github.io/blog/">Join the beta</a> for access</i>
```bash
lucy define definition.json
```

### Add a package to an existing definition
<i>Note: publish is currently only open to beta testers. <a href="http://lucybot.github.io/blog/">Join the beta</a> for access</i>
```bash
lucy publish /path/to/directory/containing/package.json
```
<br><br>
## About
There are two main components to a lucy module:<br>
* DEFINITION - this is JSON that describes what kind of code is being generated, and provides a sample configuration.<br>
* PACKAGE - this is a set of code templates, scripts, and files that will be used to generate code. There can be multiple packages per definition.<br>

Most users will simply run ```lucy build``` to generate code from an existing lucy package. However, you can also create your own definitions and packages to share with others. Let's walk through a "hello world" example.

<i>Note that while we're in beta, the ```define``` and ```publish``` commands won't work unless you're signed up. Feel free to jump ahead to ```build``` though!</i>

### Quickstart
To download all the files described in this tutorial, enter a new directory and run
```bash
lucy build hello-world-starter '{"username": "SOME_UNIQUE_ID"}'
```
choosing a unique id that won't collide with other hello-world-* definitions.

you can then run
```bash
lucy define def.json

lucy publish pkg
lucy build hello-world-YOUR_UNIQUE_ID:js config.json

lucy publish javapkg
lucy build hello-world-YOUR_UNIQUE_ID:java config.json
```

### The Definition
We start with a definition:
<br><br><i>def.json</i>
```js
{
  "name": "hello-world",
  "description": "A hello world example for lucy",
  "sample_input": {
    "greeting": "Hello",
    "person": "world"
  }
}
```
(you'll need to replace "hello-world" with something unique)

and run:
```bash
lucy define def.json
```
which pushes the definition to lucy's servers.
<br>
### The Package
Now we create a package by starting a new directory 'pkg'
<br><br><i>pkg/hello.js</i>
```js
console.log('<%- greeting %> <%- person %>');
```

<br><i>pkg/package.json</i>
```js
{
  "lucy_def": "hello-world",
  "package_name": "js",
  "files": [{
    "from": "hello.js"
  }]
}
```

and run
```bash
lucy publish pkg
```
which will zip up the directory and upload the resulting tarball.
<br>
### Build!
Now anyone can create a config.json like
<br><br><i>config.json</i>
```js
{
  "greeting": "Yo",
  "person": "lucy"
}
```

and run
```bash
lucy build hello-world:js config.json
```

which will generate this file in the working directory:
<br><br><i>hello.js</i>
```js
console.log("Yo lucy");
```
<br>
### Extend!
What's more, you (or anyone else) can add other packages to the hello-world definition, for example:
<br><br><i>Hello.java</i>
```java
public class Hello {
  public static void main(String[] args) {
    System.out.println("<%- greeting %> <%- person %>");
  }
}
```

<br><i>package.json</i>
```js
{
  "lucy_def": "hello-world",
  "package_name": "java",
  "files": [{
    "from": "Hello.java"
  }]
}
```
<br><br>
<a href="http://lucybot.github.io/blog/">Join the beta</a> if you're intersted in giving it a shot!
<br><br>

## Full JSON spec
<i>definition.json</i>
```js
{
  "name": "string", // A unique identifier for this definition, allowed chars are alphanumeric and '-'
  "description": "string", // A human-readable description of what kind of code this definition should generate
  "sample_input": {} // Arbitrary JSON. All packages associated with this definition should run without errors if given this as input, and all build inputs will be type-checked against it.
}
```
<br><br>
<i>package.json</i>
```js
{
  "definition_name": "string", // The identifier specified in definition.json
  "package_name": "string", // An identifier distinct from all other packages associated with this definition. Will default to definition_name if unspecified
  "files": {  // The files to be generated
    "from": "string", // The relative path (foo/bar.baz) or glob (foo/*) to read from inside the package directory
    "to": "string", // The relative path of the file to write to in the destination directory. Defaults to "from"
    "method": "string" // Either "render" (which fills out EJS templates) or "copy". Defaults to "render"
  },
  "js_scripts": [  // These scripts will be run in order after all files are generated.
    "script1.js",
    "script2.js"
  ]
}
```
