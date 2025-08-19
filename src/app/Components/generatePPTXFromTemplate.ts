
import pptxgen from "pptxgenjs";

/**
 * Helper: Ambil gambar dari API dan ubah jadi base64 dengan prefix lengkap
 */
async function fetchImageAsBase64(query: string): Promise<string> {
  try {
    const res = await fetch(`/api/fetch-images?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data?.data) throw new Error("Invalid image response");

    // pastikan ada prefix
    return data.data.startsWith("data:")
      ? data.data
      : `data:image/png;base64,${data.data}`;
  } catch (err) {
    console.error("❌ Gagal fetch image:", query, err);
    // fallback 1x1 transparent pixel
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8X1hQAAAAASUVORK5CYII=";
  }
}

/**
 * Helper: Convert layouts array -> object by type
 */
function convertLayoutsArrayToObject(template: any) {
  if (Array.isArray(template.layouts)) {
    template.layouts = Object.fromEntries(
      template.layouts.map((l: any) => [l.type, l])
    );
  }
  return template;
}

/**
 * Helper: tambah text ke slide, support string / array bullet
 */
function addTextSafe(
  slide: any,
  value: string | string[],
  shapeConfig: any,
  global: any
) {
  if (!value) return;

  const baseStyle = {
    ...shapeConfig,
    fontSize: shapeConfig.fontSize || global.fontSize || 14,
    color: global.textColor,
    fontFace: global.fontFamily,
    bold: shapeConfig.bold || false,
    italic: shapeConfig.italic || false,
    align: shapeConfig.align || "left",
  };

  if (Array.isArray(value)) {
    slide.addText(
      value.map((t) => ({ text: t, options: { bullet: true } })),
      baseStyle
    );
  } else {
    slide.addText(value, baseStyle);
  }
}

/**
 * Main: Generate PPTX dari contentMap + template
 */
export async function generatePPTXFromTemplate(contentMap: any, template: any) {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "DEFAULT", width: 10, height: 5.625 });
  pptx.layout = "DEFAULT";

  const global = template.style || {};
  template = convertLayoutsArrayToObject(template);

  for (const slideData of contentMap.slides) {
    const layoutType = slideData.layout;
    const layout = template.layouts[layoutType];
    if (!layout) {
      console.warn(`⚠️ Layout not found: ${layoutType}`);
      continue;
    }

    const slide = pptx.addSlide();
    if (global.bgColor) slide.background = { fill: global.bgColor };

    // ====== Chart ======
    if (layoutType === "chart" && slideData.content) {
      try {
        const { type, labels, datasets } = slideData.content;
        const chartType: any = type?.toLowerCase() || "bar";
        const chartData = datasets.map((ds: any) => ({
          name: ds.label,
          labels,
          values: ds.data,
        }));

        slide.addChart(chartType, chartData, {
          ...(layout.chart || { x: 1, y: 1.2, w: 8, h: 4 }),
          fontSize: layout.fontSize || global.fontSize || 14,
          showLegend: true,
          legendPos: "b",
        });

        if (slideData.title) {
          addTextSafe(slide, slideData.title, layout.title || { x: 0.5, y: 0.3, w: 9, h: 0.5 }, global);
        }
      } catch (err) {
        console.error("❌ Error rendering chart slide:", err);
      }
      continue;
    }

    // ====== Table ======
    if (layoutType === "table" && slideData.table?.data) {
      try {
        slide.addTable(slideData.table.data, {
          ...(layout.table || { x: 1, y: 1, w: 8, h: 4 }),
          fontSize: layout.table?.fontSize || global.fontSize || 14,
          border: { type: "solid", color: layout.borderColor || "999999" },
        });

        if (slideData.title) {
          addTextSafe(slide, slideData.title, layout.title, global);
        }
      } catch (err) {
        console.error("❌ Error rendering table slide:", err);
      }
      continue;
    }

    // ====== Comparison ======
    if (layoutType === "comparison" && slideData.comparison) {
      try {
        const { left, right } = slideData.comparison;
        if (left) {
          addTextSafe(slide, left.title, layout.leftTitle, global);
          addTextSafe(slide, left.description, layout.leftDescription, global);
        }
        if (right) {
          addTextSafe(slide, right.title, layout.rightTitle, global);
          addTextSafe(slide, right.description, layout.rightDescription, global);
        }
        if (slideData.title) {
          addTextSafe(slide, slideData.title, layout.title, global);
        }
      } catch (err) {
        console.error("❌ Error rendering comparison slide:", err);
      }
      continue;
    }

    // ====== Generic ======
    for (const key of Object.keys(layout)) {
      const shapeConfig = layout[key];
      const value = slideData[key];
      if (!value || !shapeConfig) continue;

      // Image single
      if (key === "imageUrl") {
        try {
          const imageData =
            typeof value === "string" && value.startsWith("http")
              ? await fetchImageAsBase64(value)
              : value;
          slide.addImage({ ...shapeConfig, data: imageData });
        } catch (err) {
          console.error("❌ Gagal memuat gambar:", value, err);
        }
        continue;
      }

      // Multiple images
      if (key === "images" && Array.isArray(value)) {
        try {
          const imagesBase64 = await Promise.all(
            value.map((img: string) =>
              img?.startsWith("data:") ? img : fetchImageAsBase64(img)
            )
          );
          imagesBase64.forEach((img, i) => {
            if (img) slide.addImage({ ...shapeConfig[i], data: img });
          });
          if (slideData.description && layout.description) {
            addTextSafe(slide, slideData.description, layout.description, global);
          }
        } catch (err) {
          console.error("❌ Gagal memuat multi gambar:", err);
        }
        continue;
      }

      // Text / Bullets
      if (typeof value === "string" || Array.isArray(value)) {
        addTextSafe(slide, value, shapeConfig, global);
      }
    }
  }

  // ====== FileName ======
  let fileName =
    contentMap.topic || contentMap.slides[0]?.title || "Generated_Presentation";
  fileName = fileName.replace(/[\\/:*?"<>|]/g, "_");

  try {
    await pptx.writeFile({ fileName: `${fileName}.pptx` });
  } catch (err) {
    console.error("❌ Failed to write PPTX file:", err);
    throw err;
  }
}
