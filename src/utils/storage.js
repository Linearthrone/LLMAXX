// LLMAXX Storage Utility
// Handles persistent data storage using Electron's APIs and localStorage

import { ipcRenderer } from 'electron';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants.js';

class StorageManager {
  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.electronAPI;
    this.storageAvailable = this.checkStorageAvailability();
  }

  // Check if localStorage is available
  checkStorageAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Get data from storage
  async get(key, defaultValue = null) {
    try {
      if (this.isElectron) {
        // Use Electron's persistent storage
        const result = await ipcRenderer.invoke('storage-get', key);
        return result !== null ? JSON.parse(result) : defaultValue;
      } else if (this.storageAvailable) {
        // Use localStorage for browser fallback
        const item = localStorage.getItem(key);
        return item !== null ? JSON.parse(item) : defaultValue;
      }
      return defaultValue;
    } catch (error) {
      console.error(`Storage get error for key ${key}:`, error);
      return defaultValue;
    }
  }

  // Set data to storage
  async set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      
      if (this.isElectron) {
        await ipcRenderer.invoke('storage-set', key, serialized);
      } else if (this.storageAvailable) {
        localStorage.setItem(key, serialized);
      } else {
        throw new Error('No storage available');
      }
      
      return true;
    } catch (error) {
      console.error(`Storage set error for key ${key}:`, error);
      return false;
    }
  }

  // Remove data from storage
  async remove(key) {
    try {
      if (this.isElectron) {
        await ipcRenderer.invoke('storage-remove', key);
      } else if (this.storageAvailable) {
        localStorage.removeItem(key);
      } else {
        throw new Error('No storage available');
      }
      
      return true;
    } catch (error) {
      console.error(`Storage remove error for key ${key}:`, error);
      return false;
    }
  }

  // Clear all storage
  async clear() {
    try {
      if (this.isElectron) {
        await ipcRenderer.invoke('storage-clear');
      } else if (this.storageAvailable) {
        localStorage.clear();
      } else {
        throw new Error('No storage available');
      }
      
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  // Get all keys in storage
  async getKeys() {
    try {
      if (this.isElectron) {
        return await ipcRenderer.invoke('storage-get-keys');
      } else if (this.storageAvailable) {
        return Object.keys(localStorage);
      }
      return [];
    } catch (error) {
      console.error('Storage getKeys error:', error);
      return [];
    }
  }

  // Check if key exists
  async has(key) {
    try {
      if (this.isElectron) {
        return await ipcRenderer.invoke('storage-has', key);
      } else if (this.storageAvailable) {
        return localStorage.getItem(key) !== null;
      }
      return false;
    } catch (error) {
      console.error(`Storage has error for key ${key}:`, error);
      return false;
    }
  }

  // Get storage size (approximate)
  async getSize() {
    try {
      if (this.isElectron) {
        return await ipcRenderer.invoke('storage-get-size');
      } else if (this.storageAvailable) {
        let total = 0;
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
          }
        }
        return total;
      }
      return 0;
    } catch (error) {
      console.error('Storage getSize error:', error);
      return 0;
    }
  }

  // Export all data
  async exportData() {
    try {
      const keys = await this.getKeys();
      const data = {};
      
      for (const key of keys) {
        data[key] = await this.get(key);
      }
      
      return {
        version: '1.0.0',
        timestamp: Date.now(),
        data
      };
    } catch (error) {
      console.error('Storage export error:', error);
      return null;
    }
  }

  // Import data
  async importData(exportData) {
    try {
      if (!exportData || !exportData.data) {
        throw new Error('Invalid export data format');
      }

      // Clear existing data (optional - could be made configurable)
      await this.clear();

      // Import all data
      for (const [key, value] of Object.entries(exportData.data)) {
        await this.set(key, value);
      }

      return true;
    } catch (error) {
      console.error('Storage import error:', error);
      return false;
    }
  }

  // Backup specific keys
  async backup(keys) {
    try {
      const backup = {};
      
      for (const key of keys) {
        backup[key] = await this.get(key);
      }
      
      return {
        version: '1.0.0',
        timestamp: Date.now(),
        backup
      };
    } catch (error) {
      console.error('Storage backup error:', error);
      return null;
    }
  }

  // Restore specific keys
  async restore(backupData) {
    try {
      if (!backupData || !backupData.backup) {
        throw new Error('Invalid backup data format');
      }

      for (const [key, value] of Object.entries(backupData.backup)) {
        await this.set(key, value);
      }

      return true;
    } catch (error) {
      console.error('Storage restore error:', error);
      return false;
    }
  }
}

// Specialized storage methods for different data types

