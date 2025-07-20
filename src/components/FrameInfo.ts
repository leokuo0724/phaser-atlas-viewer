import { FrameData } from "../types/AtlasTypes";

export interface FrameInfoEvents {
  onFrameJump: (frameIndex: number) => void;
}

export class FrameInfo {
  private currentFrameNameElement: HTMLSpanElement;
  private currentFrameIndexElement: HTMLSpanElement;
  private totalFramesElement: HTMLSpanElement;
  private events: FrameInfoEvents | null = null;

  private totalFrames: number = 0;
  private currentFrame: number = 0;

  constructor(
    currentFrameNameElement: HTMLSpanElement,
    currentFrameIndexElement: HTMLSpanElement,
    totalFramesElement: HTMLSpanElement,
    events?: FrameInfoEvents
  ) {
    this.currentFrameNameElement = currentFrameNameElement;
    this.currentFrameIndexElement = currentFrameIndexElement;
    this.totalFramesElement = totalFramesElement;
    this.events = events || null;

    this.setupInteractivity();
  }

  private setupInteractivity(): void {
    // Make frame index clickable for direct frame input
    this.currentFrameIndexElement.style.cursor = "pointer";
    this.currentFrameIndexElement.style.textDecoration = "underline";
    this.currentFrameIndexElement.title = "Click to jump to specific frame";

    this.currentFrameIndexElement.addEventListener("click", () => {
      this.promptForFrameJump();
    });
  }

  private promptForFrameJump(): void {
    if (!this.events || this.totalFrames === 0) return;

    const input = prompt(
      `Jump to frame (0-${this.totalFrames - 1}):`,
      this.currentFrame.toString()
    );

    if (input !== null) {
      const frameIndex = parseInt(input.trim());

      if (
        !isNaN(frameIndex) &&
        frameIndex >= 0 &&
        frameIndex < this.totalFrames
      ) {
        this.events.onFrameJump(frameIndex);
      } else {
        alert(
          `Please enter a valid frame number between 0 and ${
            this.totalFrames - 1
          }`
        );
      }
    }
  }

  public updateFrameInfo(
    frameIndex: number,
    totalFrames: number,
    frameData: FrameData | null
  ): void {
    this.currentFrame = frameIndex;
    this.totalFrames = totalFrames;

    // Update frame name
    this.currentFrameNameElement.textContent = frameData?.filename || "-";

    // Update frame index
    this.currentFrameIndexElement.textContent = frameIndex.toString();

    // Update total frames
    this.totalFramesElement.textContent = (totalFrames - 1).toString();

    // Update title for accessibility
    this.currentFrameIndexElement.title = `Frame ${frameIndex} of ${
      totalFrames - 1
    }. Click to jump to specific frame.`;
  }

  public setFrameJumpHandler(events: FrameInfoEvents): void {
    this.events = events;
  }

  public getFrameInfo(): {
    currentFrame: number;
    totalFrames: number;
    frameName: string;
  } {
    return {
      currentFrame: this.currentFrame,
      totalFrames: this.totalFrames,
      frameName: this.currentFrameNameElement.textContent || "-",
    };
  }
}
