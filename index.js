const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// ভিডিও প্লেয়ার পেজ
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Video Player</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; background: #121212; color: #fff; padding-top: 50px; }
          video { max-width: 90%; width: 700px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        </style>
      </head>
      <body>
        <h2>My 24/7 Video Stream / Player</h2>
        
        <!-- সোর্স লিংকে আপনার আসল ভিডিও ফাইল (mp4) এর ডিরেক্ট লিংক দিন -->
        <video controls autoplay muted loop>
          <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
