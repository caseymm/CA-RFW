import AWS from 'aws-sdk';
import playwright from 'playwright';
import dateFormat from 'dateformat';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// The name of the bucket that you have created
const BUCKET_NAME = 'weather-warnings';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET
});

const now = new Date();
const dateStr = dateFormat(now, "mm-d-yyyy-hhMMss");

async function uploadFile(name, data, ext) {
  // Setting up S3 upload parameters
  const params = {
      Bucket: BUCKET_NAME,
      Key: `${name}.${ext}`, // File name you want to save as in S3
      Body: data,
      Metadata: {
        'Cache-Control': 'no-cache',
      }
  };

  // Uploading files to the bucket
  s3.upload(params, function(err, data) {
      if (err) {
          throw err;
      }
      console.log(`File uploaded successfully. ${data.Location}`);
  });
};

async function useTheData(folder, color){
  // this is where screenshot stuff goes
  const browser = await playwright['chromium'].launch();
  const context = await browser.newContext({
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  await page.setViewportSize({ width: 800, height: 800 });
  await page.goto(`https://caseymm.github.io/mbx-devour/?url=https://weather-warnings.s3.us-west-1.amazonaws.com/${folder}/latest.json&fill=${color}&fill-opacity=.6`);
  try{
    await page.waitForSelector('#hidden', {state: 'attached'});
  } catch(err){
    // try again
    await delay(5000) // waiting 5 seconds
    console.log(`${folder} try again`)
    console.log(`https://caseymm.github.io/mbx-devour/?url=https://weather-warnings.s3.us-west-1.amazonaws.com/${folder}/latest.json&fill=${color}&fill-opacity=.6`)
    await page.goto(`https://caseymm.github.io/mbx-devour/?url=https://weather-warnings.s3.us-west-1.amazonaws.com/${folder}/latest.json&fill=${color}&fill-opacity=.6`);
    await page.waitForSelector('#hidden', {state: 'attached'});
  }
  const screenshot = await page.screenshot();
  await uploadFile(`${folder}/latest-img`, screenshot, 'png');
  await uploadFile(`${folder}/${dateStr}-img`, screenshot, 'png');
  await browser.close();
  return screenshot;
}

export { uploadFile, useTheData }