var gulp = require('gulp')
var browserify = require('browserify')
var babelify = require('babelify')
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var purescript = require('gulp-purescript');

gulp.task('purescript-compile', function () {
    return purescript.compile({ src: [ 'js/**/*.purs',
                                       'bower_components/purescript-*/src/**/*.purs', ] });
});

var b = function() {
    return browserify({
        cache: {},
        packageCache: {},
        entries: ['./js/main.js'],
        debug: false,
        transform: ['babelify']
    });
};

var w = watchify(b());

w.on('log', gutil.log);

var bundle = function(pkg) {
    return pkg.bundle()
              .pipe(source('bundle.js'))
              .pipe(gulp.dest('./dist'));
};

gulp.task('watch', function() {
    bundle(w);
    w.on('update', bundle.bind(null, w));
});

gulp.task('build', ['purescript-compile'], bundle.bind(null, b()));

gulp.task('default', ['watch']);
