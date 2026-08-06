import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

import "./config/logger.js";
import app from './app.js';
import { FILES_DIR } from './config/paths.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
   =========================================
          SFI API Started on port ${PORT}
   -----------------------------------------
   Endpoint: http://localhost:${PORT}/api/notes
   Arquivos: http://localhost:${PORT}/files
   Caminho:  ${FILES_DIR}
   =========================================
  `);
});
