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

const Q = require('q');
const fs = require('fs');
const path = require('path');
const killChrome = require('./common/helper').killChrome;
const webdriver = require('selenium-webdriver');

const By = webdriver.By;
const separator = process.platform === 'win32' ? ';' : ':';

process.env.PATH = `${process.env.PATH}${separator}${path.dirname(require('macaca-chromedriver').binPath)}`;

let driver;
let _global;

const pureMethods = [
  'sendKeys',
  'click',
  'getTagName',
  'getText',
  'getInnerHtml',
  'getCssValue',
  'getAttribute',
  'isDisplayed',
  'clear'
];

const changeGlobalMap = {
  elementById(id) {
    return driver.findElement(By.id(id));
  },

  elementByName(name) {
    return driver.findElement(By.name(name));
  },

  get(url) {
    return driver.get(url);
  },

  elementByJs(js) {
    return driver.findElement(By.js(js));
  },

  elementByCss(css) {
    return driver.findElement(By.css(css));
  },

  elementByXpath(xpath) {
    return driver.findElement(By.xpath(xpath));
  },

  elementsByXpath(xpath) {
    return driver.findElements(By.xpath(xpath));
  },

  elementByClassName(className) {
    return driver.findElement(By.className(className));
  },

  elementsByClassName(className) {
    return driver.findElements(By.className(className));
  },

  getTitle() {
    return driver.getTitle();
  },

  getCurrentUrl() {
    return driver.getCurrentUrl();
  },

  executeScript(js) {
    return driver.executeScript(js);
  },

  maximize() {
    return driver.manage().window().maximize();
  },

  setNormalSize(width, height) {
    return driver.manage().window().setSize(width || 1280, height || 960);
  },

  getWindowHandles() {
    return driver.getAllWindowHandles();
  },

  window(handle) {
    return driver.switchTo().window(handle);
  },

  close() {
    return driver.close();
  },

  takeScreenshot(filePath) {
    if (!filePath) {
      return driver.takeScreenshot();
    } else if (typeof filePath === 'string') {
      return driver.takeScreenshot().then((data) => {
        return new Promise((resolve, reject) => {
          fs.writeFile(path.resolve(filePath), data, 'base64', (err) => {
            if (err) {
              return reject(err);
            }

            resolve(filePath);
          });
        });
      });
    } else {
      throw new Error('takeScreenshot function only support filepath');
    }
  },

  hover(xpath) {
    const webEle = driver.findElement(By.xpath(xpath));
    driver.actions().mouseMove(webEle).perform();
    return webEle;
  }
};

class PromiseChain {
  constructor() {
    this.deferred = Q.defer();
    this._inject();
  }

  _then(cb, errCb) {
    return this
      .deferred
      .promise
      .then((elem) => {
        cb(elem);
      }, (err) => {
        errCb(err);
      });
  }

  then(cb, errCb) {
    const p = new PromiseChain();

    this._then((elem) => {
      p._complete(cb(elem));
    }, (err) => {
      errCb && !p._complete(errCb(err)) || p._fail(err);
    }).catch((err) => {
      p._fail(err);
    });

    return p;
  }

  catch(errCb) {
    const p = new PromiseChain();

    this._then((elem) => {
      p._complete(elem);
    }, (err) => {
      p._complete(errCb(err));
    }).catch((err) => {
      p._fail(err);
    });

    return p;
  }

  init() {
    const p = new PromiseChain();

    // Cleaning Chrome before init
    killChrome().then(() => {
      driver = new webdriver.Builder()
        .forBrowser('chrome')
        .build();

      this._complete(p._complete());
    });

    return p;
  }

  sleep(ms) {
    const p = new PromiseChain();

    this._then((elem) => {
      Q.delay(ms).then(() => {
        p._complete(elem);
      }, (err) => {
        p._fail(err);
      });
    }, (err) => {
      p._fail(err);
    });

    return p;
  }

  end(done) {
    this._then(() => {
      done();
    }, (err) => {
      done(err);
    });
  }

  quit(done) {
    driver.quit();

    // Cleaning Chrome
    killChrome().then(() => {
      done();
    });
  }

  _complete(val) {
    this.deferred.resolve(val);
  }

  _fail(err) {
    this.deferred.reject(err);
  }

  _inject() {
    pureMethods.forEach((method) => {
      this[method] = (args) => {
        const p = new PromiseChain();

        this._then((elem) => {
          elem[method](args).then((elem) => {
            p._complete(elem);
          }, (err) => {
            err = new Error(`[ Webdriver Error: ${method} (${args}) => ${err.message} ]`);
            p._fail(err);
          });
        }, (err) => {
          p._fail(err);
        });

        return p;
      };
    });

    Object.keys(changeGlobalMap).forEach((method) => {
      PromiseChain.prototype[method] = (args) => {
        const p = new PromiseChain();
        this._then(() => {
          _global = changeGlobalMap[method](args);
          _global.then((elem) => {
            p._complete(elem);
          }, (err) => {
            err = new Error(`[ Webdriver Error: ${method} (${args}) => ${err.message} ]`);
            p._fail(err);
          });
        }, (err) => {
          p._fail(err);
        });

        return p;
      };
    });
  }
}

module.exports = {
  initPromiseChain() {
    return new PromiseChain();
  },

  addPromiseChainMethod(name, func) {
    const wrappedMethod = function() {
      const p = new PromiseChain();
      const args = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
      const that = this;
      this._then(() => {
        that.then(() => {
          return func.apply(that, args);
        }).then((elem) => {
          p._complete(elem);
        }, (err) => {
          err = new Error(`[ Webdriver Error: ${name} (${args}) => ${err.message} ]`);
          p._fail(err);
        });
      }, (err) => {
        p._fail(err);
      });
      return p;
    };

    PromiseChain.prototype[name] = wrappedMethod;
  }
};
