const gulp = require('gulp');
const polybuild = require('polybuild');
const zip = require('gulp-zip');
const util = require('gulp-util');
const clean = require('gulp-clean');

var zipName = 'chrome-twrm.zip',
    buildDir = 'build',
    polymerDeps = [
        'src/html/*.html',
        'src/html/**/*.html'
    ],
    polymerJsDeps = [
        'src/js/*.js'
    ],
    bowerDeps = [
        "bower_components/jquery/dist/jquery.min.js",
        "bower_components/jqueryui/ui/version.js",
        "bower_components/jqueryui/ui/position.js"
    ],
    otherDeps = [
        'src/css/*.css'
    ];

gulp.task('clean', function () {
    return gulp.src(buildDir + '/*', {read: false})
        .pipe(clean());
});

gulp.task('build-polymer', function () {
    return gulp.src(polymerDeps)
        .pipe(polybuild())
        .pipe(gulp.dest(buildDir))
        .on('end', function () {
        });
});

gulp.task('build-dep-bower', function () {
    return gulp.src(bowerDeps)
        .pipe(gulp.dest(buildDir));
});

gulp.task('build-dep-other', function () {
    return gulp.src(otherDeps)
        .pipe(gulp.dest(buildDir));
});

gulp.task('build', ['build-polymer', 'build-dep-bower', 'build-dep-other']);

gulp.task('bundle', ['build'], function () {
    // gulp.src(['manifest.json', 'bower_components/*', 'build/*', 'res/*'])
    return gulp.src(['manifest.json', buildDir + '/*', 'src/js/*', 'res/*', 'res/**/*'], {base: '.'})
        .pipe(zip(zipName))
        .pipe(gulp.dest(util.env.path ? util.env.path : '.'))
    ;
});
gulp.task('watch', function () {
    gulp.watch(polymerDeps, ['build-polymer']);
    gulp.watch(polymerJsDeps, ['build-polymer']);
    gulp.watch(bowerDeps, ['build-dep-bower']);
    gulp.watch(otherDeps, ['build-dep-other']);
});