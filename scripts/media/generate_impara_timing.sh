#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
# Original abstract timing exercise: crossings at 2, 5, 8, 11 seconds.
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i 'color=c=0x163d2a:s=720x360:r=30:d=13' \
  -f lavfi -i 'color=c=0xf1cc76:s=36x36:r=30:d=13,format=rgba,geq=r=241:g=204:b=118:a=if(lte(hypot(X-18\,Y-18)\,17)\,255\,0)' \
  -filter_complex "[0:v]drawbox=x=358:y=30:w=4:h=300:color=0xaac8af:t=fill,drawbox=x=40:y=179:w=640:h=2:color=0x486c54:t=fill[bg];[bg][1:v]overlay=x='342+260*sin(PI*(t-2)/3)':y=162:shortest=1,format=yuv420p[out]" \
  -map '[out]' -an -c:v libx264 -profile:v baseline -crf 23 -movflags +faststart \
  public/media/impara/timing-linea-v1.mp4
