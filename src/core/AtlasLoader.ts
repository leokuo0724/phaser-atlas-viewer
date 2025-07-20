import { AtlasData, FrameData } from "../types/AtlasTypes";

export interface LoadedAtlas {
  data: AtlasData;
  textureURL: string;
  totalFrames: number;
  frames: FrameData[];
}

export class AtlasLoader {
  private loadedAtlas: LoadedAtlas | null = null;

  public async loadAtlas(
    textureFile: File,
    atlasFile: File
  ): Promise<LoadedAtlas> {
    try {
      // Parse atlas JSON
      const atlasData = await this.parseAtlasJSON(atlasFile);

      // Create object URL for texture
      const textureURL = URL.createObjectURL(textureFile);

      // Validate texture matches atlas
      await this.validateTextureImage(textureFile, atlasData);

      // Extract and sort frame data by filename
      const frames = atlasData.textures[0]?.frames || [];
      const sortedFrames = [...frames].sort((a, b) => {
        // Sort by filename (natural sort for numbered sequences)
        return a.filename.localeCompare(b.filename, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });
      const totalFrames = sortedFrames.length;

      const loadedAtlas: LoadedAtlas = {
        data: atlasData,
        textureURL,
        totalFrames,
        frames: sortedFrames,
      };

      this.loadedAtlas = loadedAtlas;
      return loadedAtlas;
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  private async parseAtlasJSON(file: File): Promise<AtlasData> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Comprehensive validation
      this.validateAtlasStructure(data);

      return data as AtlasData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("Invalid JSON file: Unable to parse atlas data");
      }
      throw error;
    }
  }

  private validateAtlasStructure(data: any): void {
    // Check root structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid atlas: Root must be an object");
    }

    if (!data.textures || !Array.isArray(data.textures)) {
      throw new Error("Invalid atlas: Missing or invalid textures array");
    }

    if (data.textures.length === 0) {
      throw new Error("Invalid atlas: No textures found");
    }

    // Validate first texture (we only support single texture atlases for now)
    const texture = data.textures[0];
    this.validateTextureStructure(texture);
  }

  private validateTextureStructure(texture: any): void {
    const requiredFields = ["image", "size", "frames"];
    for (const field of requiredFields) {
      if (!(field in texture)) {
        throw new Error(`Invalid texture: Missing ${field} field`);
      }
    }

    // Validate size
    if (
      !texture.size.w ||
      !texture.size.h ||
      typeof texture.size.w !== "number" ||
      typeof texture.size.h !== "number"
    ) {
      throw new Error(
        "Invalid texture: Size must have numeric width and height"
      );
    }

    // Validate frames array
    if (!Array.isArray(texture.frames)) {
      throw new Error("Invalid texture: Frames must be an array");
    }

    if (texture.frames.length === 0) {
      throw new Error("Invalid texture: No frames found");
    }

    // Validate each frame
    texture.frames.forEach((frame: any, index: number) => {
      this.validateFrameStructure(frame, index);
    });
  }

  private validateFrameStructure(frame: any, index: number): void {
    const requiredFields = ["filename", "frame", "sourceSize"];
    for (const field of requiredFields) {
      if (!(field in frame)) {
        throw new Error(`Invalid frame ${index}: Missing ${field} field`);
      }
    }

    // Validate frame coordinates
    const frameRect = frame.frame;
    if (
      (!frameRect.x && frameRect.x !== 0) ||
      (!frameRect.y && frameRect.y !== 0) ||
      !frameRect.w ||
      !frameRect.h
    ) {
      throw new Error(
        `Invalid frame ${index}: Frame coordinates must be numeric`
      );
    }

    // Validate source size
    const sourceSize = frame.sourceSize;
    if (!sourceSize.w || !sourceSize.h) {
      throw new Error(
        `Invalid frame ${index}: Source size must have width and height`
      );
    }

    // Validate filename
    if (typeof frame.filename !== "string" || frame.filename.trim() === "") {
      throw new Error(
        `Invalid frame ${index}: Filename must be a non-empty string`
      );
    }
  }

  private async validateTextureImage(
    file: File,
    atlasData: AtlasData
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          const texture = atlasData.textures[0];
          const expectedWidth = texture?.size.w;
          const expectedHeight = texture?.size.h;

          if (img.width !== expectedWidth || img.height !== expectedHeight) {
            console.warn(
              `Texture size mismatch: Expected ${expectedWidth}x${expectedHeight}, ` +
                `got ${img.width}x${img.height}`
            );
          }

          // Validate that frames fit within texture bounds
          const frames = texture?.frames || [];
          for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const { x, y, w, h } = frame!.frame;

            if (x + w > img.width || y + h > img.height) {
              reject(
                new Error(
                  `Frame ${i} (${
                    frame!.filename
                  }) extends beyond texture bounds: ` +
                    `${x + w}x${y + h} > ${img.width}x${img.height}`
                )
              );
              return;
            }
          }

          resolve();
        } catch (error) {
          reject(error);
        } finally {
          URL.revokeObjectURL(img.src);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error("Failed to load texture image"));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  public getLoadedAtlas(): LoadedAtlas | null {
    return this.loadedAtlas;
  }

  public getFrameData(index: number): FrameData | null {
    if (
      !this.loadedAtlas ||
      index < 0 ||
      index >= this.loadedAtlas.totalFrames
    ) {
      return null;
    }
    return this.loadedAtlas.frames[index] || null;
  }

  public cleanup(): void {
    if (this.loadedAtlas) {
      URL.revokeObjectURL(this.loadedAtlas.textureURL);
      this.loadedAtlas = null;
    }
  }

  // Utility methods for frame analysis
  public getFrameNames(): string[] {
    if (!this.loadedAtlas) return [];
    return this.loadedAtlas.frames.map((frame) => frame.filename);
  }

  public findFrameByName(
    name: string
  ): { index: number; frame: FrameData } | null {
    if (!this.loadedAtlas) return null;

    const index = this.loadedAtlas.frames.findIndex(
      (frame) => frame.filename === name || frame.filename.includes(name)
    );

    if (index === -1) return null;

    return {
      index,
      frame: this.loadedAtlas.frames[index]!,
    };
  }

  public getAtlasInfo(): {
    totalFrames: number;
    textureSize: { w: number; h: number };
    imageName: string;
  } | null {
    if (!this.loadedAtlas) return null;

    const texture = this.loadedAtlas.data.textures[0];
    if (!texture) return null;

    return {
      totalFrames: this.loadedAtlas.totalFrames,
      textureSize: texture.size,
      imageName: texture.image,
    };
  }
}
