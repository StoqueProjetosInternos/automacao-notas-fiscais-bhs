import fs from 'fs';
import path from 'path';
import { FILES_DIR } from '../config/paths.js';
import { generateRateioExcel } from '../../features/excel/generateRateioExcel.js';
import { enrichData } from '../../features/pdf/dataEnrichment.js';
import { GraphEmailPdfProcessor } from '../../features/email/searchDataFromEmail.js';

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
          const stats = fs.statSync(folderPath);
          const createdAt = stats.birthtime && stats.birthtime.getTime() > 0 ? stats.birthtime.toISOString() : stats.mtime.toISOString();
          notes.push({
            id: folder,
            fileName: jsonFile,
            createdAt: createdAt,
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

    try {
      const rawContent = fs.readFileSync(filePath, 'utf-8');
      const oldData = JSON.parse(rawContent);

      // Propaga alterações contábeis do cabeçalho para os itens do rateio
      if (newData.accountingFields && oldData.accountingFields) {
        const oldCr = oldData.accountingFields.cr;
        const newCr = newData.accountingFields.cr;
        const oldNatureza = oldData.accountingFields.naturezaCode;
        const newNatureza = newData.accountingFields.naturezaCode;
        const oldContract = oldData.accountingFields.contract;
        const newContract = newData.accountingFields.contract;

        if (oldCr !== newCr) {
          newData.accountingFields.crDescription = newCr && newCr !== 'N/A' ? `Centro de Custo ${newCr}` : 'N/A';
        }

        if (newData.apportionment && Array.isArray(newData.apportionment)) {
          newData.apportionment = newData.apportionment.map((item: any) => {
            const updatedItem = { ...item };
            
            if (oldCr && updatedItem.cr === oldCr) {
              updatedItem.cr = newCr;
              updatedItem.crDescription = newCr && newCr !== 'N/A' ? `Centro de Custo ${newCr}` : 'N/A';
            }
            if (oldNatureza && updatedItem.naturezaCode === oldNatureza) {
              updatedItem.naturezaCode = newNatureza;
            }
            if (oldContract && updatedItem.contract === oldContract) {
              updatedItem.contract = newContract;
            }

            return updatedItem;
          });
        }
      }
    } catch (err) {
      console.warn(`[NoteService] Erro ao propagar alteração contábil para os itens:`, err);
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
      const activeNotes = this.listAllNotes();
      const content = fs.readFileSync(usageLogPath, 'utf-8');
      const lines = content.trim().split('\n');
      if (lines.length <= 1) return [];

      const headers = lines[0].split(',');
      const logs = [];
      const cleanStr = (s: string) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() : '';
      const cleanDoc = (s: string) => s ? s.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() : '';

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = this.splitCsvLine(line);
        if (cols.length >= headers.length) {
          const fileName = cols[1];
          const id = fileName.replace(/\.[^/.]+$/, ""); // remove a extensão
          
          const docNumCsv = cols[10];
          const supplierCsv = cols[3];
          const cnpjCsv = cols[9];

          const docNumCleanCsv = cleanDoc(docNumCsv);
          const supplierCleanCsv = cleanStr(supplierCsv);
          const cnpjCleanCsv = cnpjCsv ? cnpjCsv.replace(/\D/g, '') : '';

          const matchingNote = activeNotes.find(note => {
            if (note.id === id) return true;

            const noteDocNum = note.data.documentIdentifiers?.documentNumber;
            const noteDocNumClean = cleanDoc(noteDocNum);

            if (docNumCleanCsv && noteDocNumClean && docNumCleanCsv === noteDocNumClean) {
              const noteSupplier = note.data.supplier?.name;
              const noteCnpj = note.data.supplier?.cnpjCpf;

              const noteSupplierClean = cleanStr(noteSupplier);
              const noteCnpjClean = noteCnpj ? noteCnpj.replace(/\D/g, '') : '';

              if (supplierCleanCsv && noteSupplierClean && supplierCleanCsv === noteSupplierClean) {
                return true;
              }
              if (cnpjCleanCsv && noteCnpjClean && cnpjCleanCsv === noteCnpjClean) {
                return true;
              }
              if (note.id.toLowerCase().includes(docNumCleanCsv)) {
                return true;
              }
            }

            if (!docNumCleanCsv && supplierCleanCsv) {
              const noteSupplier = note.data.supplier?.name;
              const noteSupplierClean = cleanStr(noteSupplier);
              if (supplierCleanCsv === noteSupplierClean) {
                const valCsv = cols[11] ? parseFloat(cols[11]) : undefined;
                const valNote = note.data.financial?.originalValue;
                if (valCsv !== undefined && valNote !== undefined && Math.abs(valCsv - valNote) < 0.01) {
                  return true;
                }
              }
            }

            return false;
          });

          let fileStatus = 'Pendente';
          if (!matchingNote) {
            fileStatus = 'Excluído';
          } else {
            const status = matchingNote.data.status;
            if (status === 'validado') {
              fileStatus = 'Validado';
            } else if (status === 'pendente') {
              fileStatus = 'Pendente';
            } else if (status === 'arquivado') {
              fileStatus = 'Arquivado';
            } else {
              fileStatus = 'Processado';
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

  public static async syncEmails() {
    const processor = new GraphEmailPdfProcessor({
      tenantId: process.env.TENANT_ID || "",
      clientId: process.env.CLIENT_ID || "",
      clientSecret: process.env.CLIENT_SECRET || "",
      userEmail: process.env.USER_EMAIL || "",
      tempDir: path.resolve(FILES_DIR, '..', '..', '.tmp'),
      outputDir: FILES_DIR,
      markAsReadAfterSuccess: true, // Marcar no e-mail real como lido
    });

    return await processor.processLatestUnreadEmails(5);
  }

  public static async sendDeadlineAlerts(items: any[]) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Nenhum item informado para envio de alertas');
    }

    const criticalItems = items.filter(item => item.diasRestantes <= 10);
    if (criticalItems.length === 0) {
      return { success: true, message: 'Nenhum fornecedor com prazo crítico (<= 10 dias) para envio de alertas.' };
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;
    const smtpTo = process.env.SMTP_TO;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpTo) {
      throw new Error('Configuração de SMTP incompleta nas variáveis de ambiente');
    }

    const nodemailer = await import('nodemailer');
    const transporter = (nodemailer.default || nodemailer).createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    let tableRows = '';
    criticalItems.forEach(item => {
      const color = item.diasRestantes <= 7 ? '#ef4444' : '#eab308';
      const severity = item.diasRestantes <= 7 ? 'Crítico' : 'Alerta';
      tableRows += `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; font-weight: bold; color: #111827;">${item.fornecedor}</td>
          <td style="padding: 12px; color: #374151;">R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 12px; color: #374151;">${item.vencimento}</td>
          <td style="padding: 12px; font-weight: bold; color: ${color};">${item.diasRestantes} dias (${severity})</td>
        </tr>
      `;
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Relatório Preventivo de Vencimentos</h2>
        <p style="color: #4b5563; font-size: 0.95rem;">As seguintes faturas estão com vencimento próximo (menor ou igual a 10 dias) e requerem atenção urgente:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left; font-size: 0.9rem;">
          <thead>
            <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px; font-weight: 600; color: #4b5563;">Fornecedor</th>
              <th style="padding: 12px; font-weight: 600; color: #4b5563;">Valor</th>
              <th style="padding: 12px; font-weight: 600; color: #4b5563;">Vencimento</th>
              <th style="padding: 12px; font-weight: 600; color: #4b5563;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <p style="margin-top: 30px; font-size: 0.8rem; color: #9ca3af; text-align: center;">Este é um alerta automático gerado pelo Stoque Fiscal Intelligence.</p>
      </div>
    `;

    await transporter.sendMail({
      from: smtpFrom,
      to: smtpTo,
      subject: `[Alerta Fiscal] Relatório Preventivo de Vencimentos - ${criticalItems.length} Faturas`,
      html: htmlBody
    });

    console.log(`[SMTP] Relatório preventivo de vencimento enviado com sucesso para: ${smtpTo}`);
    return { success: true, message: `Alertas de vencimento enviados com sucesso para ${smtpTo}.` };
  }
}
