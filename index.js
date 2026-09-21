const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// stream.json ফাইল পড়ার ফাংশন
function getConfig() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'stream.json'), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {
      title: "24/7 লাইভ টিভি",
      logo: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png",
      ticker: "লাইভ সম্প্রচার চলছে...",
      stream: {
        type: "m3u8",
        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        duration: 0
      }
    };
  }
}

// মূল ব্রডকাস্ট ইন্টারফেস
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
          box-shadow: 0 0 50px rgba(0,0,0,0.9);
        }

        /* ভিডিওতে ক্লিক বা টানাটানি সম্পূর্ণ বন্ধ */
        video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          background: #000;
        }

        /* চ্যানেল লোগো (উপরে ডান কোনায়) */
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

        /* লাইভ ব্যাজ (উপরে বাঁ কোনায়) */
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
          box-shadow: 0 2px 8px rgba(220,38,38,0.5);
        }
        .live-dot {
          width: 8px;
          height: 8px;
          background: #fff;
          border-radius: 50%;
          animation: blink 1s infinite alternate;
        }
        @keyframes blink { from { opacity: 1; } to { opacity: 0.2; } }

        /* নিচের রানিং শিরোনাম (Breaking News Ticker) */
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
          animation: scrollText 25s linear infinite;
        }
        @keyframes scrollText {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }

        /* সাইড কন্ট্রোল বাটন (সাউন্ড ও ফুলস্ক্রিন) */
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
        .ctrl-btn:hover {
          background: rgba(255,255,255,0.2);
        }
      </style>
    </head>
    <body>

      <div class="tv-wrapper" id="tvWrapper">
        <div class="live-tag"><span class="live-dot"></span> LIVE 24/7</div>
        
        <img id="logoImg" src="" class="channel-logo" alt="Logo">

        <!-- লাইভ ভিডিও প্লেয়ার -->
        <video id="tvPlayer" autoplay muted playsinline></video>

        <!-- রানিং নিউজ স্ট্রিপ -->
        <div class="ticker-bar">
          <div class="ticker-title">শিরোনাম</div>
          <div class="ticker-text" id="tickerText">লাইভ সম্প্রচার লোড হচ্ছে...</div>
        </div>

        <!-- কাস্টম বাটন -->
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

              // লিংক পরিবর্তন হলে বা প্রথমবার প্লে হলে
              if (currentUrl !== data.stream.url) {
                currentUrl = data.stream.url;

                if (data.stream.type === 'm3u8') {
                  if (Hls.isSupported()) {
                    if (hls) hls.destroy();
                    hls = new Hls();
                    hls.loadSource(currentUrl);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
                  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = currentUrl;
                    video.play();
                  }
                } else {
                  // MP4 ভিডিওর ক্ষেত্রে সার্ভার সময় অনুযায়ী লাইভ সিঙ্ক
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

        // পেজ লোডে সিঙ্ক এবং প্রতি ২০ সেকেন্ড পর পর ডাটা চেক
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

// লাইভ সিঙ্ক রুট
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
  console.log(`24/7 TV Server is running on port ${PORT}`);
});
