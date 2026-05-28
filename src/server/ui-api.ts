import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Caminho absoluto para a pasta de arquivos (subindo dois níveis a partir de src/server)
const FILES_DIR = path.resolve(__dirname, '..', 'filesExtracted');

console.log(`[Config] Servindo arquivos de: ${FILES_DIR}`);

// Garante que o diretório de arquivos existe
if (!fs.existsSync(FILES_DIR)) {
  console.log(`[Warn] Diretório ${FILES_DIR} não encontrado. Criando...`);
  fs.mkdirSync(FILES_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Serve os arquivos (PDFs, JSONs, TXTs) estaticamente
app.use('/files', express.static(FILES_DIR));

// Lista todas as notas processadas (agora buscando em subpastas)
app.get('/api/notes', (req, res) => {
  try {
    const folders = fs.readdirSync(FILES_DIR);
    const notes = [];

    for (const folder of folders) {
      const folderPath = path.join(FILES_DIR, folder);
      if (fs.statSync(folderPath).isDirectory()) {
        const jsonFile = `${folder}.json`;
        const jsonPath = path.join(folderPath, jsonFile);

        if (fs.existsSync(jsonPath)) {
          const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          notes.push({
            id: folder,
            fileName: jsonFile,
            data: content,
            files: {
              json: `${folder}/${jsonFile}`,
              pdf: fs.existsSync(path.join(folderPath, `${folder}.pdf`)) ? `${folder}/${folder}.pdf` : null,
              txt: fs.existsSync(path.join(folderPath, `${folder}.txt`)) ? `${folder}/${folder}.txt` : null,
              excel: fs.existsSync(path.join(folderPath, `${folder}.xlsx`)) ? `${folder}/${folder}.xlsx` : null,
            }
          });
        }
      }
    }

    console.log(`[API] Retornando ${notes.length} notas processadas (em subpastas).`);
    res.json(notes);
  } catch (error) {
    console.error('[Error] Erro ao ler arquivos:', error);
    res.status(500).json({ error: 'Erro ao ler arquivos' });
  }
});

// Salva alterações em uma nota específica
app.post('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const newData = req.body;
  const filePath = path.join(FILES_DIR, id, `${id}.json`);

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf-8');
    res.json({ success: true, message: 'Nota atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error);
    res.status(500).json({ error: 'Erro ao salvar arquivo' });
  }
});

app.listen(PORT, () => {
  console.log(`
   API do Dashboard up
   Endpoint: http://localhost:${PORT}/api/notes
   Arquivos: http://localhost:${PORT}/files
  `);
});
