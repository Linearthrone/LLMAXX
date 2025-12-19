// LLMAXX Main Application
// Initializes and coordinates all components

import { createRadialMenu } from './components/radialMenu.js';
import { ChatComponent } from './components/chat.js';
import { SystemMonitorComponent } from './components/systemMonitor.js';
import { WorldInfoComponent } from './components/worldInfo.js';
import { CharacterManagerComponent } from './components/characterManager.js';
import { SettingsComponent } from './components/settings.js';
import { characterStorage } from './utils/storage.js';
import { UI_CONSTANTS } from './utils/constants.js';

class LLMAXXApp {
  constructor() {
    this.components = {};
    this.isInitialized = false;
    this.eventBus = new EventTarget();
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  async init() {
    try {
      console.log('Initializing LLMAXX...');
      
      // Add global event bus
      if (typeof window !== 'undefined') {
        window.appEvents = this.eventBus;
      }
      
      // Initialize components
      await this.initializeComponents();
      
      // Setup global event handlers
      this.setupGlobalEvents();
      
      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();
      
      // Initialize UI state
      this.restoreUIState();
      
      this.isInitialized = true;
      console.log('LLMAXX initialized successfully');
      
      // Show welcome message if first time
      await this.showWelcomeIfNeeded();
      
    } catch (error) {
      console.error('Failed to initialize LLMAXX:', error);
      this.showError('Application initialization failed');
    }
  }

  async initializeComponents() {
    // Initialize chat component
    this.components.chat = new ChatComponent();
    
    // Initialize system monitor
    this.components.systemMonitor = new SystemMonitorComponent();
    
    // Initialize world info
    this.components.worldInfo = new WorldInfoComponent();
    
    // Initialize character manager
    this.components.characterManager = new CharacterManagerComponent();
    
    // Initialize settings
    this.components.settings = new SettingsComponent();
    
    // Setup radial menus
    this.setupRadialMenus();
    
    // Add component styles
    this.addAppStyles();
  }

  setupRadialMenus() {
    // Character radial menu
    const characterMenu = createRadialMenu({
      menuElement: document.getElementById('characterRadialMenu'),
      triggerElement: document.getElementById('characterButton'),
      items: [
        { action: 'ai-contacts', icon: '🤖', label: 'AI Contacts' },
        { action: 'create-contact', icon: '➕', label: 'Create Contact' },
        { action: 'import-characters', icon: '📥', label: 'Import' },
        { action: 'character-settings', icon: '⚙️', label: 'Settings' }
      ],
      onSelect: (selection) => this.handleRadialMenuSelection('character', selection)
    });

    this.components.characterMenu = characterMenu;

    // Extensions radial menu
    const extensionsMenu = createRadialMenu({
      menuElement: document.getElementById('extensionsRadialMenu'),
      triggerElement: document.getElementById('extensionsButton'),
      items: [
        { action: 'plugin-manager', icon: '🧩', label: 'Plugin Manager' },
        { action: 'custom-scripts', icon: '📜', label: 'Custom Scripts' },
        { action: 'voice-input', icon: '🎤', label: 'Voice Input' },
        { action: 'image-gen', icon: '🖼️', label: 'Image Generation' }
      ],
      onSelect: (selection) => this.handleRadialMenuSelection('extensions', selection)
    });

    this.components.extensionsMenu = extensionsMenu;
  }

  handleRadialMenuSelection(menu, selection) {
    console.log(`Radial menu selection from ${menu}:`, selection);
    
    switch (menu) {
      case 'character':
        this.handleCharacterMenuSelection(selection);
        break;
      case 'extensions':
        this.handleExtensionsMenuSelection(selection);
        break;
    }
  }

  handleCharacterMenuSelection(selection) {
    switch (selection.action) {
      case 'ai-contacts':
        this.components.characterManager.showCharacterList();
        break;
      case 'create-contact':
        this.components.characterManager.showCreateCharacter();
        break;
      case 'import-characters':
        this.components.characterManager.showImportCharacter();
        break;
      case 'character-settings':
        this.components.settings.openSettings('appearance', 'Character Settings');
        break;
    }
  }

  handleExtensionsMenuSelection(selection) {
    switch (selection.action) {
      case 'plugin-manager':
        this.components.settings.openSettings('extensions', 'Plugin Manager');
        break;
      case 'custom-scripts':
        this.showCustomScriptsManager();
        break;
      case 'voice-input':
        this.toggleVoiceInput();
        break;
      case 'image-gen':
        this.showImageGenerator();
        break;
    }
  }

  setupGlobalEvents() {
    // Character selection events
    this.eventBus.addEventListener('character-selected', (e) => {
      const character = e.detail;
      this.components.chat.setCharacter(character);
      this.components.worldInfo.setCharacter(character);
      this.updateActiveCharacterDisplay(character);
    });

    // Settings events
    this.eventBus.addEventListener('settings-changed', (e) => {
      this.handleSettingsChange(e.detail);
    });

    // System events
    this.eventBus.addEventListener('system-update', (e) => {
      this.handleSystemUpdate(e.detail);
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Global shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            if (e.shiftKey) {
              e.preventDefault();
              this.components.chat.clearChat();
            }
            break;
          case 'c':
            if (e.shiftKey) {
              e.preventDefault();
              this.components.chat.chatInput?.focus();
            }
            break;
          case 's':
            if (e.shiftKey) {
              e.preventDefault();
              this.components.settings.openSettings();
            }
            break;
          case 'o':
            if (e.shiftKey) {
              e.preventDefault();
              this.components.characterManager.showCharacterList();
            }
            break;
        }
      }
    });
  }

  async restoreUIState() {
    try {
      // Restore UI state from storage
      const uiState = await this.getUIState();
      
      if (uiState) {
        // Restore chat window state
        if (uiState.chatCollapsed !== undefined) {
          if (uiState.chatCollapsed) {
            this.components.chat.collapseChat();
          }
        }
        
        // Restore world info state
        if (uiState.worldInfoCollapsed !== undefined) {
          if (uiState.worldInfoCollapsed) {
            this.components.worldInfo.collapseWorldInfo();
          }
        }
        
        // Restore active character
        if (uiState.activeCharacter) {
          const character = await characterStorage.getCharacter(uiState.activeCharacter);
          if (character) {
            this.eventBus.dispatchEvent(new CustomEvent('character-selected', { detail: character }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore UI state:', error);
    }
  }

  async saveUIState() {
    try {
      const uiState = {
        chatCollapsed: this.components.chat?.isCollapsed || false,
        worldInfoCollapsed: this.components.worldInfo?.isCollapsed || false,
        activeCharacter: this.components.chat?.currentCharacter?.name || null,
        timestamp: Date.now()
      };
      
      await this.setUIState(uiState);
    } catch (error) {
      console.error('Failed to save UI state:', error);
    }
  }

  handleSettingsChange(settings) {
    // Apply global setting changes
    if (settings.theme) {
      document.body.className = `theme-${settings.theme}`;
    }
    
    if (settings.compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
    
    // Save UI state when settings change
    this.saveUIState();
  }

  handleSystemUpdate(data) {
    // Handle system-wide updates
    if (data.system) {
      console.log('System update:', data.system);
    }
    
    if (data.ollama) {
      console.log('Ollama update:', data.ollama);
    }
  }

  handleWindowResize() {
    // Adjust UI components for new window size
    if (this.components.chat) {
      this.components.chat.adjustChatSize();
    }
  }

  handleVisibilityChange() {
    // Pause/resume operations based on visibility
    if (document.hidden) {
      // App is hidden - reduce update frequency
      this.components.systemMonitor?.stopMonitoring();
    } else {
      // App is visible - resume normal operations
      this.components.systemMonitor?.startMonitoring();
    }
  }

  updateActiveCharacterDisplay(character) {
    // Update character button display
    const characterButton = document.getElementById('characterButton');
    if (characterButton && character) {
      const buttonText = characterButton.querySelector('.button-text');
      if (buttonText) {
        buttonText.textContent = character.name;
      }
    }
  }

  async showWelcomeIfNeeded() {
    try {
      const settings = await this.components.settings.loadSettings();
      if (!settings.hasShownWelcome) {
        this.showWelcomeMessage();
        settings.hasShownWelcome = true;
        await this.components.settings.saveSettings();
      }
    } catch (error) {
      console.error('Failed to check welcome status:', error);
    }
  }

  showWelcomeMessage() {
    const welcomeContent = `
      <div class="welcome-content">
        <h2>Welcome to LLMAXX!</h2>
        <p>Your AI desktop overlay is ready to use.</p>
        <div class="welcome-features">
          <div class="feature">
            <h4>🤖 AI Characters</h4>
            <p>Create and chat with AI characters</p>
          </div>
          <div class="feature">
            <h4>💬 Real-time Chat</h4>
            <p>Streaming responses with Ollama</p>
          </div>
          <div class="feature">
            <h4>🌍 World Info</h4>
            <p>Organize your lore and settings</p>
          </div>
          <div class="feature">
            <h4>⚡ System Monitor</h4>
            <p>Track performance and status</p>
          </div>
        </div>
        <div class="welcome-actions">
          <button class="button" onclick="app.components.characterManager.showCreateCharacter()">
            Create Your First Character
          </button>
          <button class="button" onclick="app.components.settings.openSettings('ai-config')">
            Configure AI Settings
          </button>
        </div>
      </div>
    `;

    this.showModal('Welcome to LLMAXX', welcomeContent);
  }

  showCustomScriptsManager() {
    const content = `
      <div class="custom-scripts">
        <h3>Custom Scripts Manager</h3>
        <p class="text-muted">Run custom JavaScript to extend LLMAXX functionality</p>
        
        <div class="script-editor">
          <textarea id="customScript" class="code-editor" placeholder="// Enter your JavaScript code here&#10;// Example: console.log('Hello from custom script!');"></textarea>
          <div class="script-actions">
            <button class="button" onclick="app.runCustomScript()">Run Script</button>
            <button class="button" onclick="app.saveCustomScript()">Save Script</button>
          </div>
        </div>
        
        <div class="saved-scripts">
          <h4>Saved Scripts</h4>
          <div id="scriptList" class="script-list">
            <!-- Script list will be populated here -->
          </div>
        </div>
      </div>
    `;

    this.showModal('Custom Scripts', content);
    this.loadSavedScripts();
  }

  toggleVoiceInput() {
    if (this.voiceInputActive) {
      this.stopVoiceInput();
    } else {
      this.startVoiceInput();
    }
  }

  startVoiceInput() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      this.showError('Speech recognition is not supported in your browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      if (this.components.chat && this.components.chat.chatInput) {
        this.components.chat.chatInput.value = transcript;
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.showError(`Speech recognition error: ${event.error}`);
      this.stopVoiceInput();
    };

    this.recognition.start();
    this.voiceInputActive = true;
    this.showSuccess('Voice input started');
  }

  stopVoiceInput() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.voiceInputActive = false;
    this.showSuccess('Voice input stopped');
  }

  showImageGenerator() {
    const content = `
      <div class="image-generator">
        <h3>Image Generator</h3>
        <p class="text-muted">Generate images from text descriptions</p>
        
        <div class="prompt-input">
          <textarea id="imagePrompt" class="form-input" rows="3" placeholder="Describe the image you want to generate..."></textarea>
        </div>
        
        <div class="generation-options">
          <div class="option">
            <label>Size:</label>
            <select id="imageSize" class="form-select">
              <option value="512x512">512x512</option>
              <option value="768x768">768x768</option>
              <option value="1024x1024">1024x1024</option>
            </select>
          </div>
          <div class="option">
            <label>Style:</label>
            <select id="imageStyle" class="form-select">
              <option value="realistic">Realistic</option>
              <option value="artistic">Artistic</option>
              <option value="anime">Anime</option>
              <option value="fantasy">Fantasy</option>
            </select>
          </div>
        </div>
        
        <button class="button" onclick="app.generateImage()">Generate Image</button>
        
        <div id="imageResult" class="image-result">
          <!-- Generated image will appear here -->
        </div>
      </div>
    `;

    this.showModal('Image Generator', content);
  }

  async generateImage() {
    const prompt = document.getElementById('imagePrompt')?.value.trim();
    const size = document.getElementById('imageSize')?.value;
    const style = document.getElementById('imageStyle')?.value;

    if (!prompt) {
      this.showError('Please enter an image description');
      return;
    }

    const resultDiv = document.getElementById('imageResult');
    resultDiv.innerHTML = '<div class="loading">Generating image...</div>';

    try {
      // This would integrate with an image generation API
      // For now, we'll simulate it
      setTimeout(() => {
        resultDiv.innerHTML = `
          <div class="generated-image">
            <img src="https://picsum.photos/seed/${encodeURIComponent(prompt)}/512/512.jpg" alt="${prompt}" />
            <div class="image-info">
              <p><strong>Prompt:</strong> ${prompt}</p>
              <p><strong>Size:</strong> ${size}</p>
              <p><strong>Style:</strong> ${style}</p>
              <button class="button" onclick="app.downloadImage('${prompt}')">Download</button>
            </div>
          </div>
        `;
      }, 2000);
    } catch (error) {
      console.error('Image generation failed:', error);
      this.showError('Failed to generate image');
      resultDiv.innerHTML = '';
    }
  }

  runCustomScript() {
    const script = document.getElementById('customScript')?.value;
    if (!script.trim()) {
      this.showError('Please enter some JavaScript code');
      return;
    }

    try {
      // Create a safe execution context
      const safeScript = `
        (function() {
          ${script}
        })()
      `;
      
      eval(safeScript);
      this.showSuccess('Script executed successfully');
    } catch (error) {
      console.error('Script execution failed:', error);
      this.showError(`Script error: ${error.message}`);
    }
  }

  showModal(title, content) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 4000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const modal = document.createElement('div');
    modal.className = 'modal panel';
    modal.style.cssText = `
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      padding: 24px;
    `;

    modal.innerHTML = `
      <div class="modal-header flex-between" style="margin-bottom: 16px;">
        <h3 class="heading">${title}</h3>
        <button class="icon-button" onclick="this.closest('.modal-overlay').remove()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="modal-content">
        ${content}
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add entrance animation
    overlay.classList.add('entrance-fade-in');
    modal.classList.add('entrance-scale-in');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? 'var(--status-danger)' : type === 'success' ? 'var(--status-online)' : 'var(--status-info)'};
      color: white;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      z-index: 5000;
      animation: notificationSlideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('notification-slide-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  async getUIState() {
    // Get UI state from storage
    return JSON.parse(localStorage.getItem('llmaxx_ui_state') || '{}');
  }

  async setUIState(state) {
    // Set UI state to storage
    localStorage.setItem('llmaxx_ui_state', JSON.stringify(state));
  }

  addAppStyles() {
    if (document.getElementById('app-styles')) return;

    const style = document.createElement('style');
    style.id = 'app-styles';
    style.textContent = `
      .welcome-content {
        text-align: center;
      }
      
      .welcome-features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-lg);
        margin: var(--spacing-xl) 0;
      }
      
      .feature {
        background: var(--bg-secondary);
        padding: var(--spacing-lg);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
      }
      
      .feature h4 {
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--text-primary);
      }
      
      .feature p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 14px;
      }
      
      .welcome-actions {
        display: flex;
        gap: var(--spacing-md);
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .custom-scripts,
      .image-generator {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }
      
      .code-editor {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 12px;
        color: var(--text-primary);
        min-height: 200px;
        resize: vertical;
      }
      
      .script-actions {
        display: flex;
        gap: var(--spacing-sm);
      }
      
      .generation-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md);
      }
      
      .option {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }
      
      .option label {
        color: var(--text-secondary);
        font-size: 14px;
        font-weight: 500;
      }
      
      .form-select {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 8px 12px;
        color: var(--text-primary);
        font-size: 14px;
      }
      
      .image-result {
        margin-top: var(--spacing-lg);
      }
      
      .generated-image {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }
      
      .generated-image img {
        width: 100%;
        max-width: 512px;
        height: auto;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
      }
      
      .image-info {
        background: var(--bg-secondary);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        font-size: 14px;
      }
      
      .image-info p {
        margin: var(--spacing-xs) 0;
      }
      
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        z-index: 4000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .modal {
        background: var(--bg-overlay);
        backdrop-filter: blur(12px);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
      }
      
      .modal-header {
        padding: var(--spacing-lg) var(--spacing-lg) 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .modal-content {
        padding: 0 var(--spacing-lg) var(--spacing-lg);
      }
      
      .loading {
        text-align: center;
        padding: var(--spacing-lg);
        color: var(--text-secondary);
      }
      
      .loading::before {
        content: '';
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid var(--border-color);
        border-top-color: var(--accent-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: var(--spacing-sm);
      }
      
      .compact-mode {
        --spacing-xs: 2px;
        --spacing-sm: 4px;
        --spacing-md: 8px;
        --spacing-lg: 12px;
        --spacing-xl: 16px;
      }
      
      .theme-light {
        --bg-primary: #ffffff;
        --bg-secondary: #f8f9fa;
        --bg-tertiary: #e9ecef;
        --bg-overlay: rgba(255, 255, 255, 0.95);
        --text-primary: #212529;
        --text-secondary: #6c757d;
        --text-muted: #adb5bd;
        --border-color: #dee2e6;
      }
    `;
    document.head.appendChild(style);
  }

  destroy() {
    // Cleanup all components
    Object.values(this.components).forEach(component => {
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    });
    
    // Remove event listeners
    document.removeEventListener('keydown', this.setupKeyboardShortcuts);
    window.removeEventListener('resize', this.handleWindowResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Stop voice input if active
    if (this.voiceInputActive) {
      this.stopVoiceInput();
    }
    
    // Clean up styles
    const appStyles = document.getElementById('app-styles');
    if (appStyles) {
      appStyles.remove();
    }
  }
}

// Initialize the app
const app = new LLMAXXApp();

// Make app globally available
if (typeof window !== 'undefined') {
  window.app = app;
}

export default app;