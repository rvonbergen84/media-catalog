"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FORMAT_LABELS, MediaItem, UPGRADE_PATH } from "@/lib/types";
import {
  ArrowUpCircle,
  Check,
  X,
} from "lucide-react";

interface Props {
  items: MediaItem[];
  onEdit: (item: MediaItem) => void;
}

function formatRuntime(minutes: number): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function BoolIcon({ value }: { value: boolean }) {
  return value ? (
    <Check className="h-4 w-4 text-neon-cyan" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground/40" />
  );
}

export function MediaTable({ items, onEdit }: Props) {
  return (
    <div className="border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12"></TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Year</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Edition</TableHead>
            <TableHead>Format</TableHead>
            <TableHead className="text-right">Runtime</TableHead>
            <TableHead className="text-center">Digital</TableHead>
            <TableHead className="text-center">Extras</TableHead>
            <TableHead className="text-center">Upgrade</TableHead>
            <TableHead className="text-center">TV Info</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={12}
                className="h-24 text-center text-muted-foreground"
              >
                No items found
              </TableCell>
            </TableRow>
          )}
          {items.map((item) => {
            const upgradeTarget = UPGRADE_PATH[item.format];
            return (
              <TableRow
                key={item.id}
                className="group cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onEdit(item)}
              >
                <TableCell className="p-1">
                  <div className="h-10 w-7 overflow-hidden bg-muted">
                    <img
                      src={item.coverArt}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase tracking-wide"
                  >
                    {item.type === "tv" ? "TV" : "Movie"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {item.year}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.genre}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {item.edition || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">
                    {FORMAT_LABELS[item.format]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {formatRuntime(item.runtime)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <BoolIcon value={item.isDigitized} />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <BoolIcon value={item.hasSpecialFeatures} />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {item.markedForUpgrade && upgradeTarget ? (
                    <div className="flex justify-center">
                      <Badge className="bg-neon-amber/20 text-neon-amber border-neon-amber/30 text-[10px]">
                        <ArrowUpCircle className="h-3 w-3 mr-1" />
                        {FORMAT_LABELS[upgradeTarget]}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center font-mono tabular-nums text-xs text-muted-foreground">
                  {item.type === "tv" ? (
                    <div className="space-y-0.5">
                      <span>
                        {item.numberOfEpisodes ?? "—"} ep
                        {(item.numberOfEpisodes ?? 0) !== 1 ? "s" : ""}
                      </span>
                      {item.seasons && item.seasons.length > 0 && (
                        <div className="text-[10px] text-neon-cyan">
                          {item.seasons.filter((s) => s.owned).length}/
                          {item.seasons.length} seasons
                        </div>
                      )}
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
