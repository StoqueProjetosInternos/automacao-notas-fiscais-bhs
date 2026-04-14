import { extractDataFromPDF } from '../../features/pdf/extractDataFromPDF';

describe('extractDataFromPDF', () => {
  it('should extract text from a PDF file', async () => {
    // Mock ou use um arquivo de teste
    const mockPdfPath = './test_3.pdf'; // Ajuste para um PDF real ou mock

    const result = await extractDataFromPDF(mockPdfPath);

    expect(result).toHaveProperty('fileName');
    expect(result).toHaveProperty('outputPath');
    expect(result).toHaveProperty('textContent');
    expect(typeof result.textContent).toBe('string');
  });

  it('should throw error for invalid file', async () => {
    await expect(extractDataFromPDF('./invalid.pdf')).rejects.toThrow();
  });
});