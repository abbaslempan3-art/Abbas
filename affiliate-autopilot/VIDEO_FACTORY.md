# Affiliate AI Video Factory (local prototype)

This is an **offline, free-software** MP4 composer, not an AI generative video model. It renders one licensed image into a 1080×1920 vertical video with Thai product text, verified product facts and an affiliate disclosure. It does not connect to Shopee, ChatGPT, Google Flow or Metricool. It does not publish anything.

## Requirements
- Python 3.10+
- FFmpeg and ffprobe installed on the computer (verify with `ffmpeg -version`)
- A Thai-capable TTF font file installed locally; pass its path with `--font`
- A product photo you own or have commercial reuse permission for

## Example (Windows PowerShell)

```powershell
python affiliate-autopilot/video_factory.py --image "C:\\media\\product.jpg" --font "C:\\Windows\\Fonts\\tahoma.ttf" --name "ชื่อสินค้าที่ตรวจสอบแล้ว" --point "รายละเอียดที่ตรวจสอบแล้ว" --output "affiliate-autopilot\\output.mp4"
```

The command is for running from the **repository root**. Use the correct paths for your machine. For macOS/Linux, replace Windows paths with local paths.

## Safety and next steps
- Do not use seller photos or videos without permission.
- Do not invent claims, discounts, testimonials, reviews or sales figures.
- Preview every generated MP4 and confirm text rendering before posting.
- No network calls, secrets, subscriptions or paid APIs.
- `PUBLISH_ENABLED=false`; uploading is deliberately outside this prototype.
- For true unattended rendering, add a job runner on a machine you control; GitHub Pages alone cannot run Python or FFmpeg.
