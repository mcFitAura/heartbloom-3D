export interface PhotoData {
  id: string;
  url: string;
  texture?: any; // THREE.Texture
}

export interface HandState {
  detected: boolean;
  tension: number; // 0 (closed) to 1 (open)
  x: number;
  y: number;
}

export type AppState = {
  photos: PhotoData[];
  setPhotos: (photos: PhotoData[]) => void;
  handState: HandState;
  setHandState: (state: Partial<HandState>) => void;
  isGalleryMode: boolean;
  setGalleryMode: (isGallery: boolean) => void;
  isCameraReady: boolean;
  setCameraReady: (ready: boolean) => void;
  hiddenMessage: string;
  setHiddenMessage: (msg: string) => void;
};