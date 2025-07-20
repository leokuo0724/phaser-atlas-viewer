import * as Phaser from "phaser";
import { FrameData } from "../types/AtlasTypes";
import { DEFAULT_CANVAS_CONFIG } from "../types/AppTypes";

export interface SpriteRenderEvents {
  onFrameChanged: (frameIndex: number, frameData: FrameData) => void;
  onRenderError: (error: string) => void;
}

export class SpriteRenderer {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private frames: FrameData[] = [];
  private currentFrameIndex: number = 0;
  private textureKey: string = "";
  private events: SpriteRenderEvents;

  // Scaling properties
  private originalSpriteSize: { width: number; height: number } = {
    width: 0,
    height: 0,
  };
  private scaleFactor: number = 1;
  private canvasCenter: { x: number; y: number };

  constructor(scene: Phaser.Scene, events: SpriteRenderEvents) {
    this.scene = scene;
    this.events = events;
    this.canvasCenter = {
      x: DEFAULT_CANVAS_CONFIG.width / 2,
      y: DEFAULT_CANVAS_CONFIG.height / 2,
    };
  }

  public async loadAtlasTexture(
    textureURL: string,
    frames: FrameData[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.textureKey = "atlas-texture-" + Date.now();
      this.frames = frames;

      // Remove existing textures with same key
      if (this.scene.textures.exists(this.textureKey)) {
        this.scene.textures.remove(this.textureKey);
      }

      // Load the texture
      this.scene.load.image(this.textureKey, textureURL);

      this.scene.load.once("complete", () => {
        try {
          this.createSpriteFrames();
          this.createSprite();
          this.setFrame(0);
          resolve();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          this.events.onRenderError(`Failed to create sprite: ${message}`);
          reject(error);
        }
      });

      this.scene.load.once("loaderror", (event: any) => {
        const message = `Failed to load texture: ${event.key}`;
        this.events.onRenderError(message);
        reject(new Error(message));
      });

      this.scene.load.start();
    });
  }

  private createSpriteFrames(): void {
    if (!this.scene.textures.exists(this.textureKey)) {
      throw new Error("Texture not loaded");
    }

    const texture = this.scene.textures.get(this.textureKey);

    // Add frames to the texture
    this.frames.forEach((frameData, index) => {
      const frameName = `frame_${index}`;
      const { x, y, w, h } = frameData.frame;

      // Add frame to texture
      texture.add(frameName, 0, x, y, w, h);
    });
  }

  private createSprite(): void {
    // Clean up existing sprite
    if (this.sprite) {
      this.sprite.destroy();
    }

    // Create sprite at canvas center
    this.sprite = this.scene.add.sprite(
      this.canvasCenter.x,
      this.canvasCenter.y,
      this.textureKey,
      "frame_0"
    );

    // Calculate initial scaling
    this.calculateScaling();
    this.applyScaling();

    // Set sprite properties
    this.sprite.setOrigin(0.5, 0.5); // Center origin
  }

  private calculateScaling(): void {
    if (!this.sprite || this.frames.length === 0) return;

    // Find the largest frame dimensions to determine scaling
    let maxWidth = 0;
    let maxHeight = 0;

    this.frames.forEach((frameData) => {
      const { w, h } = frameData.sourceSize;
      maxWidth = Math.max(maxWidth, w);
      maxHeight = Math.max(maxHeight, h);
    });

    this.originalSpriteSize = { width: maxWidth, height: maxHeight };

    // Calculate scale factor to fit within canvas with some padding
    const padding = 40; // 20px padding on each side
    const availableWidth = DEFAULT_CANVAS_CONFIG.width - padding;
    const availableHeight = DEFAULT_CANVAS_CONFIG.height - padding;

    const scaleX = availableWidth / maxWidth;
    const scaleY = availableHeight / maxHeight;

    // Use the smaller scale to ensure the sprite fits completely
    this.scaleFactor = Math.min(scaleX, scaleY, 1); // Don't scale up beyond original size
  }

  private applyScaling(): void {
    if (!this.sprite) return;

    this.sprite.setScale(this.scaleFactor);
  }

  public setFrame(frameIndex: number): void {
    if (!this.sprite || frameIndex < 0 || frameIndex >= this.frames.length) {
      return;
    }

    this.currentFrameIndex = frameIndex;
    const frameName = `frame_${frameIndex}`;

    try {
      this.sprite.setFrame(frameName);

      // Adjust sprite position based on frame's source size and sprite source size
      const frameData = this.frames[frameIndex];
      if (frameData) {
        this.adjustSpritePosition(frameData);
        this.events.onFrameChanged(frameIndex, frameData);
      }
    } catch (error) {
      console.error(`Failed to set frame ${frameIndex}:`, error);
      this.events.onRenderError(`Failed to display frame ${frameIndex}`);
    }
  }

  private adjustSpritePosition(frameData: FrameData): void {
    if (!this.sprite) return;

    // Calculate offset based on trimmed sprite data
    const { spriteSourceSize, sourceSize } = frameData;

    if (spriteSourceSize && sourceSize) {
      // Calculate the offset from center due to trimming
      const offsetX =
        spriteSourceSize.x + spriteSourceSize.w / 2 - sourceSize.w / 2;
      const offsetY =
        spriteSourceSize.y + spriteSourceSize.h / 2 - sourceSize.h / 2;

      // Apply scaled offset to maintain centered appearance
      this.sprite.setPosition(
        this.canvasCenter.x + offsetX * this.scaleFactor,
        this.canvasCenter.y + offsetY * this.scaleFactor
      );
    } else {
      // Fallback to canvas center if no trimming data
      this.sprite.setPosition(this.canvasCenter.x, this.canvasCenter.y);
    }
  }

  public getCurrentFrame(): number {
    return this.currentFrameIndex;
  }

  public getTotalFrames(): number {
    return this.frames.length;
  }

  public getFrameData(index: number): FrameData | null {
    if (index < 0 || index >= this.frames.length) return null;
    return this.frames[index] || null;
  }

  public getCurrentFrameData(): FrameData | null {
    return this.getFrameData(this.currentFrameIndex);
  }

  // Animation methods for Phase 5
  public nextFrame(): void {
    if (this.frames.length === 0) return;
    const nextIndex = (this.currentFrameIndex + 1) % this.frames.length;
    this.setFrame(nextIndex);
  }

  public previousFrame(): void {
    if (this.frames.length === 0) return;
    const prevIndex =
      this.currentFrameIndex === 0
        ? this.frames.length - 1
        : this.currentFrameIndex - 1;
    this.setFrame(prevIndex);
  }

  public getScalingInfo(): {
    scaleFactor: number;
    originalSize: { width: number; height: number };
    displaySize: { width: number; height: number };
  } {
    return {
      scaleFactor: this.scaleFactor,
      originalSize: this.originalSpriteSize,
      displaySize: {
        width: this.originalSpriteSize.width * this.scaleFactor,
        height: this.originalSpriteSize.height * this.scaleFactor,
      },
    };
  }

  public cleanup(): void {
    // Destroy sprite
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }

    // Remove texture
    if (this.textureKey && this.scene.textures.exists(this.textureKey)) {
      this.scene.textures.remove(this.textureKey);
    }

    // Reset state
    this.frames = [];
    this.currentFrameIndex = 0;
    this.textureKey = "";
    this.scaleFactor = 1;
    this.originalSpriteSize = { width: 0, height: 0 };
  }

  // Debug methods
  public getDebugInfo(): {
    frameCount: number;
    currentFrame: number;
    textureKey: string;
    scaleFactor: number;
    spritePosition: { x: number; y: number } | null;
    spriteScale: { x: number; y: number } | null;
  } {
    return {
      frameCount: this.frames.length,
      currentFrame: this.currentFrameIndex,
      textureKey: this.textureKey,
      scaleFactor: this.scaleFactor,
      spritePosition: this.sprite
        ? { x: this.sprite.x, y: this.sprite.y }
        : null,
      spriteScale: this.sprite
        ? { x: this.sprite.scaleX, y: this.sprite.scaleY }
        : null,
    };
  }
}
