import fs from 'fs/promises'

async function updateTimestamp() {
  try {
    await fs.writeFile('./last-updated.txt', String(new Date()));
  } catch (err) {
    console.log(err);
  }
}

updateTimestamp();
