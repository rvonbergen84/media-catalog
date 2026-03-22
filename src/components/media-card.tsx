"use client";

import { useRef } from "react";
import { FORMAT_LABELS, MediaItem } from "@/lib/types";
import { Film } from "lucide-react";
import { useState } from "react";
import { useDominantColor, getDominantBg } from "@/hooks/use-dominant-color";

export interface CardRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  item: MediaItem;
  onEdit: (item: MediaItem, rect: CardRect | null) => void;
  darkMode?: boolean;
}

export function MediaCard({ item, onEdit, darkMode }: Props) {
  const [imgError, setImgError] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const dominantColor = useDominantColor(item.coverArt);
  const bgColor = getDominantBg(dominantColor, !!darkMode);

  const handleClick = () => {
    const rect = frameRef.current?.getBoundingClientRect();
    onEdit(item, rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null);
  };

  return (
    <div
      className="group cursor-pointer"
      onClick={handleClick}
    >
      {/* Poster on surface */}
      <div
        ref={frameRef}
        className="relative bg-muted aspect-[4/5] overflow-hidden flex items-center justify-center p-8 sm:p-12 transition-colors duration-500"
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        {!imgError && item.coverArt ? (
          <div className="relative w-[75%] aspect-[2/3] shadow-[8px_12px_30px_rgba(0,0,0,0.25)] dark:shadow-[8px_12px_40px_rgba(0,0,0,0.6)] rotate-[2deg] group-hover:rotate-[0deg] transition-transform duration-700 ease-out overflow-hidden">
            <img
              src={item.coverArt}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="w-[75%] aspect-[2/3] bg-background/50 flex flex-col items-center justify-center text-muted-foreground/30 rotate-[2deg]">
            <Film className="h-12 w-12" />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="pt-5 space-y-1">
        <h3 className="text-xl font-medium leading-snug tracking-tight">
          {item.title}
        </h3>
        <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider pt-1">
          {FORMAT_LABELS[item.format]} · {item.genre} · {item.year}
        </p>
      </div>
    </div>
  );
}
