import gulp from 'gulp'
import requireDir from 'require-dir'

requireDir('./gulp/tasks', { recurse: true });

gulp.task('default', ['auto-rebuild']);