class SettingsStorage extends StorageManager {
  async getSettings() {
    return await this.get(STORAGE_KEYS.appSettings, DEFAULT_SETTINGS);
  }

  async setSettings(settings) {
    return await this.set(STORAGE_KEYS.appSettings, settings);
  }

  async updateSetting(key, value) {
    const settings = await this.getSettings();
    settings[key] = value;
    return await this.setSettings(settings);
  }

  async resetSettings() {
    return await this.setSettings(DEFAULT_SETTINGS);
  }
}

class CharacterStorage extends StorageManager {
  async getCharacters() {
    return await this.get(STORAGE_KEYS.characters, []);
  }

  async setCharacters(characters) {
    return await this.set(STORAGE_KEYS.characters, characters);
  }

  async getCharacter(name) {
    const characters = await this.getCharacters();
    return characters.find(char => char.name === name);
  }

  async saveCharacter(character) {
    const characters = await this.getCharacters();
    const existingIndex = characters.findIndex(char => char.name === character.name);
    
    if (existingIndex >= 0) {
      characters[existingIndex] = character;
    } else {
      characters.push(character);
    }
    
    return await this.setCharacters(characters);
  }

  async deleteCharacter(name) {
    const characters = await this.getCharacters();
    const filtered = characters.filter(char => char.name !== name);
    return await this.setCharacters(filtered);
  }

  async getActiveCharacter() {
    return await this.get(STORAGE_KEYS.activeCharacter, null);
  }

  async setActiveCharacter(character) {
    return await this.set(STORAGE_KEYS.activeCharacter, character);
  }
}

class ChatStorage extends StorageManager {
  async getChatHistory(characterName = null) {
    const allHistory = await this.get(STORAGE_KEYS.chatHistory, {});
    
    if (characterName) {
      return allHistory[characterName] || [];
    }
    
    return allHistory;
  }

  async saveMessage(characterName, message) {
    const allHistory = await this.getChatHistory();
    
    if (!allHistory[characterName]) {
      allHistory[characterName] = [];
    }
    
    allHistory[characterName].push({
      ...message,
      timestamp: Date.now()
    });
    
    return await this.set(STORAGE_KEYS.chatHistory, allHistory);
  }

  async clearChatHistory(characterName = null) {
    if (characterName) {
      const allHistory = await this.getChatHistory();
      delete allHistory[characterName];
      return await this.set(STORAGE_KEYS.chatHistory, allHistory);
    } else {
      return await this.remove(STORAGE_KEYS.chatHistory);
    }
  }

  async getChatStats(characterName = null) {
    const history = await this.getChatHistory(characterName);
    
    if (characterName) {
      return {
        messageCount: history.length,
        lastMessage: history.length > 0 ? history[history.length - 1].timestamp : null
      };
    }
    
    const stats = {};
    for (const [name, messages] of Object.entries(history)) {
      stats[name] = {
        messageCount: messages.length,
        lastMessage: messages.length > 0 ? messages[messages.length - 1].timestamp : null
      };
    }
    
    return stats;
  }
}

class WorldInfoStorage extends StorageManager {
  async getWorldInfo() {
    return await this.get(STORAGE_KEYS.worldInfo, {
      lore: [],
      settings: {},
      notes: {}
    });
  }

  async setWorldInfo(worldInfo) {
    return await this.set(STORAGE_KEYS.worldInfo, worldInfo);
  }

  async addLoreItem(loreItem) {
    const worldInfo = await this.getWorldInfo();
    worldInfo.lore.push({
      ...loreItem,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    });
    return await this.setWorldInfo(worldInfo);
  }

  async removeLoreItem(id) {
    const worldInfo = await this.getWorldInfo();
    worldInfo.lore = worldInfo.lore.filter(item => item.id !== id);
    return await this.setWorldInfo(worldInfo);
  }

  async updateLoreItem(id, updates) {
    const worldInfo = await this.getWorldInfo();
    const itemIndex = worldInfo.lore.findIndex(item => item.id === id);
    
    if (itemIndex >= 0) {
      worldInfo.lore[itemIndex] = { ...worldInfo.lore[itemIndex], ...updates };
      return await this.setWorldInfo(worldInfo);
    }
    
    return false;
  }
}

// Create and export instances
export const storage = new StorageManager();
export const settingsStorage = new SettingsStorage();
export const characterStorage = new CharacterStorage();
export const chatStorage = new ChatStorage();
export const worldInfoStorage = new WorldInfoStorage();

// Convenience exports
export default {
  StorageManager,
  SettingsStorage,
  CharacterStorage,
  ChatStorage,
  WorldInfoStorage,
  storage,
  settingsStorage,
  characterStorage,
  chatStorage,
  worldInfoStorage
};