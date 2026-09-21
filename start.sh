#!/bin/bash

# লাইভ ফোল্ডার তৈরি
mkdir -p /app/live

# লোগো ডাউনলোড (না থাকলে ডিফল্ট লোগো নেবে)
if [ ! -f /app/logo.png ]; then
  wget -q -O /app/logo.png "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/HBO_Max_Logo.svg/320px-HBO_Max_Logo.svg.png"
fi

# Nginx চালু করা
nginx

# 24/7 লাইভ অটো-রিস্টার্ট লুপ
while true; do
  echo "FFmpeg Live Broadcasting Started..."
  
  ffmpeg -re -f concat -safe 0 -protocol_whitelist file,http,https,tcp,tls -stream_loop -1 -i /app/playlist.txt \
    -i /app/logo.png \
    -filter_complex \
    "[0:v]scale=640:360[base]; \
     [1:v]scale=60:-1[logo]; \
     [base][logo]overlay=W-w-20:20[v_logo]; \
     [v_logo]drawbox=y=ih-28:color=black@0.6:width=iw:height=28:t=fill, \
     drawtext=fontfile=/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf:text='Welcome to My TV 24/7, live stream channel':fontcolor=yellow:fontsize=14:x=w-mod(t*75\,w+text_w):y=h-21[v_out]" \
    -map "[v_out]" -map 0:a? \
    -c:v libx264 -preset ultrafast -tune zerolatency -b:v 450k -maxrate 500k -bufsize 1000k \
    -threads 1 \
    -c:a aac -b:a 64k -ar 44100 \
    -f hls -hls_time 4 -hls_list_size 5 -hls_flags delete_segments \
    /app/live/stream.m3u8

  echo "Stream ended or crashed. Restarting in 3 seconds..."
  sleep 3
done
