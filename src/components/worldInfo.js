// LLMAXX World Info Component
// Handles world information panel, lore items, and character notes

import { worldInfoStorage } from '../utils/storage.js';
import { MESSAGE_TYPES } from '../utils/constants.js';

class WorldInfoComponent {
  constructor() {
    this.worldInfoPanel = document.getElementById('worldInfo');
    this.worldInfoContent = document.getElementById('worldInfoContent');
    this.toggleWorldInfoBtn = document.getElementById('toggleWorldInfo');
    this.collapsedWorldInfo = document.getElementById('collapsedWorldInfo');
    this.expandWorldInfoBtn = document.getElementById('expandWorldInfo');
    this.loreItems = document.getElementById('loreItems');
    this.characterNotes = document.getElementById('characterNotes');
    
    this.isCollapsed = false;
    this.worldInfo = null;
    this.currentCharacter = null;
    this.editingItem = null;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadWorldInfo();
    this.setupDragAndDrop();
  }

  bindEvents() {
    // Toggle world info panel
    this.toggleWorldInfoBtn.addEventListener('click', () => this.toggleWorldInfo());
    this.expandWorldInfoBtn.addEventListener('click', () => this.expandWorldInfo());

    // Add lore item button
    const addLoreBtn = document.createElement('button');
    addLoreBtn.className = 'button add-lore-btn';
    addLoreBtn.innerHTML = `
      <span class="control-icon">➕</span>
      <span>Add Lore</span>
    `;
    addLoreBtn.addEventListener('click', () => this.showLoreEditor());
    this.insertAddLoreButton(addLoreBtn);

    // Edit mode toggle
    const editModeBtn = document.createElement('button');
    editModeBtn.className = 'icon-button edit-mode-btn';
    editModeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    `;
    editModeBtn.title = 'Toggle Edit Mode';
    editModeBtn.addEventListener('click', () => this.toggleEditMode());
    this.insertEditModeButton(editModeBtn);

    // Handle lore item clicks
    this.loreItems.addEventListener('click', (e) => {
      const loreItem = e.target.closest('.lore-item');
      if (loreItem) {
        this.handleLoreItemClick(loreItem, e);
      }
    });
  }

  insertAddLoreButton(button) {
    const loreSection = this.worldInfoContent.querySelector('.world-info-section');
    if (loreSection) {
      const header = loreSection.querySelector('h5');
      if (header) {
        header.insertAdjacentElement('afterend', button);
      }
    }
  }

  insertEditModeButton(button) {
    const header = this.worldInfoPanel.querySelector('.world-info-header');
    if (header) {
      header.appendChild(button);
    }
  }

  setupDragAndDrop() {
    // Setup drag and drop for lore items
    this.loreItems.addEventListener('dragstart', (e) => {
      const loreItem = e.target.closest('.lore-item');
      if (loreItem) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', loreItem.innerHTML);
        loreItem.classList.add('dragging');
      }
    });

    this.loreItems.addEventListener('dragend', (e) => {
      const loreItem = e.target.closest('.lore-item');
      if (loreItem) {
        loreItem.classList.remove('dragging');
      }
    });

    this.loreItems.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingItem = this.loreItems.querySelector('.dragging');
      const afterElement = this.getDragAfterElement(this.loreItems, e.clientY);
      
      if (afterElement == null) {
        this.loreItems.appendChild(draggingItem);
      } else {
        this.loreItems.insertBefore(draggingItem, afterElement);
      }
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.lore-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  async loadWorldInfo() {
    try {
      this.worldInfo = await worldInfoStorage.getWorldInfo();
      this.displayLoreItems();
      this.updateCharacterNotes();
    } catch (error) {
      console.error('Failed to load world info:', error);
      this.showError('Failed to load world information');
    }
  }

  displayLoreItems() {
    this.loreItems.innerHTML = '';
    
    if (!this.worldInfo.lore || this.worldInfo.lore.length === 0) {
      this.loreItems.innerHTML = `
        <div class="lore-item empty-state">
          <span class="lore-value">No lore items added yet. Click "Add Lore" to get started.</span>
        </div>
      `;
      return;
    }

    this.worldInfo.lore.forEach((loreItem, index) => {
      const item = this.createLoreItem(loreItem, index);
      this.loreItems.appendChild(item);
    });
  }

  createLoreItem(loreItem, index) {
    const item = document.createElement('div');
    item.className = 'lore-item';
    item.draggable = true;
    item.dataset.id = loreItem.id;
    item.dataset.index = index;

    const key = document.createElement('span');
    key.className = 'lore-key';
    key.textContent = loreItem.key || 'Unknown';
    key.contentEditable = false;

    const value = document.createElement('span');
    value.className = 'lore-value';
    value.textContent = loreItem.value || '';
    value.contentEditable = false;

    const actions = document.createElement('div');
    actions.className = 'lore-actions';
    actions.style.display = 'none';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-button edit-btn';
    editBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    `;
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.editLoreItem(loreItem.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-button delete-btn';
    deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18"></path>
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
      </svg>
    `;
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteLoreItem(loreItem.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(key);
    item.appendChild(value);
    item.appendChild(actions);

    // Show actions on hover
    item.addEventListener('mouseenter', () => {
      actions.style.display = 'flex';
    });

    item.addEventListener('mouseleave', () => {
      actions.style.display = 'none';
    });

    return item;
  }

  updateCharacterNotes() {
    if (!this.currentCharacter) {
      this.characterNotes.innerHTML = '<p class="text-muted">No character selected</p>';
      return;
    }

    let notes = '';
    
    // Add character description
    if (this.currentCharacter.data?.description) {
      notes += `<p><strong>Description:</strong> ${this.currentCharacter.data.description}</p>`;
    }

    // Add personality
    if (this.currentCharacter.data?.personality) {
      notes += `<p><strong>Personality:</strong> ${this.currentCharacter.data.personality}</p>`;
    }

    // Add scenario
    if (this.currentCharacter.data?.scenario) {
      notes += `<p><strong>Scenario:</strong> ${this.currentCharacter.data.scenario}</p>`;
    }

    // Add background
    if (this.currentCharacter.data?.background) {
      notes += `<p><strong>Background:</strong> ${this.currentCharacter.data.background}</p>`;
    }

    // Add custom notes if any
    if (this.currentCharacter.notes) {
      notes += `<p><strong>Notes:</strong> ${this.currentCharacter.notes}</p>`;
    }

    if (!notes) {
      notes = '<p class="text-muted">No character information available</p>';
    }

    this.characterNotes.innerHTML = notes;
  }

  setCharacter(character) {
    this.currentCharacter = character;
    this.updateCharacterNotes();
  }

  toggleWorldInfo() {
    if (this.isCollapsed) {
      this.expandWorldInfo();
    } else {
      this.collapseWorldInfo();
    }
  }

  collapseWorldInfo() {
    if (this.isCollapsed) return;

    this.isCollapsed = true;
    this.worldInfoPanel.classList.add('collapsed');
    this.collapsedWorldInfo.classList.remove('hidden');

    // Update button icon
    this.toggleWorldInfoBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    `;
  }

  expandWorldInfo() {
    if (!this.isCollapsed) return;

    this.isCollapsed = false;
    this.worldInfoPanel.classList.remove('collapsed');
    this.collapsedWorldInfo.classList.add('hidden');

    // Update button icon
    this.toggleWorldInfoBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    `;
  }

  showLoreEditor(loreItem = null) {
    const overlay = document.createElement('div');
    overlay.className = 'lore-editor-overlay';
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
    modal.className = 'lore-editor panel';
    modal.style.cssText = `
      width: 90%;
      max-width: 500px;
      padding: 24px;
    `;

    const isEdit = loreItem !== null;
    const title = isEdit ? 'Edit Lore Item' : 'Add Lore Item';

    modal.innerHTML = `
      <div class="modal-header flex-between" style="margin-bottom: 16px;">
        <h3 class="heading">${title}</h3>
        <button class="icon-button" id="closeLoreEditor">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <form id="loreForm">
        <div class="form-group" style="margin-bottom: 16px;">
          <label for="loreKey" class="form-label">Key/Category</label>
          <input 
            type="text" 
            id="loreKey" 
            class="form-input" 
            placeholder="e.g., Setting, Character, Magic System"
            value="${loreItem?.key || ''}"
            required
          />
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label for="loreValue" class="form-label">Value/Description</label>
          <textarea 
            id="loreValue" 
            class="form-input" 
            rows="4"
            placeholder="Enter the lore information..."
            required
          >${loreItem?.value || ''}</textarea>
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label for="lorePriority" class="form-label">Priority</label>
          <select id="lorePriority" class="form-input">
            <option value="low" ${loreItem?.priority === 'low' ? 'selected' : ''}>Low</option>
            <option value="medium" ${!loreItem?.priority || loreItem?.priority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="high" ${loreItem?.priority === 'high' ? 'selected' : ''}>High</option>
          </select>
        </div>
        <div class="form-actions flex-between">
          <button type="button" class="button" id="cancelLoreEditor">Cancel</button>
          <button type="submit" class="button">${isEdit ? 'Update' : 'Add'}</button>
        </div>
      </form>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add form styles
    this.addFormStyles();

    // Bind events
    const closeBtn = modal.querySelector('#closeLoreEditor');
    const cancelBtn = modal.querySelector('#cancelLoreEditor');
    const form = modal.querySelector('#loreForm');

    closeBtn.addEventListener('click', () => this.closeLoreEditor(overlay));
    cancelBtn.addEventListener('click', () => this.closeLoreEditor(overlay));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeLoreEditor(overlay);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveLoreItem(overlay, loreItem);
    });

    // Add entrance animation
    overlay.classList.add('entrance-fade-in');
    modal.classList.add('entrance-scale-in');

    // Focus first input
    setTimeout(() => {
      modal.querySelector('#loreKey').focus();
    }, 100);
  }

