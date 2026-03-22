import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB_API_KEY not configured" },
      { status: 500 }
    );
  }

  const url = `${TMDB_BASE}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json(
      { error: "TMDB request failed" },
      { status: res.status }
    );
  }

  const data = await res.json();

  const results = data.results
    .filter(
      (r: Record<string, unknown>) =>
        r.media_type === "movie" || r.media_type === "tv"
    )
    .slice(0, 8)
    .map((r: Record<string, unknown>) => ({
      id: r.id,
      type: r.media_type === "movie" ? "movie" : "tv",
      title:
        r.media_type === "movie"
          ? (r.title as string)
          : (r.name as string),
      year: extractYear(
        r.media_type === "movie"
          ? (r.release_date as string)
          : (r.first_air_date as string)
      ),
      coverArt: r.poster_path
        ? `https://image.tmdb.org/t/p/w300${r.poster_path}`
        : null,
      overview: r.overview
        ? (r.overview as string).slice(0, 120)
        : "",
    }));

  return NextResponse.json({ results });
}

function extractYear(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null;
  const year = parseInt(dateStr.slice(0, 4), 10);
  return isNaN(year) ? null : year;
}
