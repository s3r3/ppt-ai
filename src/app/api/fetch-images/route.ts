// src/app/api/fetch-images/route.ts
import { NextResponse } from "next/server";

// Base64 placeholder kecil (1x1 pixel transparan PNG)
const PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8X1hQAAAAASUVORK5CYII=";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q"); // pakai parameter q
  if (!query) {
    return NextResponse.json({ data: PLACEHOLDER, error: "Missing query" }, { status: 400 });
  }

  try {
    const cx = process.env.GOOGLE_CX;
    const key = process.env.GOOGLE_API_KEY;
    if (!cx || !key) throw new Error("Google API Key / CX not configured");

    // 1. Search image via Google Custom Search
    const searchRes = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&searchType=image&num=1&q=${encodeURIComponent(
        query
      )}`
    );

    if (!searchRes.ok) throw new Error("Google Search API failed");

    const searchData = await searchRes.json();
    const imageUrl = searchData.items?.[0]?.link;
    if (!imageUrl) throw new Error("No image found");

    // 2. Fetch image binary
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Failed to fetch image");

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // 3. Return data: URL base64 lengkap
    return NextResponse.json(
      { data: `data:${contentType};base64,${base64}` },
      { status: 200, headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate" } }
    );
  } catch (err: any) {
    console.error("❌ Error fetching image:", err.message || err);
    return NextResponse.json({ data: PLACEHOLDER }, { status: 200 });
  }
}
