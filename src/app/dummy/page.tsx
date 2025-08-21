"use client";

import { useState, useEffect } from "react";
import { useContentMapStore } from "../store/app.store";
import SlidePreview from "../preview/preview";
import { generatePPTXFromTemplate } from "../Components/generatePPTXFromTemplate";
import template from "../../../public/templates/soft-pink-elegant.json";

export default function Dummy() {
  const { contentMap } = useContentMapStore();
  const [slides, setSlides] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contentMap && contentMap.slides) {
      setSlides(contentMap.slides);
      setError(null);
    } else {
      setSlides([]);
      setError("No slides data available in content map");
    }
  }, [contentMap]);

  const handleDownload = async () => {
    if (!contentMap) {
      setError("Content map not found!");
      return;
    }
    try {
      const { blob, fileName } = await generatePPTXFromTemplate(
        contentMap,
        template
      );

      // ✅ manual download via <a>
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Failed to generate PPT:", err);
      setError("Error generating PPT. Check console for details.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-10">
      <h2 className="text-2xl font-bold mb-6">Preview & Download PPT</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {slides.length > 0 ? (
        <>
          <div className="w-full max-w-3xl">
            <SlidePreview slides={slides} />
          </div>

          <button
            onClick={handleDownload}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Download PPT
          </button>
        </>
      ) : (
        <p className="text-gray-600">No data to display.</p>
      )}
    </div>
  );
}
