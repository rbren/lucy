lucy
====
Lucy is a tool for sharing, coordinating, and automating code. Lucy works by feeding JSON into templated code to produce customized code that compiles and runs.

Lucy is currently in beta - if you'd like to try it out, please e-mail bobby@bbrennan.info for access.

## Installation
You'll need nodejs to run lucy:<br>
https://github.com/joyent/node/wiki/installing-node.js-via-package-manager

Then you can run
```bash
sudo npm install -g lucy
```

## Usage
### Build an existing package
```bash
lucy build definition:package config.json
```

### Push a new definition
* Note: define is currently only open to beta testers. E-mail bobby@bbrennan.info for access
```bash
lucy define definition.json
```

### Add a package to an existing definition
* Note: publish is currently only open to beta testers. E-mail bobby@bbrennan.info for access
```bash
lucy publish /path/to/directory/containing/package.json
```

## About
There are two main components to a lucy module:<br>
DEFINITION - this is JSON that describes what kind of code is being generated, and provides a sample configuration.<br>
PACKAGE - this is a set of code templates, scripts, and files that will be used to generate code. There can be multiple packages per definition.<br>

Most users will simply run lucy build to generate code from an existing Lucy package. However, you can also create your own definitions and packages to share with others. Let's walk through a "hello world" example.

### The Definition
We start with a definition:
* def.json
```js
{
  "name": "hello-world",
  "description": "A hello world example for Lucy",
  "sample_input": {
    "greeting": "Hello",
    "person": "world"
  }
}
```

and run:
```bash
lucy define def.json
```
which pushes the definition to Lucy's servers.

### The Package
Now we create a package by starting a new directory with two files:
* hello.ejs
```js
console.log("<%- greeting %> <%- person %>");
```

* package.json
```js
{
  "lucy_def": "hello-world",
  "package_name": "js",
  "files": [{
    "from": "hello.ejs",
    "to": "hello.js",
    "method": "render"
  }]
}
```

and run
```bash
lucy publish /path/to/dir
```
which will zip up the directory and upload the resulting tarball.

### Build!
Now anyone can create a config.json like
* config.json
```js
{
  "greeting": "Yo",
  "person": "Lucy"
}
```

and run
```bash
lucy build hello-world:js config.json
```

which will generate this file in the working directory:
* hello.js
```js
console.log("Yo Lucy");
```

### Extend!
What's more, you (or anyone else) can add other packages to the hello-world definition, for example:
* hello.ejs
```java
public class HelloWorld {
  public static void main(String[] args) {
    System.out.println("<%- greeting %> <%- person %>");
  }
}
```

* package.json
```js
{
  "lucy_def": "hello-world",
  "package_name": "java",
  "files": [{
    "from": "hello.ejs",
    "to": "hello.js",
    "method": "render"
  }]
}

E-mail bobby@bbrennan.info if you're intersted in giving it a shot!
```
