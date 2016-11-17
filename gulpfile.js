'use strict';

var gulp = require('gulp');
var gutil = require( 'gulp-util' );
var gnf = require('gulp-npm-files');
var rename = require("gulp-rename");
var sass = require('gulp-sass');
var cssnano = require('gulp-cssnano');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var useref = require('gulp-useref');
var gulpIf = require('gulp-if');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var ftp = require( 'vinyl-ftp' );
var del = require('del');
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var browserSync = require('browser-sync').create();

//  development

gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: "./src",
            routes: {
                "/node_modules": "node_modules",
                "/browser-sync": "browser-sync"
            }
        }
    });
});
gulp.task('sass', function () {
    gulp.src('./src/sass/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
    }))
    // .pipe(cssnano())
    .pipe(rename("main.min.css"))
    // .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./src/css/'))
    .pipe(browserSync.reload({
        stream: true
    }));
});
gulp.task('watch', ['browserSync', 'sass'], function () {
    gulp.watch('./src/sass/**/*.scss', ['sass'])
    gulp.watch('./src/*.html', browserSync.reload)
    gulp.watch('./src/pages/*.html', browserSync.reload)
    gulp.watch('./src/js/**/*.js', browserSync.reload)
});

//  production

gulp.task('clear:cache', function (callback) {
    return cache.clearAll(callback);
});
gulp.task('useref', function(){
    return gulp.src(['./src/pages/*.html','./src/index.html'])
    .pipe(useref({ searchPath: ['./','./src'] }))
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulpIf('!*.html', gulp.dest('./public_html')))
    .pipe(gulpIf(['*.html','!index.html'], gulp.dest('./public_html/pages')))
    .pipe(gulpIf('index.html', gulp.dest('./public_html')));
});
gulp.task('images', function(){
    return gulp.src('./src/assets/img/**/*.+(png|jpg|gif)')
    .pipe(cache(imagemin({
        interlaced: true
    })))
    .pipe(gulp.dest('public_html/assets/img'));
});
gulp.task('icons', function() {
    return gulp.src('./src/assets/icons/*')
    .pipe(gulp.dest('public_html/assets/icons'));
});
gulp.task('favicon', function() {
    return gulp.src('./src/favicon.ico')
    .pipe(gulp.dest('public_html'));
});
gulp.task('fonts', function() {
    return gulp.src('./src/assets/fonts/*')
    .pipe(gulp.dest('public_html/assets/fonts'));
});
gulp.task('clean:dist', function() {
    return del.sync('public_html');
});

//  sequences

gulp.task('default', function (callback) {
    runSequence('clear:cache',['sass','browserSync','watch'],callback);
});
gulp.task('build', function (callback) {
    runSequence('clean:dist',['sass','useref','images','icons','favicon','fonts'],callback);
});

// gulp.task('deploy', require('./glp/deploy')(gulp, plugins));
