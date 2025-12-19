// LLMAXX System Monitor Component
// Handles real-time system monitoring and status display

import { api } from '../utils/api.js';
import { UI_CONSTANTS } from '../utils/constants.js';

class SystemMonitorComponent {
  constructor() {
    this.monitorElement = document.querySelector('.system-monitor');
    this.cpuBar = document.getElementById('cpuBar');
    this.cpuValue = document.getElementById('cpuValue');
    this.memBar = document.getElementById('memBar');
    this.memValue = document.getElementById('memValue');
    this.ollamaStatus = document.getElementById('ollamaStatus');
    this.serverStatus = document.getElementById('serverStatus');
    this.systemSettingsBtn = document.getElementById('systemSettings');
    
    this.updateInterval = null;
    this.lastUpdate = null;
    this.isUpdating = false;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.startMonitoring();
    this.initializeDisplay();
  }

  bindEvents() {
    // System settings button
    this.systemSettingsBtn.addEventListener('click', () => {
      this.openSystemSettings();
    });

    // Click on status indicators for details
    this.ollamaStatus.addEventListener('click', () => {
      this.showOllamaDetails();
    });

    this.serverStatus.addEventListener('click', () => {
      this.showServerDetails();
    });

    // Hover effects for interactive elements
    this.monitorElement.addEventListener('mouseover', (e) => {
      if (e.target.closest('.monitor-item')) {
        e.target.closest('.monitor-item').classList.add('hover-glow');
      }
    });

    this.monitorElement.addEventListener('mouseout', (e) => {
      if (e.target.closest('.monitor-item')) {
        e.target.closest('.monitor-item').classList.remove('hover-glow');
      }
    });
  }

  initializeDisplay() {
    // Set initial display values
    this.updateCPU(0);
    this.updateMemory(0);
    this.updateOllamaStatus({ status: 'checking' });
    this.updateServerStatus({ status: 'online' });
  }

