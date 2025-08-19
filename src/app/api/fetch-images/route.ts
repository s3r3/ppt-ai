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

  const searchStart = Date.now();

  // Helper untuk mengambil gambar dan mengonversi ke Base64
  const fetchImageToBase64 = async (imageUrl: string) => {
    try {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error("Failed to fetch image");
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return `data:${contentType};base64,${base64}`;
    } catch (err) {
      console.warn(`⚠️ Failed to fetch image from ${imageUrl}:`, err);
      return null;
    }
  };

  // 1. Unsplash
  try {
    const unsplashKey = process.env.UNSPLASH_API_KEY;
    if (unsplashKey) {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=${unsplashKey}`,
        { headers: { "Accept-Version": "v1" } }
      );
      if (res.ok) {
        const data = await res.json();
        const imageUrl = data.results?.[0]?.urls?.regular;
        if (imageUrl) {
          const base64Image = await fetchImageToBase64(imageUrl);
          if (base64Image) {
            console.log(`✅ Unsplash found image for "${query}" in ${Date.now() - searchStart}ms`);
            return NextResponse.json(
              { data: base64Image },
              { status: 200, headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate" } }
            );
          }
        }
      }
    } else {
      console.warn("⚠️ UNSPLASH_API_KEY not configured");
    }
  } catch (err) {
    console.warn("⚠️ Unsplash search failed:", err);
  }

  // 2. Pexels
  try {
    const pexelsKey = process.env.PEXELS_API_KEY;
    if (pexelsKey) {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
        { headers: { Authorization: pexelsKey } }
      );
      if (res.ok) {
        const data = await res.json();
        const imageUrl = data.photos?.[0]?.src?.medium;
        if (imageUrl) {
          const base64Image = await fetchImageToBase64(imageUrl);
          if (base64Image) {
            console.log(`✅ Pexels found image for "${query}" in ${Date.now() - searchStart}ms`);
            return NextResponse.json(
              { data: base64Image },
              { status: 200, headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate" } }
            );
          }
        }
      }
    } else {
      console.warn("⚠️ PEXELS_API_KEY not configured");
    }
  } catch (err) {
    console.warn("⚠️ Pexels search failed:", err);
  }

  // 3. Google Custom Search
  try {
    const cx = process.env.GOOGLE_CX;
    const key = process.env.GOOGLE_API_KEY;
    if (!cx || !key) throw new Error("Google API Key / CX not configured");

    const searchRes = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&searchType=image&num=1&q=${encodeURIComponent(
        query
      )}`
    );

    if (!searchRes.ok) throw new Error("Google Search API failed");

    const searchData = await searchRes.json();
    const imageUrl = searchData.items?.[0]?.link;
    if (imageUrl) {
      const base64Image = await fetchImageToBase64(imageUrl);
      if (base64Image) {
        console.log(`✅ Google found image for "${query}" in ${Date.now() - searchStart}ms`);
        return NextResponse.json(
          { data: base64Image },
          { status: 200, headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate" } }
        );
      }
    }
  } catch (err) {
    console.warn("⚠️ Google search failed:", err);
  }

  // Fallback to placeholder
  console.log(`⚠️ No image found for "${query}", using placeholder`);
  return NextResponse.json(
    { data: PLACEHOLDER },
    { status: 200, headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate" } }
  );
}