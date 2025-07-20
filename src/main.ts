import * as Phaser from "phaser";
import {
  DEFAULT_CANVAS_CONFIG,
  DEFAULT_APP_STATE,
  AppState,
} from "./types/AppTypes";
import { FileUploader, FileUploadEvents } from "./components/FileUploader";
import { AtlasLoader } from "./core/AtlasLoader";
import { SpriteRenderer, SpriteRenderEvents } from "./core/SpriteRenderer";
import { FrameController, FrameControllerEvents } from "./core/FrameController";
import { FrameData } from "./types/AtlasTypes";
import { ControlPanel, ControlPanelEvents } from "./components/ControlPanel";
import { FrameInfo, FrameInfoEvents } from "./components/FrameInfo";
import {
  ProgressIndicator,
  ProgressIndicatorEvents,
} from "./components/ProgressIndicator";

class PhaserAtlasViewer {
  private game: Phaser.Game | null = null;
  private scene: Phaser.Scene | null = null;
  private state: AppState = { ...DEFAULT_APP_STATE };
  private elements: { [key: string]: HTMLElement } = {};
  private fileUploader: FileUploader | null = null;
  private atlasLoader: AtlasLoader | null = null;
  private spriteRenderer: SpriteRenderer | null = null;
  private frameController: FrameController | null = null;
  private controlPanel: ControlPanel | null = null;
  private frameInfo: FrameInfo | null = null;
  private progressIndicator: ProgressIndicator | null = null;

  constructor() {
    this.initializeElements();
    this.initializeComponents();
    this.setupEventListeners();
    this.initializePhaser();
  }

  private initializeElements(): void {
    // Get DOM elements with null checks
    const textureInput = document.getElementById("textureInput");
    const atlasInput = document.getElementById("atlasInput");
    const runButton = document.getElementById("runButton");
    const viewerSection = document.getElementById("viewerSection");
    const playButton = document.getElementById("playButton");
    const scrubBar = document.getElementById("scrubBar");
    const scrubHandle = document.getElementById("scrubHandle");
    const frameRateSlider = document.getElementById("frameRateSlider");
    const frameRateValue = document.getElementById("frameRateValue");
    const currentFrameName = document.getElementById("currentFrameName");
    const currentFrameIndex = document.getElementById("currentFrameIndex");
    const totalFrames = document.getElementById("totalFrames");
    const errorMessage = document.getElementById("errorMessage");
    const gameContainer = document.getElementById("gameContainer");

    if (
      !textureInput ||
      !atlasInput ||
      !runButton ||
      !viewerSection ||
      !playButton ||
      !scrubBar ||
      !scrubHandle ||
      !frameRateSlider ||
      !frameRateValue ||
      !currentFrameName ||
      !currentFrameIndex ||
      !totalFrames ||
      !errorMessage ||
      !gameContainer
    ) {
      throw new Error("Required DOM elements not found");
    }

    this.elements.textureInput = textureInput as HTMLInputElement;
    this.elements.atlasInput = atlasInput as HTMLInputElement;
    this.elements.runButton = runButton as HTMLButtonElement;
    this.elements.viewerSection = viewerSection as HTMLDivElement;
    this.elements.playButton = playButton as HTMLButtonElement;
    this.elements.scrubBar = scrubBar as HTMLDivElement;
    this.elements.scrubHandle = scrubHandle as HTMLDivElement;
    this.elements.frameRateSlider = frameRateSlider as HTMLInputElement;
    this.elements.frameRateValue = frameRateValue as HTMLSpanElement;
    this.elements.currentFrameName = currentFrameName as HTMLSpanElement;
    this.elements.currentFrameIndex = currentFrameIndex as HTMLSpanElement;
    this.elements.totalFrames = totalFrames as HTMLSpanElement;
    this.elements.errorMessage = errorMessage as HTMLDivElement;
    this.elements.gameContainer = gameContainer as HTMLDivElement;
  }

