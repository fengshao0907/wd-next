/* ================================================================
 * wd-next by xdf(xudafeng[at]126.com)
 *
 * first created at : Fri Sep 11 2015 00:49:51 GMT+0800 (CST)
 *
 * ================================================================
 * Copyright 2013 xdf
 *
 * Licensed under the MIT License
 * You may not use this file except in compliance with the License.
 *
 * ================================================================ */

'use strict';

var driver = require('..')();

describe('github test sample', function() {
  this.timeout(300000);

  before(function() {
  });

  after(function() {
    return driver
    .quit();
  });

  it('#0 goto github repository', function(done) {
    return driver
      .init()
      .get('https://www.baidu.com')
      .sleep(10000)
      .takeScreenshot('./test.png')
      .elementByJs('document.querySelectorAll(".btn.btn-sm.btn-with-count.tooltipped.tooltipped-n")[1]' )
      .getTagName()
      .then(function(text) {
        console.log('---------' + text);
      })
      .end(done);

  });

  it('#1 goto github repository', function(done) {
    return driver
      .init()
      .get('https://www.baidu.com')
      .sleep(10000)
      .elementByJs('document.querySelectorAll(".btn.btn-sm.btn-with-count.tooltipped.tooltipped-n")[1]' )
      .getTagName()
      .then(function(text) {
        console.log('---------' + text);
      })
      .end(done);

  });
});
