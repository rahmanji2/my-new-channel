#!/bin/bash

# ১. লাইভ ফোল্ডার তৈরি
mkdir -p /app/live

# ২. লোগো ফাইল নিশ্চিত করা (না থাকলে ব্যাকআপ তৈরি)
if [ ! -f /app/logo.png ] || [ ! -s /app/logo.png ]; then
  ffmpeg -y -f lavfi -i color=c=black@0.0:s=60x30 -frames:v 1 /app/logo.png
fi

# ৩. Nginx ওয়েব সার্ভার ব্যাকগ্রাউন্ডে চালু করা
nginx

# ৪. বাফার-মুক্ত ২৪/৭ লাইভ লুপ (একটির পর একটি ভিডিও চলবে)
while true; do
  while IFS= read -r video_url || [ -n "$video_url" ]; do
    [[ "$video_url" =~ ^#.*$ ]] && continue
    [[ -z "$video_url" ]] && continue
    video_url=$(echo "$video_url" | sed -e "s/^file //" -e "s/'//g" -e 's/"//g')

    echo "Broadcasting: $video_url"

    ffmpeg -re \
      -reconnect 1 -reconnect_at_eof 0 -reconnect_streamed 1 -reconnect_delay_max 5 \
      -user_agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
      -i "$video_url" \
      -stream_loop -1 -i /app/logo.png \
      -filter_complex \
      "[0:v]scale=426:240[base]; \
       [1:v]scale=50:-1[logo]; \
       [base][logo]overlay=W-w-10:10[v_logo]; \
       [v_logo]drawbox=y=ih-20:color=black@0.6:width=iw:height=20:t=fill, \
       drawtext=fontfile=/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf:text='Welcome to My TV 24/7':fontcolor=yellow:fontsize=10:x=w-mod(t*50\,w+text_w):y=h-15[v_out]" \
      -map "[v_out]" -map 0:a? \
      -c:v libx264 -preset ultrafast -tune zerolatency \
      -b:v 250k -maxrate 280k -bufsize 500k \
      -threads 2 \
      -c:a aac -b:a 48k -ar 44100 \
      -f hls \
      -hls_time 3 \
      -hls_list_size 6 \
      -hls_flags delete_segments+append_list \
      /app/live/stream.m3u8

    echo "Video finished. Loading next..."
    sleep 1
  done < /app/playlist.txt
  sleep 2
done
