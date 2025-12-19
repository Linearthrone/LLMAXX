// LLMAXX Radial Menu Component
// Handles radial menu functionality for character and extensions menus

import { UI_CONSTANTS } from '../utils/constants.js';

class RadialMenu {
  constructor(options = {}) {
    this.menuElement = options.menuElement;
    this.triggerElement = options.triggerElement;
    this.items = options.items || [];
    this.isOpen = false;
    this.activeItem = null;
    this.onSelect = options.onSelect || (() => {});
    this.onOpen = options.onOpen || (() => {});
    this.onClose = options.onClose || (() => {});
    
    this.init();
  }

  init() {
    if (!this.menuElement || !this.triggerElement) {
      console.error('RadialMenu: Missing required elements');
      return;
    }

    this.bindEvents();
    this.setupItems();
  }

  bindEvents() {
    // Trigger element click
    this.triggerElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.menuElement.contains(e.target) && !this.triggerElement.contains(e.target)) {
        this.close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Item hover effects
    this.menuElement.addEventListener('mouseover', (e) => {
      const item = e.target.closest('.radial-item');
      if (item) {
        this.highlightItem(item);
      }
    });

    this.menuElement.addEventListener('mouseout', (e) => {
      const item = e.target.closest('.radial-item');
      if (item) {
        this.unhighlightItem(item);
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (this.isOpen) {
        this.handleKeyNavigation(e);
      }
    });
  }

  setupItems() {
    const items = this.menuElement.querySelectorAll('.radial-item');
    
    items.forEach((item, index) => {
      // Store index for keyboard navigation
      item.dataset.index = index;
      
      // Add click handler
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectItem(item);
      });

      // Add keyboard data attributes
      if (index < 9) {
        item.dataset.key = (index + 1).toString();
        item.dataset.shortcut = `${index + 1}`;
      }
    });

