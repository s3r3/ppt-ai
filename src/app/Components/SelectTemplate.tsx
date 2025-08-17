import { useState, useEffect, useCallback } from 'react'

export default function SelectTemplate({
  onSelect,
}: {
  onSelect: (template: any) => void
}) {
  const [templateId, setTemplateId] = useState('')
  const [templates, setTemplates] = useState<any[]>([])

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch('/templates/index.json')
      const data = await res.json()
      setTemplates(data)
      if (data.length > 0) {
        selectTemplate(data[0])
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    }
  }, [])

  const selectTemplate = useCallback((template: any) => {
    setTemplateId(template.id)
    const src = template.coverUrl
    calcSubjectColor(src).then((color) => {
      document.body.style.background = color
    })
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [])

  const selectedTemplate = templates.find((t) => t.id === templateId)

  return (
    <div className="template_content">
      <h2 className="text-xl font-semibold mb-4">🎨 Pilih Template</h2>

      <div className="flex flex-wrap gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`border-2 rounded-md p-2 cursor-pointer ${template.id === templateId ? 'border-blue-500' : 'border-transparent'}`}
            onClick={() => selectTemplate(template)}
          >
            <img src={template.coverUrl} alt={template.name} className="w-40 h-24 object-cover rounded" />
            <div className="text-center mt-2 text-sm">{template.name}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={!templateId}
          onClick={() => {
            if (selectedTemplate) {
              onSelect(selectedTemplate)
            } else {
              alert('Mohon pilih template terlebih dahulu.')
            }
          }}
        >
          Lanjut: Generate PPT
        </button>
      </div>
    </div>
  )
}

async function calcSubjectColor(src: string): Promise<string> {
  const img = new Image()
  await new Promise<void>((resolve) => {
    const sameOrigin = src.startsWith(window.location.origin) || src.startsWith('/')
    if (!sameOrigin) img.crossOrigin = 'anonymous'
    img.src = src
    img.onload = () => resolve()
    img.onerror = () => resolve()
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = img.width
  canvas.height = img.height
  ctx?.drawImage(img, 0, 0)

  const data = ctx?.getImageData(0, 0, canvas.width, canvas.height).data
  if (!data) return 'white'

  const colorMap: Record<string, number> = {}

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2]
    const brightness = r + g + b
    if (brightness < 50 || brightness > 660) continue
    const key = `${r},${g},${b}`
    colorMap[key] = (colorMap[key] || 0) + 1
  }

  const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1])
  const topColors = sorted.slice(0, 3).map(([key]) => key)

  return `linear-gradient(to bottom right, rgb(${topColors.join('), rgb(')}))`
}
