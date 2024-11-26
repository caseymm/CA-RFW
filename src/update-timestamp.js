import fs from 'fs/promises'

async function updateTimestamp() {
  const filePath = './last-updated.txt';
  try {
   // Read the file content
   const content = await fs.readFile(filePath, 'utf8');
   const lastUpdatedDate = new Date(content);

   if (isNaN(lastUpdatedDate.getTime())) {
     console.log('Invalid date format in file. Updating the timestamp.');
     await fs.writeFile(filePath, String(new Date()));
     return;
   }

   // Check if the date is more than 60 days old
   const currentDate = new Date();
   const sixtyDaysInMillis = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds

   if (currentDate.getTime() - lastUpdatedDate.getTime() > sixtyDaysInMillis) {
     console.log('Date is more than 60 days old. Updating the timestamp.');
     await fs.writeFile(filePath, String(currentDate));
   } else {
     console.log('Date is within 60 days. Keeping the file as is.');
   }
  } catch (err) {
    console.error('Error:', err);
  }
}

updateTimestamp();
