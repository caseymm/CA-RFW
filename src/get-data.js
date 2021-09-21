import fetch from 'node-fetch';
import twitter from 'twitter-lite';
import dateFormat from 'dateformat';
import centroid from '@turf/centroid';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { uploadFile } from './actions.js';
import { california } from './shapes/california.js';
import { ca_counties } from './shapes/ca_counties.js';
import { test_json } from './shapes/test-rfw.js';

const now = new Date();
const dateStr = dateFormat(now, "mm-d-yyyy-hhMMss");

const client = new twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,  
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,  
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,  
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const CA_SHAPE = california.features[0];

async function getLatestRFW(){

  let fc = {
    "type": "FeatureCollection",
    "features": []
  };

  let metadata = {
    'updated': false,
    'counties': [],
    'cleared': []
  }

  const metadataFileUrl = `https://weather-warnings.s3.amazonaws.com/ca-rfw/metadata.json`;
  const metadataRespLatest = await fetch(metadataFileUrl);
  const metadataLatest = await metadataRespLatest.json();

  const fullRFWFileUrl = `https://weather-warnings.s3.amazonaws.com/rfw/latest.json`;
  const fullRFWRespLatest = await fetch(fullRFWFileUrl);
  const fullRFWJsonLatest = await fullRFWRespLatest.json();

  const latestFileUrl = `https://weather-warnings.s3.amazonaws.com/ca-rfw/latest.json`;
  const respLatest = await fetch(latestFileUrl);
  const jsonLatest = await respLatest.json();

  fullRFWJsonLatest.features.forEach(f => {
    const center = centroid(f);
    // is it in CA?
    if(booleanPointInPolygon(center, CA_SHAPE)){
      fc.features.push(f);
      // which county is it in?
      ca_counties.features.forEach(county => {
        if(booleanPointInPolygon(center, county)){
          metadata.counties.push(county.properties['NAME'])
        }
      })
    }
  });

  // if what we just pulls doesn't equal the lastest version we have, save it
  if(JSON.stringify(fc) === JSON.stringify(jsonLatest)){
    console.log(`no new CA red flag warnings`);
    await uploadFile(`ca-rfw/metadata`, JSON.stringify(metadata), 'json');
  } else {
    metadata.updated = true;
    metadataLatest.counties.forEach(prevCounty => {
      // if was in before but not now, then it is cleared
      if(metadata.counties.indexOf(prevCounty) < 0){
        metadata.cleared.push(prevCounty);
      }
    })
    await uploadFile(`ca-rfw/${dateStr}`, JSON.stringify(fc), 'json');
    await uploadFile(`ca-rfw/latest`, JSON.stringify(fc), 'json');
    await uploadFile(`ca-rfw/metadata`, JSON.stringify(metadata), 'json');

    // this is different but now zero, so that means that they've cleared it,
    if(fc.features.length === 0){
      // tweet that rfws have cleared
      const status = {
        status: 'Cleared: No current Red Flag Warnings in California'
      };
      client.post('statuses/update', status).then(result => {
        console.log('You successfully tweeted this : "' + result.text + '"');
      }).catch(console.error);
    }
  }
}

getLatestRFW();


