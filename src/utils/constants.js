// LLMAXX Application Constants

const APP_CONFIG = {
  name: 'LLMAXX',
  version: '1.0.0',
  description: 'AI Desktop Overlay Application'
};

// UI Constants
const UI_CONSTANTS = {
  // Layout percentages and positions
  chatWindowWidth: 33, // percentage of screen width
  minChatWidth: 400,
  maxChatWidth: 600,
  
  // Spacing (in pixels, should match CSS variables)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  
  // Animation durations (in milliseconds)
  animations: {
    fast: 150,
    normal: 250,
    slow: 350
  },
  
  // Z-index layers
  zIndex: {
    background: 0,
    worldInfo: 900,
    systemMonitor: 900,
    leftControls: 900,
    chatWindow: 950,
    characterButton: 1000,
    radialMenu: 2000,
    settingsOverlay: 3000,
    characterModal: 3000
  }
};

// API Configuration
const API_CONFIG = {
  // Default API endpoints
  ollama: {
    baseUrl: 'http://localhost:11434',
    endpoints: {
      generate: '/api/generate',
      chat: '/api/chat',
      tags: '/api/tags',
      pull: '/api/pull',
      delete: '/api/delete'
    },
    timeout: 30000
  },
  
  // Character formats (SillyTavern compatible)
  characterFormats: {
    json: 'json',
    png: 'png',
    yaml: 'yaml'
  },
  
  // Default AI model settings
  defaultModel: {
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 2048,
    contextSize: 4096
  }
};

// Storage Keys
const STORAGE_KEYS = {
  // General settings
  appSettings: 'llmaxx_settings',
  
  // Character data
  characters: 'llmaxx_characters',
  activeCharacter: 'llmaxx_active_character',
  
  // Chat history
  chatHistory: 'llmaxx_chat_history',
  
  // AI configuration
  aiConfig: 'llmaxx_ai_config',
  
  // World info
  worldInfo: 'llmaxx_world_info',
  
  // Extensions
  extensions: 'llmaxx_extensions',
  
  // UI state
  uiState: 'llmaxx_ui_state'
};

// Default Settings
const DEFAULT_SETTINGS = {
  // General
  theme: 'dark',
  language: 'en',
  autoStart: false,
  startMinimized: false,
  
  // Chat settings
  autoSaveChat: true,
  maxChatHistory: 1000,
  messageSound: false,
  typingIndicator: true,
  
  // AI settings
  defaultProvider: 'ollama',
  defaultModel: 'llama2',
  streamResponse: true,
  
  // UI settings
  chatWindowOpacity: 0.95,
  showSystemMonitor: true,
  showWorldInfo: true,
  compactMode: false,
  
  // Keyboard shortcuts
  shortcuts: {
    toggleApp: 'Ctrl+Shift+L',
    toggleMousePassthrough: 'Ctrl+Shift+M',
    focusChat: 'Ctrl+Shift+C',
    clearChat: 'Ctrl+Shift+K'
  }
};

// Character Template (SillyTavern compatible)
const CHARACTER_TEMPLATE = {
  name: '',
  description: '',
  personality: '',
  scenario: '',
  first_mes: '',
  mes_example: '',
  background: '',
  data: {
    name: '',
    description: '',
    personality: '',
    scenario: '',
    first_mes: '',
    mes_example: '',
    background: '',
    extensions: {},
    alternate_greetings: [],
    tags: [],
    creator: '',
    character_version: '',
    system_prompt: '',
    post_history_instructions: '',
    spec: '',
    spec_char: ''
  }
};

// System Info Categories
const SYSTEM_CATEGORIES = {
  general: {
    name: 'General',
    icon: '⚙️',
    color: '#8b5cf6'
  },
  prompts: {
    name: 'System Prompts',
    icon: '📝',
    color: '#ec4899'
  },
  ai: {
    name: 'AI Configuration',
    icon: '🧠',
    color: '#8b5cf6'
  },
  server: {
    name: 'Server Settings',
    icon: '🌐',
    color: '#3b82f6'
  },
  appearance: {
    name: 'Appearance',
    icon: '🎨',
    color: '#a855f7'
  },
  extensions: {
    name: 'Extensions',
    icon: '🔌',
    color: '#10b981'
  }
};

// Extension Categories
const EXTENSION_CATEGORIES = {
  plugins: {
    name: 'Plugin Manager',
    icon: '🧩',
    description: 'Manage installed plugins'
  },
  scripts: {
    name: 'Custom Scripts',
    icon: '📜',
    description: 'Run custom JavaScript scripts'
  },
  voice: {
    name: 'Voice Input',
    icon: '🎤',
    description: 'Voice-to-text input'
  },
  image: {
    name: 'Image Generation',
    icon: '🖼️',
    description: 'Generate images from text'
  },
  translation: {
    name: 'Translation',
    icon: '🌍',
    description: 'Translate messages'
  },
  memory: {
    name: 'Long-term Memory',
    icon: '🧠',
    description: 'Persistent conversation memory'
  }
};

// Message Types
const MESSAGE_TYPES = {
  user: 'user',
  assistant: 'assistant',
  system: 'system',
  narration: 'narration',
  action: 'action'
};

// Notification Types
const NOTIFICATION_TYPES = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error'
};

// Validation Patterns
const VALIDATION_PATTERNS = {
  // URLs
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // Localhost URLs
  localhost: /^https?:\/\/localhost(:[0-9]+)?(\/.*)?$/,
  
  // Names (allow letters, numbers, spaces, hyphens, underscores)
  name: /^[a-zA-Z0-9\s\-_]+$/,
  
  // JSON
  json: /^[\s\S]*\{[\s\S]*\}[\s\S]*$/
};

// Error Messages
const ERROR_MESSAGES = {
  // Network errors
  networkError: 'Network connection failed',
  timeoutError: 'Request timed out',
  apiError: 'API request failed',
  
  // Character errors
  characterNotFound: 'Character not found',
  invalidCharacterFormat: 'Invalid character format',
  characterSaveError: 'Failed to save character',
  
  // Chat errors
  messageSendError: 'Failed to send message',
  chatLoadError: 'Failed to load chat history',
  
  // System errors
  storageError: 'Storage access failed',
  settingsError: 'Failed to save settings',
  
  // Validation errors
  invalidUrl: 'Invalid URL format',
  invalidName: 'Invalid name format',
  requiredField: 'This field is required'
};

// Success Messages
const SUCCESS_MESSAGES = {
  characterSaved: 'Character saved successfully',
  characterDeleted: 'Character deleted successfully',
  settingsSaved: 'Settings saved successfully',
  chatCleared: 'Chat cleared successfully',
  messageSent: 'Message sent successfully',
  connected: 'Connected successfully',
  disconnected: 'Disconnected successfully'
};

// Export all constants
export {
  APP_CONFIG,
  UI_CONSTANTS,
  API_CONFIG,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  CHARACTER_TEMPLATE,
  SYSTEM_CATEGORIES,
  EXTENSION_CATEGORIES,
  MESSAGE_TYPES,
  NOTIFICATION_TYPES,
  VALIDATION_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};