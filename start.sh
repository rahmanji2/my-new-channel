#!/bin/bash

# ১. লাইভ ডিরেক্টরি নিশ্চিত করা
mkdir -p /app/live

# ২. রিপোজিটরিতে logo.png না থাকলে স্বচ্ছ ব্যাকআপ তৈরি
if [ ! -f /app/logo.png ] || [ ! -s /app/logo.png ]; then
  ffmpeg -f lavfi -i color=c=black@0.0:s=60x30 -frames:v 1 /app/logo.png -y
fi

# ৩. Nginx চালু করা
nginx

# ৪. ২৪/৭ লাইভ সম্প্রচার লুপ
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
      "[0:v]fps=20,scale=480:270[base]; \
       [1:v]scale=55:-1[logo]; \
       [base][logo]overlay=W-w-15:15[v_logo]; \
       [v_logo]drawbox=y=ih-24:color=black@0.6:width=iw:height=24:t=fill, \
       drawtext=fontfile=/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf:text='Welcome to My TV 24/7, live stream channel':fontcolor=yellow:fontsize=12:x=w-mod(t*65\,w+text_w):y=h-18[v_out]" \
      -map "[v_out]" -map 0:a? \
      -c:v libx264 -preset ultrafast -tune zerolatency \
      -b:v 300k -maxrate 350k -bufsize 500k \
      -threads 2 \
      -c:a aac -b:a 48k -ar 44100 \
      -f hls \
      -hls_time 2 \
      -hls_list_size 6 \
      -hls_flags delete_segments+split_by_time \
      /app/live/stream.m3u8

    sleep 2
  done < /app/playlist.txt
  sleep 2
done
