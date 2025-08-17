"use client";
import React, { useState } from 'react';

type Slide = {
  title: string;
  content: string[];
};

type Outline = {
  title: string;
  slides: Slide[];
};

type OutlineEditProps = {
  initialOutline?: Outline;
  onOutlineChange?: (outline: Outline) => void;
};

const defaultOutline: Outline = {
  title: '',
  slides: [{ title: 'New Slide', content: [''] }],
};

const OutlineEdit: React.FC<OutlineEditProps> = ({ initialOutline = defaultOutline, onOutlineChange }) => {
  const [outline, setOutline] = useState<Outline>(initialOutline);
  const updateOutline = (newOutline: Outline) => {
    setOutline(newOutline);
    onOutlineChange?.(newOutline);
  };

  const handleTitleChange = (value: string) => {
    updateOutline({ ...outline, title: value });
  };

  const handleSlideTitleChange = (index: number, value: string) => {
    const updatedSlides = [...outline.slides];
    updatedSlides[index].title = value;
    updateOutline({ ...outline, slides: updatedSlides });
  };

  const handleSlidePointChange = (slideIndex: number, pointIndex: number, value: string) => {
    const updatedSlides = [...outline.slides];
    updatedSlides[slideIndex].content[pointIndex] = value;
    updateOutline({ ...outline, slides: updatedSlides });
  };

  const addSlide = () => {
    const newSlide: Slide = { title: 'New Slide', content: [''] };
    updateOutline({ ...outline, slides: [...outline.slides, newSlide] });
  };

  const addPointToSlide = (slideIndex: number) => {
    const updatedSlides = [...outline.slides];
    updatedSlides[slideIndex].content.push('');
    updateOutline({ ...outline, slides: updatedSlides });
  };

  const removeSlide = (slideIndex: number) => {
    const updatedSlides = outline.slides.filter((_, i) => i !== slideIndex);
    updateOutline({ ...outline, slides: updatedSlides });
  };

  const removePoint = (slideIndex: number, pointIndex: number) => {
    const updatedSlides = [...outline.slides];
    updatedSlides[slideIndex].content.splice(pointIndex, 1);
    updateOutline({ ...outline, slides: updatedSlides });
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block font-bold">Presentation Title</label>
        <input
          className="border rounded px-2 py-1 w-full"
          value={outline.title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />
      </div>

      {outline.slides.map((slide, index) => (
        <div key={index} className="border p-3 rounded space-y-2 bg-white shadow">
          <div className="flex justify-between items-center">
            <input
              className="text-lg font-semibold border-b w-full"
              value={slide.title}
              onChange={(e) => handleSlideTitleChange(index, e.target.value)}
            />
            <button
              className="text-red-500 ml-2"
              onClick={() => removeSlide(index)}
            >
              🗑️
            </button>
          </div>

          {slide.content.map((point, pointIndex) => (
            <div key={pointIndex} className="flex items-center space-x-2">
              <input
                className="border rounded px-2 py-1 w-full"
                value={point}
                onChange={(e) => handleSlidePointChange(index, pointIndex, e.target.value)}
              />
              <button
                className="text-red-500"
                onClick={() => removePoint(index, pointIndex)}
              >
                ❌
              </button>
            </div>
          ))}

          <button
            className="text-blue-500 text-sm"
            onClick={() => addPointToSlide(index)}
          >
            ➕ Add Point
          </button>
        </div>
      ))}

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={addSlide}
      >
        ➕ Add Slide
      </button>
    </div>
  );
};

export default OutlineEdit;