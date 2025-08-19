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
  | 'three-images-with-description';

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
  images?: string[];
  description?: string;
  left?: any;
  right?: any;
  conclusion?: string;
  comparison?: Comparison;
}

export interface ContentMap {
  topic?: string;
  slides: Slide[];
}

// ==================== IMAGE SEARCH (GOOGLE) ====================
const imageCache: Map<string, string | null> = new Map();

async function searchImage(query: string): Promise<string | null> {
  if (!query) return null;
  if (imageCache.has(query)) return imageCache.get(query) ?? null;

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX;
    if (!apiKey || !cx) {
      console.warn('⚠️ GOOGLE_API_KEY or GOOGLE_CX not configured');
      return null;
    }

    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&searchType=image&q=${encodeURIComponent(
        query
      )}&num=1`
    );

    if (!res.ok) {
      console.warn('⚠️ Google image search failed:', res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    const url = data?.items?.[0]?.link ?? null;
    imageCache.set(query, url);
    return url;
  } catch (err) {
    console.error('❌ Error fetching Google image:', err);
    return null;
  }
}

// ==================== HELPERS ====================
function ensureConclusion(contentMap: ContentMap) {
  const hasConclusion = contentMap.slides.some((s) => s.layout === 'conclusion');
  if (!hasConclusion) {
    contentMap.slides.push({
      layout: 'conclusion',
      title: 'Kesimpulan',
      conclusion: 'Presentasi ini memberikan gambaran menyeluruh mengenai topik yang dibahas.',
    });
  }
}

function ensureComparison(contentMap: ContentMap, outline: { title: string }[]) {
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
}

async function enrichImages(contentMap: ContentMap) {
  for (const slide of contentMap.slides) {
    // three-images-with-description
    if (slide.layout === 'three-images-with-description') {
      if (!slide.images || slide.images.length < 3) {
        slide.images = [];
        for (let i = 0; i < 3; i++) {
          const query = `${slide.title || contentMap.topic} ${i + 1}`;
          const img = await searchImage(query);
          if (img) slide.images.push(img);
        }
      }
    }

    // single image slide
    if (['image', 'conclusion'].includes(slide.layout) && !slide.imageUrl) {
      const query = slide.title || contentMap.topic || '';
      const imageUrl = await searchImage(query || 'presentation');
      if (imageUrl) slide.imageUrl = imageUrl;
    }
  }
}

function buildSystemPrompt() {
  return `
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
4) Output harus berupa JSON murni sesuai skema berikut:

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
      
      'timeline',
      'process',
      'conclusion',
      'three-images-with-description'
    ])},
    "title"?: string,
    "subtitle"?: string,
    "text"?: string,
    "timeline"?: Array<{ "year": string, "event": string }>,
    "process"?: Array<{ "step": string, "description": string }>,
    "bullets"?: string[],
    "table"?: { "data": string[][] },
    "quote"?: { "text": string, "author": string },
    "chart"?: { "type": "bar" | "line" | "pie" | "scatter", "labels": string[], "d
    "content"?: {
      "type": "bar" | "line" | "pie" | "scatter",
      "labels"?: string[],
      "datasets": Array<{ "label": string, "data": any[] }>
    },
    "imageUrl"?: string ,
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
}

async function callCohere(systemPrompt: string, userPrompt: string) {
  const response = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'command-a-03-2025',
      message: userPrompt,
      preamble: systemPrompt,
      max_tokens: 1500,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Cohere API error: ${errData.message || response.statusText}`);
  }

  const data = await response.json();
  const jsonString =
    typeof data.text === 'string'
      ? data.text
      : typeof data.message === 'string'
      ? data.message
      : null;

  if (!jsonString) throw new Error('Cohere response missing valid JSON text');

  return JSON.parse(jsonString) as ContentMap;
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

    if (!process.env.COHERE_API_KEY) {
      return NextResponse.json({ message: 'COHERE_API_KEY not configured' }, { status: 500 });
    }

    const systemPrompt = buildSystemPrompt();
    const userPrompt = `Outline Presentasi:\n${JSON.stringify(
      outline,
      null,
      2
    )}\n\nSilakan buat contentMap JSON:`;

    // 🔹 Call Cohere
    const cohereStart = Date.now();
    const contentMap = await callCohere(systemPrompt, userPrompt);
    console.log(`⏱ Cohere API call: ${Date.now() - cohereStart}ms`);

    if (!contentMap?.slides || !Array.isArray(contentMap.slides)) {
      return NextResponse.json({ error: 'Invalid content map format' }, { status: 500 });
    }

    // 🔹 Ensure mandatory slides
    ensureConclusion(contentMap);
    ensureComparison(contentMap, outline);

    // 🔹 Fetch images
    await enrichImages(contentMap);

    console.log(`✅ Total processing: ${Date.now() - startTime}ms`);
    return NextResponse.json({ contentMap }, { status: 200 });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to generate content map' }, { status: 500 });
  }
}
