import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const excelFilePath = path.resolve('../../base_fornecedores_faturas.xlsx');
const jsonOutputPath = path.resolve('../dashboard/src/assets/base_fornecedores_faturas.json');

function convertExcelDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

try {
  const workbook = XLSX.readFile(excelFilePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { raw: false }) as any[];
  
  const mappedData = data.map((item, index) => {
    const fornecedor = item['Nome Fornecedor'] || 'Fornecedor Sem Nome';
    const codigoParceiro = item['Cód.Parceiro'] || '00000';
    const vencimentoOriginal = item['Vencimento'] || '';
    const vencimentoBR = convertExcelDate(vencimentoOriginal);
    
    // Calcula um valor simulado estável baseado no código do parceiro para ter dados realistas e visual premium
    const codNum = parseInt(codigoParceiro, 10) || (index + 1);
    const valorSimulado = parseFloat(((codNum * 0.75) + 1500).toFixed(2));
    
    return {
      id: `m${index + 1}`,
      fornecedor: fornecedor,
      documento: `PARC-${codigoParceiro}`,
      valor: valorSimulado,
      vencimento: vencimentoBR,
      cnpj: item['CNPJ'] || '',
      centroResultado: item['CentroResultado'] || '',
      natureza: item['Natureza'] || ''
    };
  });

  fs.writeFileSync(jsonOutputPath, JSON.stringify(mappedData, null, 2), 'utf8');
  console.log(`Sucesso: Gravados ${mappedData.length} registros em ${jsonOutputPath}`);
} catch (error) {
  console.error("Erro ao gerar JSON a partir da planilha:", error);
}
