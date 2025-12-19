// LLMAXX Character Manager Component
// Handles character creation, editing, importing, and management

import { characterStorage, chatStorage } from '../utils/storage.js';
import { CHARACTER_TEMPLATE, MESSAGE_TYPES } from '../utils/constants.js';

class CharacterManagerComponent {
  constructor() {
    this.characterButton = document.getElementById('characterButton');
    this.characterModal = document.getElementById('characterModal');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalBody = document.getElementById('modalBody');
    this.closeModalBtn = document.getElementById('closeModal');
    
    this.currentView = 'list'; // list, create, edit, import
    this.editingCharacter = null;
    this.characters = [];
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadCharacters();
  }

  bindEvents() {
    // Character button
    this.characterButton.addEventListener('click', () => {
      this.showCharacterList();
    });

    // Modal close
    this.closeModalBtn.addEventListener('click', () => this.closeModal());
    this.characterModal.addEventListener('click', (e) => {
      if (e.target === this.characterModal) {
        this.closeModal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.characterModal.classList.contains('hidden')) {
        this.closeModal();
      }
    });
  }

  async loadCharacters() {
    try {
      this.characters = await characterStorage.getCharacters();
    } catch (error) {
      console.error('Failed to load characters:', error);
      this.showError('Failed to load characters');
    }
  }

  showCharacterList() {
    this.currentView = 'list';
    this.modalTitle.textContent = 'Characters';
    
    const content = `
      <div class="character-list-header flex-between">
        <div class="character-stats">
          <span class="text-muted">${this.characters.length} characters</span>
        </div>
        <div class="character-actions">
          <button class="button" id="createCharacterBtn">
            <span class="control-icon">➕</span>
            Create Character
          </button>
          <button class="button" id="importCharacterBtn">
            <span class="control-icon">📥</span>
            Import Character
          </button>
        </div>
      </div>
      <div class="character-grid" id="characterGrid">
        ${this.renderCharacterGrid()}
      </div>
    `;

    this.modalBody.innerHTML = content;
    this.characterModal.classList.remove('hidden');
    
    this.bindCharacterListEvents();
  }

