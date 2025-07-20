export interface ControlPanelEvents {
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onFrameRateChange: (fps: number) => void;
  onFrameJump: (frameIndex: number) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onGoToFirst: () => void;
  onGoToLast: () => void;
  onLoopToggle: (enabled: boolean) => void;
}

export class ControlPanel {
  private playButton: HTMLButtonElement;
  private frameRateSlider: HTMLInputElement;
  private frameRateValue: HTMLSpanElement;
  private events: ControlPanelEvents;

  private isPlaying: boolean = false;
  private frameRate: number = 12;
  private isLooping: boolean = true;

  constructor(
    playButton: HTMLButtonElement,
    frameRateSlider: HTMLInputElement,
    frameRateValue: HTMLSpanElement,
    events: ControlPanelEvents
  ) {
    this.playButton = playButton;
    this.frameRateSlider = frameRateSlider;
    this.frameRateValue = frameRateValue;
    this.events = events;

    this.setupControls();
    this.setupKeyboardNavigation();
  }

  private setupControls(): void {
    // Play/Pause button
    this.playButton.addEventListener('click', () => {
      if (this.isPlaying) {
        this.events.onPause();
      } else {
        this.events.onPlay();
      }
    });

    // Frame rate slider
    this.frameRateSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const fps = parseInt(target.value);
      this.frameRate = fps;
      this.frameRateValue.textContent = fps.toString();
      this.events.onFrameRateChange(fps);
    });

    // Initialize frame rate display
    this.frameRateValue.textContent = this.frameRateSlider.value;
  }

  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (e) => {
      // Only handle keyboard shortcuts when not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ': // Spacebar for play/pause
          e.preventDefault();
          if (this.isPlaying) {
            this.events.onPause();
          } else {
            this.events.onPlay();
          }
          break;

        case 'Escape': // Stop and go to first frame
          e.preventDefault();
          this.events.onStop();
          break;

        case 'ArrowLeft': // Previous frame
          e.preventDefault();
          this.events.onStepBackward();
          break;

        case 'ArrowRight': // Next frame
          e.preventDefault();
          this.events.onStepForward();
          break;

        case 'Home': // Go to first frame
          e.preventDefault();
          this.events.onGoToFirst();
          break;

        case 'End': // Go to last frame
          e.preventDefault();
          this.events.onGoToLast();
          break;

        case 'j': // Jump to frame
        case 'J':
          e.preventDefault();
          this.promptForFrameJump();
          break;

        case ',': // Step backward (< key)
          e.preventDefault();
          this.events.onStepBackward();
          break;

        case '.': // Step forward (> key)
          e.preventDefault();
          this.events.onStepForward();
          break;

        // Frame rate controls
        case '+':
        case '=':
          e.preventDefault();
          this.adjustFrameRate(1);
          break;

        case '-':
        case '_':
          e.preventDefault();
          this.adjustFrameRate(-1);
          break;

        case 'l':
        case 'L': // Toggle loop
          e.preventDefault();
          this.toggleLoop();
          break;
      }
    });
  }

  private promptForFrameJump(): void {
    const input = prompt('Jump to frame number:');
    if (input !== null) {
      const frameIndex = parseInt(input.trim());
      if (!isNaN(frameIndex) && frameIndex >= 0) {
        this.events.onFrameJump(frameIndex);
      }
    }
  }

  private adjustFrameRate(delta: number): void {
    const currentRate = parseInt(this.frameRateSlider.value);
    const newRate = Math.max(1, Math.min(60, currentRate + delta));
    
    this.frameRateSlider.value = newRate.toString();
    this.frameRate = newRate;
    this.frameRateValue.textContent = newRate.toString();
    this.events.onFrameRateChange(newRate);
  }

  private toggleLoop(): void {
    this.isLooping = !this.isLooping;
    this.events.onLoopToggle(this.isLooping);
    
    // Visual feedback
    console.log(`Loop ${this.isLooping ? 'enabled' : 'disabled'}`);
  }

  public updatePlayState(isPlaying: boolean): void {
    this.isPlaying = isPlaying;
    this.playButton.textContent = isPlaying ? 'Pause' : 'Play';
  }

  public updateFrameRate(fps: number): void {
    this.frameRate = fps;
    this.frameRateSlider.value = fps.toString();
    this.frameRateValue.textContent = fps.toString();
  }

  public getPlayState(): boolean {
    return this.isPlaying;
  }

  public getFrameRate(): number {
    return this.frameRate;
  }

  public updateLoopState(isLooping: boolean): void {
    this.isLooping = isLooping;
  }

  public getLoopState(): boolean {
    return this.isLooping;
  }

  // Add visual indicators for keyboard shortcuts
  public showKeyboardShortcuts(): void {
    const shortcuts = [
      'Spacebar: Play/Pause',
      'Esc: Stop and go to first frame',
      '← →: Previous/Next frame',
      'Home/End: First/Last frame',
      'J: Jump to frame',
      '+/-: Adjust frame rate',
      'L: Toggle loop',
      ', .: Step backward/forward'
    ];

    console.log('Keyboard shortcuts:', shortcuts.join(', '));
    
    // You could also show this in a tooltip or help panel
    this.playButton.title = shortcuts.join('\n');
  }
}