  startMonitoring() {
    // Initial update
    this.updateSystemInfo();
    
    // Set up regular updates
    this.updateInterval = setInterval(() => {
      this.updateSystemInfo();
    }, 2000); // Update every 2 seconds

    // Listen for system updates from main process
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onSystemUpdate((data) => {
        this.handleSystemUpdate(data);
      });
    }
  }

  stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async updateSystemInfo() {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    
    try {
      // Get system stats from main process
      let systemStats = null;
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        systemStats = await window.electronAPI.getSystemStats();
      } else {
        // Fallback for browser environment
        systemStats = await this.getBrowserSystemStats();
      }

      // Check Ollama status
      const ollamaStatus = await api.checkStatus('ollama');

      // Update displays
      if (systemStats) {
        this.updateCPU(systemStats.cpu?.usage || 0);
        this.updateMemory(systemStats.memory?.used || 0);
      }

      this.updateOllamaStatus(ollamaStatus);
      this.updateServerStatus({ status: 'online' }); // App is running, so server is online

      this.lastUpdate = Date.now();

    } catch (error) {
      console.error('System monitor update error:', error);
      this.showError('Failed to update system info');
    } finally {
      this.isUpdating = false;
    }
  }

  handleSystemUpdate(data) {
    // Handle updates from main process
    if (data.system) {
      this.updateCPU(data.system.cpu?.usage || 0);
      this.updateMemory(data.system.memory?.used || 0);
    }

    if (data.ollama) {
      this.updateOllamaStatus(data.ollama);
    }
  }

  updateCPU(usage) {
    const clampedUsage = Math.max(0, Math.min(100, usage));
    
    this.cpuBar.style.width = `${clampedUsage}%`;
    this.cpuValue.textContent = `${Math.round(clampedUsage)}%`;
    
    // Update color based on usage
    if (clampedUsage > 80) {
      this.cpuBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    } else if (clampedUsage > 60) {
      this.cpuBar.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
    } else {
      this.cpuBar.style.background = 'linear-gradient(90deg, var(--accent-primary), var(--accent-tertiary))';
    }

    // Add pulse animation for high usage
    if (clampedUsage > 80) {
      this.cpuBar.classList.add('progress-pulse');
    } else {
      this.cpuBar.classList.remove('progress-pulse');
    }
  }

  updateMemory(usage) {
    const clampedUsage = Math.max(0, Math.min(100, usage));
    
    this.memBar.style.width = `${clampedUsage}%`;
    this.memValue.textContent = `${Math.round(clampedUsage)}%`;
    
    // Update color based on usage
    if (clampedUsage > 85) {
      this.memBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    } else if (clampedUsage > 70) {
      this.memBar.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
    } else {
      this.memBar.style.background = 'linear-gradient(90deg, var(--accent-primary), var(--accent-tertiary))';
    }

    // Add pulse animation for high usage
    if (clampedUsage > 85) {
      this.memBar.classList.add('progress-pulse');
    } else {
      this.memBar.classList.remove('progress-pulse');
    }
  }

  updateOllamaStatus(statusData) {
    const statusText = this.ollamaStatus.querySelector('.status-text');
    const statusDot = this.ollamaStatus.querySelector('.status-dot');
    
    // Remove all status classes
    this.ollamaStatus.classList.remove('online', 'offline', 'warning');
    
    switch (statusData.status) {
      case 'online':
        this.ollamaStatus.classList.add('online');
        statusText.textContent = `Online (${statusData.count || 0} models)`;
        statusDot.style.background = 'var(--status-online)';
        break;
        
      case 'offline':
        this.ollamaStatus.classList.add('offline');
        statusText.textContent = 'Offline';
        statusDot.style.background = 'var(--status-offline)';
        break;
        
      case 'checking':
        this.ollamaStatus.classList.add('warning');
        statusText.textContent = 'Checking...';
        statusDot.style.background = 'var(--status-warning)';
        break;
        
      default:
        this.ollamaStatus.classList.add('offline');
        statusText.textContent = 'Unknown';
        statusDot.style.background = 'var(--status-offline)';
    }

    // Add tooltip with more info
    this.ollamaStatus.title = this.getOllamaTooltip(statusData);
  }

  updateServerStatus(statusData) {
    const statusText = this.serverStatus.querySelector('.status-text');
    const statusDot = this.serverStatus.querySelector('.status-dot');
    
    // Remove all status classes
    this.serverStatus.classList.remove('online', 'offline', 'warning');
    
    switch (statusData.status) {
      case 'online':
        this.serverStatus.classList.add('online');
        statusText.textContent = 'Online';
        statusDot.style.background = 'var(--status-online)';
        break;
        
      case 'offline':
        this.serverStatus.classList.add('offline');
        statusText.textContent = 'Offline';
        statusDot.style.background = 'var(--status-offline)';
        break;
        
      default:
        this.serverStatus.classList.add('online');
        statusText.textContent = 'Active';
        statusDot.style.background = 'var(--status-online)';
    }
  }

  getOllamaTooltip(statusData) {
    if (statusData.status === 'online' && statusData.models) {
      const modelList = statusData.models.slice(0, 5).map(m => m.name).join(', ');
      const moreText = statusData.models.length > 5 ? ` and ${statusData.models.length - 5} more` : '';
      return `Ollama is running with ${statusData.models.length} models: ${modelList}${moreText}`;
    } else if (statusData.status === 'offline') {
      return 'Ollama is not running. Start Ollama to use local AI models.';
    } else if (statusData.error) {
      return `Error connecting to Ollama: ${statusData.error}`;
    }
    return 'Checking Ollama status...';
  }

  async getBrowserSystemStats() {
    // Fallback for browser environment
    try {
      // Get memory info if available
      let memoryInfo = null;
      if (performance.memory) {
        memoryInfo = {
          used: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100,
          total: performance.memory.jsHeapSizeLimit
        };
      }

      // Simulate CPU info (not available in browser)
      const cpuInfo = {
        usage: Math.random() * 20 + 5 // Simulated low CPU usage
      };

      return {
        cpu: cpuInfo,
        memory: memoryInfo || { used: 0, total: 'Unknown' },
        gpu: null,
        os: {
          platform: navigator.platform,
          arch: 'Unknown'
        }
      };
    } catch (error) {
      console.error('Browser system stats error:', error);
      return null;
    }
  }

  showOllamaDetails() {
    const statusData = this.getCurrentOllamaStatus();
    
    // Create details modal or notification
    this.showDetailsModal('Ollama Details', this.formatOllamaDetails(statusData));
  }

  showServerDetails() {
    const details = {
      status: 'Online',
      uptime: this.getUptime(),
      version: '1.0.0',
      platform: navigator.platform
    };
    
    this.showDetailsModal('Server Details', this.formatServerDetails(details));
  }

  getCurrentOllamaStatus() {
    const statusText = this.ollamaStatus.querySelector('.status-text').textContent;
    const statusDot = this.ollamaStatus.querySelector('.status-dot');
    const backgroundColor = window.getComputedStyle(statusDot).backgroundColor;
    
    let status = 'unknown';
    if (backgroundColor.includes('16, 185, 129')) status = 'online';
    else if (backgroundColor.includes('239, 68, 68')) status = 'offline';
    else if (backgroundColor.includes('245, 158, 11')) status = 'checking';
    
    return {
      status,
      text: statusText,
      lastUpdate: this.lastUpdate
    };
  }

  formatOllamaDetails(statusData) {
    let html = `
      <div class="status-details">
        <p><strong>Status:</strong> ${statusData.text}</p>
        <p><strong>Last Update:</strong> ${statusData.lastUpdate ? new Date(statusData.lastUpdate).toLocaleTimeString() : 'Never'}</p>
    `;

    if (statusData.status === 'offline') {
      html += `
        <div class="status-help">
          <h4>Getting Started with Ollama:</h4>
          <ol>
            <li>Download Ollama from <a href="https://ollama.ai" target="_blank">ollama.ai</a></li>
            <li>Install and start Ollama on your system</li>
            <li>Pull a model: <code>ollama pull llama2</code></li>
            <li>Restart LLMAXX to detect Ollama</li>
          </ol>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  formatServerDetails(details) {
    return `
      <div class="status-details">
        <p><strong>Status:</strong> ${details.status}</p>
        <p><strong>Version:</strong> ${details.version}</p>
        <p><strong>Platform:</strong> ${details.platform}</p>
        <p><strong>Uptime:</strong> ${details.uptime}</p>
        <p><strong>Last Update:</strong> ${this.lastUpdate ? new Date(this.lastUpdate).toLocaleTimeString() : 'Never'}</p>
      </div>
    `;
  }

  getUptime() {
    if (this.lastUpdate) {
      const uptime = Date.now() - (this.lastUpdate - 10000); // Approximate start time
      const minutes = Math.floor(uptime / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
      if (hours > 0) return `${hours}h ${minutes % 60}m`;
      return `${minutes}m`;
    }
    return 'Unknown';
  }

  showDetailsModal(title, content) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'details-modal-overlay';
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

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'details-modal panel';
    modal.style.cssText = `
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      padding: 24px;
    `;

    modal.innerHTML = `
      <div class="modal-header flex-between" style="margin-bottom: 16px;">
        <h3 class="heading">${title}</h3>
        <button class="icon-button" id="closeDetails">
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

    // Add close handlers
    const closeBtn = modal.querySelector('#closeDetails');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    // Add entrance animation
    overlay.classList.add('entrance-fade-in');
    modal.classList.add('entrance-scale-in');
  }

  openSystemSettings() {
    // Emit event to open system settings
    if (typeof window !== 'undefined' && window.appEvents) {
      window.appEvents.emit('open-settings', {
        category: 'system',
        title: 'System & Server Settings'
      });
    }
  }

  showError(message) {
    // Update status indicators to show error
    this.updateOllamaStatus({ 
      status: 'offline', 
      error: message 
    });
  }

  forceUpdate() {
    // Force immediate update
    this.updateSystemInfo();
  }

  destroy() {
    this.stopMonitoring();
    
    // Remove event listeners
    if (this.systemSettingsBtn) {
      this.systemSettingsBtn.removeEventListener('click', this.openSystemSettings);
    }
  }
}

// Export for use in main app
export { SystemMonitorComponent };
export default SystemMonitorComponent;