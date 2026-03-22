"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Format,
  FORMAT_LABELS,
  MediaItem,
  MediaType,
  Season,
  UPGRADE_PATH,
} from "@/lib/types";
import { GENRES } from "@/lib/genres";
import { Check, Film, ImagePlus, Loader2, Minus, Plus, Search, Trash2, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: MediaItem) => void;
  onDelete?: (id: string) => void;
  editItem?: MediaItem | null;
}

interface TmdbSearchResult {
  id: number;
  type: "movie" | "tv";
  title: string;
  year: number | null;
  coverArt: string | null;
  overview: string;
}

const DEFAULT_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' fill='%23D6CFC7'%3E%3Crect width='300' height='450'/%3E%3Ctext x='150' y='225' text-anchor='middle' dy='.3em' font-family='system-ui' font-size='14' fill='%239B848E'%3ENo Cover%3C/text%3E%3C/svg%3E";

// Map TMDB genre names to our genre list
const GENRE_MAP: Record<string, string> = {
  "Action": "Action",
  "Action & Adventure": "Action",
  "Adventure": "Adventure",
  "Animation": "Animation",
  "Comedy": "Comedy",
  "Crime": "Crime",
  "Documentary": "Documentary",
  "Drama": "Drama",
  "Family": "Family",
  "Fantasy": "Fantasy",
  "History": "History",
  "Horror": "Horror",
  "Music": "Music",
  "Mystery": "Mystery",
  "Romance": "Romance",
  "Science Fiction": "Sci-Fi",
  "Sci-Fi & Fantasy": "Sci-Fi",
  "Thriller": "Thriller",
  "War": "War",
  "War & Politics": "War",
  "Western": "Western",
};

function mapGenre(tmdbGenres: string[]): string {
  for (const g of tmdbGenres) {
    if (GENRE_MAP[g]) return GENRE_MAP[g];
  }
  return "";
}

