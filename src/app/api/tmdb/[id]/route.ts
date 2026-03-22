import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const type = request.nextUrl.searchParams.get("type") || "movie";

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB_API_KEY not configured" },
      { status: 500 }
    );
  }

  const endpoint = type === "tv" ? "tv" : "movie";
  const url = `${TMDB_BASE}/${endpoint}/${id}?api_key=${apiKey}&language=en-US&append_to_response=credits`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json(
      { error: "TMDB request failed" },
      { status: res.status }
    );
  }

  const data = await res.json();

  const genres: string[] = (
    data.genres as { id: number; name: string }[]
  ).map((g) => g.name);

  let runtime: number | null = null;
  if (type === "movie") {
    runtime = data.runtime ?? null;
  } else {
    const epRuntimes = data.episode_run_time as number[] | undefined;
    runtime = epRuntimes && epRuntimes.length > 0 ? epRuntimes[0] : null;
  }

  let numberOfSeasons: number | null = null;
  let numberOfEpisodes: number | null = null;
  if (type === "tv") {
    numberOfSeasons = data.number_of_seasons ?? null;
    numberOfEpisodes = data.number_of_episodes ?? null;
  }

  // Overview
  const overview: string = data.overview || "";

  // Credits — producers and top cast
  const credits = data.credits || {};
  const crew = credits.crew || [];
  const cast = credits.cast || [];

  const producers: string[] = crew
    .filter((c: { job: string }) => c.job === "Producer" || c.job === "Executive Producer")
    .slice(0, 5)
    .map((c: { name: string }) => c.name);

  // For TV, also check "created_by"
  const createdBy: string[] = (data.created_by || []).map((c: { name: string }) => c.name);

  const topCast: string[] = cast
    .slice(0, 6)
    .map((c: { name: string }) => c.name);

  return NextResponse.json({
    genres,
    runtime,
    numberOfSeasons,
    numberOfEpisodes,
    overview,
    producers: type === "tv" && createdBy.length > 0 ? createdBy : producers,
    topCast,
  });
}