    // Add shortcuts hint
    this.addShortcutHints();
  }

  addShortcutHints() {
    const items = this.menuElement.querySelectorAll('.radial-item');
    
    items.forEach(item => {
      if (item.dataset.shortcut) {
        const hint = document.createElement('div');
        hint.className = 'radial-shortcut';
        hint.textContent = item.dataset.shortcut;
        item.appendChild(hint);
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isOpen) return;

    // Calculate position
    this.positionMenu();
    
    // Add animation classes
    this.menuElement.classList.remove('hidden');
    this.menuElement.classList.add('radial-menu-expand');
    
    // Animate items
    const items = this.menuElement.querySelectorAll('.radial-item');
    items.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('radial-item-appear');
      }, index * 50);
    });

    this.isOpen = true;
    this.onOpen();
    
    // Focus first item for keyboard navigation
    setTimeout(() => {
      const firstItem = this.menuElement.querySelector('.radial-item');
      if (firstItem) {
        this.highlightItem(firstItem);
      }
    }, 100);
  }

  close() {
    if (!this.isOpen) return;

    // Remove animation classes
    this.menuElement.classList.remove('radial-menu-expand');
    this.menuElement.classList.add('radial-menu-collapse');
    
    // Animate items out
    const items = this.menuElement.querySelectorAll('.radial-item');
    items.forEach((item, index) => {
      setTimeout(() => {
        item.classList.remove('radial-item-appear');
        item.classList.add('radial-item-disappear');
      }, index * 30);
    });

    // Hide menu after animation
    setTimeout(() => {
      this.menuElement.classList.add('hidden');
      this.menuElement.classList.remove('radial-menu-collapse');
      this.menuElement.classList.remove('radial-item-disappear');
      
      // Clear highlights
      items.forEach(item => {
        this.unhighlightItem(item);
      });
    }, 300);

    this.isOpen = false;
    this.activeItem = null;
    this.onClose();
  }

  positionMenu() {
    const triggerRect = this.triggerElement.getBoundingClientRect();
    const menuRect = this.menuElement.getBoundingClientRect();
    
    // Position menu near trigger element
    const top = triggerRect.top + triggerRect.height / 2 - menuRect.height / 2;
    const left = triggerRect.left + triggerRect.width / 2 - menuRect.width / 2;
    
    // Adjust if menu goes off screen
    const adjustedTop = Math.max(10, Math.min(top, window.innerHeight - menuRect.height - 10));
    const adjustedLeft = Math.max(10, Math.min(left, window.innerWidth - menuRect.width - 10));
    
    this.menuElement.style.position = 'fixed';
    this.menuElement.style.top = `${adjustedTop}px`;
    this.menuElement.style.left = `${adjustedLeft}px`;
  }

  selectItem(item) {
    if (!item || !item.classList.contains('radial-item')) return;

    const action = item.dataset.action;
    const index = parseInt(item.dataset.index);
    
    // Add selection animation
    item.classList.add('radial-item-selected');
    
    setTimeout(() => {
      item.classList.remove('radial-item-selected');
    }, 200);

    // Trigger callback
    this.onSelect({
      action,
      index,
      item,
      element: item
    });

    // Close menu
    this.close();
  }

  highlightItem(item) {
    if (!item) return;

    // Clear previous highlight
    const items = this.menuElement.querySelectorAll('.radial-item');
    items.forEach(i => i.classList.remove('radial-item-highlighted'));

    // Highlight new item
    item.classList.add('radial-item-highlighted');
    this.activeItem = item;
  }

  unhighlightItem(item) {
    if (item) {
      item.classList.remove('radial-item-highlighted');
    }
  }

  handleKeyNavigation(e) {
    const items = Array.from(this.menuElement.querySelectorAll('.radial-item'));
    
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        this.navigateItems(items, -1);
        break;
        
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        this.navigateItems(items, 1);
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this.activeItem) {
          this.selectItem(this.activeItem);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
        
      default:
        // Handle number shortcuts
        if (e.key >= '1' && e.key <= '9') {
          const index = parseInt(e.key) - 1;
          if (items[index]) {
            this.selectItem(items[index]);
          }
        }
        break;
    }
  }

  navigateItems(items, direction) {
    if (items.length === 0) return;

    let currentIndex = -1;
    
    if (this.activeItem) {
      currentIndex = items.indexOf(this.activeItem);
    }

    let newIndex = currentIndex + direction;
    
    // Wrap around
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;

    this.highlightItem(items[newIndex]);
  }

  updateItems(newItems) {
    // Clear existing items
    this.menuElement.innerHTML = '';
    
    // Add new items
    newItems.forEach(itemData => {
      const item = this.createItem(itemData);
      this.menuElement.appendChild(item);
    });
    
    // Reinitialize
    this.setupItems();
  }

  createItem(itemData) {
    const item = document.createElement('div');
    item.className = 'radial-item';
    item.dataset.action = itemData.action;
    
    if (itemData.shortcut) {
      item.dataset.shortcut = itemData.shortcut;
    }

    const icon = document.createElement('div');
    icon.className = 'radial-icon';
    icon.textContent = itemData.icon || '📁';
    
    const label = document.createElement('span');
    label.textContent = itemData.label || itemData.action;
    
    item.appendChild(icon);
    item.appendChild(label);

    if (itemData.description) {
      item.title = itemData.description;
    }

    return item;
  }

  destroy() {
    // Remove event listeners
    this.triggerElement.removeEventListener('click', this.toggle);
    document.removeEventListener('click', this.close);
    document.removeEventListener('keydown', this.handleKeyNavigation);
    
    // Clean up menu
    if (this.menuElement.parentNode) {
      this.menuElement.parentNode.removeChild(this.menuElement);
    }
  }
}

// Factory function for creating radial menus
export function createRadialMenu(options) {
  return new RadialMenu(options);
}

// Export class for extension
export { RadialMenu };
export default RadialMenu;