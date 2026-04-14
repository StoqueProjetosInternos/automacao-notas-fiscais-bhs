import { parseBoletoData, BoletoData } from '../../features/pdf/parseBoletoData';

describe('parseBoletoData', () => {
  it('should parse a simple boleto text correctly', () => {
    const rawText = `
      ASSOCIACAO DO BEM ESTAR SOCIAL DO BAIRRO DA MANGA 01/01/2023 1.234,56
      Nome do pagador MARLY VIEIRA JARDIM Hidr 188
      Nosso número 1234/567890
      Número do Documento 98765
      Data do documento 01/01/2023
      Data de Emissão 01/01/2023
      12345.67890 12345.678901 12345.678901 1 12345678901234
    `;

    const parsedData: BoletoData = parseBoletoData(rawText);

    expect(parsedData.beneficiary?.name).toBe('ASSOCIACAO DO BEM ESTAR SOCIAL DO BAIRRO DA MANGA');
    expect(parsedData.financial?.dueDate).toBe('01/01/2023');
    expect(parsedData.financial?.originalValue).toBe(1234.56);
    expect(parsedData.financial?.chargedValue).toBe(1234.56);
    expect(parsedData.payer?.name).toBe('MARLY VIEIRA JARDIM');
    expect(parsedData.documentIdentifiers?.ourNumber).toBe('1234/567890');
    expect(parsedData.documentIdentifiers?.documentNumber).toBe('98765');
    expect(parsedData.documentIdentifiers?.documentDate).toBe('01/01/2023');
    expect(parsedData.documentIdentifiers?.issueDate).toBe('01/01/2023');
    expect(parsedData.barcode).toBe('12345.6789012345.67890112345.678901112345678901234');
    expect(parsedData.documentType).toBe('Outros'); // Based on current regex, this text doesn't match specific types
    expect(parsedData.rawText).toBe(rawText);
  });

  it('should handle missing data gracefully', () => {
    const rawText = `
      Some random text without specific boleto data.
    `;

    const parsedData: BoletoData = parseBoletoData(rawText);

    expect(parsedData.beneficiary?.name).toBeUndefined();
    expect(parsedData.financial?.dueDate).toBeUndefined();
    expect(parsedData.financial?.originalValue).toBeUndefined();
    expect(parsedData.financial?.chargedValue).toBeUndefined();
    expect(parsedData.payer?.name).toBeUndefined();
    expect(parsedData.documentIdentifiers?.ourNumber).toBeUndefined();
    expect(parsedData.documentIdentifiers?.documentNumber).toBeUndefined();
    expect(parsedData.documentIdentifiers?.documentDate).toBeUndefined();
    expect(parsedData.documentIdentifiers?.issueDate).toBeUndefined();
    expect(parsedData.barcode).toBeUndefined();
    expect(parsedData.documentType).toBe('Outros');
    expect(parsedData.rawText).toBe(rawText);
  });

  it('should correctly identify document type as Água', () => {
    const rawText = `
      Conta de Água - Hidr 123
      Leitura anterior: 100
      Leitura atual: 200
      Consumo: 100m3
    `;
    const parsedData: BoletoData = parseBoletoData(rawText);
    expect(parsedData.documentType).toBe('Água');
  });

  it('should correctly identify document type as Internet/Telefonia', () => {
    const rawText = `
      Fatura de internet e telefonia móvel
      Serviços de dados móveis
    `;
    const parsedData: BoletoData = parseBoletoData(rawText);
    expect(parsedData.documentType).toBe('Internet/Telefonia');
  });

  it('should correctly identify document type as Energia Elétrica', () => {
    const rawText = `
      Conta de Energia Elétrica - Consumo KWH
    `;
    const parsedData: BoletoData = parseBoletoData(rawText);
    expect(parsedData.documentType).toBe('Energia Elétrica');
  });

  it('should correctly identify document type as Gás', () => {
    const rawText = `
      Fatura de Gás Natural - Consumo em m3
    `;
    const parsedData: BoletoData = parseBoletoData(rawText);
    expect(parsedData.documentType).toBe('Gás');
  });

  // Add more specific tests for different regex patterns and edge cases
});