export function MediaFormDialog({ open, onOpenChange, onSave, onDelete, editItem }: Props) {
  const [type, setType] = useState<MediaType>("movie");
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [genre, setGenre] = useState("");
  const [format, setFormat] = useState<Format>("bluray");
  const [runtime, setRuntime] = useState("");
  const [coverArt, setCoverArt] = useState(DEFAULT_COVER);
  const [isDigitized, setIsDigitized] = useState(false);
  const [markedForUpgrade, setMarkedForUpgrade] = useState(false);
  const [hasSpecialFeatures, setHasSpecialFeatures] = useState(false);
  const [edition, setEdition] = useState("");
  const [numberOfEpisodes, setNumberOfEpisodes] = useState("");
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [tmdbId, setTmdbId] = useState<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TMDB search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [filling, setFilling] = useState(false);

  useEffect(() => {
    if (open && editItem) {
      setType(editItem.type);
      setTitle(editItem.title);
      setYear(String(editItem.year));
      setGenre(editItem.genre);
      setFormat(editItem.format);
      setRuntime(String(editItem.runtime));
      setCoverArt(editItem.coverArt);
      setIsDigitized(editItem.isDigitized);
      setMarkedForUpgrade(editItem.markedForUpgrade);
      setHasSpecialFeatures(editItem.hasSpecialFeatures);
      setEdition(editItem.edition || "");
      setTmdbId(editItem.tmdbId);
      setNumberOfEpisodes(
        editItem.numberOfEpisodes ? String(editItem.numberOfEpisodes) : ""
      );
      if (editItem.seasons && editItem.seasons.length > 0) {
        setSeasons(editItem.seasons);
      } else {
        setSeasons([]);
      }
    } else if (open) {
      setType("movie");
      setTitle("");
      setYear("");
      setGenre("");
      setFormat("bluray");
      setRuntime("");
      setCoverArt(DEFAULT_COVER);
      setIsDigitized(false);
      setMarkedForUpgrade(false);
      setHasSpecialFeatures(false);
      setEdition("");
      setTmdbId(undefined);
      setNumberOfEpisodes("");
      setSeasons([]);
    }
    // Reset search state when dialog opens/closes
    setSearchQuery("");
    setSearchResults([]);
    setSearching(false);
    setFilling(false);
  }, [open, editItem]);

  const canUpgrade = UPGRADE_PATH[format] !== null;

  useEffect(() => {
    if (!canUpgrade) setMarkedForUpgrade(false);
  }, [canUpgrade]);

  const handleCoverChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setCoverArt(reader.result as string);
      reader.readAsDataURL(file);
    },
    []
  );

  // TMDB search
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/tmdb?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch {
      // silently fail — user can still enter manually
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = async (result: TmdbSearchResult) => {
    setType(result.type);
    setTitle(result.title);
    setTmdbId(result.id);
    if (result.year) setYear(String(result.year));
    if (result.coverArt) setCoverArt(result.coverArt);
    setSearchResults([]);
    setSearchQuery("");

    // Fetch details for runtime and genre
    setFilling(true);
    try {
      const res = await fetch(`/api/tmdb/${result.id}?type=${result.type}`);
      const data = await res.json();
      if (data.runtime) setRuntime(String(data.runtime));
      if (data.genres) {
        const mapped = mapGenre(data.genres);
        if (mapped) setGenre(mapped);
      }
      if (result.type === "tv") {
        if (data.numberOfSeasons) {
          const count = data.numberOfSeasons as number;
          setSeasons(
            Array.from({ length: count }, (_, i) => ({
              number: i + 1,
              owned: true,
            }))
          );
        }
        if (data.numberOfEpisodes) {
          setNumberOfEpisodes(String(data.numberOfEpisodes));
        }
      }
    } catch {
      // silently fail
    } finally {
      setFilling(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const item: MediaItem = {
      id: editItem?.id ?? uuid(),
      ...(tmdbId && { tmdbId }),
      type,
      title: title.trim(),
      year: parseInt(year, 10),
      genre,
      format,
      runtime: parseInt(runtime, 10) || 0,
      coverArt,
      ...(edition.trim() && { edition: edition.trim() }),
      isDigitized,
      markedForUpgrade,
      hasSpecialFeatures,
      ...(type === "tv" && {
        numberOfEpisodes: parseInt(numberOfEpisodes, 10) || undefined,
        seasons: seasons.length > 0 ? seasons : undefined,
      }),
      createdAt: editItem?.createdAt ?? now,
      updatedAt: now,
    };
    onSave(item);
    onOpenChange(false);
  };

  const upgradeLabel = canUpgrade
    ? `Mark for upgrade (${FORMAT_LABELS[format]} → ${FORMAT_LABELS[UPGRADE_PATH[format]!]})`
    : "Already highest format";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent showCloseButton={false}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-0">
            <DrawerHeader>
              <DrawerTitle className="text-xl font-semibold">
                {editItem ? "Edit" : "Add"} Media
              </DrawerTitle>
            </DrawerHeader>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {/* TMDB Search — only for new items */}
              {!editItem && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Search TMDB</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by title..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSearch();
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSearch}
                      disabled={searching || !searchQuery.trim()}
                    >
                      {searching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Search"
                      )}
                    </Button>
                  </div>

                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <div className="border border-border overflow-hidden divide-y divide-border max-h-64 overflow-y-auto">
                      {searchResults.map((r) => (
                        <button
                          key={`${r.type}-${r.id}`}
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors"
                          onClick={() => handleSelectResult(r)}
                        >
                          <div className="h-12 w-8 overflow-hidden bg-muted shrink-0">
                            {r.coverArt ? (
                              <img
                                src={r.coverArt}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Film className="h-4 w-4 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {r.title}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase tracking-wide shrink-0"
                              >
                                {r.type === "tv" ? "TV" : "Movie"}
                              </Badge>
                            </div>
                            {r.year && (
                              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                                {r.year}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searching && (
                    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Searching...
                    </div>
                  )}

                  {filling && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                      Fetching details...
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                  required
                />
              </div>

              {/* Type — radio row */}
              <div className="space-y-1.5">
                <Label>Type</Label>
                <div className="flex gap-2">
                  {([["movie", "Movie"], ["tv", "TV Series"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setType(val)}
                      className={`flex-1 h-9 text-sm font-medium border transition-colors ${
                        type === val
                          ? "bg-foreground text-background border-foreground"
                          : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year */}
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2024"
                  min={1888}
                  max={2099}
                  required
                />
              </div>

              {/* Genre */}
              <div className="space-y-1.5">
                <Label>Genre</Label>
                <Select value={genre} onValueChange={(v) => setGenre(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <span>{genre || "Select genre"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Format */}
              <div className="space-y-1.5">
                <Label>Format</Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as Format)}
                >
                  <SelectTrigger className="w-full">
                    <span>{FORMAT_LABELS[format]}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dvd">DVD</SelectItem>
                    <SelectItem value="bluray">Blu-ray</SelectItem>
                    <SelectItem value="4k_bluray">4K Blu-ray</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Edition */}
              <div className="space-y-1.5">
                <Label>Edition</Label>
                <Input
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  placeholder="e.g. Criterion, Steelbook, Special Edition"
                />
              </div>

              {/* Seasons — TV only */}
              {type === "tv" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Seasons</Label>
                    <div className="flex items-center gap-1.5">
                      {seasons.length > 0 && (
                        <>
                          <button
                            type="button"
                            className="text-xs text-foreground hover:underline"
                            onClick={() =>
                              setSeasons((prev) =>
                                prev.map((s) => ({ ...s, owned: true }))
                              )
                            }
                          >
                            Select All
                          </button>
                          <span className="text-muted-foreground text-xs">·</span>
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:underline"
                            onClick={() =>
                              setSeasons((prev) =>
                                prev.map((s) => ({ ...s, owned: false }))
                              )
                            }
                          >
                            Deselect All
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {seasons.map((season) => (
                      <button
                        key={season.number}
                        type="button"
                        onClick={() =>
                          setSeasons((prev) =>
                            prev.map((s) =>
                              s.number === season.number
                                ? { ...s, owned: !s.owned }
                                : s
                            )
                          )
                        }
                        className={`inline-flex items-center justify-center h-8 min-w-[2rem] px-2 text-xs font-medium border transition-colors ${
                          season.owned
                            ? "bg-foreground/10 border-foreground/30 text-foreground"
                            : "bg-muted border-border text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        {season.owned && (
                          <Check className="h-3 w-3 mr-0.5 shrink-0" />
                        )}
                        S{season.number}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setSeasons((prev) => [
                          ...prev,
                          { number: prev.length + 1, owned: true },
                        ])
                      }
                      className="inline-flex items-center justify-center h-8 min-w-[2rem] px-2 text-xs font-medium border border-dashed border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
                    >
                      <Plus className="h-3 w-3 mr-0.5" />
                      Season
                    </button>
                    {seasons.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setSeasons((prev) => prev.slice(0, -1))
                        }
                        className="inline-flex items-center justify-center h-8 min-w-[2rem] px-2 text-xs font-medium border border-dashed border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors"
                      >
                        <Minus className="h-3 w-3 mr-0.5" />
                        Remove
                      </button>
                    )}
                  </div>
                  {seasons.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {seasons.filter((s) => s.owned).length} of{" "}
                      {seasons.length} season{seasons.length !== 1 ? "s" : ""}{" "}
                      owned
                    </p>
                  )}
                </div>
              )}

              {/* Cover Art URL + upload */}
              <div className="space-y-1.5">
                <Label>Cover Art</Label>
                <div className="flex items-center gap-4">
                  <div
                    className="relative h-24 w-16 border border-border overflow-hidden bg-muted cursor-pointer group shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <img
                      src={coverArt}
                      alt="Cover"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImagePlus className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Input
                      type="url"
                      placeholder="Paste image URL"
                      onChange={(e) => {
                        if (e.target.value) setCoverArt(e.target.value);
                      }}
                      defaultValue={coverArt.startsWith("data:") ? "" : coverArt}
                      key={coverArt.startsWith("http") ? coverArt : "cover-url"}
                    />
                    <p className="text-xs text-muted-foreground">
                      Or click the thumbnail to upload a file
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="special"
                    checked={hasSpecialFeatures}
                    onCheckedChange={(c) => setHasSpecialFeatures(c === true)}
                  />
                  <Label htmlFor="special" className="font-normal cursor-pointer">
                    Special Features Included
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="digitized"
                    checked={isDigitized}
                    onCheckedChange={(c) => setIsDigitized(c === true)}
                  />
                  <Label htmlFor="digitized" className="font-normal cursor-pointer">
                    Added to Digital Library
                  </Label>
                </div>
                {format === "dvd" && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="upgrade"
                      checked={markedForUpgrade}
                      onCheckedChange={(c) => setMarkedForUpgrade(c === true)}
                    />
                    <Label htmlFor="upgrade" className="font-normal cursor-pointer">
                      Upgrade to Blu-ray
                    </Label>
                  </div>
                )}
                {format === "bluray" && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="upgrade"
                      checked={markedForUpgrade}
                      onCheckedChange={(c) => setMarkedForUpgrade(c === true)}
                    />
                    <Label htmlFor="upgrade" className="font-normal cursor-pointer">
                      Upgrade to 4K
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* Footer — pinned to bottom */}
            <div className="flex items-center border-t bg-muted/50 px-6 py-6">
              {editItem && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onDelete(editItem.id);
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">{editItem ? "Save Changes" : "Add"}</Button>
              </div>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
