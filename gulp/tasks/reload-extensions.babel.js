import gulp from 'gulp';
var $ = require('gulp-load-plugins')();

import { reloadExtensions as config } from '../config.babel';
import os from 'os';

var chrome = null;
switch (os.platform()) {
  case 'linux':
    chrome = 'google-chrome';
    break;
  case 'darwin':
    chrome = 'google chrome';
    break;
  case 'win32':
    chrome = 'chrome';
    break;
  default:
    throw "Google Chrome is not installed."
}

gulp.task('reload-extensions', () =>
  gulp.src(__filename)
      .pipe($.open({app: chrome, uri: config.triggerUri}))
);
