/* ================================================================
 * wd-next by xdf(xudafeng[at]126.com)
 *
 * first created at : Fri Sep 11 2015 00:49:51 GMT+0800 (CST)
 *
 * ================================================================
 * Copyright  xdf
 *
 * Licensed under the MIT License
 * You may not use this file except in compliance with the License.
 *
 * ================================================================ */

'use strict';

var Q = require('q');
var fs = require('fs');
var path = require('path');
var webdriver = require('selenium-webdriver');
var By = webdriver.By;

process.env.PATH = process.env.PATH + ':' + path.dirname(require('chromedriver').path);

var driver;
var _global;
var pureMethods = ['sendKeys', 'click', 'getTagName', 'getText', 'getInnerHtml'];

var changeGlobalMap = {
  elementById: function(args) {
    return driver.findElement(By.id(args));
  },
  elementByName: function(args) {
    return driver.findElement(By.name(args));
  },
  get: function(args) {
    return driver.get(args);
  },
  elementByJs: function(args) {
    return driver.findElement(By.js(args));
  },
  elementByCss: function(args) {
    return driver.findElement(By.css(args));
  },
  elementByXpath: function(args) {
    return driver.findElement(By.xpath(args));
  },
  takeScreenshot: function(args) {
    if (!args) {
      return driver.takeScreenshot();
    } else if (typeof args === 'string') {
      return driver.takeScreenshot().then(function(data) {
        return new Promise(function(resolve, reject) {
          fs.writeFile(path.resolve(args), data, 'base64', function(err) {
            if (err) {
              return reject(err);
            }
            resolve(args);
          });
        });
      });
    } else {
      throw new Error('takeScreenshot function only support filepath');
    }
  },
  getTitle: function() {
    return driver.getTitle();
  },
  getCurrentUrl: function() {
    return driver.getCurrentUrl();
  },
  executeScript: function(args) {
    return driver.executeScript(args);
  }
};

function PromiseChain() {
  this.deferred = Q.defer();
  this._inject();
}

PromiseChain.prototype._then = function(cb, errCb) {
  return this.deferred.promise.then(function(elem) {
    cb(elem);
  }, function(err) {
    errCb(err);
  });
};

PromiseChain.prototype.then = function(cb, errCb) {
  var p = new PromiseChain();

  this._then(function(elem) {
    p._complete(cb(elem));
  }, function(err) {
    errCb && !p._complete(errCb(err)) || p._fail(err);
  }).catch(function(err) {
    p._fail(err);
  });
  return p;
};

PromiseChain.prototype.catch = function(errCb) {
  var p = new PromiseChain();

  this._then(function(elem) {
    p._complete(elem);
  }, function(err) {
    p._complete(errCb(err));
  }).catch(function(err) {
    p._fail(err);
  });
  return p;
};

PromiseChain.prototype.init = function() {
  var p = new PromiseChain();
  driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();
  this._complete(p._complete());
  return p;
};

PromiseChain.prototype.sleep = function(ms) {
  var p = new PromiseChain();
  this._then(function(elem) {
    Q.delay(ms).then(function() {
      p._complete(elem);
    }, function(err) {
      p._fail(err);
    });
  }, function(err) {
    p._fail(err);
  });
  return p;
};

PromiseChain.prototype.end = function(done) {
  this._then(function() {
    done();
  }, function(err) {
    throw err;
  }).done();
};

PromiseChain.prototype.quit = function() {
  driver.quit();
};

PromiseChain.prototype._complete = function(val) {
  this.deferred.resolve(val);
};

PromiseChain.prototype._fail = function(err) {
  this.deferred.reject(err);
};

PromiseChain.prototype._inject = function() {
  var that = this;
  pureMethods.forEach(function(method) {
    PromiseChain.prototype[method] = function(args) {
      var p = new PromiseChain();
      that._then(function(elem) {
        elem[method](args).then(function(elem) {
          p._complete(elem);
        }, function(err) {
          err = new Error('[ Webdriver Error: ' + method + '(' + args + ')=>'+ err.message +' ]');
          p._fail(err);
        });
      }, function(err) {
        p._fail(err);
      });
      return p;
    };
  });

  Object.keys(changeGlobalMap).forEach(function(method) {
    PromiseChain.prototype[method] = function(args) {
      var p = new PromiseChain();
      that._then(function() {
        _global = changeGlobalMap[method](args);
        _global.then(function(elem) {
          p._complete(elem);
        }, function(err) {
          err = new Error('[ Webdriver Error: ' + method + '(' + args + ')=>'+ err.message +' ]');
          p._fail(err);
        });
      }, function(err) {
        p._fail(err);
      });
      return p;
    };
  });
};

module.exports = {
  initPromiseChain: function() {
    return new PromiseChain();
  },
  addPromiseChainMethod: function(name, func) {
    var wrappedMethod = function() {
      var p = new PromiseChain();
      var args = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
      var that = this;
      this._then(function() {
        func.apply(that, args).then(function(elem) {
          p._complete(elem);
        }, function(err) {
          err = new Error('[ Webdriver Error: ' + name + '(' + args + ')=>'+ err.message +' ]');
          p._fail(err);
        });
      }, function(err) {
        p._fail(err);
      });
      return p;
    };
    PromiseChain.prototype[name] = wrappedMethod;
  }
};
