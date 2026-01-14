import { create } from 'zustand';
import { AppState } from './types';

export const useStore = create<AppState>((set) => ({
  photos: [],
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
}));