// LLMAXX Chat Component
// Handles chat functionality including message display, sending, and history

import { chatStorage, characterStorage } from '../utils/storage.js';
import { api } from '../utils/api.js';
import { MESSAGE_TYPES } from '../utils/constants.js';

class ChatComponent {
  constructor() {
    this.chatWindow = document.getElementById('chatWindow');
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    this.sendButton = document.getElementById('sendButton');
    this.toggleChatBtn = document.getElementById('toggleChat');
    this.clearChatBtn = document.getElementById('clearChat');
    this.collapsedIndicator = document.getElementById('collapsedChatIndicator');
    this.expandChatBtn = document.getElementById('expandChat');
    this.messageCount = document.getElementById('messageCount');
    this.activeCharacterSpan = document.getElementById('activeCharacter');
    
    this.isCollapsed = false;
    this.currentCharacter = null;
    this.messageHistory = [];
    this.isTyping = false;
    this.currentStream = null;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadActiveCharacter();
    this.loadChatHistory();
    this.setupAutoResize();
  }

  bindEvents() {
    // Send button
    this.sendButton.addEventListener('click', () => this.sendMessage());
    
    // Enter key to send (Shift+Enter for new line)
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Toggle chat
    this.toggleChatBtn.addEventListener('click', () => this.toggleChat());
    this.expandChatBtn.addEventListener('click', () => this.expandChat());

    // Clear chat
    this.clearChatBtn.addEventListener('click', () => this.clearChat());

    // Auto-scroll to bottom on new messages
    this.chatMessages.addEventListener('DOMNodeInserted', () => {
      this.scrollToBottom();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (!this.isCollapsed) {
        this.adjustChatSize();
      }
    });
  }

  setupAutoResize() {
    this.chatInput.addEventListener('input', () => {
      this.autoResizeTextarea();
    });
  }

  autoResizeTextarea() {
    this.chatInput.style.height = 'auto';
    this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
  }

  async loadActiveCharacter() {
    try {
      this.currentCharacter = await characterStorage.getActiveCharacter();
      this.updateCharacterDisplay();
    } catch (error) {
      console.error('Failed to load active character:', error);
    }
  }

  updateCharacterDisplay() {
    if (this.currentCharacter) {
      this.activeCharacterSpan.textContent = this.currentCharacter.name;
    } else {
      this.activeCharacterSpan.textContent = 'No character selected';
    }
  }

  async loadChatHistory() {
    if (!this.currentCharacter) return;

    try {
      this.messageHistory = await chatStorage.getChatHistory(this.currentCharacter.name);
      this.displayMessages();
    } catch (error) {
      console.error('Failed to load chat history:', error);
      this.addSystemMessage('Failed to load chat history');
    }
  }

  displayMessages() {
    this.chatMessages.innerHTML = '';
    
    if (this.messageHistory.length === 0) {
      this.addSystemMessage(`Start a conversation with ${this.currentCharacter?.name || 'the AI'}`);
      return;
    }

    this.messageHistory.forEach(message => {
      this.displayMessage(message, false);
    });

    this.updateMessageCount();
    this.scrollToBottom();
  }

