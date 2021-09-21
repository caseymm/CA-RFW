const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const waited = await delay(30000) /// waiting 30 seconds