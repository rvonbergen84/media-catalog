"use client";

import { useEffect, useState } from "react";

interface ColorResult {
  light: string | null;
  dark: string | null;
}

// Simple in-memory cache to avoid re-fetching
const colorCache = new Map<string, ColorResult>();

export function useDominantColor(imageUrl: string | undefined | null): ColorResult | null {
  const [color, setColor] = useState<ColorResult | null>(() => {
    if (imageUrl && colorCache.has(imageUrl)) {
      return colorCache.get(imageUrl)!;
    }
    return null;
  });

  useEffect(() => {
    if (!imageUrl || imageUrl.startsWith("data:")) {
      setColor(null);
      return;
    }

    if (colorCache.has(imageUrl)) {
      setColor(colorCache.get(imageUrl)!);
      return;
    }

    let cancelled = false;

    fetch(`/api/color?url=${encodeURIComponent(imageUrl)}`)
      .then((res) => res.json())
      .then((data: ColorResult) => {
        if (!cancelled) {
          colorCache.set(imageUrl, data);
          setColor(data);
        }
      })
      .catch(() => {
        if (!cancelled) setColor(null);
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return color;
}

export function getDominantBg(color: ColorResult | null, isDark: boolean): string | undefined {
  if (!color) return undefined;
  const value = isDark ? color.dark : color.light;
  return value || undefined;
}
