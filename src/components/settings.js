// LLMAXX Settings Component
// Handles settings panels and configuration management

import { settingsStorage } from '../utils/storage.js';
import { SYSTEM_CATEGORIES, EXTENSION_CATEGORIES } from '../utils/constants.js';
import { api } from '../utils/api.js';

class SettingsComponent {
  constructor() {
    this.settingsOverlay = document.getElementById('settingsOverlay');
    this.settingsPanel = this.settingsOverlay?.querySelector('.settings-panel');
    this.settingsTitle = document.getElementById('settingsTitle');
    this.settingsContent = document.getElementById('settingsContent');
    this.closeSettingsBtn = document.getElementById('closeSettings');
    
    this.currentCategory = null;
    this.settings = {};
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSettings();
    this.setupEventListeners();
  }

  bindEvents() {
    // Close settings
    this.closeSettingsBtn?.addEventListener('click', () => this.closeSettings());
    this.settingsOverlay?.addEventListener('click', (e) => {
      if (e.target === this.settingsOverlay) {
        this.closeSettings();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.settingsOverlay?.classList.contains('hidden')) {
        this.closeSettings();
      }
    });
  }

  setupEventListeners() {
    // Listen for events from other components
    if (typeof window !== 'undefined' && window.appEvents) {
      window.appEvents.on('open-settings', (data) => {
        this.openSettings(data.category, data.title);
      });
    }

    // Listen for control button clicks
    document.addEventListener('click', (e) => {
      const controlBtn = e.target.closest('.control-button');
      if (controlBtn && controlBtn.dataset.panel) {
        const category = controlBtn.dataset.panel;
        this.openSettings(category);
      }
    });
  }

  async loadSettings() {
    try {
      this.settings = await settingsStorage.getSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = {};
    }
  }

