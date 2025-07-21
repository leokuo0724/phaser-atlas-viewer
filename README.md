# Phaser Atlas Viewer

A web-based tool for viewing and debugging TexturePacker atlas animations using Phaser 3. This tool allows developers to load texture atlases, preview sprite animations, and debug frame sequences with an intuitive interface.

![Phaser Atlas Viewer](https://img.shields.io/badge/Phaser-3.70.0-blue?style=for-the-badge) ![TypeScript](https://img.shields.io/badge/TypeScript-5.1.6-blue?style=for-the-badge) ![Vite](https://img.shields.io/badge/Vite-5.0.0-purple?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## 🚀 Live Demo

**Try it now: [https://leokuo0724.github.io/phaser-atlas-viewer/](https://leokuo0724.github.io/phaser-atlas-viewer/)**

## Features

### 🎮 Core Functionality

- **Atlas Loading**: Load TexturePacker atlas files (JSON + texture image)
- **Frame Navigation**: Interactive scrub bar for frame-by-frame navigation
- **Auto-play Animation**: Configurable frame rate (1-60 FPS) with play/pause controls
- **Frame Information**: Real-time display of current frame name and index
- **Auto-scaling**: Sprites automatically scale to fit 800x600 canvas

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/leokuo0724/phaser-atlas-viewer.git
cd phaser-atlas-viewer

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Usage

1. **Load Files**: Select your texture image and atlas JSON file
2. **Click "Load Atlas"**: The viewer will validate and load your atlas
3. **Navigate Frames**: Use the scrub bar or keyboard shortcuts
4. **Control Animation**: Play/pause and adjust frame rate as needed

## Keyboard Shortcuts

| Key          | Action                     |
| ------------ | -------------------------- |
| `Space`      | Play/Pause animation       |
| `Esc`        | Stop and go to first frame |
| `←` `→`      | Previous/Next frame        |
| `Home` `End` | First/Last frame           |
| `J`          | Jump to specific frame     |
| `+` `-`      | Adjust frame rate          |
| `L`          | Toggle loop mode           |
| `,` `.`      | Step backward/forward      |

## Supported Atlas Formats

### TexturePacker JSON Format

The tool supports TexturePacker's standard JSON format:

```json
{
  "textures": [
    {
      "image": "sprite_sheet.png",
      "size": { "w": 1024, "h": 512 },
      "frames": [
        {
          "filename": "sprite_001.png",
          "frame": { "x": 0, "y": 0, "w": 64, "h": 64 },
          "sourceSize": { "w": 64, "h": 64 }
        }
      ]
    }
  ]
}
```

### File Requirements

- **Image**: PNG, JPG, or other web-compatible formats
- **Atlas**: Valid JSON file with TexturePacker structure
- **Frame Names**: Automatically sorted alphabetically for sequence viewing

## Project Structure

```
phaser-atlas-viewer/
├── src/
│   ├── components/          # UI Components
│   │   ├── ControlPanel.ts     # Animation controls
│   │   ├── FileUploader.ts     # File upload handling
│   │   ├── FrameInfo.ts        # Frame information display
│   │   └── ProgressIndicator.ts # Visual progress bar
│   ├── core/               # Core Logic
│   │   ├── AtlasLoader.ts      # Atlas parsing and validation
│   │   ├── FrameController.ts  # Animation control logic
│   │   └── SpriteRenderer.ts   # Phaser rendering
│   ├── types/              # TypeScript Definitions
│   │   ├── AppTypes.ts         # Application state types
│   │   └── AtlasTypes.ts       # TexturePacker format types
│   ├── main.ts             # Application entry point
│   └── index.html          # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Development

### Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm preview  # Preview production build
pnpm clean    # Clean build directory
```

### Architecture Principles

- **Event-Driven**: Components communicate through well-defined events
- **Type Safety**: Full TypeScript coverage with strict configuration
- **Modular Design**: Clear separation of concerns
- **Error Handling**: Comprehensive validation and user feedback
- **Performance**: Efficient rendering and memory management

### Code Quality

- Strict TypeScript configuration
- Consistent code formatting
- Comprehensive error handling
- Memory leak prevention
- Mobile-responsive design

## Browser Compatibility

| Browser | Version | Status             |
| ------- | ------- | ------------------ |
| Chrome  | 90+     | ✅ Fully Supported |
| Firefox | 88+     | ✅ Fully Supported |
| Safari  | 14+     | ✅ Fully Supported |
| Edge    | 90+     | ✅ Fully Supported |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain existing code style
- Add comprehensive error handling
- Update documentation for new features
- Test across supported browsers

## Troubleshooting

### Common Issues

**Atlas Not Loading**

- Verify JSON format matches TexturePacker structure
- Check that image and atlas files match
- Ensure file paths are accessible

**Performance Issues**

- Large atlases (>2048px) may impact performance
- Consider reducing frame count for smoother playback
- Close other browser tabs to free memory

**Mobile Issues**

- Touch interactions require modern mobile browsers
- Large atlases may exceed mobile memory limits
- Use landscape orientation for better experience

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Phaser 3](https://phaser.io/) - Powerful 2D game framework
- [TexturePacker](https://www.codeandweb.com/texturepacker) - Atlas creation tool
- [Vite](https://vitejs.dev/) - Fast build tool
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

---

**Built with ❤️ for game developers and animators**
