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
var runSequence = require('run-sequence');
var browserSync = require('browser-sync').create();

//  development

gulp.task('browserSync', function() {
    browserSync.init({
        server: "./src",
    });
});
gulp.task('modules:get-css', function() {
    return gulp.src(gnf(), {base:'./'})
    .pipe(gulpIf('*.css', gulp.dest('./src/css/')))
});

gulp.task('modules:css', function() {
    return gulp.src("./src/css/node_modules/**/*.css")
    .pipe(rename(function (path) { path.extname = ".css";}))
    .pipe(gulp.dest("./src/css/modules"));
});

gulp.task('modules:get-scss', function() {
    return gulp.src(gnf(), {base:'./'})
    .pipe(gulpIf('*.scss', gulp.dest('./src/sass/')))
});
gulp.task('modules:scss', function() {
    return gulp.src("./src/sass/node_modules/**/*.scss")
    .pipe(rename(function (path) { path.extname = ".scss";}))
    .pipe(gulp.dest("./src/sass/modules"));
});
gulp.task('modules:get', function (callback) {
    return runSequence('clean:modules','modules:get-css','modules:css','modules:get-scss','modules:scss','clean:node_modules',callback);
});
gulp.task('modules', function (callback) {
    return runSequence('modules:get-css','modules:css','clean:node_modules',callback);
});
gulp.task('sass', function () {
    gulp.src('./src/sass/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
    }))
    .pipe(cssnano())
    .pipe(sourcemaps.write('./'))
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
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulpIf('!*.html', gulp.dest('./dist')))
    .pipe(gulpIf(['*.html','!index.html'], gulp.dest('./dist/pages')))
    .pipe(gulpIf('index.html', gulp.dest('./dist')));
});
gulp.task('images', function(){
    return gulp.src('./src/assets/images/*.+(png|jpg|gif)')
    .pipe(cache(imagemin({
        interlaced: true
    })))
    .pipe(gulp.dest('dist/assets/images'));
});
gulp.task('icons', function() {
    return gulp.src('./src/assets/icons/*')
    .pipe(gulp.dest('dist/assets/icons'));
});
gulp.task('fonts', function() {
    return gulp.src('./src/assets/fonts/*')
    .pipe(gulp.dest('dist/assets/fonts'));
});
gulp.task('clean:dist', function() {
    return del.sync('dist');
});
gulp.task('clean:modules', function() {
    return del.sync('./src/css/modules');
    del.sync('./src/sass/modules');
});
gulp.task('clean:node_modules', function() {
    del.sync('./src/css/node_modules')
    del.sync('./src/css/modules/modularscale-sass')
    del.sync('./src/sass/node_modules')
    del.sync('./src/sass/modules/pills')
    del.sync('./src/sass/modules/pills/dist/pills.min.css')
    del.sync('./src/sass/modules/modularscale-sass/stylesheets/_modular-scale-tests.scss')
    del.sync('./src/sass/modules/modularscale-sass/test-compass/')
    del.sync('./src/sass/modules/modularscale-sass/test-node-sass/');
});

//  sequences

gulp.task('default', function (callback) {
    runSequence('modules',['sass','browserSync','watch'],callback);
});
gulp.task('build', function (callback) {
    runSequence('clean:dist','modules',['sass','useref','images','fonts'],callback);
});
