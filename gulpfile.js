var gulp = require('gulp')
var browserify = require('browserify')
var babelify = require('babelify')
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
const mocha = require('gulp-mocha');

var b = function() {
    return browserify({
        cache: {},
        packageCache: {},
        entries: ['./js/main.js'],
        debug: false,
        transform: ['babelify', 'uglifyify']
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


gulp.task('test', () =>
    gulp.src('./test/*.js', {read: false})
	.pipe(mocha({ timeout: 20000 }))
);

gulp.task('build', bundle.bind(null, b()));

gulp.task('default', ['watch']);
