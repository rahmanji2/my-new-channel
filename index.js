const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// channels.json theke list porar function
function getChannels() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'channels.json'), 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// 1. Web Player UI (M3U8 ebong MP4 duitai cholbe)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Universal Video & IPTV Player</title>
      <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
      <style>
        body { margin: 0; background: #0f172a; color: #fff; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
        .box { width: 90%; max-width: 850px; background: #1e293b; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        video { width: 100%; border-radius: 8px; background: #000; margin-top: 15px; }
        select { width: 100%; padding: 12px; border-radius: 6px; background: #334155; color: white; border: 1px solid #475569; font-size: 16px; margin-top: 10px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>My Video & IPTV Player</h2>
        <select id="channelSelect" onchange="playVideo(this.value)"></select>
        <video id="videoPlayer" controls autoplay muted playsinline></video>
      </div>

      <script>
        const video = document.getElementById('videoPlayer');
        const select = document.getElementById('channelSelect');
        let hls = null;

        // Server theke channel list load kora
        fetch('/api/channels')
          .then(res => res.json())
          .then(channels => {
            channels.forEach((ch, idx) => {
              const opt = document.createElement('option');
              opt.value = ch.url;
              opt.textContent = ch.name;
              select.appendChild(opt);
            });
            if (channels.length > 0) playVideo(channels[0].url);
          });

        function playVideo(url) {
          if (hls) {
            hls.destroy();
            hls = null;
          }

          if (url.includes('.m3u8')) {
            if (Hls.isSupported()) {
              hls = new Hls();
              hls.loadSource(url);
              hls.attachMedia(video);
              hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = url;
              video.play();
            }
          } else {
            // MP4 ba shadharon video link-er jonno
            video.src = url;
            video.play();
          }
        }
      </script>
    </body>
    </html>
  `);
});

// 2. Channels JSON data endpoint
app.get('/api/channels', (req, res) => {
  res.json(getChannels());
});

// 3. M3U Playlist Route (VLC, TiviMate, OTT Player-e chalate)
app.get('/playlist.m3u', (req, res) => {
  const channels = getChannels();
  let m3u = '#EXTM3U\n';
  
  channels.forEach((ch, index) => {
    m3u += `#EXTINF:-1 tvg-id="${index + 1}" tvg-name="${ch.name}", ${ch.name}\n`;
    m3u += `${ch.url}\n`;
  });

  res.setHeader('Content-Type', 'application/x-mpegURL');
  res.setHeader('Content-Disposition', 'inline; filename="playlist.m3u"');
  res.send(m3u);
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
