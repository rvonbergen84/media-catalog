import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Decode JPEG/PNG pixel data using a simple sampling approach
    // We'll use the raw bytes to estimate dominant color from the image data
    // For efficiency, sample bytes from the middle portion of the file
    const sampleStart = Math.floor(bytes.length * 0.3);
    const sampleEnd = Math.min(sampleStart + 30000, bytes.length);

    let rSum = 0, gSum = 0, bSum = 0, count = 0;

    // Sample byte triplets from image data
    for (let i = sampleStart; i < sampleEnd - 2; i += 3) {
      const r = bytes[i], g = bytes[i + 1], b = bytes[i + 2];
      const brightness = (r + g + b) / 3;
      // Skip very dark, very light, and gray pixels
      if (brightness > 40 && brightness < 220) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max > 0 ? (max - min) / max : 0;
        // Prefer pixels with some color
        if (saturation > 0.05) {
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
      }
    }

    if (count === 0) {
      // Fallback: sample all pixels without saturation filter
      for (let i = sampleStart; i < sampleEnd - 2; i += 3) {
        const r = bytes[i], g = bytes[i + 1], b = bytes[i + 2];
        const brightness = (r + g + b) / 3;
        if (brightness > 30 && brightness < 225) {
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
      }
    }

    if (count === 0) {
      return NextResponse.json({ light: null, dark: null });
    }

    const rAvg = rSum / count;
    const gAvg = gSum / count;
    const bAvg = bSum / count;

    // Convert to HSL
    const rN = rAvg / 255, gN = gAvg / 255, bN = bAvg / 255;
    const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
    let h = 0;
    const d = max - min;

    if (d !== 0) {
      if (max === rN) h = ((gN - bN) / d + (gN < bN ? 6 : 0)) * 60;
      else if (max === gN) h = ((bN - rN) / d + 2) * 60;
      else h = ((rN - gN) / d + 4) * 60;
    }

    const hue = Math.round(h);

    return NextResponse.json(
      {
        light: `hsl(${hue}, 25%, 92%)`,
        dark: `hsl(${hue}, 15%, 12%)`,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
