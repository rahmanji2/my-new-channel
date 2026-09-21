#!/bin/bash

mkdir -p /app/live

# ১. যদি নিজস্ব logo.png না থাকে, তবে একটি চমৎকার ক্লিয়ার টিভি লোগো ডায়নামিকালি জেনারেট হবে
if [ ! -f /app/logo.png ] || [ ! -s /app/logo.png ]; then
  ffmpeg -y -f lavfi -i color=c=red@0.85:s=90x34 -vf \
    "drawtext=fontfile=/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf:text='LIVE TV':fontcolor=white:fontsize=15:x=(w-text_w)/2:y=(h-text_h)/2" \
    -frames:v 1 /app/logo.png
fi

# ২. Nginx চালু
nginx

# ৩. বাফার-মুক্ত ২৪/৭ লাইভ লুপ
while true; do
  while IFS= read -r video_url || [ -n "$video_url" ]; do
    [[ "$video_url" =~ ^#.*$ ]] && continue
    [[ -z "$video_url" ]] && continue
    video_url=$(echo "$video_url" | sed -e "s/^file //" -e "s/'//g" -e 's/"//g')

    echo "Broadcasting smooth: $video_url"

    ffmpeg -stream_loop -1 -re \
      -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5 \
      -i "$video_url" \
      -stream_loop -1 -i /app/logo.png \
      -filter_complex \
      "[0:v]fps=20,scale=480:270[base]; \
       [1:v]scale=75:-1[logo]; \
       [base][logo]overlay=W-w-12:12[v_logo]; \
       [v_logo]drawbox=y=ih-22:color=black@0.65:width=iw:height=22:t=fill, \
       drawtext=fontfile=/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf:text='Welcome to My TV 24/7, live stream channel':fontcolor=yellow:fontsize=11:x=w-mod(t*60\,w+text_w):y=h-16[v_out]" \
      -map "[v_out]" -map 0:a? \
      -c:v libx264 -preset ultrafast -tune zerolatency \
      -b:v 280k -maxrate 320k -bufsize 600k \
      -threads 2 \
      -c:a aac -b:a 48k -ar 44100 \
      -f hls \
      -hls_time 3 \
      -hls_list_size 8 \
      -hls_flags delete_segments+split_by_time \
      /app/live/stream.m3u8

    sleep 2
  done < /app/playlist.txt
  sleep 2
done
