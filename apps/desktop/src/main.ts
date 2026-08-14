import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Flags de estabilidade do Chromium para evitar erros de renderização/network no Windows
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

// Carrega variáveis de ambiente procurando em locais possíveis do .env
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.resourcesPath || '', '.env'),
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

const PORT = Number(process.env.PORT) || 3001;
let mainWindow: BrowserWindow | null = null;

async function startBackendServer() {
  try {
    // Resolve o caminho dinamicamente em tempo de execução (dev ou empacotado)
    const possibleAppPaths = [
      path.resolve(__dirname, '../automacao/dist/server/app.js'),
      path.resolve(__dirname, '../../automacao/dist/server/app.js'),
      path.resolve(__dirname, 'automacao/dist/server/app.js'),
      path.resolve(process.resourcesPath || '', 'automacao/dist/server/app.js'),
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
      path.resolve(__dirname, '../dashboard/dist'),
      path.resolve(__dirname, '../../dashboard/dist'),
      path.resolve(__dirname, 'dashboard/dist'),
      path.resolve(process.resourcesPath || '', 'dashboard/dist'),
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
      console.log(`[Desktop Backend] Servidor Express iniciado na porta ${PORT}`);
    });
  } catch (error) {
    console.error('[Desktop Backend] Erro ao iniciar servidor backend embutido:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'Stoque Fiscal Intelligence',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Redireciona logs de console do Renderer para o terminal
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Desktop UI Log] ${message} (${sourceId}:${line})`);
  });

  const devUrl = 'http://localhost:5173';
  const prodUrl = `http://localhost:${PORT}`;

  // Tenta conectar ao servidor Vite de desenvolvimento (HMR / Live Reload instantâneo)
  fetch(devUrl)
    .then(() => {
      console.log('[Desktop] Conectado ao Vite Dev Server (HMR Ativo na porta 5173). Alterações de código React serão refletidas instantaneamente!');
      mainWindow?.loadURL(devUrl);
    })
    .catch(() => {
      console.log('[Desktop] Vite Dev Server não encontrado em 5173. Carregando arquivos estáticos compilados do backend...');
      mainWindow?.loadURL(prodUrl);
    });

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
