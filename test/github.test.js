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
      .get('https://github.com/macacajs/macaca')
      .sleep(1000)
      .getTitle()
      .then(function(title) {
        title.should.containEql('macaca');
      })
      .sleep(1000)
      .elementByCss('.pagehead-actions li:nth-child(2) a')
      .click()
      .sleep(1000)
      .getCurrentUrl()
      .then(function(url) {
        if (!!~url.indexOf('/login?')) {
          return driver
            .init()
            .executeScript('alert("Please login in 20s!")');
        }
      })
      .sleep('20000')
      .elementByXpath('/html/body/div[4]/div/div[1]/div/div/ul/li[2]/div/form[2]/button')
      .getInnerHtml()
      .then(function(text) {
        text.should.containEql('Star');
      })
      .elementByXpath('/html/body/div[4]/div/div[1]/div/div/ul/li[2]/div/form[2]/button')
      .click()
      .sleep(6000)
      .takeScreenshot('./test.png')
      .end(done);
  });
});

