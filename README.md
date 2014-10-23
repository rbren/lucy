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
```
<br><br>
## Usage
### Build an existing package
```bash
lucy build definition:package config.json
```

### Push a new definition
<i>Note: define is currently only open to beta testers. E-mail bobby@bbrennan.info for access</i>
```bash
lucy define definition.json
```

### Add a package to an existing definition
<i>Note: publish is currently only open to beta testers. E-mail bobby@bbrennan.info for access</i>
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

and run:
```bash
lucy define def.json
```
which pushes the definition to lucy's servers.
<br>
### The Package
Now we create a package by starting a new directory 'pkg'
<br><br><i>pkg/hello.ejs</i>
```js
console.log('<%- greeting %> <%- person %>');
```

<br><i>pkg/package.json</i>
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
<br><br><i>hello.ejs</i>
```java
public class HelloWorld {
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
    "from": "hello.ejs",
    "to": "HelloWorld.java",
    "method": "render"
  }]
}
```
<br><br>
E-mail bobby@bbrennan.info if you're intersted in giving it a shot!
