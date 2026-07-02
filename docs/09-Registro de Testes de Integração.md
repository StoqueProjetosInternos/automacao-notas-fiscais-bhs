# Registro de Testes de Integração

Os testes de integração verificam a correta comunicação e fluxo de dados entre os diferentes módulos do backend Express, o SDK da Google Gemini API e os geradores de planilhas ExcelJS.

## Cenários de Teste de Integração Mapeados

### CTI-001: Fluxo de Extração com IA (Google Gemini API)
- **Objetivo**: Garantir que o buffer de um PDF de fatura enviado para o motor Gemini API retorne um JSON estruturado em conformidade estrita com o contrato de dados `BoletoData`.
- **Módulos Integrados**: `apps/automacao/src/features/pdf/aiExtract.ts` e SDK `@google/generative-ai`.
- **Passos de Execução**:
  1. Carregar buffer do arquivo PDF local de teste.
  2. Submeter o buffer à API do Gemini utilizando o prompt do sistema.
  3. Validar se o JSON retornado possui chaves críticas como `financial.chargedValue` e `barcode`.
- **Resultado Obtido**: Sucesso. A extração via IA recuperou corretamente os metadados fiscais sem a necessidade de OCR estático.

### CTI-002: Enriquecimento Contábil de Fornecedores e Geração de Excel
- **Objetivo**: Validar se o cruzamento do JSON gerado com a base local de referência contábil gera corretamente a planilha consolidada de rateios.
- **Módutos Integrados**: `apps/automacao/src/features/pdf/dataEnrichment.ts` e `apps/automacao/src/features/excel/generateRateioExcel.ts`.
- **Passos de Execução**:
  1. Cruzar o JSON bruto extraído com o arquivo CSV `data/base_referencia.csv`.
  2. Mapear o CR e Natureza e exportar a planilha final `Rateio.xlsx`.
  3. Validar a existência de duas abas na planilha: `Rateio` (consolidado) e `Rateio_Detalhado` (individualizado por número de série).
- **Resultado Obtido**: Sucesso. A planilha final é gerada contendo os cabeçalhos esperados pelo Zeev/ERP do cliente.
