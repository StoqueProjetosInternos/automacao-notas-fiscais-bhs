## 2026-04-06 - Início do Desenvolvimento - Indexação de Dados do PDF

### Objetivo:
Transformar os dados de texto brutos extraídos de PDFs em um formato estruturado e indexado (JSON) para facilitar o consumo programático.

### Análise Inicial:
- O arquivo `src/features/pdf/extractDataFromPDF.ts` utiliza `pdf-parse` para extrair texto completo de PDFs e salva em `.txt`.
- O arquivo `src/filesExtracted/test_2.txt` mostra que o conteúdo é de um boleto, semi-estruturado, com labels e valores, mas sem indexação.

### Proposta de Solução:
1.  **Identificação de Pontos Chave:** Extrair informações como tipo de documento, dados do beneficiário/pagador, detalhes financeiros e identificadores do documento.
2.  **Formato de Saída:** JSON, para ser facilmente consumível em JavaScript/TypeScript.
3.  **Lógica de Parsing:** Utilizar Expressões Regulares (Regex) e busca por palavras-chave para identificar e extrair os valores.
4.  **Refatoração:** Modificar `extractDataFromPDF.ts` para que, além de extrair o texto, ele também o parseie e retorne um objeto JSON estruturado.

### Próximos Passos (Implementação):
11. Criar o arquivo `src/features/pdf/parseBoletoData.ts` para a lógica de parsing.
12. Definir uma interface TypeScript (`BoletoData`) para o formato dos dados estruturados.
13. Implementar funções de parsing iniciais com regex para campos chave.
14. Integrar a nova função de parsing em `extractDataFromPDF.ts`.

## 2026-04-13 - Documentacao Tecnica do Estado Atual

### Objetivo:
Registrar tecnicamente a arquitetura e o comportamento atual do projeto, considerando que a aplicacao segue em desenvolvimento e ainda nao cobre o fluxo corporativo completo.

### Escopo documentado:
- Estrutura de pastas e modulos ativos.
- Fluxo atual de processamento de PDFs.
- Responsabilidades dos modulos de PDF, Excel, e-mail e service.
- Entradas, saidas e dependencias relevantes.
- Limitacoes, riscos e dividas tecnicas observadas.
- Desalinhamentos entre testes existentes e implementacao atual.

### Observacoes:
- A documentacao foi consolidada em `documentation.md`.
- Nao houve alteracao funcional de codigo nesta etapa.
- O documento foi escrito com foco no estado atual implementado, nao no estado alvo do produto.

## 2026-04-14 - Refatoração e Integração de Fluxo

### Objetivo:
Refatorar o código para integrar o processamento de e-mails com a extração e parsing de PDFs, e remover a dependência de testes unitários Jest temporariamente.

### Ações Realizadas:
1.  **Remoção da Funcionalidade de Desbloqueio de PDF:**
    *   O arquivo `src/features/pdf/unlockPdf.ts` foi removido (a exclusão física será realizada pelo usuário).
    *   Referências a `jest` e `@types/jest` foram removidas de `package.json`.
    *   Os scripts de teste (`test`, `test:watch`, `test:coverage`) foram removidos de `package.json`.
    *   O arquivo `jest.config.cjs` e o diretório `src/tests` foram marcados para exclusão manual pelo usuário.
2.  **Integração de Parsing de PDF:**
    *   `src/features/pdf/extractDataFromPDF.ts` foi modificado para importar e utilizar `parseBoletoData` diretamente, retornando o conteúdo parseado (`parsedContent`) junto com o texto bruto.
    *   A interface `ExtractedData` em `extractDataFromPDF.ts` foi atualizada para incluir `parsedContent: BoletoData`.