  private initializeComponents(): void {
    // Initialize atlas loader
    this.atlasLoader = new AtlasLoader();

    // Initialize file uploader with event handlers
    const uploadEvents: FileUploadEvents = {
      onFilesReady: (textureFile: File, atlasFile: File) =>
        this.handleFilesReady(textureFile, atlasFile),
      onError: (message: string) => this.showError(message),
    };

    this.fileUploader = new FileUploader(
      this.elements.textureInput as HTMLInputElement,
      this.elements.atlasInput as HTMLInputElement,
      this.elements.runButton as HTMLButtonElement,
      uploadEvents
    );

    // Initialize control panel
    const controlEvents: ControlPanelEvents = {
      onPlay: () => this.frameController?.play(),
      onPause: () => this.frameController?.pause(),
      onStop: () => this.frameController?.stop(),
      onFrameRateChange: (fps: number) =>
        this.frameController?.setFrameRate(fps),
      onFrameJump: (frameIndex: number) => this.setCurrentFrame(frameIndex),
      onStepForward: () => this.frameController?.nextFrame(),
      onStepBackward: () => this.frameController?.previousFrame(),
      onGoToFirst: () => this.frameController?.goToFirstFrame(),
      onGoToLast: () => this.frameController?.goToLastFrame(),
      onLoopToggle: (enabled: boolean) =>
        this.frameController?.setLooping(enabled),
    };

    this.controlPanel = new ControlPanel(
      this.elements.playButton as HTMLButtonElement,
      this.elements.frameRateSlider as HTMLInputElement,
      this.elements.frameRateValue as HTMLSpanElement,
      controlEvents
    );

    // Initialize frame info display
    const frameInfoEvents: FrameInfoEvents = {
      onFrameJump: (frameIndex: number) => this.setCurrentFrame(frameIndex),
    };

    this.frameInfo = new FrameInfo(
      this.elements.currentFrameName as HTMLSpanElement,
      this.elements.currentFrameIndex as HTMLSpanElement,
      this.elements.totalFrames as HTMLSpanElement,
      frameInfoEvents
    );

    // Initialize progress indicator
    const progressEvents: ProgressIndicatorEvents = {
      onProgressChange: (progress: number) => {
        if (this.frameController) {
          this.frameController.setFrameFromProgress(progress);
        }
      },
    };

    this.progressIndicator = new ProgressIndicator(
      this.elements.scrubBar as HTMLDivElement,
      this.elements.scrubHandle as HTMLDivElement,
      progressEvents
    );

    // Add progress indicator styles
    this.progressIndicator.addStyles();
  }

  private setupEventListeners(): void {
    // Scrub bar interactions (enhanced)
    this.setupScrubBarListeners();

    // Show keyboard shortcuts info
    if (this.controlPanel) {
      this.controlPanel.showKeyboardShortcuts();
    }
  }

  private setupScrubBarListeners(): void {
    let isDragging = false;
    let wasDragging = false;

    const updateFrameFromPosition = (clientX: number) => {
      if (this.state.totalFrames === 0) return;

      const rect = (
        this.elements.scrubBar as HTMLDivElement
      ).getBoundingClientRect();
      const position = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );
      const frameIndex = Math.floor(
        position * Math.max(0, this.state.totalFrames - 1)
      );
      this.setCurrentFrame(frameIndex);
    };

