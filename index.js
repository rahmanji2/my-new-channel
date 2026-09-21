const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

function getVideos() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'channels.json'), 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// টিভি চ্যানেল পেজ
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>24/7 Live TV Channel</title>
      <style>
        body { margin: 0; background: #0b0f19; color: #fff; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
        .tv-frame { width: 90%; max-width: 900px; background: #1a2234; padding: 15px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.7); text-align: center; }
        .live-badge { display: inline-block; background: red; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 13px; margin-bottom: 10px; animation: blink 1.5s infinite; }
        @keyframes blink { 50% { opacity: 0.5; } }
        video { width: 100%; border-radius: 8px; background: #000; outline: none; }
        .info { margin-top: 10px; color: #94a3b8; font-size: 15px; }
      </style>
    </head>
    <body>
      <div class="tv-frame">
        <span class="live-badge">● LIVE 24/7</span>
        <h2 style="margin: 5px 0 15px 0;">My 24/7 Online TV Channel</h2>
        
        <!-- টিভি প্লেয়ার (ইউজার পজ করতে পারবে না, টানতে পারবে না) -->
        <video id="tvPlayer" autoplay muted playsinline></video>
        
        <div class="info" id="status">Syncing with Live Broadcast...</div>
      </div>

      <script>
        const video = document.getElementById('tvPlayer');
        const status = document.getElementById('status');
        let playlist = [];
        let currentIndex = 0;

        // প্লেলিস্ট ফেচ করা
        fetch('/api/playlist')
          .then(res => res.json())
          .then(data => {
            playlist = data;
            if (playlist.length > 0) {
              playChannel(0);
            } else {
              status.innerText = "No programs available.";
            }
          });

        function playChannel(index) {
          currentIndex = index;
          video.src = playlist[currentIndex].url;
          status.innerText = "Now Playing: " + (playlist[currentIndex].title || "Live Stream");
          video.play().catch(() => {
            status.innerText = "Click anywhere to enable audio!";
          });
        }

        // একটি ভিডিও শেষ হলে স্বয়ংক্রিয়ভাবে পরবর্তী ভিডিও চলবে (লুপ আকারে)
        video.addEventListener('ended', () => {
          let nextIndex = (currentIndex + 1) % playlist.length;
          playChannel(nextIndex);
        });

        // লাইভ ফিল রাখার জন্য ক্লিক করলে আনমিউট হবে
        window.addEventListener('click', () => {
          if (video.muted) {
            video.muted = false;
          }
        }, { once: true });
      </script>
    </body>
    </html>
  `);
});

// প্লেলিস্ট ডেটা এন্ডপয়েন্ট
app.get('/api/playlist', (req, res) => {
  res.json(getVideos());
});

app.listen(PORT, () => {
  console.log('TV Channel running on port ' + PORT);
});
