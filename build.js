// Does the same thing as the make file, but isn't absurdly annoying to get
// running on Windows. ;)

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { promisify } = require('util');

const INPUT_PATH = 'index.bs';
const OUTPUT_PATH = 'index.html';

const BIKESHED_URL = 'https://api.csswg.org/bikeshed/';
const REQUEST_TIMEOUT = 30000; // 30 seconds timeout

const rename = promisify(fs.rename);
const unlink = promisify(fs.unlink);

async function checkErrors() {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(INPUT_PATH));
    formData.append('output', 'err');

    const response = await axios.post(BIKESHED_URL, formData, {
      headers: formData.getHeaders(),
      timeout: REQUEST_TIMEOUT,
      responseType: 'text'
    });

    if (response.data && response.data.trim()) {
      console.log('Bikeshed errors/warnings:');
      console.log(response.data);
      return response.data;
    }
    
    return null;
  } catch (error) {
    throw new Error(`Error checking Bikeshed errors: ${error.message}`);
  }
}

async function writeOutput() {
  const tmpPath = OUTPUT_PATH + '_TMP';
  
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(INPUT_PATH));
    formData.append('force', '1');

    const response = await axios.post(BIKESHED_URL, formData, {
      headers: formData.getHeaders(),
      timeout: REQUEST_TIMEOUT,
      responseType: 'stream'
    });

    // Write to temporary file
    const writeStream = fs.createWriteStream(tmpPath);
    response.data.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      response.data.on('error', reject);
    });

    // Atomically move temp file to final location
    await rename(tmpPath, OUTPUT_PATH);
    
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await unlink(tmpPath);
    } catch (unlinkError) {
      // Ignore unlink errors
    }
    throw new Error(`Error writing output: ${error.message}`);
  }
}

async function main() {
  try {
    console.log('Starting Bikeshed build process...');
    
    // First check for errors
    const errors = await checkErrors();
    
    // Only proceed if no critical errors
    if (errors && errors.includes('FATAL ERROR')) {
      throw new Error('Fatal errors found, aborting build');
    }
    
    // Generate the output
    await writeOutput();
    
    console.log('\n✅ Build completed successfully!');
    console.log(`📄 Generated: ${OUTPUT_PATH}`);
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();