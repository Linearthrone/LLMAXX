const { app, BrowserWindow, Menu, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');
const si = require('systeminformation');

let mainWindow;
let overlayWindow;
let isOverlayMode = false;

// Disable menu bar for clean overlay appearance
Menu.setApplicationMenu(null);

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('src/index.html');
  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  // Dev tools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Set up window to be click-through when not on UI elements
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
}

// System monitoring functions
async function getSystemStats() {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const gpu = await si.graphics();
    const osInfo = await si.osInfo();
    
    return {
      cpu: {
        usage: Math.round(cpu.currentLoad),
        cores: cpu.cpus.length
      },
      memory: {
        used: Math.round((mem.used / mem.total) * 100),
        total: Math.round(mem.total / 1024 / 1024 / 1024) + 'GB'
      },
      gpu: gpu.controllers.length > 0 ? {
        name: gpu.controllers[0].model,
        memory: gpu.controllers[0].memoryTotal
      } : null,
      os: {
        platform: osInfo.platform,
        arch: osInfo.arch
      }
    };
  } catch (error) {
    console.error('Error getting system stats:', error);
    return null;
  }
}

// Check Ollama status
async function checkOllamaStatus() {
  try {
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:11434/api/tags', { 
      timeout: 3000 
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        status: 'online',
        models: data.models || [],
        count: data.models ? data.models.length : 0
      };
    }
  } catch (error) {
    // Check if Ollama service is running but not responding
    return { status: 'offline', error: error.message };
  }
  
  return { status: 'offline' };
}

// IPC handlers
ipcMain.handle('get-system-stats', async () => {
  return await getSystemStats();
});

ipcMain.handle('check-ollama', async () => {
  return await checkOllamaStatus();
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.handle('close-app', () => {
  app.quit();
});

ipcMain.handle('toggle-always-on-top', () => {
  if (mainWindow) {
    const current = mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(!current);
    return !current;
  }
});

// Global shortcuts
app.whenReady().then(() => {
  createMainWindow();

  // Toggle overlay visibility with Ctrl+Shift+L
  globalShortcut.register('CommandOrControl+Shift+L', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Toggle click-through mode with Ctrl+Shift+M
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    if (mainWindow) {
      isOverlayMode = !isOverlayMode;
      mainWindow.setIgnoreMouseEvents(isOverlayMode, { forward: true });
    }
  });

  // Periodic system monitoring updates
  setInterval(async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const stats = await getSystemStats();
      const ollamaStatus = await checkOllamaStatus();
      
      mainWindow.webContents.send('system-update', {
        system: stats,
        ollama: ollamaStatus,
        timestamp: Date.now()
      });
    }
  }, 2000); // Update every 2 seconds
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}