#!/bin/bash

# ফোল্ডার তৈরি
mkdir -p /app/live

# লোগো ডাউনলোড (না থাকলে)
if [ ! -f /app/logo.png ]; then
  wget -q -O /app/logo.png "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/HBO_Max_Logo.svg/320px-HBO_Max_Logo.svg.png"
fi

# Nginx চালু
nginx

# ২৪/৭ স্ট্রিম লুপ
while true; do
  while IFS= read -r video_url || [ -n "$video_url" ]; do
    # খালি লাইন বা কমেন্ট বাদ
    [[ "$video_url" =~ ^#.*$ ]] && continue
    [[ -z "$video_url" ]] && continue
    # যদি আগে 'file ' লেখা থাকে তা স্বয়ংক্রিয়ভাবে মুছে ফেলা
    video_url=$(echo "$video_url" | sed -e "s/^file //" -e "s/'//g" -e 's/"//g')

    echo "Broadcasting: $video_url"

    ffmpeg -re -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5 \
      -i "$video_url" \
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

    sleep 2
  done < /app/playlist.txt
  sleep 2
done
