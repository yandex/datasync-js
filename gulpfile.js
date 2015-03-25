var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    wrapper = require('gulp-wrapper'),
    concat = require('gulp-concat'),
    del = require('del'),
    rename = require('gulp-rename'),
    queue = require('streamqueue');

gulp.task('debug', function () {
    return queue({ objectMode: true },
            gulp.src('src/intro.js'),
            gulp.src(['node_modules/ym/modules.js'])
                .pipe(wrapper({
                    header: '(function(ns){var module = { exports: {} }, exports = {};\n',
                    footer: '\nns.modules = module.exports; })(ns);\n'
                })
            ),
            gulp.src(['node_modules/vow/lib/vow.js'])
                .pipe(wrapper({
                    header: '(function (ns) {\nvar module = { exports: {} }, exports = {};\n',
                    footer: "\nns.vow = module.exports; ns.modules.define('vow', function (provide) { provide(ns.vow); }); })(ns);\n"
                })
            ),
            gulp.src('src/*/**/*.js'),
            gulp.src('src/outro.js')
        )
        .pipe(concat('cloud-data-sync-api.js'))
        .pipe(wrapper({
            header: '(function (global) {',
            footer: '})(this);'
        }))
        .pipe(gulp.dest('./build/'))
        .on('end', function () {
            del.sync(['build/vow.js', 'build/modules.js']);
        });
});

gulp.task('release', ['debug'], function () {
    return gulp.src('build/cloud-data-sync-api.js')
        .pipe(uglify())
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(gulp.dest('./build/'));
});

gulp.task('default', ['debug', 'release']);

gulp.task('watch', ['debug'], function () {
    gulp.watch('src/**/*.js', ['debug']);
});

gulp.task('clean', function (callback) {
    del(['build/cloud-data-sync-api*.js'], callback);
});