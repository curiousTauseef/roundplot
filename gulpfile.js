var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var babel = require("gulp-babel");

gulp.task("default", function () {
  return gulp.src("src/*.es6")
    .pipe(babel())
    .pipe(gulp.dest("dist"));
});