  addFormStyles() {
    if (document.getElementById('lore-form-styles')) return;

    const style = document.createElement('style');
    style.id = 'lore-form-styles';
    style.textContent = `
      .form-label {
        display: block;
        margin-bottom: 8px;
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
      
      .form-group {
        display: flex;
        flex-direction: column;
      }
      
      .form-actions {
        margin-top: 24px;
      }
    `;
    document.head.appendChild(style);
  }

  closeLoreEditor(overlay) {
    overlay.classList.add('exit-fade-out');
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 200);
  }

  async saveLoreItem(overlay, existingItem) {
    const key = overlay.querySelector('#loreKey').value.trim();
    const value = overlay.querySelector('#loreValue').value.trim();
    const priority = overlay.querySelector('#lorePriority').value;

    if (!key || !value) {
      this.showError('Please fill in all fields');
      return;
    }

    try {
      const loreData = {
        key,
        value,
        priority,
        activated: true
      };

      if (existingItem) {
        await worldInfoStorage.updateLoreItem(existingItem.id, loreData);
      } else {
        await worldInfoStorage.addLoreItem(loreData);
      }

      this.closeLoreEditor(overlay);
      await this.loadWorldInfo();
    } catch (error) {
      console.error('Failed to save lore item:', error);
      this.showError('Failed to save lore item');
    }
  }

  async editLoreItem(id) {
    const loreItem = this.worldInfo.lore.find(item => item.id === id);
    if (loreItem) {
      this.showLoreEditor(loreItem);
    }
  }

  async deleteLoreItem(id) {
    if (!confirm('Are you sure you want to delete this lore item?')) return;

    try {
      await worldInfoStorage.removeLoreItem(id);
      await this.loadWorldInfo();
    } catch (error) {
      console.error('Failed to delete lore item:', error);
      this.showError('Failed to delete lore item');
    }
  }

  handleLoreItemClick(item, event) {
    // Toggle activation on double click
    if (event.detail === 2) {
      const id = item.dataset.id;
      const loreItem = this.worldInfo.lore.find(l => l.id === id);
      if (loreItem) {
        this.toggleLoreActivation(id, !loreItem.activated);
      }
    }
  }

  async toggleLoreActivation(id, activated) {
    try {
      await worldInfoStorage.updateLoreItem(id, { activated });
      await this.loadWorldInfo();
    } catch (error) {
      console.error('Failed to toggle lore activation:', error);
    }
  }

  toggleEditMode() {
    const items = this.loreItems.querySelectorAll('.lore-item');
    items.forEach(item => {
      const key = item.querySelector('.lore-key');
      const value = item.querySelector('.lore-value');
      const actions = item.querySelector('.lore-actions');
      
      if (key.contentEditable === 'false') {
        key.contentEditable = true;
        value.contentEditable = true;
        item.classList.add('editing');
        actions.style.display = 'flex';
      } else {
        key.contentEditable = false;
        value.contentEditable = false;
        item.classList.remove('editing');
        actions.style.display = 'none';
      }
    });
  }

  getActiveLore() {
    if (!this.worldInfo.lore) return [];
    
    return this.worldInfo.lore
      .filter(item => item.activated !== false)
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;
        return aPriority - bPriority;
      });
  }

  formatLoreForPrompt() {
    const activeLore = this.getActiveLore();
    if (activeLore.length === 0) return '';

    let loreText = 'World Information:\n';
    activeLore.forEach(item => {
      loreText += `- ${item.key}: ${item.value}\n`;
    });

    return loreText;
  }

  showError(message) {
    // Show error notification
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--status-danger);
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
    this.toggleWorldInfoBtn.removeEventListener('click', this.toggleWorldInfo);
    this.expandWorldInfoBtn.removeEventListener('click', this.expandWorldInfo);
  }
}

// Export for use in main app
export { WorldInfoComponent };
export default WorldInfoComponent;