import pptxgen from "pptxgenjs";

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function convertLayoutsArrayToObject(template: any) {
  if (Array.isArray(template.layouts)) {
    const layoutObj: any = {};
    for (const layout of template.layouts) {
      layoutObj[layout.type] = layout;
    }
    template.layouts = layoutObj;
  }
  return template;
}

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
      console.error(`Layout not found for type: ${layoutType}`);
      continue;
    }

    const slide = pptx.addSlide();

    // Background global
    if (global.bgColor) {
      slide.background = { fill: global.bgColor };
    }

    // ===== CHART =====
    if (layoutType === "chart" && slideData.content) {
      const { type, labels, datasets } = slideData.content;
      const resolvedChartType = type?.toLowerCase() || "bar";

      const chartData = datasets.map((ds: any) => ({
        name: ds.label,
        labels,
        values: ds.data,
      }));

      const chartLayout = layout.chart || { x: 1, y: 1.2, w: 8, h: 4 };

      slide.addChart(resolvedChartType, chartData, {
        ...chartLayout,
        fontSize: layout.fontSize || global.fontSize || 14,
        showLegend: true,
        legendPos: "b",
      });

      if (slideData.title) {
        const titleLayout = layout.title || { x: 0.5, y: 0.3, w: 9, h: 0.5 };
        slide.addText(slideData.title, {
          ...titleLayout,
          fontSize: titleLayout.fontSize || 18,
          bold: true,
          color: global.textColor,
          fontFace: global.fontFamily,
          align: titleLayout.align || "center",
        });
      }
      continue;
    }

    // ===== TABLE =====
    if (layoutType === "table" && slideData.table && layout.table) {
      const tableData = slideData.table.data || [];

      slide.addTable(tableData, {
        ...layout.table,
        fontSize: layout.table.fontSize || global.fontSize || 14,
        border: { type: "solid", color: layout.borderColor || "999999" },
      });

      if (slideData.title && layout.title) {
        slide.addText(slideData.title, {
          ...layout.title,
          fontSize: layout.title.fontSize || 18,
          bold: true,
          color: global.textColor,
          fontFace: global.fontFamily,
          align: layout.title.align || "center",
        });
      }
      continue;
    }

    // ===== COMPARISON =====
    if (layoutType === "comparison" && slideData.comparison) {
      const comp = slideData.comparison;

      // Left
      if (comp.left) {
        if (layout.leftTitle) {
          slide.addText(comp.left.title, {
            ...layout.leftTitle,
            fontSize: layout.leftTitle.fontSize || global.fontSize,
            bold: true,
            color: global.textColor,
            fontFace: global.fontFamily,
          });
        }
        if (layout.leftDescription) {
          slide.addText(comp.left.description, {
            ...layout.leftDescription,
            fontSize: layout.leftDescription.fontSize || global.fontSize,
            color: global.textColor,
            fontFace: global.fontFamily,
          });
        }
      }

      // Right
      if (comp.right) {
        if (layout.rightTitle) {
          slide.addText(comp.right.title, {
            ...layout.rightTitle,
            fontSize: layout.rightTitle.fontSize || global.fontSize,
            bold: true,
            color: global.textColor,
            fontFace: global.fontFamily,
          });
        }
        if (layout.rightDescription) {
          slide.addText(comp.right.description, {
            ...layout.rightDescription,
            fontSize: layout.rightDescription.fontSize || global.fontSize,
            color: global.textColor,
            fontFace: global.fontFamily,
          });
        }
      }

      if (slideData.title && layout.title) {
        slide.addText(slideData.title, {
          ...layout.title,
          fontSize: layout.title.fontSize || 18,
          bold: true,
          color: global.textColor,
          fontFace: global.fontFamily,
          align: layout.title.align || "center",
        });
      }
      continue;
    }

    // ===== GENERIC ELEMENTS =====
    for (const key of Object.keys(layout)) {
      const shapeConfig = layout[key];
      const value = slideData[key];

      if (!value || !shapeConfig) continue;

      // Handle image
      if (key === "imageUrl") {
        try {
          let imageData = value;
          if (typeof value === "string" && value.startsWith("http")) {
            imageData = await fetchImageAsBase64(value);
          }

          slide.addImage({
            x: shapeConfig.x,
            y: shapeConfig.y,
            w: shapeConfig.w,
            h: shapeConfig.h,
            data: imageData, // pakai data base64
          });
        } catch (err) {
          console.error("Gagal memuat gambar:", value, err);
        }
        continue;
      }

      if (Array.isArray(value)) {
        slide.addText(
          value.map((text: string) => ({ text, options: { bullet: true } })),
          {
            ...shapeConfig,
            fontSize: shapeConfig.fontSize || global.fontSize,
            color: global.textColor,
            fontFace: global.fontFamily,
          }
        );
      } else if (typeof value === "string") {
        slide.addText(value, {
          ...shapeConfig,
          fontSize: shapeConfig.fontSize || global.fontSize,
          color: global.textColor,
          fontFace: global.fontFamily,
          bold: shapeConfig.bold || false,
          italic: shapeConfig.italic || false,
          align: shapeConfig.align || "left",
        });
      }
    }
  }

  // Nama file otomatis
  let fileName = "Generated_Presentation";
  if (contentMap.topic) {
    fileName = contentMap.topic;
  } else if (contentMap.slides[0]?.title) {
    fileName = contentMap.slides[0].title;
  }
  fileName = fileName.replace(/[\\/:*?"<>|]/g, "_");

  try {
    await pptx.writeFile({ fileName: `${fileName}.pptx` });
  } catch (err) {
    console.error("Failed to write PPTX file:", err);
    throw err;
  }
}
