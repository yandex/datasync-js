var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    wrapper = require('gulp-wrapper'),
    concat = require('gulp-concat'),
    del = require('del'),
    rename = require('gulp-rename'),
    queue = require('streamqueue'),
    eslint = require('gulp-eslint'),
    eslintRules = require('fs').readFileSync('.eslintrc.json');

gulp.task('debug', function () {
    return queue({ objectMode: true },
            gulp.src('src/intro.js'),
            gulp.src(['node_modules/ym/modules.js'])
                .pipe(wrapper({
                    header: '/* eslint-disable */(function(ns){var module = { exports: {} }, exports = {};\n',
                    footer: '\nns.modules = module.exports; })(ns);\n/* eslint-enable */'
                })
            ),
            gulp.src(['node_modules/vow/lib/vow.js'])
                .pipe(wrapper({
                    header: '/* eslint-disable */(function (ns) {\nvar module = { exports: {} }, exports = {};\n',
                    footer: "\nns.Promise = module.exports.Promise; ns.modules.define('Promise', function (provide) { provide(ns.Promise); }); })(ns);\n/* eslint-enable */"
                })
            ),
            gulp.src(['node_modules/localforage/dist/localforage.nopromises.js'])
                .pipe(wrapper({
                    header: '/* eslint-disable */(function (ns) {\nvar module = { exports: {} }, exports = {}, Promise = ns.Promise;\n',
                    footer: "\nvar localForage = module.exports;\nns.modules.define('localForage', [], function (provide) { provide(localForage); }); })(ns);/* eslint-enable */\n"
                })
            ),
            gulp.src('src/*/**/*.js'),
            gulp.src('src/outro.js')
        )
        .pipe(concat('cloud-data-sync-api.js'))
        .pipe(wrapper({
            header: '(function (global) {\n',
            footer: '\n})(this);'
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

gulp.task('debug.stripped', function () {
    return queue({ objectMode: true },
            gulp.src('src/intro-stripped.js'),
            gulp.src(['node_modules/localforage/dist/localforage.nopromises.js'])
                .pipe(wrapper({
                        header: '/* eslint-disable */(function (ns) {\nvar module = { exports: {} }, exports = {}, Promise = ns.Promise;\n',
                        footer: "\nvar localForage = module.exports;\nns.modules.define('localForage', [], function (provide) { provide(localForage); }); })(ns);\n/* eslint-enable */"
                    })
                ),
            gulp.src('src/*/**/*.js'),
            gulp.src('src/outro.js')
        )
        .pipe(concat('cloud-data-sync-api.stripped.js'))
        .pipe(wrapper({
            header: '(function (global) {\n',
            footer: '\n})(this);'
        }))
        .pipe(gulp.dest('./build/'));
});

gulp.task('release.stripped', ['debug.stripped'], function () {
    return gulp.src('build/cloud-data-sync-api.stripped.js')
        .pipe(uglify())
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(gulp.dest('./build/'));
});

gulp.task('eslint', function () {
    return gulp.src('src/*/**/*.js')
        .pipe(eslint(eslintRules))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('default', ['debug', 'debug.stripped', 'release', 'release.stripped']);

gulp.task('watch', ['debug'], function () {
    gulp.watch('src/**/*.js', ['debug']);
});

gulp.task('clean', function (callback) {
    del(['build/cloud-data-sync-api*.js'], callback);
});
