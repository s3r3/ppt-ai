// src/app/api/generate-content-map/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ========== TYPES ==========
type Layout =
  | 'title'
  | 'bulleted-list'
  | 'image'
  | 'table'
  | 'chart'
  | 'quote'
  | 'comparison'
  | 'conclusion'
  | 'three-images-with-description'; // ✅ NEW

type ChartType = 'bar' | 'line' | 'pie' | 'scatter';

interface Dataset {
  label: string;
  data: any[];
}

interface ChartContent {
  type: ChartType;
  labels?: string[];
  datasets: Dataset[];
}

interface Comparison {
  left: { title: string; description: string };
  right: { title: string; description: string };
}

export interface Slide {
  layout: Layout;
  title?: string;
  subtitle?: string;
  text?: string;
  bullets?: string[];
  table?: { data: string[][] };
  content?: ChartContent;
  imageUrl?: string;
  caption?: string;
  images?: string[]; // ✅ NEW (for three-images-with-description)
  description?: string; // ✅ NEW (for three-images-with-description)
  left?: any;
  right?: any;
  conclusion?: string;
  comparison?: Comparison;
}

export interface ContentMap {
  topic?: string;
  slides: Slide[];
}

// ==================== IMAGE SEARCH (UNSPLASH) ====================

const imageCache: Map<string, string | null> = new Map();

function cleanUnsplashUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete('ixid');
    return urlObj.toString();
  } catch {
    return url;
  }
}

async function searchImage(query: string): Promise<string | null> {
  if (imageCache.has(query)) return imageCache.get(query) ?? null;

  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) return null;

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const rawUrl = data?.results?.[0]?.urls?.regular || null;
    if (!rawUrl) return null;

    const cleanedUrl = cleanUnsplashUrl(rawUrl);
    imageCache.set(query, cleanedUrl);
    return cleanedUrl;
  } catch (err) {
    console.error('Error fetching image:', err);
    return null;
  }
}

// ==================== MAIN ROUTE ====================

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { outline } = body as { outline: Array<{ title: string; [k: string]: any }> };

    if (!outline || !Array.isArray(outline)) {
      return NextResponse.json({ message: 'Invalid outline format' }, { status: 400 });
    }
    for (const item of outline) {
      if (typeof item !== 'object' || !item.title) {
        return NextResponse.json({ message: 'Invalid outline item format' }, { status: 400 });
      }
    }

    const systemPrompt = `
Kamu adalah asisten ahli presentasi. Berdasarkan outline slide presentasi, buatlah struktur contentMap lengkap untuk sebuah presentasi PowerPoint yang menarik, kreatif, dan variatif.

Gunakan berbagai jenis layout: title, bulleted-list, image, table, chart, quote, comparison, conclusion, dan three-images-with-description.

WAJIB:
1) Tambahkan minimal 1 slide "conclusion" di akhir presentasi.
2) Jika ada indikasi perbandingan (mis. "vs", "kelebihan", "kekurangan", "perbandingan"), tambahkan minimal 1 slide "comparison".
3) Jika ada topik yang cocok untuk menampilkan beberapa gambar sekaligus, gunakan layout "three-images-with-description" dengan format:
{
  "layout": "three-images-with-description",
  "title": string,
  "images": string[3],
  "description": string
}
4) Hanya keluarkan JSON murni sesuai skema berikut:

{
  "topic": string,
  "slides": Array<{
    "layout": ${JSON.stringify([
      'title',
      'bulleted-list',
      'image',
      'table',
      'chart',
      'quote',
      'comparison',
      'conclusion',
      'three-images-with-description'
    ])},
    "title"?: string,
    "subtitle"?: string,
    "text"?: string,
    "bullets"?: string[],
    "table"?: { "data": string[][] },
    "content"?: {
      "type": "bar" | "line" | "pie" | "scatter",
      "labels"?: string[],
      "datasets": Array<{ "label": string, "data": any[] }>
    },
    "imageUrl"?: string,
    "caption"?: string,
    "images"?: string[],
    "description"?: string,
    "left"?: any,
    "right"?: any,
    "conclusion"?: string,
    "comparison"?: {
      "left": { "title": string, "description": string },
      "right": { "title": string, "description": string }
    }
  }>
}`;

    const userPrompt = `Outline Presentasi:\n${JSON.stringify(outline, null, 2)}\n\nSilakan buat contentMap JSON:`;


    if (!process.env.COHERE_API_KEY) {
      return NextResponse.json({ message: 'COHERE_API_KEY not configured' }, { status: 500 });
    }

    const cohereStart = Date.now();
    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'command-r-plus',
        message: userPrompt,
        preamble: systemPrompt,
        max_tokens: 1500,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    console.log(`Cohere API call: ${Date.now() - cohereStart}ms`);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Cohere API error: ${errData.message || response.statusText}`);
    }

    const data = await response.json();

    let contentMap: ContentMap;
    try {
      const jsonString =
        typeof data.text === 'string'
          ? data.text
          : typeof data.message === 'string'
          ? data.message
          : null;

      if (!jsonString) throw new Error('Cohere response missing valid JSON text');
      contentMap = JSON.parse(jsonString) as ContentMap;
    } catch (e) {
      console.error('Failed to parse Cohere response:', data);
      return NextResponse.json({ error: 'Failed to parse Cohere response' }, { status: 500 });
    }

    if (!contentMap?.slides || !Array.isArray(contentMap.slides)) {
      return NextResponse.json({ error: 'Invalid content map format' }, { status: 500 });
    }

    const hasConclusion = contentMap.slides.some((s) => s.layout === 'conclusion');
    if (!hasConclusion) {
      contentMap.slides.push({
        layout: 'conclusion',
        title: 'Kesimpulan',
        conclusion: 'Presentasi ini memberikan gambaran menyeluruh mengenai topik yang dibahas.',
      });
    }

    const needsComparison = outline.some((item) =>
      /vs|perbandingan|kekurangan|kelebihan/i.test(item.title)
    );
    const hasComparison = contentMap.slides.some((s) => s.layout === 'comparison');
    if (needsComparison && !hasComparison) {
      contentMap.slides.push({
        layout: 'comparison',
        title: 'Perbandingan',
        comparison: {
          left: { title: 'Opsi A', description: 'Kelebihan dan kekurangan opsi A.' },
          right: { title: 'Opsi B', description: 'Kelebihan dan kekurangan opsi B.' },
        },
      });
    }

    // ✅ Auto fetch image for new layout
    for (const slide of contentMap.slides) {
      if (slide.layout === 'three-images-with-description' && (!slide.images || slide.images.length < 3)) {
        slide.images = [];
        for (let i = 0; i < 3; i++) {
          const query = `${slide.title || contentMap.topic} ${i + 1}`;
          const img = await searchImage(query);
          if (img) slide.images.push(img);
        }
      }

      if (['image', 'conclusion'].includes(slide.layout) && !slide.imageUrl) {
        const query = slide.title || contentMap.topic || '';
        const imageUrl = await searchImage(query || 'presentation');
        if (imageUrl) slide.imageUrl = imageUrl;
      }
    }

    console.log(`Total processing: ${Date.now() - startTime}ms`);
    return NextResponse.json({ contentMap }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to generate content map' }, { status: 500 });
  }
}
