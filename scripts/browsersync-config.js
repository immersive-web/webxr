/*
 |--------------------------------------------------------------------------
 | Browser-sync config file
 |--------------------------------------------------------------------------
 |
 | For up-to-date information about the options:
 |   http://www.browsersync.io/docs/options/
 |
 | There are more options than you see here, these are just the ones that are
 | set internally. See the website for more info.
 |
 |
 */

const bs = require('browser-sync').create();
const shell = require('shelljs');

const isDev = process.env.NODE_ENV === 'development';

function isEnabled (val) {
  val = val || '';
  return val !== '' && val !== '0' && val !== 'false' && val !== 'off';
}

function getEnvVar (name, defaultVal) {
  return name in process.env ? isEnabled(name) : defaultVal;
}

function runMake (cmd, opts) {
  return new Promise((resolve, reject) => {
    opts = opts || {};
    opts.silent = 'silent' in opts ? opts.silent : false;
    opts.async = 'async' in opts ? opts.async : true;

    const makeChildProcess = shell.exec(`make ${cmd}`, {
      async: opts.async
    });

    makeChildProcess.stdout.on('data', (code, stdout, stderr) => {
      if (typeof stderr !== 'undefined') {
        if (!opts.silent) {
          console.error('Program stderr:\n', stderr);
        }

        reject(stderr);

        return;
      } else if (typeof stdout !== 'undefined') {
        if (!opts.silent) {
          console.log('Program output:\n', stdout);
        }

        resolve(stdout);

        return;
      }

      if (typeof code !== 'undefined') {
        if (!opts.silent) {
          console.log('Exit code:', code);
        }

        resolve(stdout);
      }
    });
  });
}

if (isDev) {
  bs.watch('archive/**,charter/**,spec/**,*.html,*.css,*.js').on('change', bs.reload);

  bs.watch('spec/{latest,1.1}/index.bs', (evt, file) => {
    if (evt !== 'change') {
      return;
    }

    const htmlFile = file.replace(/.bs$/, '.html');

    console.log('Detected change in `%s`', file);
    console.log('Rewriting to `%s` …', htmlFile);

    runMake(htmlFile).then(() => {
      // NOTE: This currently doesn't reload properly because the HTML file
      // gets wiped out during the `make` call, which writes to the HTML file.
      console.log("Reloading `%s`", htmlFile);
      bs.reload();
    }).catch(err => {
      console.warn('Encountered error running `make %s`:', htmlFile, err);
    });
  });
}

module.exports = {
  server: '.',
  files: [
    '**',
    '!*\.{7z,com,class,db,dll,dmg,exe,gitignore,gz,iso,jar,o,log,so,sql,sqlite,tar,zip}',
    '!node_modules'
  ],
  watchOptions: {
    ignoreInitial: true
  },
  port: process.env.BS_PORT || process.env.PORT || 3000,
  open: getEnvVar('BS_OPEN', false),
  notify: getEnvVar('BS_NOTIFY', false),
  tunnel: getEnvVar('BS_TUNNEL', false),
  minify: getEnvVar('BS_MINIFY', false)
};
