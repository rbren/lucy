set -e

curl -X DELETE http://admin:nannerb2@localhost:5984/test_definitions
curl -X DELETE http://admin:nannerb2@localhost:5984/test_packages
curl -X PUT http://admin:nannerb2@localhost:5984/test_definitions
curl -X PUT http://admin:nannerb2@localhost:5984/test_packages

DEF_HELLO="defs/hello-lucy.json"
PKG_HELLO="pkgs/hello-lucy/node/"
BLD_HELLO="blds/hello-lucy/"
PKGNAME_HELLO="test-hello-lucy:node"

DEF_ADV_HELLO="defs/hello-lucy-adv.json"
PKG_ADV_HELLO="pkgs/hello-lucy/node-adv/"

define() {
  lucy define $1
  return $?
}

publish() {
  lucy publish $1
  return $?
}

build () {
  (cd $1 && lucy build $2 config.json)
  return $?
}

testname="No Test Set"
PASSMSG() { 
  echo -e "\n\n\n$testname:\n****PASSED****\n\n\n" 
}
FAILMSG() { 
  echo -e "\n\n\n$testname:\n****FAILED****\n\n\n" 
}
checkPass() {
  set +e
  echo -e "\n" | $1
  if [ $? -eq 0 ]; then
    PASSMSG
  else
    FAILMSG
    exit 1
  fi
  set -e
}

checkFail() {
  set +e
  echo -e "\n" | $1
  if [ $? -ne 0 ]; then
    PASSMSG
  else
    FAILMSG
    exit 1
  fi
  set -e
}

checkGolden() {
  testsum="$(cksum $1)"
  testsum=${testsum% *}
  testsum=${testsum% *}
  goldsum="$(cksum $2)"
  goldsum=${goldsum% *}
  goldsum=${goldsum% *}

  if [ "$testsum" -eq "$goldsum" ]; then
    PASSMSG 
  else
    FAILMSG
    exit 1
  fi
}

testname="Nonexistant User can't write or build"
export LUCYUSER=nonexistant@gmail.com
export LUCYPASS=somethingdumb
testname="Nonexistant user can't define"
checkFail "define $DEF_HELLO"
testname="Nonexistant user can't publish"
checkFail "publish $PKG_HELLO"
testname="Nonexistant user can't build"
checkFail "build $BLD_HELLO $PKGNAME_HELLO"


export LUCY_HOST=http://localhost
export LUCYUSER=testrunner@gmail.com
export LUCYPASS=testinglucy

testname="Define test-hello-lucy"
checkPass "define $DEF_HELLO"
testname="Publish test-hello-lucy:node"
checkPass "publish $PKG_HELLO"
testname="Build test-hello-lucy:node"
checkPass "build $BLD_HELLO $PKGNAME_HELLO"
testname="Check test-hello-lucy:node build against golden"
checkGolden blds/hello-lucy/hello.js blds/hello-lucy/golden/hello.js



testname="Adversary pass"

export LUCYUSER=adversary@bbrennan.info
testname="Adversary can define new"
checkPass "define $DEF_ADV_HELLO"
testname="Adversary can't redefine"
checkFail "define $DEF_HELLO"

testname="Adversary can publish new (to orig user's defn)"
checkPass "publish $PKG_ADV_HELLO"
testname="Adversary can't republish"
checkFail "publish $PKG_HELLO"

testname="Adversary can build"
checkPass "build $BLD_HELLO $PKGNAME_HELLO"