    // Enhanced mouse events with better UX
    (this.elements.scrubBar as HTMLDivElement).addEventListener(
      "mousedown",
      (e) => {
        e.preventDefault();
        isDragging = true;
        wasDragging = false;
        updateFrameFromPosition(e.clientX);
        (this.elements.scrubHandle as HTMLDivElement).style.cursor = "grabbing";

        // Pause animation while dragging
        if (this.frameController?.getIsPlaying()) {
          this.frameController.pause();
        }
      }
    );

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        wasDragging = true;
        updateFrameFromPosition(e.clientX);
      }
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        (this.elements.scrubHandle as HTMLDivElement).style.cursor = "grab";

        // Reset drag flag after a small delay to prevent click event
        setTimeout(() => {
          wasDragging = false;
        }, 10);
      }
    });

    // Click to jump (only if not dragging)
    (this.elements.scrubBar as HTMLDivElement).addEventListener(
      "click",
      (e) => {
        if (!wasDragging) {
          updateFrameFromPosition(e.clientX);
        }
      }
    );

    // Touch events for mobile support
    (this.elements.scrubBar as HTMLDivElement).addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        isDragging = true;
        const touch = e.touches[0];
        if (touch) {
          updateFrameFromPosition(touch.clientX);
        }
      }
    );

    document.addEventListener("touchmove", (e) => {
      if (isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) {
          updateFrameFromPosition(touch.clientX);
        }
      }
    });

    document.addEventListener("touchend", () => {
      if (isDragging) {
        isDragging = false;
      }
    });

    // Hover effects
    (this.elements.scrubBar as HTMLDivElement).addEventListener(
      "mouseenter",
      () => {
        if (!isDragging) {
          (this.elements.scrubHandle as HTMLDivElement).style.backgroundColor =
            "#2980b9";
        }
      }
    );

    (this.elements.scrubBar as HTMLDivElement).addEventListener(
      "mouseleave",
      () => {
        if (!isDragging) {
          (this.elements.scrubHandle as HTMLDivElement).style.backgroundColor =
            "#3498db";
        }
      }
    );
  }

  private async handleFilesReady(
    textureFile: File,
    atlasFile: File
  ): Promise<void> {
    try {
      if (!this.atlasLoader) {
        throw new Error("Atlas loader not initialized");
      }

      // Show loading state
      this.showError("Loading atlas...");

      // Load and validate atlas
      const loadedAtlas = await this.atlasLoader.loadAtlas(
        textureFile,
        atlasFile
      );

      // Update application state
      this.state.atlasData = loadedAtlas.data;
      this.state.totalFrames = loadedAtlas.totalFrames;
      this.state.currentFrame = 0;
      this.state.textureLoaded = false;

      // Load into Phaser sprite renderer
      if (this.spriteRenderer) {
        await this.spriteRenderer.loadAtlasTexture(
          loadedAtlas.textureURL,
          loadedAtlas.frames
        );
      }

      // Initialize frame controller
      if (this.frameController) {
        this.frameController.initialize(loadedAtlas.totalFrames);
      }

      // Success - show viewer
      this.showError("");
      this.showViewer();
      this.updateUI();

      console.log("Atlas loaded successfully:", {
        totalFrames: loadedAtlas.totalFrames,
        textureSize: loadedAtlas.data.textures[0]?.size,
        imageName: loadedAtlas.data.textures[0]?.image,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      this.showError(`Failed to load atlas: ${message}`);
      console.error("Atlas loading failed:", error);
    }
  }

  private initializePhaser(): void {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: DEFAULT_CANVAS_CONFIG.width,
      height: DEFAULT_CANVAS_CONFIG.height,
      parent: "gameContainer",
      backgroundColor: DEFAULT_CANVAS_CONFIG.backgroundColor,
      antialias: DEFAULT_CANVAS_CONFIG.antialias,
      scene: {
        preload: () => {},
        create: () => this.onSceneCreate(),
        update: () => this.onSceneUpdate(),
      },
    };

    this.game = new Phaser.Game(config);
  }

  private onSceneCreate(): void {
    if (this.game && this.game.scene.scenes[0]) {
      this.scene = this.game.scene.scenes[0];
      this.initializeRendering();
    }
  }

  private initializeRendering(): void {
    if (!this.scene) return;

    // Initialize sprite renderer
    const spriteEvents: SpriteRenderEvents = {
      onFrameChanged: (frameIndex: number, _frameData: FrameData) => {
        this.state.currentFrame = frameIndex;
        this.updateUI();
      },
      onRenderError: (error: string) =>
        this.showError(`Rendering error: ${error}`),
    };

    this.spriteRenderer = new SpriteRenderer(this.scene, spriteEvents);

    // Initialize frame controller
    const frameEvents: FrameControllerEvents = {
      onFrameChange: (frameIndex: number, _frameData: FrameData | null) => {
        if (this.spriteRenderer) {
          this.spriteRenderer.setFrame(frameIndex);
        }
      },
      onPlayStateChange: (isPlaying: boolean) => {
        this.state.isPlaying = isPlaying;
        if (this.controlPanel) {
          this.controlPanel.updatePlayState(isPlaying);
        }
        if (this.progressIndicator) {
          this.progressIndicator.setAnimating(isPlaying);
        }
      },
      onFrameRateChange: (fps: number) => {
        this.state.frameRate = fps;
        if (this.controlPanel) {
          this.controlPanel.updateFrameRate(fps);
        }
      },
    };

    this.frameController = new FrameController(frameEvents, (index: number) => {
      return this.atlasLoader?.getFrameData(index) || null;
    });
  }

  private onSceneUpdate(): void {
    // Animation update logic - handled by FrameController
  }

  private setCurrentFrame(frameIndex: number): void {
    if (frameIndex < 0 || frameIndex >= this.state.totalFrames) return;

    if (this.frameController) {
      this.frameController.setFrame(frameIndex);
    }
  }

  private updateUI(): void {
    // Update frame info using the frame info component
    const currentFrameData = this.getCurrentFrameData();
    if (this.frameInfo) {
      this.frameInfo.updateFrameInfo(
        this.state.currentFrame,
        this.state.totalFrames,
        currentFrameData
      );
    }

    // Update progress indicator
    if (this.progressIndicator) {
      this.progressIndicator.updateProgress(
        this.state.currentFrame,
        this.state.totalFrames
      );
    }

    // Update scrub bar position (fallback)
    this.updateScrubBarPosition();
  }

  private updateScrubBarPosition(): void {
    if (this.state.totalFrames <= 0) return;

    const position =
      this.state.currentFrame / Math.max(1, this.state.totalFrames - 1);
    const scrubBarWidth = (this.elements.scrubBar as HTMLDivElement)
      .offsetWidth;
    const handlePosition = position * (scrubBarWidth - 16); // 16px = handle width

    (
      this.elements.scrubHandle as HTMLDivElement
    ).style.left = `${handlePosition}px`;
  }

  private getCurrentFrameData() {
    if (!this.atlasLoader) return null;
    return this.atlasLoader.getFrameData(this.state.currentFrame);
  }

  private showViewer(): void {
    (this.elements.viewerSection as HTMLDivElement).classList.add("active");
  }

  private showError(message: string): void {
    if (message) {
      (this.elements.errorMessage as HTMLDivElement).textContent = message;
      (this.elements.errorMessage as HTMLDivElement).classList.add("show");
    } else {
      (this.elements.errorMessage as HTMLDivElement).classList.remove("show");
    }
  }

  public cleanup(): void {
    // Cleanup frame controller
    if (this.frameController) {
      this.frameController.cleanup();
    }

    // Cleanup sprite renderer
    if (this.spriteRenderer) {
      this.spriteRenderer.cleanup();
    }

    // Cleanup atlas loader resources
    if (this.atlasLoader) {
      this.atlasLoader.cleanup();
    }

    // Reset UI components
    if (this.controlPanel) {
      this.controlPanel.updatePlayState(false);
    }

    if (this.progressIndicator) {
      this.progressIndicator.cleanup();
    }

    // Cleanup Phaser game
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }

    // Reset file uploader
    if (this.fileUploader) {
      this.fileUploader.reset();
    }

    // Reset component references
    this.controlPanel = null;
    this.frameInfo = null;
    this.progressIndicator = null;
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PhaserAtlasViewer();
});
