// TexturePacker Atlas Format Definitions
export interface AtlasData {
  textures: TextureData[];
}

export interface TextureData {
  image: string;
  format: string;
  size: {
    w: number;
    h: number;
  };
  scale: number;
  frames: FrameData[];
}

export interface FrameData {
  filename: string;
  rotated: boolean;
  trimmed: boolean;
  sourceSize: {
    w: number;
    h: number;
  };
  spriteSourceSize: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  frame: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  anchor: {
    x: number;
    y: number;
  };
}