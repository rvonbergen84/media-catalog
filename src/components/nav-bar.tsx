"use client";

import { Button } from "@/components/ui/button";
import { FilterState, MediaType } from "@/lib/types";
import { Moon, Plus, Sun } from "lucide-react";

interface Props {
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
  onAdd: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const TYPE_TABS: { value: MediaType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV" },
];

export function NavBar({
  filter,
  onFilterChange,
  onAdd,
  darkMode,
  onToggleDarkMode,
}: Props) {
  return (
    <header className="w-full px-6 sm:px-8 lg:px-12 pt-8 pb-4">
      <div className="flex items-center justify-between gap-8">
        {/* Left — Brand */}
        <h1 className="text-xl font-medium leading-none select-none" style={{ letterSpacing: "0.07rem" }}>
          MEDIA LIBRARY
        </h1>

        {/* Right — Tabs + Dark mode + Add */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-1 font-mono text-xs uppercase tracking-widest">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() =>
                  onFilterChange({ ...filter, type: tab.value })
                }
                className={`px-3 py-1.5 transition-colors underline-offset-4 decoration-1 ${
                  filter.type === tab.value
                    ? "text-foreground underline"
                    : "text-muted-foreground hover:text-foreground hover:underline"
                }`}
              >
                {tab.label.toUpperCase()}
              </button>
            ))}
          </nav>
          <Button onClick={onAdd} className="hidden sm:inline-flex h-8 font-mono text-xs uppercase tracking-widest hover:!bg-[#4A7FE5]">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            ADD
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
