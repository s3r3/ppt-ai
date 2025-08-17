"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SelectTemplate from "@/app/Components/SelectTemplate"; // pastikan path benar
import { useContentMapStore } from "./store/app.store";

export default function Home() {
  const [inputType, setInputType] = useState<"subject" | "text" | "file">("subject");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [outline, setOutline] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [step, setStep] = useState<"input" | "outline" | "template">("input");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setContentMap } = useContentMapStore(); // <- simpan contentMap ke Zustand

 const generateOutline = async () => {
  if ((inputType === "subject" && !subject) ||
      (inputType === "text" && !text) ||
      (inputType === "file" && !file)) {
    alert("Mohon isi input sesuai jenis yang dipilih");
    return;
  }

  setLoading(true);
  try {
    let content = "";
    if (inputType === "subject") content = subject;
    if (inputType === "text") content = text;

    const res = await fetch("/api/generate-outline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: content }),
    });

    const data = await res.json();
    if (res.ok) {
      const extractedOutline = data.outline || [];
      setOutline(extractedOutline);
      await generateContentMap(extractedOutline); // Panggil generateContentMap setelah outline dihasilkan
      setStep("outline");
    } else {
      console.error("Gagal generate:", data.error);
      alert("Gagal generate outline");
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Terjadi kesalahan");
  } finally {
    setLoading(false);
  }
};

const generateContentMap = async (outline: any[]) => {
  try {
    const res = await fetch("/api/generate-content-map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outline }),
    });

    const data = await res.json();
    if (res.ok) {
      setContentMap(data.contentMap); // Simpan content map ke store
      console.log("✅ ContentMap:", data.contentMap);
    } else {
      console.error("Gagal generate content map:", data.error);
      alert("Gagal generate content map");
    }
  } catch (err) {
    console.error("Error:", err);
  }
};

  const handleNextStep = () => {
    if (outline.length === 0) return;
    setStep("template");
  };

  const handleTemplateSelected = (template: any) => {
    if (!template) {
      alert("Pilih template terlebih dahulu");
      return;
    }

    setSelectedTemplate(template);
    // bisa juga simpan ke Zustand jika ingin
    router.push("/dummy"); // lanjut ke preview & download
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-6 font-sans">

      <h1 className="text-3xl font-bold text-center mb-2">
        🤖 AI Generate PPT dari Topik, Teks, atau File
      </h1>

      {step === "input" && (
        <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-md border">
          <div className="mb-4">
            <select
              value={inputType}
              onChange={(e) => setInputType(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="subject">Dari Tema</option>
              <option value="text">Dari Teks</option>
              <option value="file">Dari File</option>
            </select>
          </div>

          {inputType === "subject" && (
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Contoh: Perubahan Iklim"
              className="w-full border border-black rounded px-3 py-2"
            />
          )}

          {inputType === "text" && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis atau tempelkan teks panjang (maks 2000 karakter)"
              rows={5}
              maxLength={2000}
              className="w-full border border-black rounded px-3 py-2"
            />
          )}

          {inputType === "file" && (
            <input
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border border-black rounded px-3 py-2"
            />
          )}

          <button
            onClick={generateOutline}
            disabled={loading}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-60 w-full"
          >
            {loading ? "Menghasilkan..." : "🚀 Generate Outline"}
          </button>
        </div>
      )}

      {step === "outline" && (
        <div className="w-full max-w-2xl bg-gray-50 p-6 rounded-lg shadow-inner">
          <h2 className="text-xl font-semibold mb-4">📝 Outline Presentasi</h2>
          {outline.map((slide, idx) => (
            <div key={idx} className="mb-5 p-4 bg-white rounded border">
              <h3 className="font-bold text-lg text-blue-700">{slide.title}</h3>
              {slide.bullets?.length > 0 ? (
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  {slide.bullets.map((point: string, i: number) => (
                    <li key={i} className="text-gray-700">{point}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Tidak ada bullet</p>
              )}
            </div>
          ))}

          <button
            onClick={handleNextStep}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded font-medium hover:bg-green-700 w-full"
          >
            ✅ Lanjut: Pilih Template
          </button>
        </div>
      )}

      {step === "template" && (
        <div className="w-full max-w-2xl bg-gray-50 p-6 rounded-lg shadow-inner">
          <h2 className="text-xl font-semibold mb-4">🎨 Pilih Template</h2>
          <SelectTemplate onSelect={(template) => setSelectedTemplate(template)} />

          {selectedTemplate && (
            <div className="mt-4 p-4 bg-white rounded border">
              <h3 className="font-bold text-lg text-pink-600">{selectedTemplate.name}</h3>
              <p className="text-gray-700">{selectedTemplate.description}</p>
            </div>
          )}

          <button
            onClick={() => handleTemplateSelected(selectedTemplate)}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded font-medium hover:bg-green-700 w-full"
          >
            ✅ Generate PPT
          </button>
        </div>
      )}
    </div>
  );
}
