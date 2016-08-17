import gulp from 'gulp';
var $ = require('gulp-load-plugins')();

import { autoRebuild as config } from '../config.babel';
import os from 'os';
import runSequence from 'run-sequence';

gulp.task('auto-rebuild', ['build-bower-update'], () =>
  gulp.watch(
    [`${config.base.sourceDirectory}/**/*`],
    ['auto-rebuild-inner']
  )
);

gulp.task('auto-rebuild-inner', (callback) =>
  runSequence(
    'build-sources',
    'reload-extensions',
  callback)
);
