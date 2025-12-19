# LLMAXX Desktop Overlay

A sophisticated AI desktop overlay application inspired by SillyTavern, featuring real-time chat with AI characters, system monitoring, and a futuristic tech aesthetic.

## Features

### 🎨 **Core Interface**
- **Desktop Overlay**: Transparent, always-on-top overlay that sits above other applications
- **Collapsible Chat Window**: Right-side chat (33% of screen) that collapses to top-right corner
- **Character Management**: Upper-left character button with radial menu for quick access
- **System Monitor**: Bottom-left widget showing CPU/GPU usage and server status
- **World Info Panel**: Bottom panel for lore and character notes (collapsible)

### 🤖 **AI Integration**
- **Multiple AI Providers**: Support for Ollama, OpenAI, Anthropic, and Google
- **Streaming Responses**: Real-time message streaming with typing indicators
- **Character System**: SillyTavern-compatible character cards and management
- **World Information**: Context-aware lore and setting integration
- **Custom Prompts**: System prompt management and variable substitution

### 🎯 **User Experience**
- **Radial Menus**: Intuitive radial menus for character and extension access
- **Keyboard Shortcuts**: Global shortcuts for quick access (Ctrl+Shift+L, etc.)
- **Tech/Future Aesthetic**: Muted gray base with deep purple and pink accents
- **Responsive Design**: Adapts to different screen sizes and resolutions
- **Click-through Mode**: Toggle interaction with underlying applications

### 🔧 **System Features**
- **Real-time Monitoring**: CPU, memory, GPU usage tracking
- **Ollama Integration**: Built-in Ollama status and model management
- **Extensions Support**: Plugin system for custom functionality
- **Settings Management**: Comprehensive configuration options
- **Data Import/Export**: Backup and restore functionality

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Ollama (for local AI models)

### Setup
```bash
# Clone the repository
git clone https://github.com/llmaxx/llmaxx.git
cd llmaxx

# Install dependencies
npm install

# Start the application
npm start

# For development mode
npm run dev
```

## Usage

### Getting Started
1. **Install Ollama** from [ollama.ai](https://ollama.ai)
2. **Pull a model**: `ollama pull llama2`
3. **Launch LLMAXX**: `npm start`
4. **Create your first character** using the character button (upper-left)

### Character Creation
1. Click the **Characters** button in the upper-left
2. Select **"Create Contact"** from the radial menu
3. Fill in character details (name, description, personality, etc.)
4. Save and start chatting!

### World Information
1. Click the **bottom panel** to expand world info
2. Add lore items with the **"Add Lore"** button
3. Organize settings, character notes, and story elements
4. World info automatically integrates into AI context

### Keyboard Shortcuts
- `Ctrl+Shift+L`: Toggle LLMAXX visibility
- `Ctrl+Shift+M`: Toggle click-through mode
- `Ctrl+Shift+C`: Focus chat input
- `Ctrl+Shift+K`: Clear chat history
- `Ctrl+Shift+S`: Open settings
- `Ctrl+Shift+O`: Open character list

## Configuration

### AI Provider Settings
Configure your preferred AI provider in **Settings > AI Configuration**:
- **Ollama**: Local models (default)
- **OpenAI**: GPT models
- **Anthropic**: Claude models
- **Google**: Gemini models

### Appearance Customization
- **Theme**: Dark, Light, or Auto
- **Accent Colors**: Purple, Pink, Blue, Green
- **Opacity**: Adjust window transparency
- **Compact Mode**: Reduce spacing for more screen space

### System Monitor
- **Update Frequency**: 1-5 second intervals
- **Display Options**: Show/hide specific metrics
- **Performance Settings**: Hardware acceleration toggle

## Development

### Project Structure
```
llmaxx/
├── src/
│   ├── components/          # UI components
│   ├── utils/              # Utility functions
│   ├── styles/             # CSS stylesheets
│   ├── main.js            # Electron main process
│   ├── index.html         # Main HTML file
│   └── app.js             # Application entry point
├── assets/                # Static assets
├── docs/                  # Documentation
└── package.json          # Project configuration
```

### Building
```bash
# Build for all platforms
npm run build

# Build for specific platform
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux
```

### Extension Development
LLMAXX supports custom extensions through the plugin system. Create extensions in the `extensions/` directory and enable them in settings.

## API Reference

### Character Format
LLMAXX uses SillyTavern-compatible character cards:

```json
{
  "name": "Character Name",
  "data": {
    "description": "Character description",
    "personality": "Personality traits",
    "first_mes": "First message",
    "mes_example": "Example conversations",
    "system_prompt": "AI instructions"
  }
}
```

### World Info Format
```json
{
  "lore": [
    {
      "key": "Setting",
      "value": "Modern day Tokyo",
      "priority": "high"
    }
  ]
}
```

## Troubleshooting

### Common Issues

**LLMAXX doesn't start**
- Check Node.js version (requires 18+)
- Run `npm install` to ensure dependencies
- Check console for error messages

**Ollama not detected**
- Ensure Ollama is running: `ollama serve`
- Check if port 11434 is available
- Verify Ollama installation

**Chat not working**
- Check AI provider configuration in settings
- Verify internet connection for cloud providers
- Ensure model is downloaded for Ollama

**Overlay not appearing**
- Check if application is minimized
- Try `Ctrl+Shift+L` to toggle visibility
- Check system tray icon

### Performance Tips
- Enable hardware acceleration in settings
- Reduce update frequency for system monitor
- Use compact mode for smaller screens
- Close unused browser tabs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow the existing code style
- Use TypeScript for new components
- Add documentation for new features
- Test on multiple platforms

## License

MIT License - see LICENSE file for details.

## Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/llmaxx/llmaxx/issues)
- **Discord**: [Join our community](https://discord.gg/llmaxx)
- **Documentation**: [Full documentation](https://docs.llmaxx.ai)

## Acknowledgments

- Inspired by [SillyTavern](https://github.com/SillyTavern/SillyTavern)
- Built with [Electron](https://electronjs.org/)
- AI integration via [Ollama](https://ollama.ai/)

---

**LLMAXX** - Your AI Desktop Companion 🚀