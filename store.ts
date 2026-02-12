import { create } from 'zustand';
import { AppState } from './types';

// =================================================================
// CONFIGURATION
// =================================================================

const DEFAULT_MESSAGE = "Love u My PIG~ happy valentine's day"; 

// Custom photos provided by user
const PRESET_URLS = [
  "https://i.postimg.cc/fVrBKD2K/Photo-(1).jpg",
  "https://i.postimg.cc/zyBxKVj8/Photo-(10).jpg",
  "https://i.postimg.cc/f3S5qppP/Photo-(10).jpg",
  "https://i.postimg.cc/K1z0BRNg/Photo-(11).jpg",
  "https://i.postimg.cc/jWnv3mmB/Photo-(11).jpg",
  "https://i.postimg.cc/VJ6KndRC/Photo-(12).jpg",
  "https://i.postimg.cc/ygqjMnzK/Photo-(12).jpg",
  "https://i.postimg.cc/CR1ckzNk/Photo-(13).jpg",
  "https://i.postimg.cc/qNR1yzLK/Photo-(14).jpg",
  "https://i.postimg.cc/G45qQd7H/Photo-(15).jpg",
  "https://i.postimg.cc/pm6qZRGj/Photo-(16).jpg",
  "https://i.postimg.cc/68mY0tjC/Photo-(17).jpg",
  "https://i.postimg.cc/Js2PqM6b/Photo-(18).jpg",
  "https://i.postimg.cc/21K2wrcF/Photo-(19).jpg",
  "https://i.postimg.cc/MX73SkHp/Photo-(2).jpg",
  "https://i.postimg.cc/Yvsb3Mny/Photo-(2).jpg",
  "https://i.postimg.cc/756K0fV8/Photo-(3).jpg",
  "https://i.postimg.cc/qN5jL4bm/Photo-(3).jpg",
  "https://i.postimg.cc/bsqCY6S6/Photo-(4).jpg",
  "https://i.postimg.cc/mP58wBXn/Photo-(4).jpg",
  "https://i.postimg.cc/8jTKkyfh/Photo-(5).jpg",
  "https://i.postimg.cc/nXP0kpRg/Photo-(5).jpg",
  "https://i.postimg.cc/PPd3f6v8/Photo-(6).jpg",
  "https://i.postimg.cc/3kcnBYSP/Photo-(6).jpg",
  "https://i.postimg.cc/G42XGHQ0/Photo-(7).jpg",
  "https://i.postimg.cc/jDFZXtgB/Photo-(7).jpg",
  "https://i.postimg.cc/kBwj2xxd/Photo-(8).jpg",
  "https://i.postimg.cc/WDqSYCCX/Photo-(8).jpg",
  "https://i.postimg.cc/56pPXwwJ/Photo-(9).jpg",
  "https://i.postimg.cc/R3JGpyyb/Photo-(9).jpg"
];

const initialPhotos = PRESET_URLS.map((url, i) => ({
  id: `preset-${i}`,
  url: url
}));

export const useStore = create<AppState>((set) => ({
  photos: initialPhotos, 
  setPhotos: (photos) => set({ photos }),
  handState: {
    detected: false,
    tension: 0,
    x: 0,
    y: 0,
  },
  setHandState: (newState) => set((state) => ({
    handState: { ...state.handState, ...newState }
  })),
  isGalleryMode: false,
  setGalleryMode: (isGallery) => set({ isGalleryMode: isGallery }),
  isCameraReady: false,
  setCameraReady: (ready) => set({ isCameraReady: ready }),
  hiddenMessage: DEFAULT_MESSAGE,
  setHiddenMessage: (msg) => set({ hiddenMessage: msg }),
}));