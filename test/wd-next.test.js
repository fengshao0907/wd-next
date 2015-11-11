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

describe('test sample', function() {
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
      .sleep(3000)
      .getTitle()
      .then(function(title) {
        console.log(title);
        //title.should.containEql('百1度');
      })
      .sleep(3000)
      .takeScreenshot('./test.png')
      .end(done);
  });

  it('#1 goto github repository', function(done) {
    return driver
      .init()
      .get('https://www.baidu.com')
      .sleep(3000)
      .elementByJs('document.querySelectorAll(".btn.btn-sm.btn-with-count.tooltipped.tooltipped-n")[1]' )
      .getTagName()
      .then(function(text) {
        console.log('---------' + text);
      })
      .end(done);

  });
});
