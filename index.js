const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Multi-Channel Live Stream</title>
      <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
      <style>
        body { margin: 0; background: #0f172a; color: #fff; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
        .player-container { width: 90%; max-width: 850px; background: #1e293b; padding: 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; }
        video { width: 100%; border-radius: 8px; background: #000; margin-top: 15px; }
        select { padding: 10px 15px; border-radius: 6px; background: #334155; color: white; border: 1px solid #475569; font-size: 16px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="player-container">
        <h2>Live TV Player</h2>
        
        <!-- GitHub থেকে চ্যানেল বা লিংক যোগ/বিয়োগ করুন -->
        <select id="channelSelect" onchange="playChannel(this.value)">
          <option value="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8">Channel 1 (Test Stream)</option>
          <option value="https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8">Channel 2 (Sample 2)</option>
        </select>

        <video id="video" controls autoplay muted></video>
      </div>

      <script>
        const video = document.getElementById('video');
        let hls = null;

        function playChannel(url) {
          if (Hls.isSupported()) {
            if (hls) { hls.destroy(); }
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            video.play();
          }
        }

        // ডিফল্ট প্রথম চ্যানেল চালানো
        playChannel(document.getElementById('channelSelect').value);
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
