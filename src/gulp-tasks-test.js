import env from 'gulp-env';
import jest from 'gulp-jest';
import gulpif from 'gulp-if';
import gutil from 'gulp-util';

import gulpOptionsBuilder from './gulp-options-builder';

let watch;

function test(gulp, opts) {
  const options = gulpOptionsBuilder(opts);
  if (watch) {
    process.env.NODE_ENV = 'test';
  }
  if (options.testPaths) {
    console.log(options.testPaths);
    return gulp.src(options.testPaths)
      .pipe(gulpif(!watch, envs))
      .pipe(jest({
        modulePathIgnorePatterns: [
          "<rootDir>/dist/",
          "<rootDir>/templates/"
        ],
        testPathIgnorePatterns: options.testPaths.filter(
          (path) => path.startsWith('!')
        ).map((path) => path.substring(1)),
        rootDir: options.base || process.cwd(),
        verbose: true,
        ...options.argv
      }))
      .on('error', (error) => {
        gutil.log(error.message);
        if (!watch) {
          process.exit(1);
        }
      })
      .pipe(gulpif(!watch, envs.reset));
  }
};

export function testTasks (gulp, opts) {

  const envs = env.set({
    NODE_ENV: 'test'
  });

  const runSequence = require('run-sequence').use(gulp);

  const options = gulpOptionsBuilder(opts);
  gulp.task(test(gulp, opts));

  gulp.task('test:update', () => {
    if (options.testPaths) {
      return gulp.src(options.testPaths)
        .pipe(gulpif(!watch, envs))
        .pipe(jest({
          modulePathIgnorePatterns: [
            "<rootDir>/dist/",
            "<rootDir>/templates/"
          ],
          testPathIgnorePatterns: options.testPaths.filter(
            (path) => path.startsWith('!')
          ).map((path) => path.substring(1)),
          rootDir: options.base || process.cwd(),
          updateSnapshot: true,
          ...options.argv
        }))
        .on('error', (error) => {
          gutil.log(error.message);
          process.exit(1);
        })
        .pipe(gulpif(!watch, envs.reset));
    }
  });

  gulp.task('test:watcher', () =>
    gulp.watch([...options.testPaths, ...options.jsAssets], ['test'])
  );

  gulp.task('test:watch', () => {
    watch = true;
    runSequence('test', 'test:watcher');
  });

  gulp.task('test:coverage', () => {
    if (options.testPaths) {
      return gulp.src(options.testPaths)
        .pipe(envs)
        .pipe(jest({
          collectCoverageFrom: options.jsAssets,
          collectCoverage: true,
          coverageReporters: ['lcov'],
          modulePathIgnorePatterns: [
            "<rootDir>/dist/",
            "<rootDir>/templates/"
          ],
          testPathIgnorePatterns: options.testPaths.filter(
            (path) => path.startsWith('!')
          ).map((path) => path.substring(1)),
          rootDir: options.base || process.cwd(),
          ...options.argv
        }))
        .on('error', (error) => {
          gutil.log(error.message);
          process.exit(1);
        })
        .pipe(envs.reset)
        .on('finish', () => {
          console.log(
            'Test coverage report available at coverage/lcov-report/index.html'
          );
        });
    }
  });
};

export default testTasks;
export { test };
