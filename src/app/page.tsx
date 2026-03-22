"use client";

import { useEffect, useState } from "react";
import { useMediaLibrary } from "@/hooks/use-media-library";
import { MediaFormDialog } from "@/components/media-form-dialog";
import { MediaDetailDialog } from "@/components/media-detail-dialog";
import { MediaCard, CardRect } from "@/components/media-card";
import { MediaTable } from "@/components/media-table";
import { NavBar } from "@/components/nav-bar";
import {
  Format,
  FORMAT_LABELS,
  MediaItem,
  SortField,
} from "@/lib/types";
import { Toaster, toast } from "sonner";
import { Film, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

const SORT_LABELS: Record<SortField, string> = {
  year: "Release Year",
  title: "Title",
  createdAt: "Date Added",
};

export default function Home() {
  const lib = useMediaLibrary();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [originRect, setOriginRect] = useState<CardRect | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("media-library-dark-mode");
    const shouldBeDark = saved === "true";
    setDarkMode(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("media-library-dark-mode", String(next));
      return next;
    });
  };

  const handleAdd = () => {
    setEditItem(null);
    setEditDialogOpen(true);
  };

  // Card click -> detail view
  const handleCardClick = (item: MediaItem, rect: CardRect | null) => {
    setOriginRect(rect);
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  // Edit button in detail view -> edit dialog
  const handleEditFromDetail = (item: MediaItem) => {
    setDetailDialogOpen(false);
    // Small delay so detail dialog closes before edit opens
    setTimeout(() => {
      setEditItem(item);
      setEditDialogOpen(true);
    }, 150);
  };

  const handleSave = (item: MediaItem) => {
    if (editItem) {
      lib.updateItem(item);
      toast.success("Updated", { description: item.title });
    } else {
      lib.addItem(item);
      toast.success("Added", { description: item.title });
    }
  };

  const handleDelete = (id: string) => {
    const item = lib.allItems.find((i) => i.id === id);
    lib.deleteItem(id);
    toast.success("Deleted", { description: item?.title });
  };

  const formatLabel =
    lib.filter.format === "all" ? "All Formats" : FORMAT_LABELS[lib.filter.format];
  const genreLabel =
    !lib.filter.genre || lib.filter.genre === "" ? "All Genres" : lib.filter.genre;
  const sortLabel = SORT_LABELS[lib.sortField];

  return (
    <div className="min-h-screen">
      <Toaster position="bottom-right" />
      <NavBar
        filter={lib.filter}
        onFilterChange={lib.setFilter}
        onAdd={handleAdd}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Search + Filters */}
      <div className="w-full px-4 sm:px-8 lg:px-12 pt-6 pb-10">
        <div className="w-full">
          {/* Large search field + filter toggle */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search collection..."
              className="w-full h-14 pl-12 pr-28 bg-transparent border-b-2 border-foreground/20 focus:border-foreground text-lg font-sans placeholder:text-muted-foreground outline-none transition-colors"
              value={lib.filter.search}
              onChange={(e) =>
                lib.setFilter({ ...lib.filter, search: e.target.value })
              }
            />
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              {filtersOpen ? "− Filters" : "+ Filters"}
            </button>
          </div>

          {/* Collapsible filters */}
          {filtersOpen && (
            <div className="mt-4 flex flex-wrap items-start gap-3">
              <Select
                value={lib.filter.format}
                onValueChange={(v) =>
                  lib.setFilter({ ...lib.filter, format: v as Format | "all" })
                }
              >
                <SelectTrigger className="w-[150px] text-sm font-mono">
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
                value={lib.filter.genre || "all"}
                onValueChange={(v) =>
                  lib.setFilter({ ...lib.filter, genre: v === "all" ? "" : v ?? "" })
                }
              >
                <SelectTrigger className="w-[150px] text-sm font-mono">
                  <span>{genreLabel}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {lib.genres.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={lib.sortField}
                onValueChange={(v) => lib.setSortField(v as SortField)}
              >
                <SelectTrigger className="w-[150px] text-sm font-mono">
                  <span>{sortLabel}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year">Release Year</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="createdAt">Date Added</SelectItem>
                </SelectContent>
              </Select>
              <button
                onClick={() =>
                  lib.setSortDirection(
                    lib.sortDirection === "asc" ? "desc" : "asc"
                  )
                }
                className="h-9 px-3 border border-border text-sm font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                {lib.sortDirection === "asc" ? "A → Z" : "Z → A"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="w-full px-4 sm:px-8 lg:px-12 pb-24 sm:pb-20">
        {lib.items.length > 0 && (
          <div className="mb-4">
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {lib.items.length}
              {lib.items.length !== lib.allItems.length &&
                ` / ${lib.allItems.length}`}{" "}
              results
            </span>
          </div>
        )}
        {lib.items.length === 0 && lib.allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Film className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-2xl font-medium mb-2">No media yet</h2>
            <p className="text-sm text-muted-foreground font-mono">
              Add your first movie or TV series to get started.
            </p>
          </div>
        ) : lib.viewMode === "card" ? (
          <div className="grid gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-14 grid-cols-2 lg:grid-cols-3">
            {lib.items.map((item) => (
              <MediaCard key={item.id} item={item} onEdit={handleCardClick} darkMode={darkMode} />
            ))}
          </div>
        ) : (
          <MediaTable items={lib.items} onEdit={(item) => handleCardClick(item, null)} />
        )}
      </main>

      {/* Detail dialog — shown on card click */}
      <MediaDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        item={selectedItem}
        onEdit={handleEditFromDetail}
        darkMode={darkMode}
        originRect={originRect}
      />

      {/* Edit dialog — shown from detail view or Add button */}
      <MediaFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSave}
        onDelete={handleDelete}
        editItem={editItem}
      />

      {/* Mobile sticky Add button */}
      <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Button onClick={handleAdd} className="h-12 px-6 font-mono text-xs uppercase tracking-widest shadow-lg hover:!bg-[#4A7FE5]">
          <Plus className="h-4 w-4 mr-2" />
          ADD
        </Button>
      </div>
    </div>
  );
}
