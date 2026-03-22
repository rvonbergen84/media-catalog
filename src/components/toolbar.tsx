"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FilterState,
  Format,
  FORMAT_LABELS,
  SortDirection,
  SortField,
  ViewMode,
} from "@/lib/types";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Grid3X3,
  List,
} from "lucide-react";

interface Props {
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (dir: SortDirection) => void;
  genres: string[];
  itemCount: number;
  totalCount: number;
}

const SORT_LABELS: Record<SortField, string> = {
  year: "Release Year",
  title: "Title",
  createdAt: "Date Added",
};

export function Toolbar({
  filter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  sortField,
  onSortFieldChange,
  sortDirection,
  onSortDirectionChange,
  genres,
  itemCount,
  totalCount,
}: Props) {
  const formatLabel =
    filter.format === "all" ? "All Formats" : FORMAT_LABELS[filter.format];
  const genreLabel = !filter.genre || filter.genre === "" ? "All Genres" : filter.genre;
  const sortLabel = SORT_LABELS[sortField];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        value={filter.format}
        onValueChange={(v) =>
          onFilterChange({ ...filter, format: v as Format | "all" })
        }
      >
        <SelectTrigger className="w-[150px] text-sm">
          <span>{formatLabel}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Formats</SelectItem>
          {(Object.entries(FORMAT_LABELS) as [Format, string][]).map(
            ([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
      <Select
        value={filter.genre || "all"}
        onValueChange={(v) =>
          onFilterChange({ ...filter, genre: v === "all" ? "" : v })
        }
      >
        <SelectTrigger className="w-[150px] text-sm">
          <span>{genreLabel}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Genres</SelectItem>
          {genres.map((g) => (
            <SelectItem key={g} value={g}>
              {g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1 ml-auto">
        <span className="text-xs text-muted-foreground font-mono tabular-nums mr-2">
          {itemCount}
          {itemCount !== totalCount && ` / ${totalCount}`}
        </span>
        <div className="flex border border-border overflow-hidden">
          <button
            aria-label="Card view"
            onClick={() => onViewModeChange("card")}
            className={`h-9 w-9 flex items-center justify-center transition-colors ${
              viewMode === "card"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            aria-label="Table view"
            onClick={() => onViewModeChange("table")}
            className={`h-9 w-9 flex items-center justify-center transition-colors ${
              viewMode === "table"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        <Select
          value={sortField}
          onValueChange={(v) => onSortFieldChange(v as SortField)}
        >
          <SelectTrigger className="w-[140px] text-sm">
            <span>{sortLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="year">Release Year</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="createdAt">Date Added</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() =>
            onSortDirectionChange(
              sortDirection === "asc" ? "desc" : "asc"
            )
          }
        >
          {sortDirection === "asc" ? (
            <ArrowUpAZ className="h-4 w-4" />
          ) : (
            <ArrowDownAZ className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
