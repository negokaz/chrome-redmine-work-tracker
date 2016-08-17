import gulp from 'gulp';
var $ = require('gulp-load-plugins')();

import { dist as config } from '../config.babel';
import { build as buildConfig } from '../config.babel';
import polybuild from 'polybuild';
import runSequence from 'run-sequence';

gulp.task('dist', (callback) =>
  runSequence(
    'clean',
    'build',
    'dist-package',
  callback)
);

// FIXME: 相対パスやめる
var manifest = require(`../../${buildConfig.manifest.directory}/${buildConfig.manifest.fileName}`);
var zipFileName = `${manifest.name}-v${manifest.version}.zip`;

gulp.task('dist-package', () => {
  gulp.src(`${buildConfig.buildDirectory}/**/*`)
      .pipe($.zip(zipFileName))
      .pipe(gulp.dest(config.base.targetDirectory));
  $.util.log(`Created package: ${config.base.targetDirectory}/${zipFileName}`);
});
