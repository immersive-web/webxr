// Does the same thing as the make file, but isn't absurdly annoying to get
// running on Windows. ;)

const request = require('request');
const fs = require('fs');

const INPUT_PATH = 'index.bs';
const OUTPUT_PATH = 'index.html';

const BIKESHED_URL = 'https://api.csswg.org/bikeshed/';

function checkErrors() {
  let stream = request.post({
    url: BIKESHED_URL,
    formData: {
      file: fs.createReadStream(INPUT_PATH),
      output: 'err'
    },
  });
  stream.pipe(process.stdout);

  return new Promise((resolve, reject) => {
    stream
      .on('error', err => {
        reject(err);
      }).on('end', () => {
        resolve();
      }).on('finish', () => {
        resolve();
      });
  });
}

function writeOutput() {
  let stream = request.post({
    url: BIKESHED_URL,
    formData: {
      file: fs.createReadStream(INPUT_PATH),
      force: '1'
    },
  });

  return new Promise((resolve, reject) => {
    let tmpPath = OUTPUT_PATH + '_TMP';
    stream.pipe(fs.createWriteStream(tmpPath))
      .on('error', (err) => {
        fs.unlinkSync(tmpPath);
        reject(err);
      }).on('finish', () => {
        fs.rename(tmpPath, OUTPUT_PATH, function (err) {
          if (err)
            reject(err);
          else
            resolve();
        });
      });
  });
}

Promise.all([
  checkErrors(),
  writeOutput()
]).then(() => {
  console.log('\nComplete!');
}).catch((err) => {
  console.error('\nAn error was encountered: ' + err);
});