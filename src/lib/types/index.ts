export type AspectRatio = '16:9' | '4:3' | 'portrait' | 'custom';

export type TransitionStyle = 'cube' | 'zoom' | 'slide' | 'flip' | 'convex' | 'fade';

export interface Presentation {
  id: string;
  title: string;
  fileSize: number;
  totalPages: number;
  aspectRatio: AspectRatio;
  data: ArrayBuffer;
  thumbnailUrl: string;
  createdAt: number;
  expiresAt: number;
  shareId?: string;
}

export interface SlideMeta {
  pageNumber: number;
  width: number;
  height: number;
  aspectRatio: AspectRatio;
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  pageNumber: number;
  color: string;
  size: number;
  isHighlighter: boolean;
  points: Point[];
}

export interface PresenterConfig {
  transition: TransitionStyle;
  laserColor: string;
  penColor: string;
  penSize: number;
  autoPlayInterval: number; // in seconds, 0 = disabled
}
