export interface ProgressIndicatorEvents {
  onProgressChange: (progress: number) => void;
}

export class ProgressIndicator {
  private scrubBar: HTMLDivElement;
  private scrubHandle: HTMLDivElement;
  private events: ProgressIndicatorEvents | null = null;

  private totalFrames: number = 0;
  private currentFrame: number = 0;
  private isAnimating: boolean = false;

  constructor(
    scrubBar: HTMLDivElement,
    scrubHandle: HTMLDivElement,
    events?: ProgressIndicatorEvents
  ) {
    this.scrubBar = scrubBar;
    this.scrubHandle = scrubHandle;
    this.events = events || null;

    this.setupProgressBar();
  }

  private setupProgressBar(): void {
    // Add progress fill background
    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";
    progressFill.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background-color: rgba(52, 152, 219, 0.3);
      border-radius: 3px;
      width: 0%;
      transition: width 0.1s ease;
      pointer-events: none;
    `;

    // Insert before the handle
    this.scrubBar.insertBefore(progressFill, this.scrubHandle);

    // Add frame markers for visual reference
    this.createFrameMarkers();
  }

  private createFrameMarkers(): void {
    // Remove existing markers
    const existingMarkers = this.scrubBar.querySelectorAll(".frame-marker");
    existingMarkers.forEach((marker) => marker.remove());

    if (this.totalFrames <= 1) return;

    // Add markers at key frame positions
    const markerCount = Math.min(this.totalFrames, 20); // Limit markers to avoid clutter
    const step = Math.max(1, Math.floor(this.totalFrames / markerCount));

    for (let i = 0; i < this.totalFrames; i += step) {
      const marker = document.createElement("div");
      marker.className = "frame-marker";

      const position = i / Math.max(1, this.totalFrames - 1);
      marker.style.cssText = `
        position: absolute;
        top: -2px;
        left: ${position * 100}%;
        width: 2px;
        height: calc(100% + 4px);
        background-color: rgba(255, 255, 255, 0.5);
        pointer-events: none;
        z-index: 1;
      `;

      this.scrubBar.appendChild(marker);
    }
  }

  public updateProgress(currentFrame: number, totalFrames: number): void {
    this.currentFrame = currentFrame;
    this.totalFrames = totalFrames;

    // Update progress fill
    const progressFill = this.scrubBar.querySelector(
      ".progress-fill"
    ) as HTMLDivElement;
    if (progressFill && totalFrames > 0) {
      const progress = currentFrame / Math.max(1, totalFrames - 1);
      progressFill.style.width = `${progress * 100}%`;
    }

    // Update handle position
    this.updateHandlePosition();

    // Recreate markers if frame count changed
    if (
      this.scrubBar.querySelectorAll(".frame-marker").length !==
      Math.min(totalFrames, 20)
    ) {
      this.createFrameMarkers();
    }
  }

  private updateHandlePosition(): void {
    if (this.totalFrames <= 0) return;

    const progress = this.currentFrame / Math.max(1, this.totalFrames - 1);
    const scrubBarWidth = this.scrubBar.offsetWidth;
    const handlePosition = progress * (scrubBarWidth - 16); // 16px = handle width

    this.scrubHandle.style.left = `${Math.max(0, handlePosition)}px`;
  }

  public setAnimating(isAnimating: boolean): void {
    this.isAnimating = isAnimating;

    // Add visual indication of animation
    const progressFill = this.scrubBar.querySelector(
      ".progress-fill"
    ) as HTMLDivElement;
    if (progressFill) {
      progressFill.style.backgroundColor = isAnimating
        ? "rgba(39, 174, 96, 0.4)" // Green when animating
        : "rgba(52, 152, 219, 0.3)"; // Blue when static
    }

    // Pulse effect for handle when animating
    this.scrubHandle.style.animation = isAnimating
      ? "pulse 2s infinite ease-in-out"
      : "none";
  }

  public getProgress(): number {
    if (this.totalFrames <= 1) return 0;
    return this.currentFrame / (this.totalFrames - 1);
  }

  public getFrameInfo(): {
    currentFrame: number;
    totalFrames: number;
    progress: number;
    isAnimating: boolean;
  } {
    return {
      currentFrame: this.currentFrame,
      totalFrames: this.totalFrames,
      progress: this.getProgress(),
      isAnimating: this.isAnimating,
    };
  }

  public addStyles(): void {
    // Add CSS animation for pulse effect
    if (!document.getElementById("progress-indicator-styles")) {
      const style = document.createElement("style");
      style.id = "progress-indicator-styles";
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .scrub-bar {
          position: relative;
          overflow: visible;
        }
        
        .frame-marker {
          transition: background-color 0.2s ease;
        }
        
        .scrub-bar:hover .frame-marker {
          background-color: rgba(255, 255, 255, 0.8);
        }
      `;
      document.head.appendChild(style);
    }
  }

  public cleanup(): void {
    // Remove markers
    const markers = this.scrubBar.querySelectorAll(".frame-marker");
    markers.forEach((marker) => marker.remove());

    // Remove progress fill
    const progressFill = this.scrubBar.querySelector(".progress-fill");
    if (progressFill) {
      progressFill.remove();
    }

    // Reset handle animation
    this.scrubHandle.style.animation = "none";
  }
}
