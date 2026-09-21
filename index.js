const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

// CORS উন্মুক্ত করা যাতে যেকোনো প্লেয়ারে চলে
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// মূল পেজ (চেক করার জন্য)
app.get('/', (req, res) => {
  res.send('IPTV Server is running! Use /live.m3u8 or /playlist.m3u to play.');
});

// ১. সরাসরি .m3u8 স্ট্রিম দেওয়ার রুট
app.get('/live.m3u8', async (req, res) => {
  // এখানে আসল লাইভ স্ট্রিমের লিংকটি বসিয়ে দিন
  const targetStream = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  
  // সরাসরি লাইভ স্ট্রিমে রিডাইরেক্ট করবে
  res.redirect(targetStream);
});

// ২. সম্পূর্ণ M3U প্লেলিস্ট রুট (VLC / TiviMate / OTT Player-এ দেওয়ার জন্য)
app.get('/playlist.m3u', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;

  const playlist = `#EXTM3U
#EXTINF:-1 tvg-id="1" tvg-name="My Live TV" group-title="Live", My Live TV
${protocol}://${host}/live.m3u8
`;

  res.setHeader('Content-Type', 'application/x-mpegURL');
  res.setHeader('Content-Disposition', 'inline; filename="playlist.m3u"');
  res.send(playlist);
});

app.listen(PORT, () => {
  console.log(`IPTV Server is running on port ${PORT}`);
});
