# Phaser Atlas Viewer

## Requirement

This project is a simple Phaser utility tool. The interface will have two file inputs, allowing users to load a texture image and its corresponding atlas JSON file from local storage.
When users upload the files and click the run button, the sprite will be displayed on the canvas. The canvas will have a draggable bar, initially positioned at the leftmost side representing the first frame. Moving the bar to the right will play subsequent frames.
Additionally, the canvas will display the current frame name for debugging purposes.

## Technical Specifications

### Core Requirements

- **Atlas Format**: TexturePacker with Phaser consumable format
- **Image Support**: PNG, JPG, WebP
- **Canvas Size**: Fixed 800x600 pixels
- **Target Browser**: Chrome
- **Framework**: Phaser 3.x + TypeScript + Vanilla JS
- **Sprite Scaling**: Auto-scale to fit canvas

### Features

- **File Input**: Drag & drop support for texture image + atlas JSON
- **Frame Navigation**:
  - Draggable scrub bar (0-100% → frame indices)
  - Click-to-jump functionality
  - Auto-play with configurable frame rate (1-60 FPS)
- **UI Controls**:
  - Play/Pause button
  - Frame rate slider
  - Current frame name display
  - Progress indicator

### Architecture

```
PhaserAtlasViewer/
├── src/
│   ├── types/
│   │   ├── AtlasTypes.ts      // TexturePacker format definitions
│   │   └── AppTypes.ts        // Application state types
│   ├── components/
│   │   ├── FileUploader.ts    // File input handling
│   │   ├── ControlPanel.ts    // UI controls
│   │   └── FrameInfo.ts       // Frame name display
│   ├── core/
│   │   ├── AtlasLoader.ts     // Atlas JSON + texture loading
│   │   ├── SpriteRenderer.ts  // Phaser sprite rendering
│   │   └── FrameController.ts // Frame navigation & animation
│   └── main.ts                // Application entry point
├── assets/                    // Sample files for testing
└── dist/                      // Built output
```

### Data Flow

```
[File Inputs] → [AtlasLoader] → [SpriteRenderer]
                      ↓              ↑
[FrameController] ← [Frame Data] → [UI Controls]
      ↓
[Scrub Bar] ← → [Auto-play] → [Frame Display]
```

### Atlas JSON Format Example

```json
{
  "textures": [
    {
      "image": "pitcher.png",
      "format": "RGBA8888",
      "size": { "w": 1997, "h": 1849 },
      "scale": 1,
      "frames": [
        {
          "filename": "pitcher_00043.png",
          "rotated": false,
          "trimmed": true,
          "sourceSize": { "w": 360, "h": 540 },
          "spriteSourceSize": { "x": 38, "y": 197, "w": 135, "h": 307 },
          "frame": { "x": 1, "y": 1, "w": 135, "h": 307 },
          "anchor": { "x": 0.5, "y": 0.5 }
        }
      ]
    }
  ]
}
```

## Implementation Plan

### Phase 1: Core Setup

1. Project initialization with TypeScript + Phaser 3.x
2. Basic HTML structure with file inputs
3. Canvas setup (800x600)

### Phase 2: File Handling

1. File upload system with validation
2. Atlas JSON parsing
3. Texture loading and validation

### Phase 3: Sprite Rendering

1. Phaser scene setup
2. Sprite creation from atlas data
3. Auto-scaling logic for canvas fit

### Phase 4: Frame Control

1. Scrub bar implementation
2. Frame navigation logic
3. Click-to-jump functionality

### Phase 5: Auto-play & UI

1. Auto-play system with frame rate control
2. Play/pause controls
3. Frame name display
4. Progress indicator

### Phase 6: Polish & Testing

1. Error handling and user feedback
2. Performance optimization
3. Cross-browser testing
4. Documentation
