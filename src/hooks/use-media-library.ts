"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FilterState,
  MediaItem,
  SortDirection,
  SortField,
  ViewMode,
} from "@/lib/types";

export function useMediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortField, setSortField] = useState<SortField>("year");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filter, setFilter] = useState<FilterState>({
    type: "all",
    format: "all",
    genre: "",
    search: "",
  });

  // Fetch all items from the database on mount
  useEffect(() => {
    fetch("/api/media")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addItem = useCallback(
    async (item: MediaItem) => {
      setItems((prev) => [...prev, item]);
      try {
        const res = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (!res.ok) {
          // Revert on failure
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          console.error("Failed to save item");
        }
      } catch {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    },
    []
  );

  const updateItem = useCallback(
    async (updated: MediaItem) => {
      setItems((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
      try {
        const res = await fetch("/api/media", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (!res.ok) console.error("Failed to update item");
      } catch {
        console.error("Failed to update item");
      }
    },
    []
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const prev = items;
      setItems((current) => current.filter((i) => i.id !== id));
      try {
        const res = await fetch("/api/media", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) {
          setItems(prev);
          console.error("Failed to delete item");
        }
      } catch {
        setItems(prev);
      }
    },
    [items]
  );

  const genres = useMemo(() => {
    const set = new Set(items.map((i) => i.genre).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (filter.type !== "all") {
      result = result.filter((i) => i.type === filter.type);
    }
    if (filter.format !== "all") {
      result = result.filter((i) => i.format === filter.format);
    }
    if (filter.genre) {
      result = result.filter((i) => i.genre === filter.genre);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter((i) => i.title.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "year") {
        cmp = a.year - b.year;
      } else if (sortField === "title") {
        cmp = a.title.localeCompare(b.title);
      } else {
        cmp = a.createdAt.localeCompare(b.createdAt);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [items, filter, sortField, sortDirection]);

  return {
    items: filteredItems,
    allItems: items,
    loading,
    viewMode,
    setViewMode,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    filter,
    setFilter,
    addItem,
    updateItem,
    deleteItem,
    genres,
  };
}
