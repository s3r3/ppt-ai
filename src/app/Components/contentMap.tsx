import { generatePPTXFromTemplate } from "./generatePPTXFromTemplate";
import templateSoftPink from "../../../public/templates/soft-pink-elegant.json";

export const contentMap = {
  topic: "Women in Technology",
  slides: [
    {
      layout: "title",
      title: "Women in Technology",
      subtitle: "Empowering Innovation and Diversity",
    },
    {
      layout: "bulleted-list",
      title: "Why Women Matter in Tech",
      bullets: [
        "Promotes diversity of thought",
        "Bridges the gender gap",
        "Improves product inclusivity",
        "Strengthens team collaboration",
        "Encourages innovation",
        "Creates more balanced teams",
      ],
    },
    {
      layout: "quote",
      text: `"The future of tech is inclusive, diverse, and female-led."`,
    },
    {
      layout: "image",
      imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      caption: "Empowered women shaping the future of technology",
    },
    {
      layout: "comparison",
      title: "Tech Industry: Then vs. Now",
      left: "Then:\n- Few female engineers\n- Lack of mentorship\n- Gender bias\n- Limited opportunities",
      right: "Now:\n- Growing female leaders\n- Supportive communities\n- Inclusive hiring\n- More diverse teams",
    },
    {
      layout: "table",
      title: "Women in Tech - Global Statistics",
      table: {
        data: [
          ["Region", "Percentage"],
          ["North America", "26%"],
          ["Europe", "22%"],
          ["Asia", "18%"],
          ["Africa", "15%"],
          ["Oceania", "14%"],
        ],
      },
    },
    {
      layout: "chart",
      title: "Women Representation in Tech Roles",
      content: {
        type: "scatter",
        labels: [],
        datasets: [
          {
            label: "2020",
            data: [
              { x: 1, y: 18 },  // Engineering
              { x: 2, y: 28 },  // Product
              { x: 3, y: 42 },  // Design
              { x: 4, y: 20 },  // Leadership
            ],
          },
          {
            label: "2025 (Projected)",
            data: [
              { x: 1, y: 30 },  // Engineering
              { x: 2, y: 40 },  // Product
              { x: 3, y: 50 },  // Design
              { x: 4, y: 35 },  // Leadership
            ],
          },
        ],
      },
    },
    {
      layout: "chart",
      title: "Gender Diversity in Tech Companies",
      content: {
        type: "bar",
        labels: ["Engineering", "Product", "Design", "Leadership"],
        datasets: [
          {
            label: "Women",
            data: [25, 30, 40, 28],
          },
          {
            label: "Men",
            data: [75, 70, 60, 72],
          },
        ],
      },
    },
    {
      layout: "image",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      caption: "Women in tech leadership roles",
    },
    {
      layout: "table",
      title: "Top Tech Companies by Female Representation",
      table: {
        data: [
          ["Company", "Women %"],
          ["Google", "35%"],
          ["Microsoft", "32%"],
          ["Amazon", "28%"],
          ["Apple", "27%"],
          ["Facebook", "25%"],
        ],
      },
    },
    {
      layout: "conclusion",
      title: "Conclusion",
      text: "Women are revolutionizing technology across the globe. To foster innovation, companies must continue to champion gender equality and support the next generation of female tech leaders. By creating inclusive environments, we can unlock the full potential of women in technology and drive meaningful change in the industry.",
    },
  ],
};

const handleTestGenerate = async () => {
  await generatePPTXFromTemplate(contentMap, templateSoftPink);
};

export default handleTestGenerate;

