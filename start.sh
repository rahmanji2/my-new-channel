#!/bin/bash

# ১. লাইভ ডিরেক্টরি নিশ্চিত করা
mkdir -p /app/live

# ২. আপনার কাঙ্ক্ষিত লোগো ডাউনলোড (প্রপার রেফারার ও ইউজার-এজেন্ট সহ)
if [ ! -f /app/logo.png ] || [ ! -s /app/logo.png ]; then
  echo "Downloading channel logo..."
  curl -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
    -e "https://www.pngegg.com/" \
    "https://e1.pngegg.com/pngimages/259/287/png-clipart-metrostation-tv-logo-thumbnail.png" -o /app/logo.png
fi

# ৩. লোগো ফাইলে কোনো এরর থাকলে বা খালি থাকলে সাধারণ টেস্ট লোগো তৈরি
if [ ! -s /app/logo.png ]; then
  echo "Logo download failed. Creating fallback logo..."
  ffmpeg -f lavfi -i color=c=blue:s=120x60 -frames:v 1 /app/logo.png -y
fi

# ৪. Nginx ওয়েব সার্ভার ব্যাকগ্রাউন্ডে চালু করা
nginx

# ৫. ২৪/৭ লাইভ রিস্টার্ট লুপ
while true; do
  while IFS= read -r video_url || [ -n "$video_url" ]; do
    # খালি লাইন ও কমেন্ট বাদ দেওয়া
    [[ "$video_url" =~ ^#.*$ ]] && continue
    [[ -z "$video_url" ]] && continue
    # কোনো কোটেশন বা স্পেস থাকলে তা পরিষ্কার করা
    video_url=$(echo "$video_url" | sed -e "s/^file //" -e "s/'//g" -e 's/"//g')

    echo "Now Broadcasting: $video_url"

    # FFmpeg লাইভ স্ট্রিম তৈরি (লোগো ওভারলে ও নিচে স্ক্রলিং টেক্সট)
    ffmpeg -re -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5 \
      -i "$video_url" \
      -i /app/logo.png \
      -filter_complex \
      "[0:v]scale=640:360[base]; \
       [1:v]scale=70:-1[logo]; \
       [base][logo]overlay=W-w-20:20[v_logo]; \
       [v_logo]drawbox=y=ih-28:color=black@0.6:width=iw:height=28:t=fill, \
       drawtext=fontfile=/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf:text='Welcome to My TV 24/7, live stream channel':fontcolor=yellow:fontsize=14:x=w-mod(t*75\,w+text_w):y=h-21[v_out]" \
      -map "[v_out]" -map 0:a? \
      -c:v libx264 -preset ultrafast -tune zerolatency -b:v 450k -maxrate 500k -bufsize 1000k \
      -threads 1 \
      -c:a aac -b:a 64k -ar 44100 \
      -f hls -hls_time 4 -hls_list_size 5 -hls_flags delete_segments \
      /app/live/stream.m3u8

    echo "Playback completed or connection dropped. Reloading next stream..."
    sleep 2
  done < /app/playlist.txt
  sleep 2
done
