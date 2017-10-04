const gulp = require('gulp');
const min = require('gulp-minify')

gulp.task('compile-js', function () {

    gulp.src(['src/**/*.js'])
        .pipe(min({
            ext: '.min.js'
        }))
        .pipe(gulp.dest('dist/'))
})
