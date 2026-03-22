import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { MediaItem, Season } from "@/lib/types";

interface DbRow {
  id: string;
  tmdb_id: number | null;
  type: string;
  title: string;
  year: number;
  genre: string;
  format: string;
  runtime: number;
  cover_art: string;
  edition: string | null;
  is_digitized: boolean;
  marked_for_upgrade: boolean;
  has_special_features: boolean;
  number_of_discs: number | null;
  number_of_episodes: number | null;
  seasons: Season[] | null;
  created_at: string;
  updated_at: string;
}

function rowToItem(row: DbRow): MediaItem {
  return {
    id: row.id,
    tmdbId: row.tmdb_id ?? undefined,
    type: row.type as MediaItem["type"],
    title: row.title,
    year: row.year,
    genre: row.genre,
    format: row.format as MediaItem["format"],
    runtime: row.runtime,
    coverArt: row.cover_art,
    edition: row.edition ?? undefined,
    isDigitized: row.is_digitized,
    markedForUpgrade: row.marked_for_upgrade,
    hasSpecialFeatures: row.has_special_features,
    numberOfDiscs: row.number_of_discs ?? undefined,
    numberOfEpisodes: row.number_of_episodes ?? undefined,
    seasons: row.seasons ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function itemToRow(item: MediaItem) {
  return {
    id: item.id,
    tmdb_id: item.tmdbId ?? null,
    type: item.type,
    title: item.title,
    year: item.year,
    genre: item.genre,
    format: item.format,
    runtime: item.runtime,
    cover_art: item.coverArt,
    edition: item.edition ?? null,
    is_digitized: item.isDigitized,
    marked_for_upgrade: item.markedForUpgrade,
    has_special_features: item.hasSpecialFeatures,
    number_of_discs: item.numberOfDiscs ?? null,
    number_of_episodes: item.numberOfEpisodes ?? null,
    seasons: item.seasons ?? [],
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

// GET — fetch all items
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("media_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data as DbRow[]).map(rowToItem);
  return NextResponse.json(items);
}

// POST — create a new item
export async function POST(req: NextRequest) {
  const item: MediaItem = await req.json();
  const row = itemToRow(item);

  const { data, error } = await supabaseAdmin
    .from("media_items")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(rowToItem(data as DbRow));
}

// PUT — update an existing item
export async function PUT(req: NextRequest) {
  const item: MediaItem = await req.json();
  const row = itemToRow(item);

  const { data, error } = await supabaseAdmin
    .from("media_items")
    .update(row)
    .eq("id", item.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(rowToItem(data as DbRow));
}

// DELETE — delete an item
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  const { error } = await supabaseAdmin
    .from("media_items")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
