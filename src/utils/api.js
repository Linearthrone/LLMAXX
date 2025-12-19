// LLMAXX API Utility
// Handles API communication with various AI providers and services

import { API_CONFIG, ERROR_MESSAGES } from './constants.js';

class APIManager {
  constructor() {
    this.providers = new Map();
    this.activeProvider = 'ollama';
    this.requestQueue = [];
    this.isProcessing = false;
    
    // Initialize default providers
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize Ollama provider
    this.providers.set('ollama', new OllamaProvider(API_CONFIG.ollama));
    
    // Placeholder for other providers
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('google', new GoogleProvider());
  }

  // Get current provider
  getProvider(name = null) {
    const providerName = name || this.activeProvider;
    return this.providers.get(providerName);
  }

  // Set active provider
  setActiveProvider(name) {
    if (this.providers.has(name)) {
      this.activeProvider = name;
      return true;
    }
    return false;
  }

  // Send chat message
  async sendMessage(message, options = {}) {
    const provider = this.getProvider();
    
    try {
      // Add to queue for processing
      const request = {
        type: 'chat',
        message,
        options,
        timestamp: Date.now()
      };
      
      return await this.processRequest(request);
    } catch (error) {
      console.error('API sendMessage error:', error);
      throw new Error(ERROR_MESSAGES.apiError);
    }
  }

  // Generate text
  async generateText(prompt, options = {}) {
    const provider = this.getProvider();
    
    try {
      const request = {
        type: 'generate',
        prompt,
        options,
        timestamp: Date.now()
      };
      
      return await this.processRequest(request);
    } catch (error) {
      console.error('API generateText error:', error);
      throw new Error(ERROR_MESSAGES.apiError);
    }
  }

  // Process queued requests
  async processRequest(request) {
    this.requestQueue.push(request);
    
    if (!this.isProcessing) {
      this.isProcessing = true;
      
      try {
        const result = await this.executeRequest(request);
        this.requestQueue = this.requestQueue.filter(r => r !== request);
        return result;
      } finally {
        this.isProcessing = false;
        
        // Process next request if any
        if (this.requestQueue.length > 0) {
          const nextRequest = this.requestQueue[0];
          this.processRequest(nextRequest);
        }
      }
    }
  }

  // Execute individual request
  async executeRequest(request) {
    const provider = this.getProvider();
    
    switch (request.type) {
      case 'chat':
        return await provider.chat(request.message, request.options);
      case 'generate':
        return await provider.generate(request.prompt, request.options);
      default:
        throw new Error(`Unknown request type: ${request.type}`);
    }
  }

  // Get available models
  async getModels(providerName = null) {
    const provider = this.getProvider(providerName);
    return await provider.getModels();
  }

  // Check provider status
  async checkStatus(providerName = null) {
    const provider = this.getProvider(providerName);
    
    try {
      const isOnline = await provider.checkStatus();
      const models = await provider.getModels();
      
      return {
        online: isOnline,
        models: models || [],
        provider: provider.name,
        endpoint: provider.baseUrl
      };
    } catch (error) {
      return {
        online: false,
        models: [],
        provider: provider.name,
        endpoint: provider.baseUrl,
        error: error.message
      };
    }
  }

  // Stream response
  async *streamMessage(message, options = {}) {
    const provider = this.getProvider();
    
    try {
      yield* provider.stream(message, options);
    } catch (error) {
      console.error('API streamMessage error:', error);
      throw new Error(ERROR_MESSAGES.apiError);
    }
  }

  // Cancel ongoing request
  cancelRequest() {
    const provider = this.getProvider();
    if (provider.cancel) {
      provider.cancel();
    }
    
    // Clear queue
    this.requestQueue = [];
    this.isProcessing = false;
  }
}

// Base Provider Class
class BaseProvider {
  constructor(config = {}) {
    this.name = config.name || 'base';
    this.baseUrl = config.baseUrl || '';
    this.timeout = config.timeout || 30000;
    this.abortController = null;
  }

  async checkStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getModels() {
    throw new Error('getModels not implemented');
  }

