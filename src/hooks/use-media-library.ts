"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FilterState,
  MediaItem,
  SortDirection,
  SortField,
  ViewMode,
} from "@/lib/types";
import { loadItems, saveItems } from "@/lib/store";

export function useMediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortField, setSortField] = useState<SortField>("year");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filter, setFilter] = useState<FilterState>({
    type: "all",
    format: "all",
    genre: "",
    search: "",
  });

  useEffect(() => {
    setItems(loadItems());
  }, []);

  const persist = useCallback((next: MediaItem[]) => {
    setItems(next);
    saveItems(next);
  }, []);

  const addItem = useCallback(
    (item: MediaItem) => {
      persist([...items, item]);
    },
    [items, persist]
  );

  const updateItem = useCallback(
    (updated: MediaItem) => {
      persist(items.map((i) => (i.id === updated.id ? updated : i)));
    },
    [items, persist]
  );

  const deleteItem = useCallback(
    (id: string) => {
      persist(items.filter((i) => i.id !== id));
    },
    [items, persist]
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
