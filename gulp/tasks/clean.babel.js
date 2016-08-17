import gulp from 'gulp';
var $ = require('gulp-load-plugins')();

import { clean as config } from '../config.babel';
import del from 'del';

gulp.task('clean', (callback) =>
    del([config.base.targetDirectory], callback)
);
