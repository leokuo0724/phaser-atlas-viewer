import { AtlasData } from './AtlasTypes';

// Application State Management
export interface AppState {
  currentFrame: number;
  totalFrames: number;
  isPlaying: boolean;
  frameRate: number;
  atlasData: AtlasData | null;
  textureLoaded: boolean;
  error: string | null;
}

// UI Events
export interface UIEvents {
  onFrameChange: (frameIndex: number) => void;
  onPlayToggle: (isPlaying: boolean) => void;
  onFrameRateChange: (fps: number) => void;
  onAtlasLoad: (atlasData: AtlasData, textureFile: File) => void;
  onError: (error: string) => void;
}

// Canvas Configuration
export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: number;
  antialias: boolean;
}

// Default configurations
export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 800,
  height: 600,
  backgroundColor: 0x2c3e50,
  antialias: true
};

export const DEFAULT_APP_STATE: AppState = {
  currentFrame: 0,
  totalFrames: 0,
  isPlaying: false,
  frameRate: 12,
  atlasData: null,
  textureLoaded: false,
  error: null
};