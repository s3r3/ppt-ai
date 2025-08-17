"use client";
import React from "react";
import {
  Bar,
  Line,
  Pie,
  Scatter,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

type Slide = {
  layout: string;
  title?: string;
  subtitle?: string;
  text?: string;
  bullets?: string[];
  imageUrl?: string;
  caption?: string;
  left?: string | object;  // bisa object
  right?: string | object; // bisa object
  table?: {
    data: (string | { text: string; options?: any })[][];
  };
  content?: {
    type: "bar" | "line" | "pie" | "scatter";
    labels?: string[];
    datasets: {
      label: string;
      data: number[] | { x: number; y: number }[];
    }[];
  };
};

type Props = {
  slides: Slide[];
};

const safeRenderText = (value: any) => {
  if (typeof value === "string") return value;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const SlidePreview: React.FC<Props> = ({ slides }) => {
  return (
    <div className="space-y-8">
      {slides.map((slide, idx) => (
        <div key={idx} className="border rounded-lg p-4 bg-pink-50 shadow-md">
          <h2 className="text-xl font-bold mb-2">{slide.title}</h2>

          {/* Title Slide */}
          {slide.layout === "title" && (
            <div>
              <h1 className="text-3xl font-bold">{slide.title}</h1>
              <p className="text-lg text-gray-600">{slide.subtitle}</p>
            </div>
          )}

          {/* Bullet List */}
          {slide.layout === "bulleted-list" && (
            <ul className="list-disc list-inside space-y-1">
              {slide.bullets?.map((item, i) => (
                <li key={i}>{safeRenderText(item)}</li>
              ))}
            </ul>
          )}

          {/* Quote */}
          {slide.layout === "quote" && (
            <blockquote className="italic border-l-4 pl-4 border-pink-400 text-gray-700">
              {safeRenderText(slide.text)}
            </blockquote>
          )}

          {/* Image */}
          {slide.layout === "image" && (
            <div className="text-center">
              <img
                src={slide.imageUrl}
                alt={slide.caption || ""}
                className="mx-auto rounded-md"
              />
              <p className="text-sm text-gray-500 mt-2">{slide.caption}</p>
            </div>
          )}

          {/* Comparison */}
          {slide.layout === "comparison" && (
            <div>
              <h3 className="font-semibold text-center mb-2">{slide.title}</h3>
              <div className="flex gap-4">
                <div className="w-1/2 bg-white rounded p-2 border">
                  <strong>Then</strong>
                  <pre className="whitespace-pre-wrap break-words">
                    {safeRenderText(slide.left)}
                  </pre>
                </div>
                <div className="w-1/2 bg-white rounded p-2 border">
                  <strong>Now</strong>
                  <pre className="whitespace-pre-wrap break-words">
                    {safeRenderText(slide.right)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {slide.layout === "table" && slide.table?.data && (
            <table className="w-full border mt-2 text-sm">
              <tbody>
                {slide.table.data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => {
                      const cellText =
                        typeof cell === "string" ? cell : safeRenderText(cell.text);
                      const isBold =
                        typeof cell !== "string" && cell.options?.bold;
                      const CellTag = rowIndex === 0 || isBold ? "th" : "td";
                      return (
                        <CellTag
                          key={colIndex}
                          className={`border px-2 py-1 text-left ${
                            isBold ? "font-bold bg-pink-100" : ""
                          }`}
                        >
                          {cellText}
                        </CellTag>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Chart */}
          {slide.layout === "chart" && slide.content && (
            <div className="bg-white border p-4 rounded mt-2 max-w-2xl mx-auto">
              {!slide.content.datasets ? (
                <p className="text-sm text-gray-400">No data for chart</p>
              ) : slide.content.type === "bar" ? (
                <Bar
                  data={{
                    labels: slide.content.labels,
                    datasets: slide.content.datasets as any,
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              ) : slide.content.type === "line" ? (
                <Line
                  data={{
                    labels: slide.content.labels,
                    datasets: slide.content.datasets as any,
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              ) : slide.content.type === "pie" ? (
                <Pie
                  data={{
                    labels: slide.content.labels,
                    datasets: (slide.content.datasets as any).map((ds: any) => ({
                      ...ds,
                      backgroundColor: ["#ff6384", "#36a2eb", "#ffcd56"],
                    })),
                  }}
                />
              ) : slide.content.type === "scatter" ? (
                <Scatter
                  data={{
                    datasets: (slide.content.datasets as any).map((ds: any) => ({
                      ...ds,
                      showLine: false,
                      pointRadius: 6,
                      backgroundColor: "rgba(75,192,192,0.6)",
                    })),
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: "bottom" } },
                    scales: {
                      x: { type: "linear" },
                      y: { type: "linear" },
                    },
                  }}
                />
              ) : null}
            </div>
          )}

          {/* Conclusion */}
          {slide.layout === "conclusion" && (
            <div>
              <h3 className="text-xl font-semibold mb-2">{slide.title}</h3>
              <p className="text-gray-700">{safeRenderText(slide.text)}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SlidePreview;
