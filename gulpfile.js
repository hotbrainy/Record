'use strict';
// External Libs
var fs          = require('fs');
var mkdirp      = require('mkdirp');
var url         = require('url');
var gulp        = require('gulp');
var $           = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload      = browserSync.reload;
var runSequence = require('run-sequence');
var _           = require('lodash');
var Q           = require('q');

// Project Files
var manifest = require('tasks/manifest');

var secrets = JSON.parse(
  fs.readFileSync(`${__dirname}/config/secrets.json`)
);
var config = {
  dest: { root: `${__dirname}/build` },
  src: { root: `${__dirname}/app` },
  env: {
    production: process.env.NODE_ENV === 'production',
    firebase: {
      location: "https://record.firebaseio.com/",
      secret: secrets.firebase
    },
    backupKey: secrets.backupKey
  }
};
config.dest.js       = `${config.dest.root}/js`;
config.dest.style    = `${config.dest.root}/css`;
config.dest.manifest = `${config.dest.root}/manifest.json`;
config.src.js        = `${config.src.root}/js`;
config.src.style     = `${config.src.root}/style`;
config.src.main      = `${config.src.js}/main.jsx`;

var crypto = require('crypto');
config.env.algo = 'aes-256-ctr';

var encrypt = function(txt) {
  var cipher = crypto.createCipher(config.env.algo, config.env.backupKey);
  var crypted = cipher.update(txt, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
};
var decrypt = function(hash) {
  var decipher = crypto.createDecipher(config.env.algo, config.env.backupKey);
  var dec = decipher.update(hash, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

gulp.task('js', function () {
  return gulp.src(config.src.main, {read: false})
    .pipe( $.plumber({
      errorHandler: $.notify.onError("Err: <%= error.message %>")
    }) )
    .pipe( $.browserify({ debug: !config.env.production }) )
    .pipe( $.if(config.env.production, $.uglify({
      compress: {
        drop_console: true,
        dead_code: true
      }, screw_ie8: true
    })) )
    .pipe( $.rename('build.js') )
    .pipe( gulp.dest(config.dest.js) )
    .pipe( $.if(config.env.production, $.rev()) )
    .pipe( $.if(config.env.production, gulp.dest(config.dest.js)) )
    .pipe( $.if(config.env.production, $.rev.manifest({
      base: config.src.root,
      merge: true,
      path: config.dest.manifest
    })) )
    .pipe( $.if(config.env.production, gulp.dest(config.dest.root)) );
});

gulp.task('less', function() {
  var autoprefixer = require('autoprefixer-core');
  var processors = [autoprefixer({
    browsers: ['last 2 versions']
  })]
  if (config.env.production) {
    processors.push(require('css-mqpacker'));
    processors.push(require('csswring'));
  }

  gulp.src(`${config.src.style}/material-ui.less`)
    .pipe( $.less() )
    .pipe( $.postcss(processors) )
    .pipe( gulp.dest(config.dest.style) )
    .pipe( reload({stream: true }) )
    .pipe( $.if(config.env.production, $.rev()))
    .pipe( $.if(config.env.production, gulp.dest(config.dest.style)) )
    .pipe( $.if(config.env.production, $.rev.manifest({
      base: config.src.root,
      merge: true,
      path: config.dest.manifest
    })) )
    .pipe( $.if(config.env.production, gulp.dest(config.dest.root)) );
});

gulp.task('styles', function() {
  var autoprefixer = require('autoprefixer-core');
  var processors = [autoprefixer({
    browsers: ['last 2 versions']
  })]
  if (config.env.production) {
    processors.push(require('css-mqpacker'));
    processors.push(require('csswring'));
  }

  return gulp.src(`${config.src.style}/master.styl`)
    .pipe( $.if(!config.env.production, $.sourcemaps.init()) )
    .pipe( $.stylus() )
    .pipe( $.if(!config.env.production, $.sourcemaps.write()) )
    .pipe( $.postcss(processors) )
    .pipe( gulp.dest(config.dest.style) )
    .pipe( reload({stream: true}) )
    .pipe( $.if(config.env.production, $.rev()))
    .pipe( $.if(config.env.production, gulp.dest(config.dest.style)) )
    .pipe( $.if(config.env.production, $.rev.manifest({
      base: config.src.root,
      merge: true,
      path: config.dest.manifest
    })) )
    .pipe( $.if(config.env.production, gulp.dest(config.dest.root)) );
});

gulp.task('html', function (cb) {
  $.util.log(manifest(config.dest.manifest));
  return gulp.src(config.src.root + '/views/layout.jade')
    .pipe( $.jade({
      locals: _.assign({},
                       { production: config.env.production },
                       manifest(config.dest.manifest)),
      pretty: !config.env.production
    }) )
    .pipe( $.rename('index.html') )
    .pipe( gulp.dest(config.dest.root) )
    .pipe( $.rename('404.html') ) // redirect for gh-pages
    .pipe( gulp.dest(config.dest.root) )
});

gulp.task('extras', function() {
  return gulp.src(`${__dirname}/config/CNAME`)
    .pipe(gulp.dest(config.dest.root));
});
gulp.task('imgs', function() {
  return gulp.src(`${config.src.root}/img/**/*`)
    .pipe(gulp.dest(`${config.dest.root}/img`));
});

gulp.task('clean', function (cb) {
  return require('del')([config.dest.root], cb);
});

gulp.task('size', function () {
  return gulp.src(`${config.dest.root}/**/*`)
    .pipe( $.size({
      title: 'Build',
      gzip: 'True'
    }) );
});

gulp.task('build', function(cb) {
  return runSequence('clean',
              ['styles', 'less', 'js', 'extras', 'imgs'],
              'html',
              'size'
         , cb);
});

gulp.task('serve', ['build'], function() {
  var historyApiFallback = require('connect-history-api-fallback');
  browserSync({
    port: 9000,
    server: {
      baseDir: [config.dest.root],
      middleware: [historyApiFallback]
    }
  });

  gulp.watch("**/*.jade", ['html']);
  gulp.watch("**/*.styl", ['styles']);
  gulp.watch("**/*.less", ['less']);
  gulp.watch("app/img/**/*", ['imgs', reload]);
  gulp.watch([
    "app/**/*.js",
    "app/**/*.jsx",
    "lib/**/*.js"
  ], ['js', reload]);
});

gulp.task('deploy', ['build', 'firebase:backup'], function(cb) {
  var ghPages = require('gh-pages');
  return ghPages.publish(config.dest.root, cb);
});

var ref = null;
var firebaseLogin = function() {
  var Firebase = require('firebase');
  ref = new Firebase(config.env.firebase.location);
  return Q.Promise(function(resolve, reject) {
    ref.authWithCustomToken(config.env.firebase.secret, function(err, data) {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

gulp.task('firebase:backup', function(cb) {
  if (!config.env.backupKey) {
    $.util.log("No backup key found in secrets.json. Skipping backup");
    return cb();
  }
  var git = require('simple-git');
  return firebaseLogin().then( function(data) {
    return Q.Promise(function(resolve) {
      ref.on('value', function(snap) {
        mkdirp.sync(`${__dirname}/backups`);
        var backups = fs.readdirSync(`${__dirname}/backups`);
        var val = JSON.stringify(snap.val());
        var filename = `${__dirname}/backups/${(new Date()).toGMTString()}.backup`
        fs.writeFileSync(filename, encrypt(val), 'utf8');
        Q.all(backups.map( function(b) {
          var _deferred = Q.defer();
          fs.readFile(`${__dirname}/backups/${b}`, {encoding: 'utf8'}, function(err, buf) {
            var backup = /(\.backup)$/.test(b) ? JSON.stringify(JSON.parse(decrypt(buf))) : '';
            if (val === backup) {
              var backupFile = `${__dirname}/backups/${b}`;
              fs.unlink(backupFile, function(err) {
                $.util.log("Removed identical backup: ", b);
                _deferred.resolve(backupFile);
              });
            } else {
              _deferred.resolve(null);
            }
          });
          return _deferred.promise;
        })).done( function(files) {
          var files = _.compact(files).concat(filename).map( function(f) {
            return f.split(__dirname)[1].slice(1);
          });
          var spaceRestore = function(s) {
            return s.replace(/,/g, ' ').replace(/\s{2}/g, ', ').replace(/\"/g, '');
          };
          var notAdded, deleted;
          git().status(function(err, st) {
            notAdded = st.not_added.map( spaceRestore );
            deleted = st.deleted.map( spaceRestore );
            files = _.filter(files, function(ff) {
              return _.includes(notAdded + deleted, ff);
            });
          })
          .then( function() {
            git().add(files)
              .commit(`Backup @ ${(new Date()).toGMTString()}`, files)
              .then(function() {
                $.util.log('Comitted backup to git');
                resolve();
              });
          });
        });
      });
    });
  });
});

gulp.task('firebase:rebuild', ['firebase:backup'], function() {
  return firebaseLogin().then(function(data) {
    var localData = JSON.parse(fs.readFileSync(`${__dirname}/data.json`));
    return Q.ninvoke(ref.set, localData);
  });
});

gulp.task('firebase:rollback', function() {
  var argv = require('minimist')(process.argv.slice(2));
  return firebaseLogin().then(function(data) {
    return Q.Promise(function(resolve) {
      var backups = fs.readdirSync(`${__dirname}/backups`);
      var sorted = _.sortBy(backups, function(b) {
        return -(new Date(b.split('.')[0]));
      });
      var steps = argv.steps ? parseInt(argv.steps) : 0
      var last = JSON.parse(
        decrypt(
          fs.readFileSync(`${__dirname}/backups/${sorted[steps]}`).toString()
        )
      );
      ref.set(last, function(err) {
        resolve(sorted);
      });
    });
  });
});

/*
 * Primary method for creating new users
 * args:
 *  --email
 *  --password
 *  --first-name
 *  --last-name (optional)
 *  --admin (optional)
 *  --edit (optional)
 */
gulp.task('firebase:createuser', function(cb) {
  var argv = require('minimist')(process.argv.slice(2));
  firebaseLogin.then( function(data) {
    ref.createUser({
      email: argv.email,
      password: argv.password
    }, function(err, userData) {
      if (err) {
        switch (err.code) {
          case "EMAIL_TAKEN":
            $.util.log("The new user account cannot be created because the email is already in use.");
          break;
          case "INVALID_EMAIL":
            $.util.log("The specified email is not a valid email.");
          break;
          default:
            $.util.log("Error creating user:", err);
          cb();
        }
      } else {
        $.util.log("Successfully created user account with uid:", userData.uid);
        ref.child(`users/${userData.uid}`).set({
          admin: !!argv.admin,
          email: argv.email,
          firstName: argv['first-name'],
          lastName: argv['last-name'],
          provider: 'password',
          createdOn: (new Date).toJSON()
        }, function(err) {
          if (err) {
            $.util.log("Error setting user data");
            cb();
          } else {
            $.util.log("User data has been set");
            cb();
          }
        })
      }
    })
  })
});

gulp.task('firebase:security', function(cb) {
  var https = require('https');
  var rules = fs.readFileSync(`${__dirname}/rules.json`);
  var options = {
    hostname: config.env.firebase.location,
    path: `security?auth?=${config.env.firebase.secret}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/JSON',
      'Content-length': rules.length
    }
  }

  var req = http.request(options, function(res) {
    $.util.log('STATUS: ' + res.statusCode);
    $.util.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      $.util.log('BODY: ' + chunk);
    });
  })

  req.on('error', function(e) {
    $.util.log('problem with request: ' + e.message);
  });

  req.write(rules);
  req.end();
});
