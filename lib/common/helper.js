/* ================================================================
 * macaca-chromedriver by xdf(xudafeng[at]126.com)
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

const childProcess = require('child_process');

function execPromise(/* command, args, options */) {
  const args = Array.prototype.slice.call(arguments);

  return new Promise((resolve, reject) => {
    childProcess.exec(args, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }
      resolve([stdout, stderr]);
    });
  });
}

function killChrome() {
  const cmd = `ps -ef | grep Chrome | grep -v grep  | grep -e 'remote-debugging-port' | awk '{ print $2 }' | xargs kill -15`;
  return execPromise(cmd);
}

module.exports = {
  killChrome
};
