import { FrameData } from "../types/AtlasTypes";

export interface FrameControllerEvents {
  onFrameChange: (frameIndex: number, frameData: FrameData | null) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onFrameRateChange: (fps: number) => void;
}

export class FrameController {
  private totalFrames: number = 0;
  private currentFrame: number = 0;
  private isPlaying: boolean = false;
  private frameRate: number = 12; // Default 12 FPS
  private animationTimer: NodeJS.Timeout | null = null;
  private isLooping: boolean = true; // Default to loop enabled
  private events: FrameControllerEvents;
  private getFrameDataCallback: (index: number) => FrameData | null;

  constructor(
    events: FrameControllerEvents,
    getFrameDataCallback: (index: number) => FrameData | null
  ) {
    this.events = events;
    this.getFrameDataCallback = getFrameDataCallback;
  }

  public initialize(totalFrames: number): void {
    this.stop(); // Stop any existing animation
    this.totalFrames = totalFrames;
    this.currentFrame = 0;
    this.notifyFrameChange();
  }

  public setFrame(frameIndex: number): void {
    if (frameIndex < 0 || frameIndex >= this.totalFrames) {
      return;
    }

    this.currentFrame = frameIndex;
    this.notifyFrameChange();
  }

  public setFrameFromProgress(progress: number): void {
    // Convert progress (0-1) to frame index
    const frameIndex = Math.floor(progress * Math.max(0, this.totalFrames - 1));
    this.setFrame(frameIndex);
  }

  public nextFrame(): void {
    if (this.totalFrames === 0) return;

    let nextIndex = this.currentFrame + 1;

    if (nextIndex >= this.totalFrames) {
      if (this.isLooping) {
        nextIndex = 0; // Loop back to first frame
      } else {
        // Stop at last frame if not looping
        this.pause();
        return;
      }
    }

    this.setFrame(nextIndex);
  }

  public previousFrame(): void {
    if (this.totalFrames === 0) return;

    const prevIndex =
      this.currentFrame === 0 ? this.totalFrames - 1 : this.currentFrame - 1;
    this.setFrame(prevIndex);
  }

  public play(): void {
    if (this.isPlaying || this.totalFrames <= 1) return;

    this.isPlaying = true;
    this.startAnimation();
    this.events.onPlayStateChange(true);
  }

  public pause(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.stopAnimation();
    this.events.onPlayStateChange(false);
  }

  public stop(): void {
    this.pause();
    this.setFrame(0);
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setFrameRate(fps: number): void {
    if (fps < 1 || fps > 60) return;

    this.frameRate = fps;

    // Restart animation with new frame rate if currently playing
    if (this.isPlaying) {
      this.stopAnimation();
      this.startAnimation();
    }

    this.events.onFrameRateChange(fps);
  }

  public setLooping(enabled: boolean): void {
    this.isLooping = enabled;
  }

  public getLooping(): boolean {
    return this.isLooping;
  }

  private startAnimation(): void {
    this.stopAnimation(); // Clear any existing timer

    const interval = 1000 / this.frameRate; // Convert FPS to milliseconds

    this.animationTimer = setInterval(() => {
      if (!this.isPlaying) {
        this.stopAnimation();
        return;
      }

      this.nextFrame();
    }, interval);
  }

  private stopAnimation(): void {
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
  }

  private notifyFrameChange(): void {
    const frameData = this.getFrameDataCallback(this.currentFrame);
    this.events.onFrameChange(this.currentFrame, frameData);
  }

  // Getters
  public getCurrentFrame(): number {
    return this.currentFrame;
  }

  public getTotalFrames(): number {
    return this.totalFrames;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getFrameRate(): number {
    return this.frameRate;
  }

  public getProgress(): number {
    if (this.totalFrames <= 1) return 0;
    return this.currentFrame / (this.totalFrames - 1);
  }

  public getCurrentFrameData(): FrameData | null {
    return this.getFrameDataCallback(this.currentFrame);
  }

  // Animation control methods
  public goToFirstFrame(): void {
    this.setFrame(0);
  }

  public goToLastFrame(): void {
    this.setFrame(this.totalFrames - 1);
  }

  public skipFrames(count: number): void {
    const newFrame = Math.max(
      0,
      Math.min(this.totalFrames - 1, this.currentFrame + count)
    );
    this.setFrame(newFrame);
  }

  // Cleanup
  public cleanup(): void {
    this.stop();
    this.totalFrames = 0;
    this.currentFrame = 0;
    this.frameRate = 12;
  }

  // Debug methods
  public getState(): {
    currentFrame: number;
    totalFrames: number;
    isPlaying: boolean;
    frameRate: number;
    progress: number;
    isLooping: boolean;
  } {
    return {
      currentFrame: this.currentFrame,
      totalFrames: this.totalFrames,
      isPlaying: this.isPlaying,
      frameRate: this.frameRate,
      progress: this.getProgress(),
      isLooping: this.isLooping,
    };
  }
}
