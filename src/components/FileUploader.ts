import { AtlasData } from "../types/AtlasTypes";

export interface FileUploadEvents {
  onFilesReady: (textureFile: File, atlasFile: File) => void;
  onError: (message: string) => void;
}

export class FileUploader {
  private textureInput: HTMLInputElement;
  private atlasInput: HTMLInputElement;
  private runButton: HTMLButtonElement;
  private events: FileUploadEvents;

  constructor(
    textureInput: HTMLInputElement,
    atlasInput: HTMLInputElement,
    runButton: HTMLButtonElement,
    events: FileUploadEvents
  ) {
    this.textureInput = textureInput;
    this.atlasInput = atlasInput;
    this.runButton = runButton;
    this.events = events;

    this.setupFileInputs();
    this.setupRunButton();
  }

  private setupFileInputs(): void {
    // Setup drag and drop for texture input
    this.setupDragAndDrop(this.textureInput, [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ]);

    // Setup drag and drop for atlas input
    this.setupDragAndDrop(this.atlasInput, ["application/json"]);

    // File change listeners
    this.textureInput.addEventListener("change", () => this.validateFiles());
    this.atlasInput.addEventListener("change", () => this.validateFiles());
  }

  private setupDragAndDrop(
    input: HTMLInputElement,
    acceptedTypes: string[]
  ): void {
    // Prevent default drag behaviors
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      input.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ["dragenter", "dragover"].forEach((eventName) => {
      input.addEventListener(eventName, () => this.highlight(input), false);
    });

    ["dragleave", "drop"].forEach((eventName) => {
      input.addEventListener(eventName, () => this.unhighlight(input), false);
    });

    // Handle dropped files
    input.addEventListener(
      "drop",
      (e) => this.handleDrop(e, input, acceptedTypes),
      false
    );
  }

  private preventDefaults(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
  }

  private highlight(input: HTMLInputElement): void {
    input.classList.add("dragover");
  }

  private unhighlight(input: HTMLInputElement): void {
    input.classList.remove("dragover");
  }

  private handleDrop(
    e: DragEvent,
    input: HTMLInputElement,
    acceptedTypes: string[]
  ): void {
    const dt = e.dataTransfer;
    if (!dt) return;

    const files = dt.files;
    if (files.length > 0) {
      const file = files[0];

      // Validate file type
      if (!file || !this.isValidFileType(file, acceptedTypes)) {
        this.events.onError(
          `Invalid file type. Expected: ${acceptedTypes.join(", ")}`
        );
        return;
      }

      // Set the file to the input
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;

      this.validateFiles();
    }
  }

  private isValidFileType(file: File, acceptedTypes: string[]): boolean {
    return acceptedTypes.some((type) => {
      if (type === "application/json") {
        return (
          file.type === "application/json" ||
          file.name.toLowerCase().endsWith(".json")
        );
      }
      return file.type === type;
    });
  }

  private setupRunButton(): void {
    this.runButton.addEventListener("click", () => this.handleRunClick());
  }

  private validateFiles(): void {
    const textureFile = this.textureInput.files?.[0];
    const atlasFile = this.atlasInput.files?.[0];

    // Enable/disable run button based on file selection
    this.runButton.disabled = !(textureFile && atlasFile);

    // Validate file types
    if (textureFile && !this.isValidImageFile(textureFile)) {
      this.events.onError("Please select a valid image file (PNG, JPG, WebP)");
      return;
    }

    if (atlasFile && !this.isValidJSONFile(atlasFile)) {
      this.events.onError("Please select a valid JSON file");
      return;
    }

    // Clear any previous errors if files are valid
    if (textureFile && atlasFile) {
      this.events.onError("");
    }
  }

  private isValidImageFile(file: File): boolean {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    return (
      validTypes.includes(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name)
    );
  }

  private isValidJSONFile(file: File): boolean {
    return (
      file.type === "application/json" ||
      file.name.toLowerCase().endsWith(".json")
    );
  }

  private async handleRunClick(): Promise<void> {
    const textureFile = this.textureInput.files?.[0];
    const atlasFile = this.atlasInput.files?.[0];

    if (!textureFile || !atlasFile) {
      this.events.onError("Please select both texture and atlas files");
      return;
    }

    try {
      // Validate atlas JSON structure
      await this.validateAtlasFile(atlasFile);

      // If validation passes, notify parent component
      this.events.onFilesReady(textureFile, atlasFile);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      this.events.onError(`File validation failed: ${message}`);
    }
  }

  private async validateAtlasFile(file: File): Promise<AtlasData> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate basic atlas structure
      if (!data.textures || !Array.isArray(data.textures)) {
        throw new Error("Invalid atlas format: missing textures array");
      }

      if (data.textures.length === 0) {
        throw new Error("Invalid atlas format: no textures found");
      }

      const texture = data.textures[0];
      if (!texture.frames || !Array.isArray(texture.frames)) {
        throw new Error("Invalid atlas format: missing frames array");
      }

      if (texture.frames.length === 0) {
        throw new Error("Invalid atlas format: no frames found");
      }

      // Validate frame structure
      const frame = texture.frames[0];
      const requiredFields = ["filename", "frame", "sourceSize"];
      for (const field of requiredFields) {
        if (!(field in frame)) {
          throw new Error(`Invalid frame format: missing ${field} field`);
        }
      }

      return data as AtlasData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("Invalid JSON file format");
      }
      throw error;
    }
  }

  // Public methods for external control
  public reset(): void {
    this.textureInput.value = "";
    this.atlasInput.value = "";
    this.runButton.disabled = true;
    this.events.onError("");
  }

  public getSelectedFiles(): { texture: File | null; atlas: File | null } {
    return {
      texture: this.textureInput.files?.[0] || null,
      atlas: this.atlasInput.files?.[0] || null,
    };
  }
}
