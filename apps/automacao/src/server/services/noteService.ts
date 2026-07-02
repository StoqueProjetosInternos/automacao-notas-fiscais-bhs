import fs from 'fs';
import path from 'path';
import { FILES_DIR } from '../config/paths.js';
import { generateRateioExcel } from '../../features/excel/generateRateioExcel.js';
import { enrichData } from '../../features/pdf/dataEnrichment.js';

export class NoteService {
  public static listAllNotes() {
    if (!fs.existsSync(FILES_DIR)) {
      fs.mkdirSync(FILES_DIR, { recursive: true });
    }

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
    return notes;
  }

  public static async updateNote(id: string, newData: any) {
    const folderPath = path.join(FILES_DIR, id);
    const filePath = path.join(folderPath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error('Nota não encontrada');
    }
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf-8');

    // Regera a planilha de rateio com base no JSON atualizado (contendo edições manuais)
    try {
      await generateRateioExcel(newData, folderPath);
      console.log(`[API] Planilha de rateio Excel regerada com sucesso para: ${id}`);
    } catch (excelError) {
      console.error(`[API] Falha ao regerar planilha de rateio para nota ${id}:`, excelError);
    }

    return { success: true };
  }

  public static async reprocessNote(id: string) {
    const folderPath = path.join(FILES_DIR, id);
    const filePath = path.join(folderPath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error('Nota não encontrada');
    }
    
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const noteData = JSON.parse(rawContent);
    
    // Reprocessa usando o enriquecedor
    const enrichedData = await enrichData(noteData);
    
    fs.writeFileSync(filePath, JSON.stringify(enrichedData, null, 2), 'utf-8');

    // Regera a planilha de rateio Excel
    await generateRateioExcel(enrichedData, folderPath);
    console.log(`[API] Nota ${id} reprocessada com sucesso.`);
    
    return { success: true, data: enrichedData };
  }

  public static async reprocessAllNotes() {
    if (!fs.existsSync(FILES_DIR)) {
      return { success: true, processedCount: 0 };
    }
    const folders = fs.readdirSync(FILES_DIR);
    let processedCount = 0;

    for (const folder of folders) {
      const folderPath = path.join(FILES_DIR, folder);
      if (fs.statSync(folderPath).isDirectory()) {
        const jsonPath = path.join(folderPath, `${folder}.json`);
        if (fs.existsSync(jsonPath)) {
          try {
            const rawContent = fs.readFileSync(jsonPath, 'utf-8');
            const noteData = JSON.parse(rawContent);
            const enrichedData = await enrichData(noteData);
            fs.writeFileSync(jsonPath, JSON.stringify(enrichedData, null, 2), 'utf-8');
            await generateRateioExcel(enrichedData, folderPath);
            processedCount++;
          } catch (err) {
            console.error(`[API] Falha ao reprocessar nota ${folder} durante lote:`, err);
          }
        }
      }
    }
    console.log(`[API] Processamento em lote concluído. ${processedCount} notas reprocessadas.`);
    return { success: true, processedCount };
  }

  public static deleteNote(id: string) {
    const folderPath = path.join(FILES_DIR, id);
    if (!fs.existsSync(folderPath)) {
      throw new Error('Nota não encontrada');
    }
    fs.rmSync(folderPath, { recursive: true, force: true });
    console.log(`[API] Pasta da nota ${id} removida com sucesso.`);
    return { success: true };
  }

  public static getUsageLog() {
    const usageLogPath = path.join(path.dirname(FILES_DIR), 'usage_log.csv');
    if (!fs.existsSync(usageLogPath)) {
      console.warn(`[NoteService] Arquivo usage_log.csv nao encontrado em: ${usageLogPath}`);
      return [];
    }

    try {
      const content = fs.readFileSync(usageLogPath, 'utf-8');
      const lines = content.trim().split('\n');
      if (lines.length <= 1) return [];

      const headers = lines[0].split(',');
      const logs = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = this.splitCsvLine(line);
        if (cols.length >= headers.length) {
          const fileName = cols[1];
          const id = fileName.replace(/\.[^/.]+$/, ""); // remove a extensão
          const folderPath = path.join(FILES_DIR, id);
          
          let fileStatus = 'Pendente';
          if (!fs.existsSync(folderPath)) {
            fileStatus = 'Excluído';
          } else {
            const jsonPath = path.join(folderPath, `${id}.json`);
            if (fs.existsSync(jsonPath)) {
              try {
                const noteJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                if (noteJson.status === 'validado') {
                  fileStatus = 'Validado';
                } else if (noteJson.status === 'pendente') {
                  fileStatus = 'Pendente';
                } else {
                  fileStatus = 'Processado';
                }
              } catch (e) {
                fileStatus = 'Processado';
              }
            } else {
              fileStatus = 'Pendente';
            }
          }

          logs.push({
            id: i,
            dataHora: this.parseCsvDate(cols[0]),
            arquivo: cols[1],
            modeloIa: cols[2],
            fornecedor: cols[3],
            tokensEntrada: parseInt(cols[4]) || 0,
            tokensSaida: parseInt(cols[5]) || 0,
            custoUsd: parseFloat(cols[6]) || 0,
            tempoProcessamentoMs: cols[7] || 'N/A',
            zeevId: cols[8] || '',
            cnpjFornecedor: cols[9] || '',
            numeroDocumento: cols[10] || '',
            valorFatura: cols[11] ? parseFloat(cols[11]) : undefined,
            status: cols[12] || 'Sucesso',
            statusArquivo: fileStatus
          });
        }
      }
      return logs;
    } catch (err) {
      console.error('[NoteService] Erro ao ler usage_log.csv:', err);
      return [];
    }
  }

  private static parseCsvDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();
    if (dateStr.includes('T')) {
      return dateStr;
    }
    // Trata o formato brasileiro DD/MM/YYYY HH:mm:ss
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (match) {
      const [, day, month, year, hour, minute, second] = match;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      );
      return date.toISOString();
    }
    return dateStr;
  }

  private static splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
}
