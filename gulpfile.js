const gulp = require('gulp');
const polybuild = require('polybuild');
const zip = require('gulp-zip');
const util = require('gulp-util');
const clean = require('gulp-clean');
const mergeStream = require('merge-stream');
const concat = require('gulp-concat');

var INDENT = '    ';
var BUILD_NAME_POLYMER_HTML = 'Polymer html';
var BUILD_NAME_POLYMER_DEPS = 'Polymer deps';
var BUILD_NAME_MANIFEST = 'Manifest';

var zipName = 'chrome-twrm.zip',
    buildDir = 'build',
    polymerHtml = [
        'src/html/*.html'
        // 'src/html/**/*.html'
    ],
    polymerDeps = {
        "src/html/bulk.html": [
            'src/js/configure.js',
            'src/js/bulk.js',
            'src/html/elements/bulk-form.html'
        ],
        "src/html/options.html": [
            'src/js/configure.js',
            'src/js/options.js',
            'src/html/elements/options-form.html'
        ],
        "src/html/overview.html": [],
        "src/html/popup.html": [
            'src/js/configure.js',
            'src/js/configure.js',
            'src/js/utils.js',
            'src/js/RedmineApi.js',
            'src/js/RedmineIssueForm.js',
            'src/js/popup-polymer.js',
            'src/html/elements/issue-wizard.html',
            'src/html/elements/issue-preview.html'

        ]
    },
    manifestDeps = {
        "background": [
            "bower_components/jquery/dist/jquery.min.js",
            'src/js/background.js',
            'src/js/configure.js'
        ],
        "tw_sd": [
            "bower_components/jquery/dist/jquery.min.js",
            "bower_components/jqueryui/ui/version.js",
            "bower_components/jqueryui/ui/position.js",
            "src/js/RedmineApi.js",
            "src/js/IssueTooltip.js",
            "src/js/TwCrawler.js",
            "src/js/utils.js",
            "src/js/configure.js",
            "src/js/tw_sd_inject.js",

            "src/css/issue_tooltip.css"
        ],
        "redmine": [
            "bower_components/jquery/dist/jquery.min.js",
            "src/js/utils.js",
            "src/js/configure.js",
            "src/js/rm_inject.js"
        ],
        "tw_search_bar": [
            "bower_components/jquery/dist/jquery.min.js",
            "src/js/configure.js",
            "src/js/tw_inject.js",
            "src/css/search_bar.css"
        ],
        "minimal_redmine": [
            "src/css/minimal_redmine.css"
        ]

    };

function flatdeps(where) {
    var flat = [];
    for (var k in where) {
        flat = flat.concat(where[k]);
    }
    return flat.filter(function (item, pos, self) {
        return self.indexOf(item) == pos;
    });
}

function findRelatedBundles(where, file) {
    var bundles = [];
    for (var k in where) if (where.hasOwnProperty(k)) {
        var normalizedFile = file.replace(__dirname, "").replace(/\\/g, "/").replace(/^\//, "");

        if (where[k].indexOf(normalizedFile) >= 0) {
            bundles.push(k);
        }
    }
    return bundles;
}

function buildPolymerHtmls(files, onEnd) {
    return gulp.src(files)
        .pipe(polybuild())
        .pipe(gulp.dest(buildDir))
        .on('end', onEnd ? onEnd : function(){});
}

function buildBundleConcat(name, files){
    var css = files.filter(function(v){ return v.match(/\.css$/) && !v.match(/\.min\./); });
    var js = files.filter(function(v){ return v.match(/\.js$/) && !v.match(/\.min\./); });
    var copy = files.filter(function(v){ return v.match(/\.min\./); });

    console.log(name, 'bundle build: css', css, 'js', js, 'copy', copy);

    var streams = mergeStream();
    if (css.length) {
        streams.add(gulp.src(css)
            .pipe(concat(name + '.css'))
            .pipe(gulp.dest(buildDir)));
    }
    if (js.length) {
        streams.add(gulp.src(js)
            .pipe(concat(name + '.js'))
            .pipe(gulp.dest(buildDir)));
    }
    if (copy.length) {
        streams.add(gulp.src(copy)
            .pipe(gulp.dest(buildDir)));
    }

    return streams;
}

function buildManifest(bundles) {
    var streams = mergeStream();
    for (var k in bundles) {
        var files = manifestDeps[bundles[k]] || manifestDeps[k];
        var name = manifestDeps[bundles[k]] ? bundles[k] : k;
        streams.add(buildBundleConcat(name, files));
    }
    return streams;
}

function measureTime() {
    var now = (new Date().getTime())/1000;

    return function(){
        return (new Date().getTime()) / 1000 - now;
    };
}

gulp.task('clean', function () {
    return gulp.src(buildDir + '/*', {read: false})
        .pipe(clean());
});
gulp.task('build-polymer', function(){
    return buildPolymerHtmls(polymerHtml);
});

gulp.task('build-manifest', function () {
    return buildManifest(manifestDeps);
});

gulp.task('build', ['build-polymer', 'build-manifest']);

gulp.task('bundle', ['build'], function () {
    // gulp.src(['manifest.json', 'bower_components/*', 'build/*', 'res/*'])
    return gulp.src(['manifest.json', buildDir + '/*', 'res/*', 'res/**/*'], {base: '.'})
        .pipe(zip(zipName))
        .pipe(gulp.dest(util.env.path ? util.env.path : '.'))
    ;
});
gulp.task('watch', function () {
    gulp.watch(polymerHtml, function(event){
        console.log(BUILD_NAME_POLYMER_HTML + ': File ' + event.path + ' was ' + event.type);
        var time = measureTime();

        try {
            buildPolymerHtmls([event.path], function(){
                console.log(INDENT + BUILD_NAME_POLYMER_HTML + ': done after ' + time());
            })
        } catch (e) {
            console.log(INDENT + BUILD_NAME_POLYMER_HTML + ': error:', e);
        }
    });

    gulp.watch(flatdeps(manifestDeps), function(event){
        console.log(BUILD_NAME_MANIFEST + ': File ' + event.path + ' was ' + event.type);

        var bundles = findRelatedBundles(manifestDeps, event.path);
        console.log(INDENT + BUILD_NAME_MANIFEST + ': Rebuilding', bundles);

        try {
            buildManifest(bundles);
        } catch (e) {
            console.log(INDENT + BUILD_NAME_MANIFEST + ': error:', e);
        }
    });

    gulp.watch(flatdeps(polymerDeps), function(event){
        console.log(BUILD_NAME_POLYMER_DEPS + ': File ' + event.path + ' was ' + event.type);
        var time = measureTime();

        var bundles = findRelatedBundles(polymerDeps, event.path);
        console.log(INDENT + BUILD_NAME_POLYMER_DEPS + ': Rebuilding', bundles);

        try {
            buildPolymerHtmls(bundles, function(){
                console.log(INDENT + BUILD_NAME_POLYMER_DEPS + ': done after ' + time());
            });
        } catch (e) {
            console.log(INDENT + BUILD_NAME_POLYMER_DEPS + ': error:', e);
        }
    });
});