  renderCharacterGrid() {
    if (this.characters.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>No Characters Yet</h3>
          <p class="text-muted">Create your first character to get started!</p>
          <button class="button" onclick="characterManager.showCreateCharacter()">
            Create Your First Character
          </button>
        </div>
      `;
    }

    return this.characters.map(character => `
      <div class="character-card" data-name="${character.name}">
        <div class="character-avatar">
          <img src="${character.avatar || 'assets/default-avatar.png'}" alt="${character.name}" />
        </div>
        <div class="character-info">
          <h4 class="character-name">${character.name}</h4>
          <p class="character-description">${character.data?.description || 'No description'}</p>
          <div class="character-tags">
            ${(character.data?.tags || []).map(tag => `
              <span class="character-tag">${tag}</span>
            `).join('')}
          </div>
        </div>
        <div class="character-actions">
          <button class="icon-button select-character" title="Select Character" data-name="${character.name}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </button>
          <button class="icon-button edit-character" title="Edit Character" data-name="${character.name}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="icon-button delete-character" title="Delete Character" data-name="${character.name}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  bindCharacterListEvents() {
    // Create character button
    document.getElementById('createCharacterBtn')?.addEventListener('click', () => {
      this.showCreateCharacter();
    });

    // Import character button
    document.getElementById('importCharacterBtn')?.addEventListener('click', () => {
      this.showImportCharacter();
    });

    // Character card actions
    this.modalBody.addEventListener('click', (e) => {
      const characterCard = e.target.closest('.character-card');
      if (!characterCard) return;

      const characterName = characterCard.dataset.name;

      if (e.target.closest('.select-character')) {
        this.selectCharacter(characterName);
      } else if (e.target.closest('.edit-character')) {
        this.showEditCharacter(characterName);
      } else if (e.target.closest('.delete-character')) {
        this.deleteCharacter(characterName);
      }
    });
  }

  showCreateCharacter() {
    this.currentView = 'create';
    this.modalTitle.textContent = 'Create Character';
    
    const content = `
      <form id="characterForm">
        <div class="form-row">
          <div class="form-group">
            <label for="charName" class="form-label">Character Name *</label>
            <input type="text" id="charName" class="form-input" placeholder="Enter character name" required />
          </div>
          <div class="form-group">
            <label for="charAvatar" class="form-label">Avatar URL</label>
            <input type="url" id="charAvatar" class="form-input" placeholder="https://example.com/avatar.jpg" />
          </div>
        </div>
        
        <div class="form-group">
          <label for="charDescription" class="form-label">Description *</label>
          <textarea id="charDescription" class="form-input" rows="3" placeholder="Describe the character's appearance, background, and key traits..." required></textarea>
        </div>
        
        <div class="form-group">
          <label for="charPersonality" class="form-label">Personality</label>
          <textarea id="charPersonality" class="form-input" rows="3" placeholder="Describe the character's personality, mannerisms, and behavior..."></textarea>
        </div>
        
        <div class="form-group">
          <label for="charScenario" class="form-label">Scenario</label>
          <textarea id="charScenario" class="form-input" rows="2" placeholder="Describe the current situation or setting..."></textarea>
        </div>
        
        <div class="form-group">
          <label for="charFirstMessage" class="form-label">First Message</label>
          <textarea id="charFirstMessage" class="form-input" rows="3" placeholder="The character's opening message..."></textarea>
        </div>
        
        <div class="form-group">
          <label for="charExampleMessages" class="form-label">Example Messages</label>
          <textarea id="charExampleMessages" class="form-input" rows="4" placeholder="Example messages that demonstrate the character's speaking style..."></textarea>
        </div>
        
        <div class="form-group">
          <label for="charSystemPrompt" class="form-label">System Prompt</label>
          <textarea id="charSystemPrompt" class="form-input" rows="2" placeholder="Instructions for the AI on how to portray this character..."></textarea>
        </div>
        
        <div class="form-group">
          <label for="charTags" class="form-label">Tags</label>
          <input type="text" id="charTags" class="form-input" placeholder="anime, fantasy, sci-fi (comma separated)" />
        </div>
        
        <div class="form-actions flex-between">
          <button type="button" class="button" onclick="characterManager.showCharacterList()">Cancel</button>
          <button type="submit" class="button">Create Character</button>
        </div>
      </form>
    `;

    this.modalBody.innerHTML = content;
    this.addFormStyles();
    this.bindCharacterFormEvents();
  }

  showEditCharacter(characterName) {
    const character = this.characters.find(c => c.name === characterName);
    if (!character) return;

    this.editingCharacter = character;
    this.currentView = 'edit';
    this.modalTitle.textContent = `Edit ${character.name}`;
    
    const content = `
      <form id="characterForm">
        <div class="form-row">
          <div class="form-group">
            <label for="charName" class="form-label">Character Name *</label>
            <input type="text" id="charName" class="form-input" value="${character.name}" required />
          </div>
          <div class="form-group">
            <label for="charAvatar" class="form-label">Avatar URL</label>
            <input type="url" id="charAvatar" class="form-input" value="${character.avatar || ''}" />
          </div>
        </div>
        
        <div class="form-group">
          <label for="charDescription" class="form-label">Description *</label>
          <textarea id="charDescription" class="form-input" rows="3" required>${character.data?.description || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label for="charPersonality" class="form-label">Personality</label>
          <textarea id="charPersonality" class="form-input" rows="3">${character.data?.personality || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label for="charScenario" class="form-label">Scenario</label>
          <textarea id="charScenario" class="form-input" rows="2">${character.data?.scenario || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label for="charFirstMessage" class="form-label">First Message</label>
          <textarea id="charFirstMessage" class="form-input" rows="3">${character.data?.first_mes || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label for="charExampleMessages" class="form-label">Example Messages</label>
          <textarea id="charExampleMessages" class="form-input" rows="4">${character.data?.mes_example || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label for="charSystemPrompt" class="form-label">System Prompt</label>
          <textarea id="charSystemPrompt" class="form-input" rows="2">${character.data?.system_prompt || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label for="charTags" class="form-label">Tags</label>
          <input type="text" id="charTags" class="form-input" value="${(character.data?.tags || []).join(', ')}" />
        </div>
        
        <div class="form-actions flex-between">
          <button type="button" class="button" onclick="characterManager.showCharacterList()">Cancel</button>
          <button type="button" class="button danger" id="deleteInEditBtn">Delete Character</button>
          <button type="submit" class="button">Update Character</button>
        </div>
      </form>
    `;

    this.modalBody.innerHTML = content;
    this.addFormStyles();
    this.bindCharacterFormEvents();
  }

  showImportCharacter() {
    this.currentView = 'import';
    this.modalTitle.textContent = 'Import Character';
    
    const content = `
      <div class="import-options">
        <div class="import-option">
          <h4>Import from File</h4>
          <p class="text-muted">Import a character file (JSON, PNG, or YAML format compatible with SillyTavern)</p>
          <input type="file" id="characterFileInput" accept=".json,.png,.yaml,.yml" class="file-input" />
          <button class="button" id="selectFileBtn">Select File</button>
        </div>
        
        <div class="import-option">
          <h4>Import from URL</h4>
          <p class="text-muted">Import a character from a URL (JSON or PNG character card)</p>
          <div class="form-group">
            <input type="url" id="characterUrlInput" class="form-input" placeholder="https://example.com/character.png" />
          </div>
          <button class="button" id="importFromUrlBtn">Import from URL</button>
        </div>
        
        <div class="import-option">
          <h4>Import from Text</h4>
          <p class="text-muted">Paste character data as JSON</p>
          <div class="form-group">
            <textarea id="characterTextInput" class="form-input" rows="8" placeholder="Paste character JSON data here..."></textarea>
          </div>
          <button class="button" id="importFromTextBtn">Import from Text</button>
        </div>
      </div>
      
      <div class="form-actions">
        <button class="button" onclick="characterManager.showCharacterList()">Back to Characters</button>
      </div>
    `;

    this.modalBody.innerHTML = content;
    this.addFormStyles();
    this.bindImportEvents();
  }

  bindCharacterFormEvents() {
    const form = document.getElementById('characterForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveCharacter();
    });

    // Delete button in edit mode
    const deleteBtn = document.getElementById('deleteInEditBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const characterName = this.editingCharacter?.name;
        if (characterName) {
          this.deleteCharacter(characterName);
        }
      });
    }
  }

  bindImportEvents() {
    // File import
    const fileInput = document.getElementById('characterFileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    
    selectFileBtn?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.importFromFile(file);
      }
    });

    // URL import
    document.getElementById('importFromUrlBtn')?.addEventListener('click', () => {
      const url = document.getElementById('characterUrlInput').value.trim();
      if (url) {
        this.importFromUrl(url);
      }
    });

    // Text import
    document.getElementById('importFromTextBtn')?.addEventListener('click', () => {
      const text = document.getElementById('characterTextInput').value.trim();
      if (text) {
        this.importFromText(text);
      }
    });
  }

  async saveCharacter() {
    const formData = this.getFormData();
    
    if (!formData.name || !formData.description) {
      this.showError('Name and description are required');
      return;
    }

    try {
      const character = {
        ...CHARACTER_TEMPLATE,
        name: formData.name,
        avatar: formData.avatar,
        data: {
          ...CHARACTER_TEMPLATE.data,
          name: formData.name,
          description: formData.description,
          personality: formData.personality,
          scenario: formData.scenario,
          first_mes: formData.firstMessage,
          mes_example: formData.exampleMessages,
          system_prompt: formData.systemPrompt,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        }
      };

      await characterStorage.saveCharacter(character);
      
      if (this.editingCharacter) {
        // Update existing character
        if (this.editingCharacter.name !== character.name) {
          // Character name changed, need to handle chat history migration
          await this.renameCharacterInHistory(this.editingCharacter.name, character.name);
        }
        this.showSuccess('Character updated successfully');
      } else {
        // New character
        this.showSuccess('Character created successfully');
      }

      await this.loadCharacters();
      this.showCharacterList();
    } catch (error) {
      console.error('Failed to save character:', error);
      this.showError('Failed to save character');
    }
  }

  getFormData() {
    return {
      name: document.getElementById('charName')?.value.trim() || '',
      avatar: document.getElementById('charAvatar')?.value.trim() || '',
      description: document.getElementById('charDescription')?.value.trim() || '',
      personality: document.getElementById('charPersonality')?.value.trim() || '',
      scenario: document.getElementById('charScenario')?.value.trim() || '',
      firstMessage: document.getElementById('charFirstMessage')?.value.trim() || '',
      exampleMessages: document.getElementById('charExampleMessages')?.value.trim() || '',
      systemPrompt: document.getElementById('charSystemPrompt')?.value.trim() || '',
      tags: document.getElementById('charTags')?.value.trim() || ''
    };
  }

  async selectCharacter(characterName) {
    try {
      const character = await characterStorage.getCharacter(characterName);
      if (character) {
        await characterStorage.setActiveCharacter(character);
        
        // Notify other components
        if (typeof window !== 'undefined' && window.appEvents) {
          window.appEvents.emit('character-selected', character);
        }
        
        this.showSuccess(`${character.name} selected as active character`);
        this.closeModal();
      }
    } catch (error) {
      console.error('Failed to select character:', error);
      this.showError('Failed to select character');
    }
  }

  async deleteCharacter(characterName) {
    if (!confirm(`Are you sure you want to delete "${characterName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await characterStorage.deleteCharacter(characterName);
      await chatStorage.clearChatHistory(characterName);
      
      await this.loadCharacters();
      this.showCharacterList();
      this.showSuccess('Character deleted successfully');
    } catch (error) {
      console.error('Failed to delete character:', error);
      this.showError('Failed to delete character');
    }
  }

  async importFromFile(file) {
    try {
      const text = await file.text();
      let characterData;

      if (file.name.endsWith('.json')) {
        characterData = JSON.parse(text);
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        // Would need a YAML parser here
        throw new Error('YAML import not yet implemented');
      } else if (file.name.endsWith('.png')) {
        characterData = await this.extractDataFromPNG(file);
      } else {
        throw new Error('Unsupported file format');
      }

      await this.processImportedCharacter(characterData);
    } catch (error) {
      console.error('Import error:', error);
      this.showError(`Import failed: ${error.message}`);
    }
  }

  async importFromUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch URL');
      
      const contentType = response.headers.get('content-type');
      let characterData;

      if (contentType?.includes('application/json')) {
        characterData = await response.json();
      } else if (contentType?.includes('image/png')) {
        characterData = await this.extractDataFromPNG(await response.blob());
      } else {
        throw new Error('Unsupported content type');
      }

      await this.processImportedCharacter(characterData);
    } catch (error) {
      console.error('URL import error:', error);
      this.showError(`Import failed: ${error.message}`);
    }
  }

  async importFromText(text) {
    try {
      const characterData = JSON.parse(text);
      await this.processImportedCharacter(characterData);
    } catch (error) {
      console.error('Text import error:', error);
      this.showError(`Import failed: Invalid JSON format`);
    }
  }

  async extractDataFromPNG(blob) {
    // This would extract character data from PNG metadata
    // Implementation would depend on the specific format used
    throw new Error('PNG import not yet implemented');
  }

  async processImportedCharacter(characterData) {
    try {
      // Normalize character data to our format
      const character = this.normalizeImportedCharacter(characterData);
      
      await characterStorage.saveCharacter(character);
      await this.loadCharacters();
      
      this.showCharacterList();
      this.showSuccess('Character imported successfully');
    } catch (error) {
      console.error('Process import error:', error);
      this.showError('Failed to process imported character');
    }
  }

  normalizeImportedCharacter(data) {
    // Normalize various character formats to our standard format
    return {
      ...CHARACTER_TEMPLATE,
      name: data.name || data.character || 'Unknown Character',
      data: {
        ...CHARACTER_TEMPLATE.data,
        name: data.name || data.character || 'Unknown Character',
        description: data.description || data.desc || '',
        personality: data.personality || '',
        scenario: data.scenario || '',
        first_mes: data.first_mes || data.first_message || '',
        mes_example: data.mes_example || data.example_messages || '',
        system_prompt: data.system_prompt || '',
        tags: data.tags || []
      }
    };
  }

  async renameCharacterInHistory(oldName, newName) {
    try {
      const allHistory = await chatStorage.getChatHistory();
      if (allHistory[oldName]) {
        allHistory[newName] = allHistory[oldName];
        delete allHistory[oldName];
        await chatStorage.set(STORAGE_KEYS.chatHistory, allHistory);
      }
    } catch (error) {
      console.error('Failed to rename character in history:', error);
    }
  }

  closeModal() {
    this.characterModal.classList.add('hidden');
    this.currentView = 'list';
    this.editingCharacter = null;
  }

  addFormStyles() {
    if (document.getElementById('character-form-styles')) return;

    const style = document.createElement('style');
    style.id = 'character-form-styles';
    style.textContent = `
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md);
      }
      
      .form-group {
        margin-bottom: var(--spacing-md);
      }
      
      .form-label {
        display: block;
        margin-bottom: var(--spacing-xs);
        color: var(--text-secondary);
        font-size: 14px;
        font-weight: 500;
      }
      
      .form-input {
        width: 100%;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 12px;
        color: var(--text-primary);
        font-size: 14px;
        font-family: inherit;
        transition: all var(--transition-fast);
      }
      
      .form-input:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
      }
      
      .form-actions {
        margin-top: var(--spacing-xl);
        padding-top: var(--spacing-lg);
        border-top: 1px solid var(--border-color);
      }
      
      .character-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--spacing-md);
        margin-top: var(--spacing-lg);
      }
      
      .character-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        display: flex;
        gap: var(--spacing-md);
        transition: all var(--transition-fast);
        position: relative;
      }
      
      .character-card:hover {
        border-color: var(--accent-primary);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
      
      .character-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
      }
      
      .character-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .character-info {
        flex: 1;
        min-width: 0;
      }
      
      .character-name {
        margin: 0 0 var(--spacing-xs) 0;
        font-size: 16px;
        color: var(--text-primary);
      }
      
      .character-description {
        margin: 0 0 var(--spacing-sm) 0;
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .character-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
      }
      
      .character-tag {
        background: var(--bg-tertiary);
        color: var(--text-muted);
        font-size: 11px;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
      }
      
      .character-actions {
        position: absolute;
        top: var(--spacing-sm);
        right: var(--spacing-sm);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        opacity: 0;
        transition: opacity var(--transition-fast);
      }
      
      .character-card:hover .character-actions {
        opacity: 1;
      }
      
      .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: var(--spacing-xl);
      }
      
      .empty-icon {
        font-size: 48px;
        margin-bottom: var(--spacing-md);
      }
      
      .import-options {
        display: grid;
        gap: var(--spacing-xl);
      }
      
      .import-option {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
      }
      
      .import-option h4 {
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--text-primary);
      }
      
      .import-option p {
        margin: 0 0 var(--spacing-md) 0;
        color: var(--text-secondary);
      }
      
      .file-input {
        display: none;
      }
      
      .button.danger {
        background: var(--status-danger);
        border-color: var(--status-danger);
      }
      
      .button.danger:hover {
        background: #dc2626;
      }
    `;
    document.head.appendChild(style);
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

  destroy() {
    // Remove event listeners
    this.characterButton.removeEventListener('click', this.showCharacterList);
    this.closeModalBtn.removeEventListener('click', this.closeModal);
  }
}

// Export for use in main app
export { CharacterManagerComponent };
export default CharacterManagerComponent;