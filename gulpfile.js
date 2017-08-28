const gulp = require('gulp'),
  argv = require('yargs').argv,
  gulpif = require('gulp-if'),
  sourcemaps = require('gulp-sourcemaps'),
  watch = require('gulp-watch'),
  sass = require('gulp-sass'),
  mmq = require('gulp-merge-media-queries'),
  browserSync = require('browser-sync'),
  reload = browserSync.reload,
  plumber = require('gulp-plumber'),
  notifier = require('node-notifier'),
  gutil = require('gulp-util'),
  rigger = require('gulp-rigger'),
  uglifyjs = require('gulp-uglifyjs'),
  cssnano = require('gulp-cssnano'),
  rename = require('gulp-rename'),
  del = require('del'),
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  mozjpeg = require('imagemin-mozjpeg'),
  cache = require('gulp-cache'),
  postcss = require('gulp-postcss'),
  autoprefixer = require('autoprefixer'),
  sprites = require('postcss-sprites'),
  assets = require('postcss-assets'),
  svgstore = require('gulp-svgstore'),
  svgmin = require('gulp-svgmin'),
  importFile = require('gulp-file-include')

var PRODUCTION = argv.production

var CONFIG = {
  browserSync: {
    server: {
      baseDir: './build'
    },
    host: 'localhost',
    port: 9900,
    logPrefix: 'INDEX.Starter',
    open: false,
    notify: false
  },
  sourcemaps: {
    css: true,
    js: false
  },
  compress: {
    css: false,
    js: false,
    img: false
  }
}

if (PRODUCTION) {
  CONFIG.sourcemaps = {
    css: false,
    js: false
  }
  CONFIG.compress = {
    css: true,
    js: true,
    img: false
  }
}

var PATHS = {
  build: {
    html: 'build/',
    js: 'build/js/',
    css: 'build/css/',
    img: 'build/img/',
    fonts: 'build/fonts/',
    sprites: 'build/img/sprites/',
    svg: 'build/svg/'
  },
  src: {
    html: 'src/pages/*.html',
    js: 'src/media/js/script.js',
    jslibs: 'src/media/js/libs.js',
    style: 'src/media/sass/main.sass',
    img: 'src/media/img/**/*.*',
    fonts: 'src/media/fonts/**/*.*',
    sprites: 'src/media/img/sprites/*.png',
    svg: 'src/media/svg/**/*.svg'
  },
  watch: {
    html: 'src/pages/**/*.html',
    js: 'src/media/js/script.js',
    style: 'src/media/sass/**/*',
    img: 'src/media/img/**/*.*',
    fonts: 'src/media/fonts/**/*.*',
    sprites: 'src/media/img/sprites/*.png',
    svg: 'src/media/svg/**/*.svg'
  },
  clean: './build'
}
var supported = [
    '> 1%',
    'last 5 versions',
    'not ie <= 8'
];

// Запускаем наш локальный сервер из директории './build'
gulp.task('webserver', () => {
  browserSync(CONFIG.browserSync)
})

gulp.task('clean', () => {
  return del.sync(PATHS.clean)
})

gulp.task('html:build', () => {
  gulp.src(PATHS.src.html)
    .pipe(rigger({ tolerant: true }))
    .pipe(gulp.dest(PATHS.build.html))
    .pipe(reload({ stream: true }))
})

gulp.task('style:build', () => {
  var PROCESSORS = [
    autoprefixer({
      browsers: supported
    }),
    assets({
      basePath: 'src/media',
      baseUrl: '../',
      loadPaths: ['img/']
    }),
    sprites({
      stylesheetPath: './src/media/css/',
      spritePath: './src/media/img/sprite.png',
      retina: true,
      outputDimensions: true,
      padding: 4,
      filterBy: (image) => /sprites\/.*\.png$/gi.test(image.url)
    })
  ]

  gulp.src(PATHS.src.style)
    .pipe(plumber({
      errorHandler: function (err) {
        gutil.log(err.message)
        notifier.notify({
          title: 'SASS compilation error',
          message: err.message
        })
      }
    }))
    .pipe(sass({
      outputStyle: 'normal',
      sourceMap: false,
      errLogToConsole: true,
      indentedSyntax: true
    }))
    .pipe(mmq())
    .pipe(postcss(PROCESSORS))
    .pipe(gulpif(PRODUCTION === true, cssnano({
      autoprefixer: {browsers: supported, add: true}
    })))
    .pipe(gulp.dest(PATHS.build.css))
    .pipe(reload({ stream: true }))
})

// Минифицируем изображения и кидаем их в кэш
gulp.task('image:build', () => {
  gulp.src([PATHS.src.img, '!./src/img/sprites/**/*'])
    .pipe(cache(imagemin({
      progressive: true,
      svgoPlugins: [{ removeViewBox: false }],
      use: [
        mozjpeg({
          progressive: true
        }),
        pngquant()
      ],
      interlaced: true
    })))
    .pipe(gulp.dest(PATHS.build.img))
})

gulp.task('svg:build', () => {
  gulp.src(PATHS.src.svg)
    .pipe(svgmin())
    .pipe(rename({ prefix: 'icon-' }))
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest(PATHS.build.svg))
})

gulp.task('fonts:build', () => {
  gulp.src(PATHS.src.fonts)
    .pipe(gulp.dest(PATHS.build.fonts))
})

// Подключаем JS файлы бибилотек из директории 'src/libs/', установленные bower'ом, конкатенируем их и минифицируем
gulp.task('libs:build', () => {
  gulp.src(PATHS.src.jslibs)   // файл, в который импортируются наши библиотеки
    .pipe(importFile({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulpif(PRODUCTION === true, uglifyjs()))
    .pipe(gulp.dest(PATHS.build.js))
})

// Минификация кастомных скриптов JS
gulp.task('script:build', () => {
  gulp.src(PATHS.src.js)
    .pipe(plumber({
      errorHandler: function (err) {
        gutil.log(err.message)
        notifier.notify({
          title: 'JS compilation error',
          message: err.message
        })
      }
    }))
    .pipe(gulpif(PRODUCTION === true, uglifyjs()))
    .pipe(gulp.dest(PATHS.build.js))
    .pipe(reload({ stream: true }))
})

// Собираем наш билд в директорию 'build/'
gulp.task('build', [
  'html:build',
  'style:build',
  'fonts:build',
  'image:build',
  'libs:build',
  'script:build',
  'svg:build'
])

// Следим за изменениями файлов, компилируем их и обновляем страницу/инжектим стили
gulp.task('watch', () => {
  watch([PATHS.watch.html], (event, cb) => gulp.start('html:build'))
  watch([PATHS.watch.style], {readDelay: 100}, (event, cb) => gulp.start('style:build'))
  watch([PATHS.watch.js], (event, cb) => gulp.start('script:build'))
  watch([PATHS.watch.img], (event, cb) => gulp.start('image:build'))
  watch([PATHS.watch.svg], (event, cb) => gulp.start('svg:build'))
  watch([PATHS.watch.fonts], (event, cb) => gulp.start('fonts:build'))
})

gulp.task('default', ['build', 'watch', 'webserver'])

gulp.task('pro', ['clean', 'build'])
