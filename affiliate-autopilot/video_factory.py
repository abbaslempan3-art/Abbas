#!/usr/bin/env python3
"""Offline, zero-API-cost Shopee Affiliate video composer.

Inputs: user-owned/licensed image, product name, verified talking points.
Outputs: 1080x1920 15-second MP4 with Thai text overlay.
Requires Python 3, FFmpeg, ffprobe and a Thai-capable TTF font installed locally.
No network, no automatic publishing, no external AI API.
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

def run(args):
    subprocess.run(args, check=True)

def main():
    p = argparse.ArgumentParser(description="Local 9:16 Affiliate Video Factory")
    p.add_argument("--image", required=True, type=Path, help="Licensed product image")
    p.add_argument("--name", required=True, help="Verified product name")
    p.add_argument("--point", action="append", default=[], help="Verified product fact (repeatable)")
    p.add_argument("--font", required=True, type=Path, help="Thai-capable .ttf font file")
    p.add_argument("--output", default="affiliate_video.mp4", type=Path)
    p.add_argument("--seconds", type=int, default=15)
    a = p.parse_args()
    if not 5 <= a.seconds <= 60: p.error("--seconds must be 5..60")
    if not a.image.is_file() or not a.font.is_file(): p.error("Image and font must exist")
    if a.output.resolve() == a.image.resolve(): p.error("Output cannot overwrite input")
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool): p.error(f"{tool} not installed or missing from PATH")
    a.output.parent.mkdir(parents=True, exist_ok=True)
    # Drawtext escapes special FFmpeg characters; text comes from verified user input.
    def esc(s):
        return s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'").replace("%", "\\%").replace(",", "\\,").replace("[", "\\[").replace("]", "\\]").replace(";", "\\;")
    font = esc(a.font.resolve().as_posix())
    name = esc(a.name[:70])
    fact = esc(" • ".join(a.point[:3])[:130] or "ตรวจสอบรายละเอียดจากหน้าสินค้าก่อนซื้อ")
    disclosure = esc("ลิงก์แนะนำสินค้าอาจได้รับค่าคอมมิชชัน")
    filters = [
        "scale=1080:1920:force_original_aspect_ratio=decrease",
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x101b2e",
        "format=yuv420p",
        f"drawtext=fontfile='{font}':text='{name}':fontcolor=white:fontsize=53:x=(w-text_w)/2:y=90:box=1:boxcolor=0x101b2e@0.85:boxborderw=20",
        f"drawtext=fontfile='{font}':text='{fact}':fontcolor=white:fontsize=32:x=(w-text_w)/2:y=h-280:box=1:boxcolor=0x101b2e@0.88:boxborderw=16",
        f"drawtext=fontfile='{font}':text='{disclosure}':fontcolor=yellow:fontsize=28:x=(w-text_w)/2:y=h-115:box=1:boxcolor=black@0.8:boxborderw=12",
    ]
    cmd = ["ffmpeg", "-hide_banner", "-y", "-loop", "1", "-framerate", "30",
           "-i", str(a.image), "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
           "-vf", ",".join(filters), "-t", str(a.seconds),
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k",
           "-movflags", "+faststart", "-shortest", str(a.output)]
    run(cmd)
    result = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                             "-show_entries", "stream=width,height", "-of", "json",
                             str(a.output)], capture_output=True, text=True, check=True)
    stream = json.loads(result.stdout)["streams"][0]
    if (stream["width"], stream["height"]) != (1080, 1920):
        raise RuntimeError("Output dimensions not 1080x1920")
    print(f"Created {a.output} (1080x1920); review before posting.")

if __name__ == "__main__":
    try: main()
    except subprocess.CalledProcessError as e:
        sys.exit(f"Video render failed: {e}")
