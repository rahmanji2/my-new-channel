const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// সকল ডোমেইন থেকে অ্যাক্সেস পাওয়ার জন্য CORS অন
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// stream.json ফাইল থেকে ডেটা পড়ার ফাংশন
function getConfig() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'stream.json'), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {
      title: "24/7 লাইভ টিভি",
      logo: "",
      ticker: "লাইভ সম্প্রচার চলছে...",
      stream: {
        type: "m3u8",
        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        duration: 0
      }
    };
  }
}

// ১. ব্রাউজারে ২৪/৭ ফুল লাইভ টিভি পেজ (টানাটানি ছাড়া, লোগো ও শিরোনামসহ)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>24/7 Live TV Channel</title>
      <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #000;
          color: #fff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          overflow: hidden;
        }
        .tv-wrapper {
          position: relative;
          width: 100vw;
          height: 100vh;
          max-width: 1200px;
          max-height: 675px;
          background: #000;
          overflow: hidden;
        }
        /* ভিডিও টানা বা পজ বন্ধ */
        video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          background: #000;
        }
        /* টিভি লোগো */
        .channel-logo {
          position: absolute;
          top: 25px;
          right: 30px;
          max-height: 55px;
          max-width: 120px;
          z-index: 20;
          pointer-events: none;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.8));
        }
        /* লাইভ ব্যাজ */
        .live-tag {
          position: absolute;
          top: 25px;
          left: 30px;
          background: #dc2626;
          color: #fff;
          padding: 4px 12px;
          font-size: 13px;
          font-weight: bold;
          border-radius: 4px;
          letter-spacing: 1px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          background: #fff;
          border-radius: 50%;
          animation: blink 1s infinite alternate;
        }
        @keyframes blink { from { opacity: 1; } to { opacity: 0.2; } }
        /* রানিং শিরোনাম (Ticker) */
        .ticker-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(90deg, #991b1b, #7f1d1d);
          color: #fff;
          display: flex;
          align-items: center;
          height: 38px;
          z-index: 25;
          font-size: 15px;
          overflow: hidden;
          border-top: 2px solid #facc15;
        }
        .ticker-title {
          background: #facc15;
          color: #000;
          padding: 0 16px;
          font-weight: bold;
          height: 100%;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          font-size: 14px;
        }
        .ticker-text {
          white-space: nowrap;
          padding-left: 100%;
          animation: scrollText 24s linear infinite;
        }
        @keyframes scrollText {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        /* বাটন */
        .tv-controls {
          position: absolute;
          bottom: 48px;
          right: 20px;
          z-index: 30;
          display: flex;
          gap: 8px;
        }
        .ctrl-btn {
          background: rgba(15, 23, 42, 0.85);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.25);
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          backdrop-filter: blur(5px);
        }
      </style>
    </head>
    <body>
      <div class="tv-wrapper" id="tvWrapper">
        <div class="live-tag"><span class="live-dot"></span> LIVE 24/7</div>
        <img id="logoImg" src="" class="channel-logo" alt="Logo">
        <video id="tvPlayer" autoplay muted playsinline></video>

        <div class="ticker-bar">
          <div class="ticker-title">শিরোনাম</div>
          <div class="ticker-text" id="tickerText">লাইভ সম্প্রচার লোড হচ্ছে...</div>
        </div>

        <div class="tv-controls">
          <button class="ctrl-btn" id="soundBtn" onclick="toggleSound()">🔊 সাউন্ড অন</button>
          <button class="ctrl-btn" onclick="toggleScreen()">⛶ ফুলস্ক্রিন</button>
        </div>
      </div>

      <script>
        const video = document.getElementById('tvPlayer');
        const logoImg = document.getElementById('logoImg');
        const tickerText = document.getElementById('tickerText');
        const soundBtn = document.getElementById('soundBtn');
        let currentUrl = '';
        let hls = null;

        function syncBroadcast() {
          fetch('/api/live-status')
            .then(res => res.json())
            .then(data => {
              tickerText.innerText = data.ticker || "লাইভ সম্প্রচার চলছে...";
              if (data.logo) {
                logoImg.src = data.logo;
                logoImg.style.display = 'block';
              } else {
                logoImg.style.display = 'none';
              }

              if (currentUrl !== data.stream.url) {
                currentUrl = data.stream.url;

                if (data.stream.type === 'm3u8') {
                  if (Hls.isSupported()) {
                    if (hls) hls.destroy();
                    hls = new Hls();
                    hls.loadSource('/live.m3u8'); // নিজস্ব প্রক্সি লিংক থেকে প্লে
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
                  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = '/live.m3u8';
                    video.play();
                  }
                } else {
                  video.src = currentUrl;
                  video.addEventListener('loadedmetadata', () => {
                    if (data.currentOffset) {
                      video.currentTime = data.currentOffset;
                    }
                    video.play();
                  }, { once: true });
                }
              }
            });
        }

        syncBroadcast();
        setInterval(syncBroadcast, 20000);

        video.addEventListener('ended', () => {
          syncBroadcast();
        });

        function toggleSound() {
          video.muted = !video.muted;
          soundBtn.innerText = video.muted ? '🔇 মিউট' : '🔊 সাউন্ড অন';
        }

        function toggleScreen() {
          const frame = document.getElementById('tvWrapper');
          if (!document.fullscreenElement) {
            frame.requestFullscreen().catch(e => alert(e.message));
          } else {
            document.exitFullscreen();
          }
        }
      </script>
    </body>
    </html>
  `);
});

// ২. সরাসরি রিভার্স প্রক্সি M3U8 লিংক (মূল অরিজিনাল লিংক কখনই প্রকাশ পাবে না)
app.get('/live.m3u8', async (req, res) => {
  try {
    const config = getConfig();
    const targetStream = config.stream && config.stream.url 
      ? config.stream.url 
      : 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

    // সার্ভার ব্যাকগ্রাউন্ড থেকে ডেটা ফেচ করে পাইপ করবে
    const response = await axios({
      method: 'GET',
      url: targetStream,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send('Error streaming M3U8: ' + error.message);
  }
});

// ৩. লাইভ সিঙ্ক লজিক
app.get('/api/live-status', (req, res) => {
  const config = getConfig();
  let currentOffset = 0;

  if (config.stream.type === 'mp4' && config.stream.duration > 0) {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    currentOffset = nowInSeconds % config.stream.duration;
  }

  res.json({
    title: config.title,
    logo: config.logo,
    ticker: config.ticker,
    stream: config.stream,
    currentOffset: currentOffset
  });
});

app.listen(PORT, () => {
  console.log(`Live TV server running on port ${PORT}`);
});