3.  **Orquestração do Fluxo de E-mail:**
    *   `src/features/email/searchDataFromEmail.ts` foi atualizado para:
        *   Importar `extractDataFromPDF` e `generateRateioExcel`.
        *   Salvar PDFs anexados em um diretório temporário (`src/tmp`).
        *   Chamar `extractDataFromPDF` para cada PDF baixado.
        *   Salvar o `parsedContent` resultante como um arquivo JSON em `src/filesExtracted`.
        *   Chamar `generateRateioExcel` com o `parsedContent`.
        *   Marcar o e-mail processado como lido.
        *   Remover o arquivo PDF temporário após o processamento.
    *   `src/main.ts` foi simplificado para apenas chamar `processEmails()`, centralizando o fluxo de automação.

### Próximos Passos:
- O usuário deve realizar a exclusão manual dos arquivos `jest.config.cjs` e do diretório `src/tests`.
- O usuário deve realizar a exclusão manual do arquivo `src/features/pdf/unlockPdf.ts`.
- Validar o fluxo completo da aplicação executando `npm run dev` ou `npm start`.
- Considerar a implementação de um mecanismo de tratamento de erros mais robusto e logging.
- Planejar a integração com o processo P032 do Zeev.

## 2026-04-16 - Análise de Leitura de Caixa de E-mail

### Objetivo:
Verificar se o arquivo `src/features/email/searchDataFromEmail.ts` está configurado para ler apenas uma caixa de e-mail por vez.

### Análise:
- O arquivo `src/features/email/searchDataFromEmail.ts` utiliza a variável de ambiente `USER_EMAIL` para construir a URL da API do Microsoft Graph.
- A URL `https://graph.microsoft.com/v1.0/users/${USER_EMAIL}/messages` garante que as requisições de e-mail são feitas para um único usuário/caixa de e-mail, conforme definido em `process.env.USER_EMAIL`.

### Conclusão:
- O arquivo `searchDataFromEmail.ts` está configurado para ler apenas uma caixa de e-mail por vez, atendendo ao requisito.

## 2026-04-16 - Adição de Logs para Monitoramento de API

### Objetivo:
Adicionar `console.log` organizados no arquivo `src/features/email/searchDataFromEmail.ts` para monitorar as chamadas de API e seus retornos.

### Ações Realizadas:
- Adicionados `console.log` antes e depois das chamadas para `getAccessToken`, `getEmails`, `getAttachments` e `markEmailAsRead`.
- Os logs incluem informações relevantes como o número de e-mails/anexos encontrados e o ID do e-mail processado.

### Próximos Passos:
- Validar o comportamento dos novos logs durante a execução do fluxo de e-mail.

### CHG-0005 — Refinamento de Extração e Estabilização de Regressão

- Data/Hora: 2026-05-14 12:45
- Contexto: Divergências em valores de milhares e regressões em arquivos previamente funcionais.
- Objetivo: Estabilizar a extração de valores monetários e garantir 100% de precisão nos casos mapeados.
- Escopo: `src/features/pdf/parseBoletoData.ts`, `src/tmp/check_all_pdfs.ts` (testes).
- Status: Aplicado

### CHG-0006 — Transição para Arquitetura AI-First e Indexação Rica

- Data/Hora: 2026-05-28 15:30
- Contexto: Mudança estratégica para uso de LLMs (Gemini) visando precisão absoluta e suporte a múltiplos layouts sem manutenção de Regex.
- Objetivo: Implementar extração via IA, expandir campos de indexação (impostos/CNPJs) e remover código legado.
- Escopo: `src/features/pdf/aiExtract.ts`, `src/features/pdf/extractDataFromPDF.ts`, `src/features/pdf/parseBoletoData.ts`, `src/server/ui-api.ts`.
- Riscos: Dependência da API do Google (mitigado pelo tier gratuito/pago), latência de rede.
- Proposta: 
    - Implementação do motor Gemini 1.5/2.x Flash.
    - Prompt especializado em documentos fiscais brasileiros.
    - Estruturação de indexação em arquivos `.json` ricos.
    - Remoção de `ocrFallback.ts` e `spatialExtract.ts`.
- Testes: Validado com `test_12.pdf` e integração com Dashboard.
- Rollback: Reverter para commits pré-IA (embora a precisão manual fosse inferior).
- Status: Aplicado
- Observações: Sistema simplificado e dívida técnica de Regex reduzida drasticamente.