  async chat(message, options = {}) {
    throw new Error('chat not implemented');
  }

  async generate(prompt, options = {}) {
    throw new Error('generate not implemented');
  }

  async *stream(message, options = {}) {
    throw new Error('stream not implemented');
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  createAbortController() {
    this.cancel(); // Cancel any existing request
    this.abortController = new AbortController();
    return this.abortController.signal;
  }

  async makeRequest(url, options = {}) {
    const signal = this.createAbortController();
    
    const requestOptions = {
      ...options,
      signal,
      timeout: this.timeout
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      throw error;
    }
  }
}

// Ollama Provider
class OllamaProvider extends BaseProvider {
  constructor(config) {
    super({
      name: 'ollama',
      ...config
    });
  }

  async checkStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        timeout: 3000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getModels() {
    try {
      const data = await this.makeRequest(`${this.baseUrl}/api/tags`);
      return data.models || [];
    } catch (error) {
      console.error('Ollama getModels error:', error);
      return [];
    }
  }

  async chat(messages, options = {}) {
    const payload = {
      model: options.model || 'llama2',
      messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        max_tokens: options.maxTokens || 2048,
        ...options.options
      }
    };

    try {
      const data = await this.makeRequest(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      return {
        content: data.message?.content || '',
        model: data.model || payload.model,
        done: data.done || true,
        usage: data.usage
      };
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw error;
    }
  }

  async generate(prompt, options = {}) {
    const payload = {
      model: options.model || 'llama2',
      prompt: prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        max_tokens: options.maxTokens || 2048,
        ...options.options
      }
    };

    try {
      const data = await this.makeRequest(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      return {
        content: data.response || '',
        model: data.model || payload.model,
        done: data.done || true,
        usage: data.usage
      };
    } catch (error) {
      console.error('Ollama generate error:', error);
      throw error;
    }
  }

  async *stream(messages, options = {}) {
    const payload = {
      model: options.model || 'llama2',
      messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
      stream: true,
      options: {
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        max_tokens: options.maxTokens || 2048,
        ...options.options
      }
    };

    const signal = this.createAbortController();

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              
              if (data.message?.content) {
                yield {
                  content: data.message.content,
                  model: data.model,
                  done: data.done
                };
              }
              
              if (data.done) {
                return;
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming response:', line);
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      throw error;
    }
  }

  async pullModel(modelName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: modelName })
      });

      return response.ok;
    } catch (error) {
      console.error('Ollama pullModel error:', error);
      return false;
    }
  }

  async deleteModel(modelName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: modelName })
      });

      return response.ok;
    } catch (error) {
      console.error('Ollama deleteModel error:', error);
      return false;
    }
  }
}

// Placeholder providers for other services
class OpenAIProvider extends BaseProvider {
  constructor() {
    super({
      name: 'openai',
      baseUrl: 'https://api.openai.com/v1'
    });
  }

  async getModels() {
    // Implementation for OpenAI models
    return [];
  }

  async chat(messages, options = {}) {
    // Implementation for OpenAI chat
    throw new Error('OpenAI provider not fully implemented');
  }
}

class AnthropicProvider extends BaseProvider {
  constructor() {
    super({
      name: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1'
    });
  }

  async getModels() {
    // Implementation for Anthropic models
    return [];
  }

  async chat(messages, options = {}) {
    // Implementation for Anthropic chat
    throw new Error('Anthropic provider not fully implemented');
  }
}

class GoogleProvider extends BaseProvider {
  constructor() {
    super({
      name: 'google',
      baseUrl: 'https://generativelanguage.googleapis.com/v1'
    });
  }

  async getModels() {
    // Implementation for Google models
    return [];
  }

  async chat(messages, options = {}) {
    // Implementation for Google chat
    throw new Error('Google provider not fully implemented');
  }
}

// Create and export API manager instance
export const api = new APIManager();

// Export provider classes for extension
export {
  BaseProvider,
  OllamaProvider,
  OpenAIProvider,
  AnthropicProvider,
  GoogleProvider,
  APIManager
};

export default api;