  displayMessage(message, animate = true) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.type} ${animate ? 'message-appear' : ''}`;
    
    // Add avatar for character messages
    if (message.type === MESSAGE_TYPES.assistant && this.currentCharacter) {
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.textContent = this.currentCharacter.name?.charAt(0).toUpperCase() || 'AI';
      messageElement.appendChild(avatar);
    }

    const content = document.createElement('div');
    content.className = 'message-content';
    
    if (message.type === MESSAGE_TYPES.assistant && message.streaming) {
      content.classList.add('streaming');
    }

    // Handle markdown-like formatting
    content.innerHTML = this.formatMessageText(message.content);
    messageElement.appendChild(content);

    // Add timestamp for system messages
    if (message.type === MESSAGE_TYPES.system) {
      const timestamp = document.createElement('div');
      timestamp.className = 'message-timestamp';
      timestamp.textContent = new Date(message.timestamp).toLocaleTimeString();
      content.appendChild(timestamp);
    }

    this.chatMessages.appendChild(messageElement);
  }

  formatMessageText(text) {
    // Basic formatting - can be enhanced with a proper markdown parser
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  async sendMessage() {
    const content = this.chatInput.value.trim();
    if (!content || this.isTyping) return;

    // Create user message
    const userMessage = {
      type: MESSAGE_TYPES.user,
      content,
      timestamp: Date.now()
    };

    // Add to display and history
    this.displayMessage(userMessage);
    this.messageHistory.push(userMessage);
    await chatStorage.saveMessage(this.currentCharacter?.name || 'default', userMessage);

    // Clear input
    this.chatInput.value = '';
    this.autoResizeTextarea();

    // Start typing indicator
    this.showTypingIndicator();
    this.isTyping = true;

    try {
      // Prepare messages for API
      const messages = this.prepareMessagesForAPI(content);

      // Stream response if enabled
      const settings = await this.getChatSettings();
      if (settings.streamResponse) {
        await this.streamResponse(messages);
      } else {
        await this.getSingleResponse(messages);
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      this.hideTypingIndicator();
      this.addSystemMessage('Failed to get response. Please try again.');
    } finally {
      this.isTyping = false;
    }
  }

  prepareMessagesForAPI(userContent) {
    const messages = [];

    // Add system prompt if character has one
    if (this.currentCharacter?.data?.system_prompt) {
      messages.push({
        role: 'system',
        content: this.currentCharacter.data.system_prompt
      });
    }

    // Add character context
    if (this.currentCharacter?.data?.description) {
      messages.push({
        role: 'system',
        content: `Character: ${this.currentCharacter.data.description}`
      });
    }

    // Add recent conversation history (last 10 messages)
    const recentMessages = this.messageHistory.slice(-10);
    recentMessages.forEach(msg => {
      if (msg.type === MESSAGE_TYPES.user || msg.type === MESSAGE_TYPES.assistant) {
        messages.push({
          role: msg.type === MESSAGE_TYPES.user ? 'user' : 'assistant',
          content: msg.content
        });
      }
    });

    return messages;
  }

  async streamResponse(messages) {
    let fullResponse = '';
    let assistantMessage = null;

    try {
      this.currentStream = api.streamMessage(messages);

      // Create streaming message element
      assistantMessage = {
        type: MESSAGE_TYPES.assistant,
        content: '',
        streaming: true,
        timestamp: Date.now()
      };

      this.displayMessage(assistantMessage);
      const messageElement = this.chatMessages.lastElementChild;
      const contentElement = messageElement.querySelector('.message-content');

      // Stream response
      for await (const chunk of this.currentStream) {
        if (chunk.content) {
          fullResponse += chunk.content;
          contentElement.innerHTML = this.formatMessageText(fullResponse);
          this.scrollToBottom();
        }
      }

      // Finalize message
      assistantMessage.content = fullResponse;
      assistantMessage.streaming = false;
      
      // Update display
      contentElement.classList.remove('streaming');
      contentElement.innerHTML = this.formatMessageText(fullResponse);

    } catch (error) {
      console.error('Stream error:', error);
      throw error;
    } finally {
      this.currentStream = null;
      this.hideTypingIndicator();
      
      if (assistantMessage && fullResponse) {
        this.messageHistory.push(assistantMessage);
        await chatStorage.saveMessage(this.currentCharacter?.name || 'default', assistantMessage);
      }
    }
  }

  async getSingleResponse(messages) {
    try {
      const response = await api.sendMessage(messages);
      
      const assistantMessage = {
        type: MESSAGE_TYPES.assistant,
        content: response.content || '',
        timestamp: Date.now()
      };

      this.displayMessage(assistantMessage);
      this.messageHistory.push(assistantMessage);
      await chatStorage.saveMessage(this.currentCharacter?.name || 'default', assistantMessage);

    } catch (error) {
      console.error('Single response error:', error);
      throw error;
    } finally {
      this.hideTypingIndicator();
    }
  }

  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message assistant message-appear typing-message';
    indicator.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = this.currentCharacter?.name?.charAt(0).toUpperCase() || 'AI';

    const content = document.createElement('div');
    content.className = 'message-content';
    
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    
    content.appendChild(typing);
    indicator.appendChild(avatar);
    indicator.appendChild(content);

    this.chatMessages.appendChild(indicator);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }

  addSystemMessage(text) {
    const message = {
      type: MESSAGE_TYPES.system,
      content: text,
      timestamp: Date.now()
    };

    this.displayMessage(message);
  }

  toggleChat() {
    if (this.isCollapsed) {
      this.expandChat();
    } else {
      this.collapseChat();
    }
  }

  collapseChat() {
    if (this.isCollapsed) return;

    this.isCollapsed = true;
    this.chatWindow.classList.add('collapsed');
    this.collapsedIndicator.classList.remove('hidden');
    this.updateMessageCount();

    // Update button icon
    this.toggleChatBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    `;
  }

  expandChat() {
    if (!this.isCollapsed) return;

    this.isCollapsed = false;
    this.chatWindow.classList.remove('collapsed');
    this.collapsedIndicator.classList.add('hidden');

    // Update button icon
    this.toggleChatBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    `;

    this.scrollToBottom();
  }

  async clearChat() {
    if (!confirm('Are you sure you want to clear the chat history?')) return;

    try {
      await chatStorage.clearChatHistory(this.currentCharacter?.name || 'default');
      this.messageHistory = [];
      this.displayMessages();
    } catch (error) {
      console.error('Failed to clear chat:', error);
      this.addSystemMessage('Failed to clear chat history');
    }
  }

  updateMessageCount() {
    const count = this.messageHistory.filter(m => 
      m.type === MESSAGE_TYPES.user || m.type === MESSAGE_TYPES.assistant
    ).length;
    
    this.messageCount.textContent = count.toString();
  }

  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  adjustChatSize() {
    // Adjust chat window size based on screen size
    const screenWidth = window.innerWidth;
    const width = Math.min(screenWidth * 0.33, 600);
    const minWidth = Math.max(width, 400);
    
    this.chatWindow.style.width = `${minWidth}px`;
  }

  async getChatSettings() {
    // Get chat settings - would be connected to settings system
    return {
      streamResponse: true,
      maxTokens: 2048,
      temperature: 0.7
    };
  }

  setCharacter(character) {
    this.currentCharacter = character;
    this.updateCharacterDisplay();
    this.loadChatHistory();
  }

  cancelCurrentRequest() {
    if (this.currentStream) {
      api.cancelRequest();
      this.currentStream = null;
      this.isTyping = false;
      this.hideTypingIndicator();
    }
  }

  destroy() {
    // Cancel any ongoing requests
    this.cancelCurrentRequest();
    
    // Remove event listeners
    this.sendButton.removeEventListener('click', this.sendMessage);
    this.toggleChatBtn.removeEventListener('click', this.toggleChat);
    this.clearChatBtn.removeEventListener('click', this.clearChat);
    this.expandChatBtn.removeEventListener('click', this.expandChat);
  }
}

// Export for use in main app
export { ChatComponent };
export default ChatComponent;