  async saveSettings() {
    try {
      await settingsStorage.setSettings(this.settings);
      this.showSuccess('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showError('Failed to save settings');
    }
  }

  openSettings(category = 'general', title = null) {
    this.currentCategory = category;
    this.settingsTitle.textContent = title || SYSTEM_CATEGORIES[category]?.name || 'Settings';
    
    this.settingsContent.innerHTML = this.renderSettingsContent(category);
    this.settingsOverlay.classList.remove('hidden');
    
    this.bindSettingsEvents();
    
    // Add entrance animation
    this.settingsOverlay.classList.add('entrance-fade-in');
    this.settingsPanel.classList.add('entrance-scale-in');
  }

  closeSettings() {
    this.settingsOverlay.classList.add('exit-fade-out');
    this.settingsPanel.classList.add('exit-scale-out');
    
    setTimeout(() => {
      this.settingsOverlay.classList.add('hidden');
      this.settingsOverlay.classList.remove('exit-fade-out', 'entrance-fade-in');
      this.settingsPanel.classList.remove('exit-scale-out', 'entrance-scale-in');
    }, 200);
  }

  renderSettingsContent(category) {
    switch (category) {
      case 'general':
        return this.renderGeneralSettings();
      case 'prompts':
        return this.renderPromptSettings();
      case 'ai-config':
        return this.renderAIConfigSettings();
      case 'server':
        return this.renderServerSettings();
      case 'appearance':
        return this.renderAppearanceSettings();
      case 'system':
        return this.renderSystemSettings();
      default:
        return this.renderGeneralSettings();
    }
  }

  renderGeneralSettings() {
    return `
      <div class="settings-section">
        <h4 class="section-title">Application</h4>
        <div class="setting-item">
          <label class="setting-label">
            <input type="checkbox" id="autoStart" ${this.settings.autoStart ? 'checked' : ''} />
            <span>Start with system</span>
          </label>
          <p class="setting-description">Launch LLMAXX when your computer starts</p>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <input type="checkbox" id="startMinimized" ${this.settings.startMinimized ? 'checked' : ''} />
            <span>Start minimized</span>
          </label>
          <p class="setting-description">Start LLMAXX in the background</p>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <input type="checkbox" id="messageSound" ${this.settings.messageSound ? 'checked' : ''} />
            <span>Message sound effects</span>
          </label>
          <p class="setting-description">Play sound when receiving messages</p>
        </div>
      </div>
      
      <div class="settings-section">
        <h4 class="section-title">Chat</h4>
        <div class="setting-item">
          <label class="setting-label">
            <input type="checkbox" id="autoSaveChat" ${this.settings.autoSaveChat ? 'checked' : ''} />
            <span>Auto-save chat history</span>
          </label>
          <p class="setting-description">Automatically save conversation history</p>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>Max chat history</span>
            <input type="number" id="maxChatHistory" value="${this.settings.maxChatHistory || 1000}" min="100" max="10000" class="setting-input" />
          </label>
          <p class="setting-description">Maximum number of messages to keep per character</p>
        </div>
      </div>
    `;
  }

  renderPromptSettings() {
    return `
      <div class="settings-section">
        <h4 class="section-title">System Prompts</h4>
        <div class="prompt-list" id="promptList">
          ${this.renderPromptList()}
        </div>
        
        <button class="button" id="addPromptBtn">
          <span class="control-icon">➕</span>
          Add New Prompt
        </button>
      </div>
      
      <div class="settings-section">
        <h4 class="section-title">Prompt Variables</h4>
        <div class="setting-item">
          <label class="setting-label">
            <span>{{char}}</span>
            <span class="setting-description">Character name</span>
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <span>{{user}}</span>
            <span class="setting-description">User name</span>
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <span>{{world_info}}</span>
            <span class="setting-description">World information</span>
          </label>
        </div>
      </div>
    `;
  }

  renderPromptList() {
    const prompts = this.settings.systemPrompts || [];
    
    if (prompts.length === 0) {
      return '<p class="text-muted">No custom prompts yet. Add your first prompt to get started.</p>';
    }

    return prompts.map((prompt, index) => `
      <div class="prompt-item" data-index="${index}">
        <div class="prompt-header">
          <h5>${prompt.name}</h5>
          <div class="prompt-actions">
            <button class="icon-button edit-prompt" data-index="${index}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="icon-button delete-prompt" data-index="${index}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <p class="prompt-description">${prompt.description}</p>
        <div class="prompt-content">${prompt.content.substring(0, 100)}${prompt.content.length > 100 ? '...' : ''}</div>
      </div>
    `).join('');
  }

  renderAIConfigSettings() {
    return `
      <div class="settings-section">
        <h4 class="section-title">AI Provider</h4>
        <div class="setting-item">
          <label class="setting-label">
            <span>Default Provider</span>
            <select id="defaultProvider" class="setting-select">
              <option value="ollama" ${this.settings.defaultProvider === 'ollama' ? 'selected' : ''}>Ollama (Local)</option>
              <option value="openai" ${this.settings.defaultProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
              <option value="anthropic" ${this.settings.defaultProvider === 'anthropic' ? 'selected' : ''}>Anthropic</option>
              <option value="google" ${this.settings.defaultProvider === 'google' ? 'selected' : ''}>Google</option>
            </select>
          </label>
          <p class="setting-description">Choose your preferred AI provider</p>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>Default Model</span>
            <select id="defaultModel" class="setting-select">
              <option value="llama2" ${this.settings.defaultModel === 'llama2' ? 'selected' : ''}>Llama 2</option>
              <option value="mistral" ${this.settings.defaultModel === 'mistral' ? 'selected' : ''}>Mistral</option>
              <option value="codellama" ${this.settings.defaultModel === 'codellama' ? 'selected' : ''}>Code Llama</option>
            </select>
          </label>
        </div>
      </div>
      
      <div class="settings-section">
        <h4 class="section-title">Generation Settings</h4>
        <div class="setting-item">
          <label class="setting-label">
            <span>Temperature</span>
            <input type="range" id="temperature" min="0" max="2" step="0.1" value="${this.settings.temperature || 0.7}" class="setting-range" />
            <span class="setting-value">${this.settings.temperature || 0.7}</span>
          </label>
          <p class="setting-description">Controls randomness in responses (0 = deterministic, 2 = very creative)</p>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>Max Tokens</span>
            <input type="number" id="maxTokens" value="${this.settings.maxTokens || 2048}" min="128" max="8192" class="setting-input" />
          </label>
          <p class="setting-description">Maximum number of tokens in response</p>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <input type="checkbox" id="streamResponse" ${this.settings.streamResponse ? 'checked' : ''} />
            <span>Stream responses</span>
          </label>
          <p class="setting-description">Show responses as they are being generated</p>
        </div>
      </div>
      
      <div class="settings-section">
        <h4 class="section-title">Provider Status</h4>
        <div id="providerStatus" class="provider-status">
          <div class="status-item">
            <span class="status-label">Ollama</span>
            <span class="status-indicator" id="ollamaStatus">Checking...</span>
          </div>
        </div>
      </div>
    `;
  }

  renderServerSettings() {
    return `
      <div class="settings-section">
        <h4 class="section-title">Network</h4>
        <div class="setting-item">
          <label class="setting-label">
            <span>Ollama URL</span>
            <input type="url" id="ollamaUrl" value="${this.settings.ollamaUrl || 'http://localhost:11434'}" class="setting-input" />
          </label>
          <p class="setting-description">URL for your Ollama instance</p>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>Request Timeout (seconds)</span>
            <input type="number" id="requestTimeout" value="${this.settings.requestTimeout || 30}" min="5" max="300" class="setting-input" />
          </label>
          <p class="setting-description">Maximum time to wait for API responses</p>
        </div>
      </div>
      
      <div class="settings-section">
        <h4 class="section-title">API Keys</h4>
        <div class="setting-item">
          <label class="setting-label">
            <span>OpenAI API Key</span>
            <input type="password" id="openaiApiKey" value="${this.settings.openaiApiKey || ''}" class="setting-input" />
          </label>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>Anthropic API Key</span>
            <input type="password" id="anthropicApiKey" value="${this.settings.anthropicApiKey || ''}" class="setting-input" />
          </label>
        </div>
      </div>
    `;
  }

  renderAppearanceSettings() {
    return `
      <div class="settings-section">
        <h4 class="section-title">Theme</h4>
        <div class="setting-item">
          <label class="setting-label">
            <span>Color Scheme</span>
            <select id="theme" class="setting-select">
              <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
              <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Light</option>
              <option value="auto" ${this.settings.theme === 'auto' ? 'selected' : ''}>Auto</option>
            </select>
          </label>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>Accent Color</span>
            <select id="accentColor" class="setting-select">
              <option value="purple" ${this.settings.accentColor === 'purple' ? 'selected' : ''}>Deep Purple</option>
              <option value="pink" ${this.settings.accentColor === 'pink' ? 'selected' : ''}>Deep Pink</option>
              <option value="blue" ${this.settings.accentColor === 'blue' ? 'selected' : ''}>Blue</option>
              <option value="green" ${this.settings.accentColor === 'green' ? 'selected' : ''}>Green</option>
            </select>
          </label>
        </div>
      </div>
      
      <div class="settings-section">
        <h4 class="section-title">UI</h4>
        <div class="setting-item">
          <label class="setting-label">
            <input type="checkbox" id="showSystemMonitor" ${this.settings.showSystemMonitor !== false ? 'checked' : ''} />
            <span>Show system monitor</span>
          </label>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <input type="checkbox" id="showWorldInfo" ${this.settings.showWorldInfo !== false ? 'checked' : ''} />
            <span>Show world info panel</span>
          </label>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>Chat window opacity</span>
            <input type="range" id="chatWindowOpacity" min="0.3" max="1" step="0.05" value="${this.settings.chatWindowOpacity || 0.95}" class="setting-range" />
            <span class="setting-value">${this.settings.chatWindowOpacity || 0.95}</span>
          </label>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <input type="checkbox" id="compactMode" ${this.settings.compactMode ? 'checked' : ''} />
            <span>Compact mode</span>
          </label>
          <p class="setting-description">Reduce spacing and font sizes for more screen space</p>
        </div>
      </div>
    `;
  }

  renderSystemSettings() {
    return `
      <div class="settings-section">
        <h4 class="section-title">Performance</h4>
        <div class="setting-item">
          <label class="setting-label">
            <input type="checkbox" id="hardwareAcceleration" ${this.settings.hardwareAcceleration !== false ? 'checked' : ''} />
            <span>Hardware acceleration</span>
          </label>
          <p class="setting-description">Use GPU for rendering (requires restart)</p>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>Update frequency</span>
            <select id="updateFrequency" class="setting-select">
              <option value="1000" ${this.settings.updateFrequency === 1000 ? 'selected' : ''}>1 second</option>
              <option value="2000" ${!this.settings.updateFrequency || this.settings.updateFrequency === 2000 ? 'selected' : ''}>2 seconds</option>
              <option value="5000" ${this.settings.updateFrequency === 5000 ? 'selected' : ''}>5 seconds</option>
            </select>
          </label>
          <p class="setting-description">How often to update system monitor</p>
        </div>
      </div>
      
      <div class="settings-section">
        <h4 class="section-title">Data Management</h4>
        <div class="setting-item">
          <button class="button" id="exportDataBtn">Export All Data</button>
          <p class="setting-description">Download all settings, characters, and chat history</p>
        </div>
        
        <div class="setting-item">
          <button class="button" id="importDataBtn">Import Data</button>
          <p class="setting-description">Restore from a backup file</p>
        </div>
        
        <div class="setting-item">
          <button class="button danger" id="clearAllDataBtn">Clear All Data</button>
          <p class="setting-description">Delete all settings, characters, and chat history</p>
        </div>
      </div>
      
      <div class="settings-section">
        <h4 class="section-title">About</h4>
        <div class="setting-item">
          <span class="setting-label">LLMAXX Version</span>
          <span class="setting-value">1.0.0</span>
        </div>
        
        <div class="setting-item">
          <span class="setting-label">Electron Version</span>
          <span class="setting-value">${typeof process !== 'undefined' ? process.versions.electron : 'Unknown'}</span>
        </div>
        
        <div class="setting-item">
          <button class="button" id="checkUpdatesBtn">Check for Updates</button>
        </div>
      </div>
    `;
  }

  bindSettingsEvents() {
    // General settings
    this.bindCheckbox('autoStart');
    this.bindCheckbox('startMinimized');
    this.bindCheckbox('messageSound');
    this.bindCheckbox('autoSaveChat');
    this.bindNumber('maxChatHistory');

    // AI settings
    this.bindSelect('defaultProvider');
    this.bindSelect('defaultModel');
    this.bindRange('temperature');
    this.bindNumber('maxTokens');
    this.bindCheckbox('streamResponse');

    // Server settings
    this.bindInput('ollamaUrl');
    this.bindNumber('requestTimeout');
    this.bindInput('openaiApiKey');
    this.bindInput('anthropicApiKey');

    // Appearance settings
    this.bindSelect('theme');
    this.bindSelect('accentColor');
    this.bindCheckbox('showSystemMonitor');
    this.bindCheckbox('showWorldInfo');
    this.bindRange('chatWindowOpacity');
    this.bindCheckbox('compactMode');

    // System settings
    this.bindCheckbox('hardwareAcceleration');
    this.bindSelect('updateFrequency');

    // Action buttons
    document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportData());
    document.getElementById('importDataBtn')?.addEventListener('click', () => this.importData());
    document.getElementById('clearAllDataBtn')?.addEventListener('click', () => this.clearAllData());
    document.getElementById('checkUpdatesBtn')?.addEventListener('click', () => this.checkForUpdates());

    // Prompt settings
    document.getElementById('addPromptBtn')?.addEventListener('click', () => this.addPrompt());
    this.bindPromptEvents();

    // Provider status
    if (this.currentCategory === 'ai-config') {
      this.updateProviderStatus();
    }
  }

