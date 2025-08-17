import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { subject } = await req.json()

  if (!subject) {
    return NextResponse.json({ error: 'Missing subject' }, { status: 400 })
  }

  if (!process.env.COHERE_API_KEY) {
    return NextResponse.json({ error: 'Cohere API key not configured' }, { status: 500 })
  }

  const prompt = `
Buatkan outline presentasi PowerPoint tentang topik berikut:

Topik: "${subject}"
Jumlah slide: sekitar 10 dengan penutup terimakasih.

Kembalikan output dalam format JSON array, dengan struktur berikut:
[
  {
    "title": "Slide X: Judul Slide",
    "bullets": ["Poin pertama", "Poin kedua", ...]
  },
  ...
]

**Kembalikan hanya array JSON-nya, dalam code block JSON seperti ini:**
\`\`\`json
[...]
\`\`\`
`

  let res
  try {
    res = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-r',
        message: prompt,
        max_tokens: 1200,
        temperature: 0.7,
      }),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect to Cohere API' }, { status: 500 })
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: 'Cohere API error', details: error },
      { status: res.status }
    )
  }

  const data = await res.json()
  const rawText = data.text || ''

  // Ekstrak dari code block
  const codeBlockMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonString = codeBlockMatch ? codeBlockMatch[1] : rawText

  try {
    const outline = JSON.parse(jsonString)
    return NextResponse.json({ outline })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON format from AI', raw: rawText }, { status: 500 })
  }
}