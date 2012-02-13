load('test_utils.js')
load('vertx.js')

var tu = new TestUtils();

var fs = vertx.FileSystem;

var fileDir = "js-test-output"

// More tests needed

function testCopy() {
  var from = fileDir + "/foo.tmp";
  var to = fileDir + "/bar.tmp";
  var content = "some-data";
  fs.writeFile(from, content, function() {
    fs.copy(from, to, function(err, res) {
      tu.azzert(err === null);
      fs.readFile(to, function(err, res) {
        tu.azzert(err === null);
        tu.azzert(res.toString() === content);
        tu.testComplete();
      });
    });
  });
}

function testMove() {
  var from = fileDir + "/foo.tmp";
  var to = fileDir + "/bar.tmp";
  var content = "some-data";
  fs.writeFile(from, content, function() {
    fs.move(from, to, function(err, res) {
      tu.azzert(err === null);
      fs.readFile(to, function(err, res) {
        tu.azzert(err === null);
        tu.azzert(res.toString() === content);
        fs.exists(from, function(err, res) {
          tu.azzert(err === null);
          tu.azzert(!res);
          tu.testComplete();
        });
      });
    });
  });
}

function testReadDir() {
  var file1 = fileDir + "/foo.tmp";
  var file2 = fileDir + "/bar.tmp";
  var file3 = fileDir + "/baz.tmp";
  var content = "some-data";
  fs.writeFile(file1, content, function() {
    fs.writeFile(file2, content, function() {
      fs.writeFile(file3, content, function() {
        fs.readDir(fileDir, function(err, res) {
          tu.azzert(err === null);
          tu.azzert(res.length === 3);
          tu.testComplete();
        });
      })
    })
  });
}

function testPumpFile() {
  var from = fileDir + "/foo.tmp";
  var to = fileDir + "/bar.tmp";
  var content = tu.generateRandomBuffer(10000);
  fs.writeFile(from, content, function() {
    fs.open(from, function(err, file1) {
      tu.azzert(err === null);
      fs.open(to, function(err, file2) {
        tu.azzert(err === null);
        var rs = file1.getReadStream();
        var ws = file2.getWriteStream();
        var pump = new vertx.Pump(rs, ws);
        pump.start();
        rs.endHandler(function() {
          // TODO For now using handler() - this will disappear when we can wrap
          // AsyncFile properly and have a close method which takes a handler
          //TODO TODO
          file1.closeDeferred().handler(function() {
            file2.closeDeferred().handler(function() {
              fs.readFile(to, function(err, res) {
                tu.azzert(err === null);
                tu.azzert(tu.buffersEqual(content, res));
                tu.testComplete();
              });
            }).execute();
          }).execute();
        });
      });
    });
  });
}

function setup(doneHandler) {
  fs.exists(fileDir, function(err, exists) {
    if (exists) {
      fs.delete(fileDir, true, function() {
        fs.mkDir(fileDir, function() {
          doneHandler();
        });
      });
    } else {
      fs.mkDir(fileDir, function() {
        doneHandler();
      });
    }
  });
}

function teardown(doneHandler) {
  fs.delete(fileDir, true, function() {
    doneHandler();
  });
}

tu.registerTests(this);

setup(function() {
  tu.appReady();
})

function vertxStop() {
  teardown(function() {
    tu.unregisterAll();
    tu.appStopped();
  });
}
