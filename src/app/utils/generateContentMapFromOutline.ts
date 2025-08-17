export async function generateContentMapFromOutline(outline: any[]) {
  // Ambil hanya 5 slide pertama dari outline
  const limitedOutline = outline.slice(0, 5);

  const res = await fetch("/api/generate-content-map", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ outline: limitedOutline }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to generate content map: ${res.status} - ${errorText}`);
  }

  try {
    const data = await res.json();
    return data;
  } catch (err) {
    const text = await res.text();
    throw new Error(`Failed to parse JSON response: ${err}\nResponse text: ${text}`);
  }
}
