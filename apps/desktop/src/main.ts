import { app, BrowserWindow, shell, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Desativa aceleracao por GPU preservando rasterizacao por software
app.disableHardwareAcceleration();

// Bloqueia multiplas instancias simultaneas
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Define variáveis de ambiente globais essenciais para o Desktop
const userDataPath = app.getPath('userData');
const userDataFilesDir = path.join(userDataPath, 'data', 'extracted');
const userDataTempDir = path.join(userDataPath, '.tmp');

if (!fs.existsSync(userDataFilesDir)) {
  fs.mkdirSync(userDataFilesDir, { recursive: true });
}
if (!fs.existsSync(userDataTempDir)) {
  fs.mkdirSync(userDataTempDir, { recursive: true });
}

// Carrega variáveis de ambiente procurando em locais possíveis do .env
const possibleEnvPaths = [
  path.resolve(userDataPath, '.env'),
  path.resolve(process.resourcesPath || '', '.env'),
  path.resolve(process.resourcesPath || '', 'app', '.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env'),
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`[Desktop] Environment .env carregado com sucesso de: ${envPath}`);
    envLoaded = true;
    break;
  }
}
if (!envLoaded) {
  console.warn('[Desktop] Nenhum arquivo .env foi encontrado nos caminhos buscados.');
}

// Se não houver FILES_DIR customizado no .env, garante o caminho gravável no userData
if (!process.env.FILES_DIR) {
  process.env.FILES_DIR = userDataFilesDir;
}

const PORT = Number(process.env.PORT) || 3001;
let mainWindow: BrowserWindow | null = null;

function startBackendServer(): Promise<void> {
  return new Promise(async (resolve) => {
    try {
      // Resolve o caminho dinamicamente em tempo de execução (dev ou empacotado)
      const possibleAppPaths = [
        path.resolve(process.resourcesPath || '', 'app/automacao/dist/server/app.js'),
        path.resolve(process.resourcesPath || '', 'automacao/dist/server/app.js'),
        path.resolve(__dirname, '../automacao/dist/server/app.js'),
        path.resolve(__dirname, 'automacao/dist/server/app.js'),
        path.resolve(__dirname, '../../automacao/dist/server/app.js'),
      ];
      let distAppPath = possibleAppPaths.find(p => fs.existsSync(p));
      if (!distAppPath) {
        distAppPath = path.resolve(__dirname, '../automacao/dist/server/app.js');
      }
      console.log(`[Desktop Backend] Carregando app do backend de: ${distAppPath}`);
      const appModule = await import(pathToFileURL(distAppPath).href);
      const expressApp: express.Express = appModule.default || appModule;

      // Servir arquivos estáticos do dashboard
      const possibleDashboardPaths = [
        path.resolve(process.resourcesPath || '', 'app/dashboard/dist'),
        path.resolve(process.resourcesPath || '', 'dashboard/dist'),
        path.resolve(__dirname, '../dashboard/dist'),
        path.resolve(__dirname, 'dashboard/dist'),
        path.resolve(__dirname, '../../dashboard/dist'),
      ];
      const dashboardDistPath = possibleDashboardPaths.find(p => fs.existsSync(p)) || path.resolve(__dirname, '../dashboard/dist');
      if (fs.existsSync(dashboardDistPath)) {
        console.log(`[Desktop Backend] Servindo frontend de: ${dashboardDistPath}`);
        expressApp.use(express.static(dashboardDistPath));

        // Fallback para Single Page Application (SPA React Router) compatível com Express v5
        expressApp.use((req, res, next) => {
          if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/files')) {
            return res.sendFile(path.join(dashboardDistPath, 'index.html'));
          }
          next();
        });
      } else {
        console.warn(`[Desktop Backend] Pasta de dist do dashboard não encontrada em: ${dashboardDistPath}`);
      }

      expressApp.listen(PORT, () => {
        console.log(`[Desktop Backend] Servidor Express iniciado com sucesso na porta ${PORT}`);
        resolve();
      });
    } catch (error: any) {
      console.error('[Desktop Backend] Erro ao iniciar servidor backend embutido:', error);
      dialog.showErrorBox('Erro na Inicialização do Backend', error.message || String(error));
      resolve();
    }
  });
}

function createWindow() {
  const possibleIconPaths = [
    path.resolve(__dirname, '../resources/icon.ico'),
    path.resolve(__dirname, '../resources/icon.png'),
    path.resolve(__dirname, 'resources/icon.ico'),
    path.resolve(__dirname, 'resources/icon.png'),
    path.resolve(process.resourcesPath || '', 'resources/icon.ico'),
    path.resolve(process.resourcesPath || '', 'resources/icon.png'),
    path.resolve(process.resourcesPath || '', 'icon.ico'),
    path.resolve(process.resourcesPath || '', 'icon.png'),
  ];
  const appIcon = possibleIconPaths.find(p => fs.existsSync(p));

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'Stoque Fiscal Intelligence',
    icon: appIcon,
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Redireciona logs de console do Renderer para o terminal
  mainWindow.webContents.on('console-message', (_event, _level, message, line, sourceId) => {
    console.log(`[Desktop UI Log] ${message} (${sourceId}:${line})`);
  });

  const devUrl = 'http://localhost:5173';
  const prodUrl = `http://localhost:${PORT}`;

  if (!app.isPackaged) {
    fetch(devUrl)
      .then(() => {
        console.log('[Desktop] Conectado ao Vite Dev Server (porta 5173).');
        mainWindow?.loadURL(devUrl);
      })
      .catch(() => {
        console.log('[Desktop] Vite Dev Server não encontrado. Carregando aplicação local integrada...');
        mainWindow?.loadURL(prodUrl);
      });
  } else {
    mainWindow.loadURL(prodUrl).catch((err) => {
      console.warn('[Desktop] Falha na primeira tentativa de conexão, retentando em 1s...', err);
      setTimeout(() => mainWindow?.loadURL(prodUrl), 1000);
    });
  }

  // Abrir links externos no navegador padrão do sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  await startBackendServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
