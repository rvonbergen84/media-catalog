"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FORMAT_LABELS, MediaItem } from "@/lib/types";
import { Film, Pencil, Play, X } from "lucide-react";
import { useDominantColor, getDominantBg } from "@/hooks/use-dominant-color";
import { CardRect } from "@/components/media-card";

interface TmdbDetails {
  overview: string;
  producers: string[];
  topCast: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MediaItem | null;
  onEdit: (item: MediaItem) => void;
  darkMode?: boolean;
  originRect?: CardRect | null;
}

type Phase = "card" | "fullscreen" | "revealed";

function formatRuntime(minutes: number): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export function MediaDetailDialog({ open, onOpenChange, item, onEdit, darkMode, originRect }: Props) {
  const [details, setDetails] = useState<TmdbDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("card");
  const dominantColor = useDominantColor(item?.coverArt);
  const bgColor = getDominantBg(dominantColor, !!darkMode);
  const isMobile = useIsMobile();

  // Desktop: 3-phase animation. Mobile: skip straight to revealed.
  useEffect(() => {
    if (open) {
      if (isMobile) {
        setPhase("revealed");
      } else {
        setPhase("card");
        const raf = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setPhase("fullscreen");
          });
        });
        const timer = setTimeout(() => setPhase("revealed"), 700);
        return () => {
          cancelAnimationFrame(raf);
          clearTimeout(timer);
        };
      }
    } else {
      setPhase("card");
    }
  }, [open, isMobile]);

  useEffect(() => {
    if (!open || !item) {
      setDetails(null);
      return;
    }

    if (item.tmdbId) {
      setLoading(true);
      fetch(`/api/tmdb/${item.tmdbId}?type=${item.type}`)
        .then((res) => res.json())
        .then((data) => {
          setDetails({
            overview: data.overview || "",
            producers: data.producers || [],
            topCast: data.topCast || [],
          });
        })
        .catch(() => setDetails(null))
        .finally(() => setLoading(false));
    }
  }, [open, item]);

  if (!item) return null;

  // Desktop frame styles based on phase
  const getFrameStyle = (): React.CSSProperties => {
    if (phase === "card" && originRect) {
      return {
        position: "fixed",
        top: originRect.top,
        left: originRect.left,
        width: originRect.width,
        height: originRect.height,
        backgroundColor: bgColor || undefined,
      };
    }
    if (phase === "fullscreen") {
      return {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: bgColor || undefined,
      };
    }
    return {
      position: "absolute",
      top: 0,
      left: "50%",
      width: "50%",
      height: "100%",
      backgroundColor: bgColor || undefined,
    };
  };

  const getImageStyle = (): React.CSSProperties => {
    if (phase === "card") return { width: "75%", maxWidth: "none" };
    if (phase === "fullscreen") return { width: "35%", maxWidth: "26rem" };
    return { width: "55%", maxWidth: "20rem" };
  };

  const frameTransition = phase === "card"
    ? "none"
    : phase === "fullscreen"
    ? "all 500ms cubic-bezier(0.4, 0, 0.2, 1)"
    : "all 600ms cubic-bezier(0.4, 0, 0.2, 1)";

  const imageTransition = phase === "card"
    ? "none"
    : "all 600ms cubic-bezier(0.4, 0, 0.2, 1)";

  // Shared detail sections
  const detailSections = (
    <>
      <section>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-mono text-muted-foreground mb-4">
          <span>{item.year}</span>
          {item.type === "movie" && item.runtime > 0 && (
            <>
              <span>/</span>
              <span>{formatRuntime(item.runtime)}</span>
            </>
          )}
          <span>/</span>
          <span>{item.genre}</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.05] mb-4">
          {item.title}
        </h2>

        {loading && (
          <p className="text-sm text-muted-foreground font-mono animate-pulse">
            Loading details...
          </p>
        )}

        {details?.overview && (
          <p className="text-base text-muted-foreground leading-relaxed">
            {details.overview}
          </p>
        )}
      </section>

      <hr className="my-8 border-foreground/10" />

      <section>
        <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
          Library Details
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Format</span>
            <span className="font-medium">{FORMAT_LABELS[item.format]}</span>
          </div>
          {item.edition && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Edition</span>
              <span className="font-medium">{item.edition}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Digitized</span>
            <span className="font-medium">
              {item.isDigitized ? "Yes" : "No"}
            </span>
          </div>
          {item.hasSpecialFeatures && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Special Features</span>
              <span className="font-medium">Included</span>
            </div>
          )}
          {item.markedForUpgrade && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Upgrade</span>
              <span className="font-medium">
                Marked for {FORMAT_LABELS[item.format === "dvd" ? "bluray" : "4k_bluray"]}
              </span>
            </div>
          )}
          {item.seasons && item.seasons.length > 0 && (
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground pt-0.5">Seasons Owned</span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {item.seasons.map((s) => (
                  <span
                    key={s.number}
                    className={`inline-flex items-center justify-center h-6 w-6 text-xs font-mono ${
                      s.owned
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.number}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {details && (details.producers.length > 0 || details.topCast.length > 0) && (
        <>
          <hr className="my-8 border-foreground/10" />
          <section>
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Title Details
            </h3>
            <div className="space-y-2 text-sm">
              {details.producers.length > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">
                    {item.type === "tv" ? "Created By" : "Producers"}
                  </span>
                  <span className="font-medium text-right">
                    {details.producers.join(", ")}
                  </span>
                </div>
              )}
              {details.topCast.length > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Cast</span>
                  <span className="font-medium text-right">
                    {details.topCast.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!p-0 !bg-transparent data-open:!animate-none data-closed:!animate-none"
        showCloseButton={false}
      >
        {/* ===== MOBILE LAYOUT ===== */}
        <div className="sm:hidden absolute inset-0 overflow-y-auto overflow-x-hidden bg-card dark:bg-background z-30">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="fixed top-4 right-4 z-20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>

          {/* Image frame on top */}
          <div
            className="relative w-full aspect-[4/5] bg-muted flex items-center justify-center"
            style={bgColor ? { backgroundColor: bgColor } : undefined}
          >
            {item.coverArt && !item.coverArt.startsWith("data:") ? (
              <div className="relative w-[60%] aspect-[2/3] shadow-[8px_12px_30px_rgba(0,0,0,0.25)] dark:shadow-[8px_12px_40px_rgba(0,0,0,0.6)] overflow-hidden">
                <img
                  src={item.coverArt}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
                {item.isDigitized && (
                  <button
                    onClick={() => window.open(`https://app.plex.tv/desktop#!/search?query=${encodeURIComponent(item.title)}`, "_blank")}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 active:bg-black/30 transition-colors"
                  >
                    <div className="h-14 w-14 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
                      <Play className="h-6 w-6 text-black fill-black ml-0.5" />
                    </div>
                  </button>
                )}
              </div>
            ) : (
              <div className="w-[60%] aspect-[2/3] bg-background/50 flex flex-col items-center justify-center text-muted-foreground/30">
                <Film className="h-12 w-12 mb-2" />
                <span className="text-xs font-mono">No Cover</span>
              </div>
            )}

            {/* Edit button — bottom right of image frame */}
            <Button
              className="absolute bottom-4 right-4 z-10 bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-widest"
              onClick={() => {
                onOpenChange(false);
                onEdit(item);
              }}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          </div>

          {/* Details below image */}
          <div className="px-6 pt-6 pb-10">
            {detailSections}
          </div>
        </div>

        {/* ===== DESKTOP LAYOUT ===== */}
        <div className="hidden sm:block relative h-full w-full overflow-hidden bg-card dark:bg-background">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-6 right-6 z-20 transition-opacity duration-300"
            style={{ opacity: phase === "revealed" ? 1 : 0 }}
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>

          {/* Details panel — revealed by the wipe */}
          <div
            className="absolute inset-0 transition-opacity duration-500 ease-out"
            style={{ opacity: phase === "revealed" ? 1 : 0 }}
          >
            <div className="flex flex-col h-full overflow-hidden w-1/2">
              <div className="flex-1 overflow-y-auto pl-8 pr-8 lg:pl-12 lg:pr-10 pt-8 pb-8">
                {detailSections}
              </div>
            </div>
          </div>

          {/* Image frame — animates: card rect → fullscreen → right 50% */}
          <div
            className="z-10 bg-muted flex items-center justify-center overflow-hidden"
            style={{
              ...getFrameStyle(),
              transition: frameTransition,
            }}
          >
            {item.coverArt && !item.coverArt.startsWith("data:") ? (
              <div
                className="relative aspect-[2/3] shadow-[8px_12px_30px_rgba(0,0,0,0.25)] dark:shadow-[8px_12px_40px_rgba(0,0,0,0.6)] overflow-hidden"
                style={{
                  ...getImageStyle(),
                  transition: imageTransition,
                  transform: phase === "card" ? "rotate(2deg)" : "rotate(0deg)",
                }}
              >
                <img
                  src={item.coverArt}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
                {item.isDigitized && phase === "revealed" && (
                  <button
                    onClick={() => window.open(`https://app.plex.tv/desktop#!/search?query=${encodeURIComponent(item.title)}`, "_blank")}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors group/play"
                  >
                    <div className="h-16 w-16 rounded-full bg-white/80 group-hover/play:bg-white group-hover/play:scale-110 flex items-center justify-center shadow-lg transition-all">
                      <Play className="h-7 w-7 text-black fill-black ml-1" />
                    </div>
                  </button>
                )}
              </div>
            ) : (
              <div className="w-[70%] max-w-md aspect-[2/3] bg-background/50 flex flex-col items-center justify-center text-muted-foreground/30">
                <Film className="h-16 w-16 mb-3" />
                <span className="text-sm font-mono">No Cover</span>
              </div>
            )}
          </div>

          {/* Edit button — desktop */}
          <Button
            className="fixed bottom-6 right-6 z-[60] bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-widest transition-opacity duration-300"
            style={{ opacity: phase === "revealed" ? 1 : 0 }}
            onClick={() => {
              onOpenChange(false);
              onEdit(item);
            }}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
