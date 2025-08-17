import { create } from "zustand";

interface OutlineItem {
  title: string;
  bullets?: string[];
}

interface ContentMapState {
  outline: OutlineItem[]; // outline presentasi
  setOutline: (outline: OutlineItem[]) => void;

  contentMap: any; // hasil generate content map
  setContentMap: (map: any) => void;

  template: any; // template yang dipilih
  setTemplate: (template: any) => void;
}

export const useContentMapStore = create<ContentMapState>((set) => ({
  outline: [],
  setOutline: (outline) => set({ outline }),

  contentMap: null,
  setContentMap: (map) => set({ contentMap: map }),

  template: null,
  setTemplate: (template) => set({ template }),
}));
