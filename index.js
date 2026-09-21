const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// সরাসরি মূল লিংকে টিভি প্লেয়ার
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>24/7 Live TV Channel</title>
      <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
      <style>
        body {
          margin: 0;
          background: #000;
          color: #fff;
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          width: 95%;
          max-width: 900px;
          text-align: center;
        }
        .badge {
          background: red;
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 14px;
          display: inline-block;
          margin-bottom: 12px;
        }
        video {
          width: 100%;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(255,255,255,0.1);
          background: #111;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <span class="badge">● LIVE 24/7</span>
        <video id="videoPlayer" controls autoplay muted playsinline></video>
      </div>

      <script>
        const video = document.getElementById('videoPlayer');
        // আসল লাইভ স্ট্রিম লিংক
        const streamUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play();
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
          video.addEventListener('loadedmetadata', function () {
            video.play();
          });
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});
