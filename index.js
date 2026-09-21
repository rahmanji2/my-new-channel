const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// CORS উন্মুক্ত করা
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// হোম পেজ
app.get('/', (req, res) => {
  res.send('Server is alive! Use /live.m3u8 for the stream.');
});

// M3U8 লিংক রুট
app.get('/live.m3u8', (req, res) => {
  // আপনার আসল m3u8 লিংকটি এখানে বসান
  const targetStream = 'https://stream.mux.com/1rmQU74oQmsN7wxHl15tDYKBAV901Pb02pF1VrLz00TOhk.m3u8';
  res.redirect(targetStream);
});

app.listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});
