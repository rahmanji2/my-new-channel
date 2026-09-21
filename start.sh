#!/bin/bash

# ১. লাইভ ডিরেক্টরি নিশ্চিত করা
mkdir -p /app/live

# ২. লোগো ফাইল চেক (না থাকলে স্বচ্ছ ব্যাকআপ তৈরি)
if [ ! -f /app/logo.png ] || [ ! -s /app/logo.png ]; then
  ffmpeg -y -f lavfi -i color=c=black@0.0:s=60x30 -frames:v 1 /app/logo.png
fi

# ৩. Nginx ব্যাকগ্রাউন্ডে চালু করা
nginx

# ৪. ২৪/৭ একের পর এক ভিডিও সম্প্রচার লুপ
while true; do
  while IFS= read -r video_url || [ -n "$video_url" ]; do
    [[ "$video_url" =~ ^#.*$ ]] && continue
    [[ -z "$video_url" ]] && continue
    video_url=$(echo "$video_url" | sed -e "s/^file //" -e "s/'//g" -e 's/"//g')

    echo "Now Broadcasting: $video_url"

    # ভিডিও শেষ হলে পরের লিংকে যেতে -stream_loop বাদ দেওয়া হয়েছে
    ffmpeg -re \
      -reconnect 1 -reconnect_at_eof 0 -reconnect_streamed 1 -reconnect_delay_max 5 \
      -i "$video_url" \
      -stream_loop -1 -i /app/logo.png \
      -filter_complex \
      "[0:v]fps=20,scale=480:270[base]; \
       [1:v]scale=55:-1[logo]; \
       [base][logo]overlay=W-w-15:15[v_logo]; \
       [v_logo]drawbox=y=ih-22:color=black@0.6:width=iw:height=22:t=fill, \
       drawtext=fontfile=/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf:text='Welcome to My TV 24/7, live stream channel':fontcolor=yellow:fontsize=11:x=w-mod(t*60\,w+text_w):y=h-16[v_out]" \
      -map "[v_out]" -map 0:a? \
      -c:v libx264 -preset ultrafast -tune zerolatency \
      -b:v 280k -maxrate 320k -bufsize 600k \
      -threads 2 \
      -c:a aac -b:a 48k -ar 44100 \
      -f hls \
      -hls_time 3 \
      -hls_list_size 8 \
      -hls_flags delete_segments+append_list \
      /app/live/stream.m3u8

    echo "ভিডিও শেষ হয়েছে। পরবর্তী ভিডিওতে যাওয়া হচ্ছে..."
    sleep 2
  done < /app/playlist.txt
  sleep 2
done
