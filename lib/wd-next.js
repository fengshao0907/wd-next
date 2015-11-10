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
var path = require('path');
var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;

process.env.PATH = process.env.PATH + ':' + path.dirname(require('chromedriver').path);

var driver = new webdriver.Builder()
  .forBrowser('chrome')
  .build();

var _global;

var pureMethods = ['sendKeys', 'click', 'getTagName'];

var changeGlobalMap = {
  elementById: function(args) {
    return driver.findElement(By.id(args))
  },
  elementByName: function(args) {
    return driver.findElement(By.name(args));
  },
  get: function(args) {
    return driver.get(args);
  }
};

function PromiseChain() {
  this.deferred = Q.defer();
  this._inject();
}

PromiseChain.prototype._then = function(cb) {
  this.deferred.promise.then(cb, function(err) {
    console.log(err);
  });
};

PromiseChain.prototype.then = function(cb) {
  var p = new PromiseChain();

  this._then(function(elem) {
    var result = cb(elem);
    if (result && typeof result.then === 'function') {
      Promise.resolve(result).then(function(elem) {
        p._complete(elem);
      });
    } else if (typeof result !== 'undefined'){
      _global = result;
      p._complete(_global);
    } else {
      p._complete(_global);
    }
  });
  return p;
};

PromiseChain.prototype._complete = function(val) {
  this.deferred.resolve(val);
};

PromiseChain.prototype.init = function() {
  var p = new PromiseChain();
  setTimeout(function() {
    p._complete();
  }, 0);
  return p;
};

PromiseChain.prototype.sleep = function(ms) {
  var p = new PromiseChain();
  this._then(function() {
    Q.delay(ms).then(function() {
      p._complete();
    });
  });
  return p;
};

PromiseChain.prototype._inject = function() {
  var that = this;
  pureMethods.forEach(function(method) {
    PromiseChain.prototype[method] = function(args) {
      var p = new PromiseChain();
      that._then(function(elem) {
        elem[method](args).then(function(elem) {
          p._complete(elem);
        });
      });
      return p;
    };
  });

  Object.keys(changeGlobalMap).forEach(function(method) {
    PromiseChain.prototype[method] = function(args) {
      var p = new PromiseChain();
      this._then(function() {
        _global = changeGlobalMap[method](args);
        _global.then(function(elem) {
          p._complete(elem);
        });
      });
      return p;
    };
  });
};


module.exports = function() {
  return new PromiseChain();
};
