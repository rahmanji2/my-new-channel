#!/bin/bash

# ১. লাইভ ডিরেক্টরি নিশ্চিত করা
mkdir -p /app/live

# ২. লোগো চেক ও ডাউনলোড
if [ ! -f /app/logo.png ] || [ ! -s /app/logo.png ]; then
  curl -s -L -A "Mozilla/5.0" "https://i.imgur.com/8Qe7Z1G.png" -o /app/logo.png
fi

# ৩. কোনো কারণে লোগো ডাউনলোড না হলে স্বয়ংক্রিয় ব্যাকআপ লোগো তৈরি
if [ ! -s /app/logo.png ]; then
  ffmpeg -f lavfi -i color=c=blue:s=120x60 -frames:v 1 /app/logo.png -y
fi

# ৪. Nginx চালু করা
nginx

# ৫. ২৪/৭ লাইভ সম্প্রচার লুপ
while true; do
  while IFS= read -r video_url || [ -n "$video_url" ]; do
    [[ "$video_url" =~ ^#.*$ ]] && continue
    [[ -z "$video_url" ]] && continue
    video_url=$(echo "$video_url" | sed -e "s/^file //" -e "s/'//g" -e 's/"//g')

    echo "Now Broadcasting: $video_url"

    ffmpeg -stream_loop -1 -re \
      -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5 \
      -i "$video_url" \
      -stream_loop -1 -i /app/logo.png \
      -filter_complex \
      "[0:v]scale=640:360[base]; \
       [1:v]scale=70:-1[logo]; \
       [base][logo]overlay=W-w-20:20[v_logo]; \
       [v_logo]drawbox=y=ih-28:color=black@0.6:width=iw:height=28:t=fill, \
       drawtext=fontfile=/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf:text='Welcome to My TV 24/7, live stream channel':fontcolor=yellow:fontsize=14:x=w-mod(t*75\,w+text_w):y=h-21[v_out]" \
      -map "[v_out]" -map 0:a? \
      -c:v libx264 -preset ultrafast -tune zerolatency -b:v 400k -maxrate 450k -bufsize 800k \
      -threads 1 \
      -c:a aac -b:a 64k -ar 44100 \
      -f hls \
      -hls_time 3 \
      -hls_list_size 5 \
      -hls_flags delete_segments+split_by_time \
      /app/live/stream.m3u8

    echo "Stream interrupted. Restarting in 2 seconds..."
    sleep 2
  done < /app/playlist.txt
  sleep 2
done
