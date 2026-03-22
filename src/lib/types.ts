export type MediaType = "movie" | "tv";
export type Format = "dvd" | "bluray" | "4k_bluray";

export const FORMAT_LABELS: Record<Format, string> = {
  dvd: "DVD",
  bluray: "Blu-ray",
  "4k_bluray": "4K Blu-ray",
};

export const UPGRADE_PATH: Record<Format, Format | null> = {
  dvd: "bluray",
  bluray: "4k_bluray",
  "4k_bluray": null,
};

export interface Season {
  number: number;
  owned: boolean;
}

export interface MediaItem {
  id: string;
  tmdbId?: number;
  type: MediaType;
  title: string;
  year: number;
  genre: string;
  format: Format;
  runtime: number; // minutes
  coverArt: string; // URL or data URI
  edition?: string; // e.g. "Criterion", "Special Edition", "Steelbook"
  isDigitized: boolean;
  markedForUpgrade: boolean;
  hasSpecialFeatures: boolean;
  // TV-specific
  numberOfDiscs?: number;
  numberOfEpisodes?: number;
  seasons?: Season[];
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = "card" | "table";
export type SortField = "year" | "title" | "createdAt";
export type SortDirection = "asc" | "desc";

export interface FilterState {
  type: MediaType | "all";
  format: Format | "all";
  genre: string;
  search: string;
}
