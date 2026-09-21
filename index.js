const express = require('express');
const app = express();

// Render স্বয়ংক্রিয়ভাবে process.env.PORT প্রোভাইড করে
const PORT = process.env.PORT || 3000;

// হেলথ চেক রুট (UptimeRobot এই রুটে পিং করবে)
app.get('/', (req, res) => {
  res.send('Server is alive and running 24/7!');
});

// আপনার আসল কাজ/বট লজিক এখানে কল করতে পারেন
function startMyBotOrTask() {
  console.log('Background task is running...');
  // উদাহরণ: setInterval বা আপনার বট চালু করার কোড
}

app.listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
  startMyBotOrTask();
});
