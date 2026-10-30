#!/usr/bin/env python3
"""Offline synthetic sample; no network, product imagery, AI, or publishing."""
import argparse
from pathlib import Path
import shutil
import subprocess
import tempfile

DISCLOSURE = 'ลิงก์ Affiliate: ผู้แนะนำอาจได้รับค่าคอมมิชชัน'

def render(output, font):
    if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):
        raise RuntimeError('Install FFmpeg with libass and libx264 first')
    if not font.is_file():
        raise ValueError('Provide a licensed Thai font using --font')
    if output.exists():
        raise ValueError('Output exists; choose a new filename (no overwrite)')
    if output.suffix.lower() != '.mp4':
        raise ValueError('Output must end in .mp4')
    output = output.resolve()
    with tempfile.TemporaryDirectory(prefix='affiliate-video-') as tmp:
        tmp = Path(tmp)
        shutil.copyfile(font, tmp / 'Thai.ttf')
        # Fixed text only: never interpolate untrusted content into FFmpeg filters.
        (tmp / 'captions.ass').write_text('''[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Noto Sans Thai,34,&H00FFFFFF,&H000000FF,&H00101010,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,45,45,150,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:06.00,Default,,0,0,0,,SAMPLE — ตัวอย่างเท่านั้น\\Nไม่มีสินค้าหรือคุณสมบัติที่รับรอง
Dialogue: 0,0:00:00.00,0:00:06.00,Default,,0,0,1000,,''' + DISCLOSURE + '\n', encoding='utf-8')
        subprocess.run(['ffmpeg','-nostdin','-n','-f','lavfi','-i','color=c=0x192540:s=720x1280:r=24:d=6',
                        '-vf','ass=captions.ass:fontsdir=.', '-an','-c:v','libx264','-threads','2',
                        '-pix_fmt','yuv420p','-movflags','+faststart',str(output)], cwd=tmp, check=True)
    subprocess.run(['ffprobe','-v','error','-show_entries','stream=width,height,codec_name:format=duration','-of','json',str(output)],check=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--font',type=Path,default=Path('/usr/share/fonts/truetype/noto/NotoSansThai-Regular.ttf'))
    args = parser.parse_args()
    render(args.output,args.font)
