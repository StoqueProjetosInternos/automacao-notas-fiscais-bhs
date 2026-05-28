# Documentação Técnica - Automação de Notas Fiscais v2

## 1. Visão Geral
Este projeto é uma solução de **Intelligent Document Processing (IDP)** que automatiza o ciclo de vida de processamento de notas fiscais e boletos. O sistema evoluiu de uma abordagem baseada em regras (Regex/OCR) para uma arquitetura **AI-First**, utilizando modelos de linguagem de larga escala (LLMs) para garantir precisão próxima de 100% e extração contextual de dados.

## 2. Arquitetura do Sistema
O sistema é estruturado em módulos especializados, seguindo princípios de alta coesão e baixo acoplamento:

- **Email Processor**: Integração com Microsoft Graph API para monitoramento e download de anexos.
- **AI Engine (`aiExtract.ts`)**: O "cérebro" do sistema. Utiliza o Google Gemini (1.5 Flash / 2.0 Flash) para processar PDFs visualmente e extrair dados estruturados via prompts especializados.
- **Parser & Schema (`parseBoletoData.ts`)**: Define o contrato de dados (`BoletoData`) que unifica a saída da IA para o restante do ecossistema.
- **Excel Generator**: Consolidação de dados em planilhas financeiras de rateio.
- **Dashboard API**: Servidor Express que serve a indexação rica (JSON) para a interface de curadoria.

## 3. Fluxo de Dados (End-to-End)
1.  **Captura**: E-mails não lidos são buscados; PDFs são salvos temporariamente.
2.  **Extração via IA**: 
    - O PDF é enviado diretamente ao modelo Gemini.
    - A IA atua como um especialista fiscal, identificando Fornecedor, Pagador, Valores Líquidos, Datas (Vencimento/Emissão/Competência) e Impostos Retidos.
3.  **Indexação Rica**:
    - Os dados são salvos em arquivos `.json` individuais em `src/filesExtracted`.
    - Cada JSON contém a estrutura completa de impostos e metadados para futura persistência em banco de dados.
4.  **Curadoria (Human-in-the-loop)**:
    - O Dashboard (React) permite que um operador revise, edite e valide os dados extraídos pela IA antes da finalização.

## 4. Módulos Principais

### 4.1. PDF AI Intelligence (`src/features/pdf`)
- `extractDataFromPDF.ts`: Orquestrador que coordena a leitura do arquivo e o salvamento da indexação.
- `aiExtract.ts`: Implementa a lógica de comunicação com o Google Generative AI, limpeza de buffers e tratamento de respostas JSON.

### 4.2. Email & Graph API (`src/features/email`)
- `searchDataFromEmail.ts`: Gerencia o fluxo OAuth2 e o monitoramento da caixa de entrada via Microsoft Graph.

### 4.3. Servidor e Dashboard
- **Backend**: `src/server/ui-api.ts` (Porta 3001) - API REST para gestão dos JSONs indexados.
- **Frontend**: Localizado em `/dashboard` - Interface moderna para visualização de PDFs e edição de dados extraídos.

## 5. Configuração de Ambiente
O projeto utiliza um arquivo `.env` para segurança:
- `GEMINI_API_KEY`: Chave do Google AI Studio.
- `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET`: Credenciais Azure para E-mail.
- `USER_EMAIL`: Caixa de correio monitorada.

## 6. Scripts Disponíveis
- `npm run dev`: Executa o fluxo de processamento local/desenvolvimento.
- `npm start`: Executa o fluxo completo (Build + Produção).
- `node src/server/ui-api.ts`: Inicia o servidor do Dashboard.

---
*Última atualização: 28 de maio de 2026 (Transição para IA Concluída)*
