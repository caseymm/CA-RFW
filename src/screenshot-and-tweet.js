import fetch from 'node-fetch';
import twitter from 'twitter-lite';
import { useTheData } from './actions.js';

const client = new twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,  
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,  
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,  
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
const uploadClient = new twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,  
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,  
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,  
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  subdomain: "upload"
});

const formatCounties = (counties) => {
  if(counties.length === 1){
    return `${counties[0]} county`;
  } else if (counties.length === 2){
    return `${counties.join(' and ')} counties`;
  } else if (counties.length >  2){
    counties[counties.length - 1] = `and ${counties[counties.length - 1]}`;
    return `${counties.join(', ')} counties`;
  }
}

async function screenshotAndTweet(){
  const folder = 'ca-rfw';
  const color = 'e60000';
  let message = '';

  const metadataFileUrl = `https://weather-warnings.s3.amazonaws.com/ca-rfw/metadata.json`;
  const metadataRespLatest = await fetch(metadataFileUrl);
  const metadataLatest = await metadataRespLatest.json();

  if(metadataLatest.updated && metadataLatest.counties.length > 0){
    message += `🚩 Red flag warning 🚩 issued for ${formatCounties(metadataLatest.counties)}`;
    if(metadataLatest.cleared.length > 0){
      message += `\n\n🆗 Red flag warnings cleared for ${formatCounties(metadataLatest.cleared)}`;
    }
    useTheData(folder, color).then(img => {
      uploadClient.post('media/upload', { media_data: img.toString('base64') }).then(result => {
        const status = {
          status: message,
          media_ids: result.media_id_string
        }
        client.post('statuses/update', status).then(result => {
          console.log('You successfully tweeted this : "' + result.text + '"');
        }).catch(console.error);
      }).catch(console.error);
    });
  } else {
    return;
  }
}

screenshotAndTweet();