  bindCheckbox(id) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', (e) => {
        this.settings[id] = e.target.checked;
        this.saveSettings();
        this.applySetting(id, e.target.checked);
      });
    }
  }

  bindInput(id) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', (e) => {
        this.settings[id] = e.target.value;
      });
      
      element.addEventListener('change', () => {
        this.saveSettings();
      });
    }
  }

  bindNumber(id) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', (e) => {
        this.settings[id] = parseInt(e.target.value) || 0;
      });
      
      element.addEventListener('change', () => {
        this.saveSettings();
      });
    }
  }

  bindSelect(id) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', (e) => {
        this.settings[id] = e.target.value;
        this.saveSettings();
        this.applySetting(id, e.target.value);
      });
    }
  }

  bindRange(id) {
    const element = document.getElementById(id);
    const valueDisplay = element?.nextElementSibling;
    
    if (element) {
      element.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        this.settings[id] = value;
        if (valueDisplay && valueDisplay.classList.contains('setting-value')) {
          valueDisplay.textContent = value;
        }
      });
      
      element.addEventListener('change', () => {
        this.saveSettings();
        this.applySetting(id, parseFloat(element.value));
      });
    }
  }

  bindPromptEvents() {
    // Edit prompt buttons
    document.querySelectorAll('.edit-prompt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.closest('.edit-prompt').dataset.index);
        this.editPrompt(index);
      });
    });

    // Delete prompt buttons
    document.querySelectorAll('.delete-prompt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.closest('.delete-prompt').dataset.index);
        this.deletePrompt(index);
      });
    });
  }

  async updateProviderStatus() {
    const statusContainer = document.getElementById('providerStatus');
    if (!statusContainer) return;

    try {
      const ollamaStatus = await api.checkStatus('ollama');
      const statusElement = document.getElementById('ollamaStatus');
      
      if (statusElement) {
        statusElement.textContent = ollamaStatus.online ? 'Online' : 'Offline';
        statusElement.className = `status-indicator ${ollamaStatus.online ? 'online' : 'offline'}`;
      }
    } catch (error) {
      console.error('Failed to check provider status:', error);
    }
  }

  addPrompt() {
    // Show prompt editor modal
    this.showPromptEditor();
  }

  editPrompt(index) {
    const prompts = this.settings.systemPrompts || [];
    const prompt = prompts[index];
    if (prompt) {
      this.showPromptEditor(prompt, index);
    }
  }

  deletePrompt(index) {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    const prompts = this.settings.systemPrompts || [];
    prompts.splice(index, 1);
    this.settings.systemPrompts = prompts;
    this.saveSettings();
    
    // Refresh the prompt list
    this.settingsContent.innerHTML = this.renderPromptSettings();
    this.bindSettingsEvents();
  }

  showPromptEditor(prompt = null, index = null) {
    // Implementation for prompt editor modal
    console.log('Show prompt editor for:', prompt, index);
  }

  async exportData() {
    try {
      const data = await settingsStorage.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `llmaxx-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.showSuccess('Data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      this.showError('Failed to export data');
    }
  }

  async importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (await settingsStorage.importData(data)) {
          await this.loadSettings();
          this.showSuccess('Data imported successfully');
        } else {
          this.showError('Failed to import data');
        }
      } catch (error) {
        console.error('Import failed:', error);
        this.showError('Invalid backup file');
      }
    });
    
    input.click();
  }

  async clearAllData() {
    const confirmation = prompt('Type "DELETE ALL DATA" to confirm:').trim();
    if (confirmation !== 'DELETE ALL DATA') return;

    try {
      await settingsStorage.clear();
      await this.loadSettings();
      this.showSuccess('All data cleared successfully');
    } catch (error) {
      console.error('Clear failed:', error);
      this.showError('Failed to clear data');
    }
  }

  checkForUpdates() {
    // Implementation for update checking
    this.showSuccess('You are running the latest version');
  }

  applySetting(key, value) {
    // Apply certain settings immediately without restart
    switch (key) {
      case 'showSystemMonitor':
        const monitor = document.querySelector('.system-monitor');
        if (monitor) {
          monitor.style.display = value ? 'block' : 'none';
        }
        break;
        
      case 'showWorldInfo':
        const worldInfo = document.getElementById('worldInfo');
        if (worldInfo) {
          worldInfo.style.display = value ? 'block' : 'none';
        }
        break;
        
      case 'chatWindowOpacity':
        const chatWindow = document.getElementById('chatWindow');
        if (chatWindow) {
          chatWindow.style.opacity = value;
        }
        break;
        
      case 'compactMode':
        document.body.classList.toggle('compact-mode', value);
        break;
        
      case 'theme':
        document.body.className = `theme-${value}`;
        break;
    }
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
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

  addSettingsStyles() {
    if (document.getElementById('settings-styles')) return;

    const style = document.createElement('style');
    style.id = 'settings-styles';
    style.textContent = `
      .settings-section {
        margin-bottom: var(--spacing-xl);
      }
      
      .section-title {
        color: var(--text-primary);
        font-size: 18px;
        font-weight: 600;
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-sm);
        border-bottom: 1px solid var(--border-color);
      }
      
      .setting-item {
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }
      
      .setting-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--text-primary);
        font-weight: 500;
        margin-bottom: var(--spacing-xs);
      }
      
      .setting-description {
        color: var(--text-muted);
        font-size: 13px;
        line-height: 1.4;
        margin: 0;
      }
      
      .setting-input,
      .setting-select {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 8px 12px;
        color: var(--text-primary);
        font-size: 14px;
        font-family: inherit;
        transition: all var(--transition-fast);
      }
      
      .setting-input:focus,
      .setting-select:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
      }
      
      .setting-range {
        flex: 1;
        margin-right: var(--spacing-md);
      }
      
      .setting-value {
        min-width: 40px;
        text-align: right;
        color: var(--text-secondary);
      }
      
      .prompt-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
      }
      
      .prompt-item {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
      }
      
      .prompt-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-sm);
      }
      
      .prompt-header h5 {
        margin: 0;
        color: var(--text-primary);
      }
      
      .prompt-actions {
        display: flex;
        gap: var(--spacing-xs);
      }
      
      .prompt-description {
        color: var(--text-secondary);
        font-size: 14px;
        margin: 0 0 var(--spacing-xs) 0;
      }
      
      .prompt-content {
        color: var(--text-muted);
        font-size: 13px;
        font-style: italic;
      }
      
      .provider-status {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }
      
      .status-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-sm);
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
      }
      
      .status-label {
        color: var(--text-primary);
        font-weight: 500;
      }
      
      .status-indicator {
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: 12px;
        font-weight: 600;
      }
      
      .status-indicator.online {
        background: var(--status-online);
        color: white;
      }
      
      .status-indicator.offline {
        background: var(--status-offline);
        color: white;
      }
    `;
    document.head.appendChild(style);
  }

  destroy() {
    // Remove event listeners
    this.closeSettingsBtn?.removeEventListener('click', this.closeSettings);
    
    // Clean up styles
    const settingsStyles = document.getElementById('settings-styles');
    if (settingsStyles) {
      settingsStyles.remove();
    }
  }
}

// Export for use in main app
export { SettingsComponent };
export default SettingsComponent;