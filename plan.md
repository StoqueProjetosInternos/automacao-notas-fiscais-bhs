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
    *   Os scripts de teste (`test`, `test:watch`, `test:coverage`) foram removidas de `package.json`.
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

### CHG-0007 — Renomeação de parser legado e limpeza

- Data/Hora: 2026-05-29 10:00
- Contexto: Após a transição para IA, o arquivo `parseBoletoData.ts` continha apenas interfaces, e arquivos antigos de teste/serviço ainda o referenciavam como função.
- Objetivo: Renomear `parseBoletoData.ts` para `types.ts` e remover código morto.
- Escopo: `src/features/pdf/parseBoletoData.ts` (renomeado), `src/features/pdf/types.ts`, `src/features/excel/generateRateioExcel.ts`, `src/features/pdf/aiExtract.ts`, `src/features/pdf/extractDataFromPDF.ts`, `src/services/processBoleto.ts` (removido), `src/tests/features/pdf/parseBoletoData.test.ts` (removido), `src/tmp/debug_extraction.ts` (removido).
- Riscos: Quebra de tipagem (mitigado pelas substituições de imports).
- Proposta: Renomear arquivo e remover os obsoletos.
- Testes: Compilação TypeScript / validação visual do código.
- Rollback:
  1) git restore src/features/pdf/parseBoletoData.ts
  2) git checkout -- src/services/processBoleto.ts src/tests/features/pdf/parseBoletoData.test.ts
  3) Reverter os imports.
- Status: Aplicado
- Observações: Refatoração concluída com sucesso.

### CHG-0008 — Refatoração Arquitetural do Dashboard (Frontend)

- Data/Hora: 2026-05-29 13:00
- Contexto: O frontend (dashboard) possuía débitos técnicos, como um componente monolítico (`App.tsx`), tipagem fraca (`any`), e configuração hardcoded.
- Objetivo: Refatorar o código para seguir as melhores práticas do React moderno (componentização, tipagem estrita, extração de serviços de API).
- Escopo: `dashboard/src/App.tsx`, `dashboard/src/components/*`, `dashboard/src/services/api.ts`, `dashboard/src/types/index.ts`, `dashboard/.env`.
- Riscos: Quebra visual ou perda de estado na passagem de props (mitigado pelo TypeScript rígido).
- Proposta: Quebrar `App.tsx` em `Header`, `Sidebar`, `DocumentViewer` e `DataEditor`. Criar tipagens compartilhadas e um serviço isolado de API.
- Testes: Build do Vite executado via `npm run build` confirmando ausência de erros TS. Funcionalidade mantida idêntica à original.
- Rollback: Reverter para os commits anteriores à componentização de `App.tsx`.
- Status: Aplicado
- Observações: Nenhuma biblioteca adicional foi introduzida, mantendo o bundle leve.

### CHG-0009 — Reestruturação de Diretórios e Limpeza de Código Morto

- Data/Hora: 2026-05-29 13:30
- Contexto: A pasta `src/` estava misturando código-fonte com arquivos de dados dinâmicos (`filesExtracted/`) e downloads temporários (`tmp/`). Além disso, havia resíduos de testes obsoletos do Jest.
- Objetivo: Mover pastas de dados para fora do `src/` visando melhores práticas, isolamento e evitar recargas acidentais em hot-reload.
- Escopo: `src/filesExtracted/` (movida para `data/extracted/`), `src/tmp/` (arquivos temporários redirecionados para `.tmp/`, e os scripts de debug renomeados para `src/scripts/`). `.gitignore` foi atualizado. Remoção da pasta `src/tests/` e do arquivo `jest.config.cjs`.
- Riscos: Quebra de caminhos de arquivos (mitigado pela atualização rigorosa dos scripts de e-mail, extração de PDF e API do Dashboard).
- Proposta: Separar `data/` e `.tmp/` na raiz do projeto e adicioná-los ao `.gitignore`. Limpar arquivos de configuração de testes mortos.
- Testes: Build do Dashboard foi previamente validado e buscas por referências antigas não retornaram ocorrências ativas.
- Rollback: Reverter os caminhos no código e mover as pastas de volta.
- Status: Aplicado
- Observações: A raiz do projeto está mais limpa e a arquitetura segue princípios mais sólidos de separação entre código e dados.

### CHG-0010 — Transição para Arquitetura de Monorepo (npm workspaces)

- Data/Hora: 2026-05-29 14:00
- Contexto: O projeto mantinha um backend na raiz e um frontend na pasta `dashboard`, gerando confusão de dependências (`package.json` misturado) e uma estrutura desbalanceada.
- Objetivo: Isolar frontend e backend em suas próprias pastas (`apps/dashboard` e `apps/automacao`) e utilizar *npm workspaces* para gerenciamento unificado na raiz.
- Escopo: Criação da pasta `apps/`. Mover o código do backend (`src`, `tsconfig.json`, `package.json`) para `apps/automacao`. Mover (copiar) o frontend para `apps/dashboard`. Atualização dos caminhos relativos em `apps/automacao` que apontavam para `data/` e `.tmp/` (agora subindo mais níveis). Criação do `package.json` raiz definindo `workspaces: ["apps/*"]`.
- Riscos: Quebra de caminhos de arquivos ou falha na resolução de módulos (mitigado pelo ajuste manual de caminhos usando `path.resolve` e subindo os níveis hierárquicos corretos, e rodando `npm install` na raiz).
- Proposta: Estruturar como um monorepo padrão do mercado, facilitando a escalabilidade. O antigo diretório `dashboard` na raiz foi substituído pela nova estrutura (o Windows reteve um pequeno lock do Vite na pasta antiga `node_modules`, que deverá ser deletada manualmente).
- Testes: Executado `npm install` na raiz com sucesso (configurando os links dos workspaces).
- Rollback: Restaurar backup anterior ou desfazer os `git mv` voltando `apps/*` para a raiz.
- Status: Aplicado
- Observações: A partir de agora, scripts do backend devem ser rodados a partir de `apps/automacao` (ou via `npm run <script> -w automacao` na raiz) e o frontend em `apps/dashboard`. O usuário precisará deletar manualmente a pasta `dashboard/node_modules` antiga que ficou presa pelo OS.

### CHG-0011 — Correção de caminhos relativos de PDF após refatoração

- Data/Hora: 2026-06-01 10:30
- Contexto: Após a migração para a arquitetura de monorepo (`apps/automacao`), os scripts de teste local e o módulo de extração quebraram pois os caminhos relativos mudaram.
- Objetivo: Ajustar os caminhos para localizar os PDFs e salvar os dados em `data/extracted` corretamente.
- Escopo: `apps/automacao/src/features/pdf/extractDataFromPDF.ts`, `apps/automacao/src/scripts/temp_extract.ts`.
- Riscos: Arquivos temporários ou gerados sendo gravados fora da pasta correta.
- Proposta: Em `extractDataFromPDF.ts`, usar a constante `FILES_DIR` do `paths.ts`. Em `temp_extract.ts`, apontar para o diretório raiz.
- Testes: Executado `npx tsx apps/automacao/src/scripts/test_pdf.ts test_2.pdf` na raiz.
- Rollback: Desfazer as edições utilizando `git checkout`.
- Status: Aplicado
- Observações: Caminhos agora utilizam a configuração centralizada de diretórios.

### CHG-0012 — Restauração do fluxo local de testes (yarn dev)

- Data/Hora: 2026-06-01 11:00
- Contexto: A migração para monorepo removeu o script `dev` da raiz e quebrou os caminhos de fallback no `main.ts`.
- Objetivo: Restaurar a experiência de desenvolvedor original (`yarn dev` na raiz) e corrigir os caminhos de teste local.
- Escopo: `package.json` (raiz), `apps/automacao/src/main.ts`.
- Riscos: Nenhum.
- Proposta: Adicionar script "dev" na raiz delegando para o workspace e ajustar caminho relativo em `main.ts`.
- Testes: Executado `npm run dev` na raiz com sucesso.
- Rollback: Remover script da raiz e reverter caminhos no `main.ts`.
- Status: Aplicado
- Observações: Fluxo de desenvolvimento local restaurado.

### CHG-0013 — Correção do carregamento de variáveis de ambiente (.env)

- Data/Hora: 2026-06-01 11:30
- Contexto: A execução dos aplicativos e scripts dentro da pasta `apps/automacao` impedia a localização do arquivo `.env` na raiz.
- Objetivo: Garantir que as credenciais (como `GEMINI_API_KEY`) sejam carregadas corretamente em todos os pontos de entrada.
- Escopo: `apps/automacao/src/main.ts`, `apps/automacao/src/server/index.ts`, `apps/automacao/src/features/email/searchDataFromEmail.ts`, `apps/automacao/src/scripts/test_pdf.ts`.
- Riscos: Nenhum.
- Proposta: Substituir `import "dotenv/config"` por `dotenv.config({ path: ... })` apontando para a raiz do repositório.
- Testes: Executado `yarn dev` com sucesso, confirmando carregamento da chave da API.
- Rollback: Reverter importações para o padrão anterior.
- Status: Aplicado
- Observações: Sistema agora é robusto para execuções em subdiretórios no monorepo.

### CHG-0014 — Resiliência de API: Retry e Exponential Backoff para Gemini

- Data/Hora: 2026-06-01 12:00
- Contexto: Instabilidades temporárias (503) e limites de taxa (429) na API do Gemini causavam falhas imediatas no fluxo.
- Objetivo: Implementar retentativas automáticas com espaçamento exponencial para aumentar a robustez da extração.
- Escopo: `apps/automacao/src/features/pdf/aiExtract.ts`.
- Riscos: Nenhum.
- Proposta: Adicionar loop de retry (máx 3 tentativas) com delay progressivo (2s, 4s).
- Testes: Validação visual do loop e logs de tentativa no terminal.
- Rollback: Remover o loop de retentativas em `aiExtract.ts`.
- Status: Aplicado
- Observações: O sistema agora tolera falhas momentâneas na infraestrutura da Google.

### CHG-0015 — Monitoramento de Custos e Tokens da IA

- Data/Hora: 2026-06-01 12:30
- Contexto: Necessidade de visibilidade sobre o consumo de tokens e custos operacionais da API do Gemini.
- Objetivo: Implementar log de consumo de tokens e estimativa de custo por extração.
- Escopo: `apps/automacao/src/features/pdf/aiExtract.ts`.
- Riscos: Nenhum.
- Proposta: Capturar `usageMetadata` da resposta da API e calcular custo baseado na tabela do Gemini 1.5 Flash.
- Testes: Executado `yarn dev` na raiz; verificado log de métricas no terminal.
- Rollback: Remover o bloco de cálculo de métricas em `aiExtract.ts`.
- Status: Aplicado
- Observações: Visibilidade financeira agora integrada ao console de execução.

### CHG-0018 — Enriquecimento de Dados (Cruzamento com Planilha)

- Data/Hora: 2026-06-01 14:00
- Contexto: A IA extrai os dados, mas é necessário cruzar com informações contábeis internas (CR, Natureza, Contrato).
- Objetivo: Implementar busca automática de dados contábeis usando o número da fatura como chave.
- Escopo: `data/base_referencia.csv`, `apps/automacao/src/features/pdf/dataEnrichment.ts`, `apps/automacao/src/features/pdf/extractDataFromPDF.ts`.
- Riscos: Falha no cruzamento se o formato do número da fatura divergir.
- Proposta: Criar base CSV e módulo de enriquecimento com normalização de strings.
- Testes: Executado `yarn dev` simulando fatura presente na base.
- Rollback: Deletar arquivo de enriquecimento e remover chamada no fluxo principal.
- Status: Aplicado
- Observações: O robô agora "carimba" CR e Natureza automaticamente.

### CHG-0017 — Utilitário de Agregação de Consumo e Custos

- Data/Hora: 2026-06-01 13:00
- Contexto: Necessidade de visualizar o total acumulado de consumo sem comprometer a integridade do arquivo CSV.
- Objetivo: Criar um script utilitário para somar e exibir os dados de uso.
- Escopo: `apps/automacao/src/scripts/show_usage.ts`, `package.json` (raiz), `apps/automacao/package.json`.
- Riscos: Nenhum.
- Proposta: Implementar script que processa o CSV e exibe totais formatados no terminal.
- Testes: Executado `yarn usage` na raiz com sucesso.
- Rollback: Deletar script e remover entradas nos arquivos `package.json`.
- Status: Aplicado
- Observações: Relatórios agora podem ser gerados instantaneamente via comando.

### CHG-0017 — Utilitário de Agregação de Consumo e Custos

- Data/Hora: 2026-06-01 13:00
- Contexto: Necessidade de visualizar o total acumulado de consumo sem comprometer a integridade do arquivo CSV.
- Objetivo: Criar um script utilitário para somar e exibir os dados de uso.
- Escopo: `apps/automacao/src/scripts/show_usage.ts`, `package.json` (raiz), `apps/automacao/package.json`.
- Riscos: Nenhum.
- Proposta: Implementar script que processa o CSV e exibe totais formatados no terminal.
- Testes: Executado `yarn usage` na raiz com sucesso.
- Rollback: Deletar script e remover entradas nos arquivos `package.json`.
- Status: Aplicado
- Observações: Relatórios agora podem ser gerados instantaneamente via comando.

### CHG-0019 — Atualização Geral da Documentação Técnica

- Data/Hora: 2026-06-08 10:15
- Contexto: O arquivo `documentation.md` continha referências de uma estrutura monolítica antiga e caminhos desatualizados após migrações recentes.
- Objetivo: Atualizar o arquivo de documentação técnica (`documentation.md`) para refletir a nova estrutura baseada em monorepo (npm workspaces), fluxo de dados via Gemini e instruções de execução atuais.
- Escopo: `documentation.md` (Raiz).
- Riscos: Nenhum (alteração de conteúdo informativo).
- Proposta: Substituição total da documentação por uma versão atualizada que descreve com precisão a estrutura de diretórios, módulos e formas de execução.
- Testes: Inspeção visual e leitura da documentação no editor.
- Rollback:
  1) `git checkout -- documentation.md`
- Status: Aplicado
- Observações: Nenhuma alteração de código envolvida. Documentação atualizada com sucesso.

### CHG-0021 — Correção de Tipagem e Erros do TypeScript no Backend

- Data/Hora: 2026-06-08 11:15
- Contexto: A compilação de produção (`tsc`) no backend apresentava 10 erros de tipagem devido a interfaces incompletas, imports redundantes e inferência implícita de tipos.
- Objetivo: Corrigir as inconsistências do compilador TypeScript para garantir compilação resiliente e sem erros em produção.
- Escopo: `apps/automacao/src/features/pdf/extractDataFromPDF.ts`, `apps/automacao/src/main.ts`, `apps/automacao/src/scripts/list_models.ts`, `apps/automacao/src/scripts/test_pdf.ts`, `apps/automacao/src/server/controllers/noteController.ts`.
- Riscos: Mínimos. Alteração estrita de tipos estáticos sem impacto na lógica do negócio.
- Proposta: Adição de propriedades em interfaces, remoção de imports repetidos e uso de casting explícito de tipos.
- Testes: Executado `npm run build -w automacao-notas-fisicais` após aplicação do diff. Compilação concluída com sucesso (saída limpa).
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/extractDataFromPDF.ts apps/automacao/src/main.ts apps/automacao/src/scripts/list_models.ts apps/automacao/src/scripts/test_pdf.ts apps/automacao/src/server/controllers/noteController.ts`
- Status: Aplicado
- Observações: Monorepo agora compila 100% sem qualquer erro ou aviso de compilação do TypeScript.

### CHG-0022 — Remoção de Servidor API Legado Obsoleto (ui-api.ts)

- Data/Hora: 2026-06-08 11:25
- Contexto: O arquivo `ui-api.ts` na raiz da pasta de servidor representava o design antigo monolítico e foi substituído por uma arquitetura padrão de mercado separada por camadas (Rotas, Controllers, Services).
- Objetivo: Limpar código morto e obsoletos da base de código do backend.
- Escopo: `apps/automacao/src/server/ui-api.ts` (removido), `documentation.md` (ajustado).
- Riscos: Nenhum (o script de execução principal já roda via `index.ts`).
- Proposta: Excluir fisicamente o arquivo e atualizar referências na documentação.
- Testes: Executado `npm run build` no backend pós-limpeza. Compilação bem-sucedida.
- Rollback:
  1) `git checkout -- apps/automacao/src/server/ui-api.ts`
- Status: Aplicado
- Observações: Código legado removido, documentação atualizada e integridade do build validada com sucesso.

### CHG-0023 — Melhoria de Prompt Contábil e Mapeamento de Valores da IA

- Data/Hora: 2026-06-08 11:35
- Contexto: O prompt anterior mesclava o valor bruto e líquido em um único campo, perdendo a rastreabilidade contábil em caso de impostos retidos na fonte.
- Objetivo: Melhorar as instruções do prompt do Gemini para diferenciar valor original (bruto) e cobrado (líquido), padronizar códigos de barra sem pontuação e instruir a captura da chave de acesso do DANFE.
- Escopo: `apps/automacao/src/features/pdf/aiExtract.ts`.
- Riscos: Mínimos.
- Proposta: Refatorar a interface `AIResponse`, a string `prompt` e o mapeamento no retorno da função de IA.
- Testes: Compilar com `npm run build` e simular extração de teste local. Compilação concluída com sucesso.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/aiExtract.ts`
- Status: Aplicado
- Observações: Prompt e mapeador enriquecidos para extração contábil mais fiel.

### CHG-0024 — Renomeação Geral do Projeto para Stoque Fiscal Intelligence (SFI)

- Data/Hora: 2026-06-08 12:20
- Contexto: O nome do projeto e de seus workspaces era genérico ("automação-notas-fiscais"). O usuário selecionou o nome "Stoque Fiscal Intelligence (SFI)".
- Objetivo: Renomear o projeto raiz, o workspace de automação backend, scripts do package.json, documentações e logs de console.
- Escopo: `package.json` (raiz), `apps/automacao/package.json`, `apps/automacao/src/main.ts`, `documentation.md`.
- Riscos: Quebra de mapeamento dos workspaces do npm (mitigado rodando `npm install` após a alteração).
- Proposta: Substituir referências do nome antigo pelo novo nos arquivos de configuração e inicialização.
- Testes: Executado `npm install` na raiz e rodado `npm run build -w stoque-fiscal-intelligence` com sucesso.
- Rollback:
  1) `git checkout -- package.json apps/automacao/package.json apps/automacao/src/main.ts documentation.md`
  2) `npm install` (na raiz, para restaurar symlinks antigos).
- Status: Aplicado
- Observações: O projeto foi integralmente renomeado e compilado com sucesso sob o novo escopo do workspace.

### CHG-0025 — Renomeação Geral do Projeto no Frontend (Dashboard)

- Data/Hora: 2026-06-08 12:25
- Contexto: Alinhamento do frontend com o novo nome "Stoque Fiscal Intelligence (SFI)".
- Objetivo: Renomear o título HTML, o texto de marca no cabeçalho da interface e o nome do pacote interno do dashboard no monorepo.
- Escopo: `apps/dashboard/package.json`, `apps/dashboard/index.html`, `apps/dashboard/src/components/Header.tsx`.
- Riscos: Nenhum.
- Proposta: Substituir títulos genéricos pelo novo nome do projeto.
- Testes: Executado `npm install` na raiz e rodado build do dashboard com sucesso (`stoque-fiscal-intelligence-dashboard`).
- Rollback:
  1) `git checkout -- apps/dashboard/package.json apps/dashboard/index.html apps/dashboard/src/components/Header.tsx`
  2) `npm install`
- Status: Aplicado
- Observações: O frontend agora exibe "Stoque Fiscal Intelligence (SFI)" na aba do navegador e "Fiscal Intelligence" no cabeçalho do painel.

### CHG-0026 — Identidade Visual Discreta no Cabeçalho (Ícone Receipt)

- Data/Hora: 2026-06-08 12:30
- Contexto: O usuário deseja uma assinatura visual simples e discreta para representar a marca do projeto SFI na barra superior do painel.
- Objetivo: Inserir o ícone de recibo (`Receipt`) do Lucide em cinza discreto ao lado do texto "Fiscal Intelligence" no cabeçalho do frontend.
- Escopo: `apps/dashboard/src/components/Header.tsx`.
- Riscos: Nenhum.
- Proposta: Adicionar suporte flex e renderizar o componente SVG de forma inline.
- Testes: Executado build do frontend com sucesso (`npm run build -w stoque-fiscal-intelligence-dashboard`).
- Rollback:
  1) `git checkout -- apps/dashboard/src/components/Header.tsx`
- Status: Aplicado
- Observações: O ícone Receipt do Lucide foi adicionado de forma sutil e responsiva com flexbox ao lado de "Fiscal Intelligence".

### CHG-0027 — Implementação de Regras de Compliance Zeev no Prompt de IA

- Data/Hora: 2026-06-08 12:35
- Contexto: O fluxo do Zeev exige validação de prazos de recebimento (mínimo de 10 dias corridos antes do vencimento e máximo de 2 dias úteis pós-emissão) e emite alertas para notas faturadas após o dia 25 do mês.
- Objetivo: Injetar a data atual de recebimento e instruir o Gemini IA a computar as regras de compliance fiscal do Zeev, adicionando o campo `zeevValidation` na interface de dados do projeto.
- Escopo: `apps/automacao/src/features/pdf/types.ts`, `apps/automacao/src/features/pdf/aiExtract.ts`.
- Riscos: IAs cometendo erros lógicos simples na contagem de dias (mitigado por instruções rigorosas no prompt).
- Proposta: Adicionar interface no TypeScript, injetar dinamicamente a data e expandir a string de prompt com a lógica de negócio do processo Zeev.
- Testes: Compilar com `npm run build -w stoque-fiscal-intelligence` com sucesso.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/types.ts apps/automacao/src/features/pdf/aiExtract.ts`
- Status: Aplicado
- Observações: Regras de negócio do Zeev ativamente integradas no pipeline de processamento inteligente do robô.

### CHG-0028 — Máscara de Formatação Financeira pt-BR no Dashboard

- Data/Hora: 2026-06-09 14:00
- Contexto: No painel de curadoria, dados financeiros decimais puros (floats) dificultavam a validação humana.
- Objetivo: Implementar formatação brasileira (ex: 20.500,20) na exibição e edição de dados financeiros no Dashboard, higienizando os dados para float nativo antes da persistência no backend. Adicionalmente, corrigir o import comentado do ícone Receipt no Header que impedia o build.
- Escopo: `apps/dashboard/src/components/Sidebar.tsx`, `apps/dashboard/src/components/DataEditor.tsx`, `apps/dashboard/src/components/Header.tsx`, `apps/dashboard/src/App.tsx`.
- Riscos: Gravação de strings no JSON quebrando o processador de rateio e o build. (Mitigado pela sanitização recursiva no front antes do salvamento).
- Proposta: Inserir exibição mascarada, reformatador sob evento `onBlur`, sanitizador recursivo `sanitizeNumericFields` no fluxo de salvamento e reativar o ícone Receipt.
- Testes: Executado `npm run build -w stoque-fiscal-intelligence-dashboard` com sucesso.
- Rollback:
  1) `git checkout -- apps/dashboard/src/components/Sidebar.tsx apps/dashboard/src/components/DataEditor.tsx apps/dashboard/src/components/Header.tsx apps/dashboard/src/App.tsx`
- Status: Aplicado
- Observações: Sem alteração de dependências. A reativação do ícone Receipt do Lucide corrigiu o erro TS6133 e normalizou o build de produção do monorepo.

### CHG-0029 — Correção de Hoisting de Funções no App.tsx do Dashboard

- Data/Hora: 2026-06-09 14:05
- Contexto: Erro do compilador/linter do React indicando acesso a `handleSelectNote` antes de sua declaração.
- Objetivo: Reordenar as funções no escopo do componente `App` para garantir o fluxo de hoisting correto de constantes.
- Escopo: `apps/dashboard/src/App.tsx`.
- Riscos: Nenhum.
- Proposta: Mover `handleSelectNote` para antes de sua primeira referência na função `loadNotes`.
- Testes: Executado `npm run build -w stoque-fiscal-intelligence-dashboard` com sucesso.
- Rollback:
  1) `git checkout -- apps/dashboard/src/App.tsx`
- Status: Aplicado
- Observações: Sem alteração de regras de negócio. O build do dashboard foi restabelecido e compila com sucesso.

### CHG-0030 — Otimização de UI: Remoção de Effect de Arraste no Dashboard

- Data/Hora: 2026-06-09 14:10
- Contexto: Alerta do React indicando re-renderização em cascata (cascading renders) ao atualizar estados dentro do useEffect de redimensionamento do painel.
- Objetivo: Substituir a lógica de listener global baseada em useEffect por registro de listener dinâmico acoplado ao evento `onMouseDown` do resizer, eliminando a dependência de renderização do state `isDragging`.
- Escopo: `apps/dashboard/src/App.tsx`.
- Riscos: Nenhum.
- Proposta: Remover o bloco `useEffect` de arraste e criar o event handler dinâmico `handleMouseDown`.
- Testes: Executado `npm run build -w stoque-fiscal-intelligence-dashboard` com sucesso.
- Rollback:
  1) `git checkout -- apps/dashboard/src/App.tsx`
- Status: Aplicado
- Observações: Melhoria de performance e redução de complexidade de hooks no React. O build do dashboard compila sem erros.

### CHG-0031 — Otimização de Performance: Desacoplamento de Estados no Mount do Dashboard

- Data/Hora: 2026-06-09 14:15
- Contexto: Alerta do React indicando possível renderização em cascata ao chamar setState síncronamente na carga inicial em loadNotes().
- Objetivo: Desacoplar a lógica de carga inicial (com seleção automática) da atualização de rotina (refresh da lista) e isolar os efeitos de montagem com tratamento assíncrono e refs (`useRef`).
- Escopo: `apps/dashboard/src/App.tsx`.
- Riscos: Nenhum.
- Proposta: Substituir a função monolítica `loadNotes` por `refreshNotesList` e um `useEffect` de mount que utiliza Promises locais e `selectedNoteRef`.
- Testes: Executado `npm run build -w stoque-fiscal-intelligence-dashboard` com sucesso.
- Rollback:
  1) `git checkout -- apps/dashboard/src/App.tsx`
- Status: Aplicado
- Observações: Resolução definitiva dos alertas de rendering em cascata e correção de comportamento no botão Sincronizar. O build do dashboard compila perfeitamente sem warnings.

### CHG-0032 — Extração e Rateio Dinâmico de Itens de Fatura

- Data/Hora: 2026-06-11 14:00
- Contexto: Processamento da fatura complexa test_16.pdf (dezenas de itens de equipamentos locados que necessitam ser desmembrados em rateio).
- Objetivo: Implementar extração via IA de tabelas de itens de despesa, enriquecimento individual e geração dinâmica em lote de linhas no Excel.
- Escopo: `apps/automacao/src/features/pdf/types.ts`, `apps/automacao/src/features/pdf/aiExtract.ts`, `apps/automacao/src/features/pdf/dataEnrichment.ts`, `apps/automacao/src/features/excel/generateRateioExcel.ts`, `data/base_referencia.csv`, `apps/dashboard/src/App.tsx`, `apps/dashboard/src/components/DataEditor.tsx`.
- Riscos: Dados de formatação do dashboard (strings pt-BR) quebrando operações aritméticas (mitigado pela adição das propriedades ao NUMERIC_FIELDS).
- Proposta: Inserir suporte a arrays de rateio (`apportionment`) no fluxo principal de ponta a ponta.
- Testes: Executar `npm run dev` na raiz e inspecionar a geração do Rateio.xlsx da pasta `test_16`.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/types.ts apps/automacao/src/features/pdf/aiExtract.ts apps/automacao/src/features/pdf/dataEnrichment.ts apps/automacao/src/features/excel/generateRateioExcel.ts data/base_referencia.csv apps/dashboard/src/App.tsx apps/dashboard/src/components/DataEditor.tsx`
- Status: Aplicado
- Observações: Implementação realizada de ponta a ponta. Aguardando execução do build e dos testes locais para comprovação.

### CHG-0033 — Mapeamento e Vínculo Individual de Itens de Rateio

- Data/Hora: 2026-06-11 15:45
- Contexto: Processamento de faturas complexas de múltiplos itens (como test_16.pdf) necessitando de vinculo contábil (CR, Natureza, Contrato) específico por item.
- Objetivo: Criar base de de/para individual de itens baseada em padrões de descrição e integrá-la no fluxo de enriquecimento. Corrigir import pendente no Header do dashboard.
- Escopo: `apps/dashboard/src/components/Header.tsx`, `apps/automacao/src/features/pdf/dataEnrichment.ts`, `data/mapeamento_itens.json` (novo).
- Riscos: Fallback incorreto para itens não catalogados.
- Proposta: Implementação de busca de patterns em `dataEnrichment.ts` sob mapeamento centralizado.
- Testes: Build do dashboard e reprocessamento do test_16 confirmando CRs e Naturezas distintos no JSON.
- Rollback:
  1) `git checkout -- apps/dashboard/src/components/Header.tsx apps/automacao/src/features/pdf/dataEnrichment.ts`
  2) Remover `data/mapeamento_itens.json`
- Status: Aplicado
- Observações: Implementado com sucesso e integrado ao dashboard.

### CHG-0034 — Revisão e Otimização do .gitignore Raiz

- Data/Hora: 2026-06-12 11:45
- Contexto: O arquivo `.gitignore` possuía regras globais arriscadas como `*.json` e `*.txt` que ocultavam arquivos importantes de configuração do monorepo, além de ignorar genericamente todos os PDFs.
- Objetivo: Ajustar as regras do `.gitignore` para ignorar adequadamente os PDFs de teste (`test_*.pdf`), pastas de dados (`data/`, `temp/`, `.tmp/`) e segredos locais, sem prejudicar o versionamento de arquivos de configuração do monorepo.
- Escopo: `.gitignore`
- Riscos: Mínimo. Segurança aumentada ao cobrir variações de arquivos `.env` locais.
- Proposta: Substituir regras excessivamente globais por regras específicas baseadas nas pastas de saída e escopo de testes na raiz.
- Testes:
  - Validar ignores usando `git check-ignore` nos arquivos `.env`, `test_2.pdf`, `data/extracted/` e nos arquivos de configuração do workspace.
- Rollback:
  1) `git checkout -- .gitignore`
- Status: Aplicado
- Observações: Alterações aplicadas após aprovação explícita [APROVAR-CODIGO] do usuário.

### CHG-0035 — Correção e Fidelidade de Cálculo do Consumo da IA (Gemini 2.5 Flash)

- Data/Hora: 2026-06-12 13:30
- Contexto: O sistema calculava as métricas e custos com base nas taxas do Gemini 1.5 Flash (obsoleto no código), subestimando drasticamente a estimativa real de custo das execuções do Gemini 2.5 Flash.
- Objetivo: Atualizar as taxas no motor de processamento e criar recálculo retroativo de custos no script de exibição de relatórios para refletir os preços oficiais do Gemini 2.5 Flash.
- Escopo: [aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts), [show_usage.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/show_usage.ts)
- Riscos: Nenhum. Mudança puramente de relatórios e logs operacionais.
- Proposta: Substituir multiplicadores de tokens em `aiExtract.ts` e recalcular custos cumulativos a partir de tokens de entrada e saída registrados no log em `show_usage.ts`.
- Testes:
  - Executar `yarn usage` antes e depois e verificar o realinhamento de custos do histórico.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/aiExtract.ts apps/automacao/src/scripts/show_usage.ts`
- Status: Aplicado
- Observações: Alterações aplicadas após aprovação explícita [APROVAR-CODIGO] do usuário.

### CHG-0036 — Enriquecimento do Log de Consumo e Formatação de Data Amigável

- Data/Hora: 2026-06-12 13:40
- Contexto: O arquivo `usage_log.csv` possuía formato básico e a coluna `data_hora` em ISO UTC, dificultando a auditoria manual ou por planilhas.
- Objetivo: Modificar o motor de IA para coletar e salvar nome de fornecedor, tempo de processamento, modelo e data formatada no fuso local. Ajustar o leitor de relatório para suportar de forma dinâmica estruturas antigas e novas do CSV.
- Escopo: [aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts), [show_usage.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/show_usage.ts)
- Riscos: Quebra de leitura do CSV legado. Mitigado por parsing dinâmico de cabeçalho com regex tolerante a vírgulas escapadas no script.
- Proposta: Inserir colunas `modelo_ia`, `fornecedor` e `tempo_processamento_ms` na gravação e ler de forma dinâmica no show_usage.ts.
- Testes:
  - Rodar `yarn usage` no CSV legado e com novos registros.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/aiExtract.ts apps/automacao/src/scripts/show_usage.ts`
- Status: Aplicado
- Observações: Alterações aplicadas após aprovação explícita [APROVAR-CODIGO] do usuário.

### CHG-0037 — Correção do Bug NaN no Relatório de Consumo da IA (yarn usage)

- Data/Hora: 2026-06-12 13:45
- Contexto: O analisador de CSV antigo baseado em Regex descartava elementos que continham espaços em branco, quebrando a leitura da nova data amigável no formato "DD/MM/AAAA HH:mm:ss".
- Objetivo: Substituir a divisão de linhas do CSV por uma função robusta e tolerante a espaços em branco que respeita os limites de aspas das colunas.
- Escopo: [show_usage.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/show_usage.ts)
- Riscos: Mínimos. Alteração restrita ao utilitário de relatórios no console.
- Proposta: Implementar a função `splitCsvLine` e acoplá-la ao agregador de dados do console.
- Testes:
  - Rodar `yarn usage` e validar se o parsing de datas brasileiras e fornecedores com espaços ocorre sem retornar NaN.
- Rollback:
  1) `git checkout -- apps/automacao/src/scripts/show_usage.ts`
- Status: Aplicado
- Observações: Alterações aplicadas após aprovação explícita [APROVAR-CODIGO] do usuário.

### CHG-0038 — Migração de Dados de Log e Correção de Cabeçalho do CSV

- Data/Hora: 2026-06-12 13:50
- Contexto: O log `usage_log.csv` possuía formato básico e foi corrompido com a gravação de colunas novas em um arquivo de estrutura antiga de 5 colunas.
- Objetivo: Reescrever o CSV de dados normalizando todas as linhas anteriores para o formato estendido de 8 colunas e implementar migração automática no código de extração.
- Escopo: [aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts), [usage_log.csv](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/data/usage_log.csv)
- Riscos: Nenhum. Correção e normalização de dados históricos.
- Proposta: Substituir conteúdo de `usage_log.csv` e implementar verificador e conversor de CSV no setup de faturamento.
- Testes:
  - Rodar `yarn usage` e validar se os valores de tokens de entrada e saída voltaram à conformidade sem NaN e com a indexação de colunas correta.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/aiExtract.ts`
  2) Restaurar backup do CSV.
- Status: Aplicado
- Observações: Alterações aplicadas após aprovação explícita [APROVAR-CODIGO] do usuário.

### CHG-0039 — Tratamento de Valores "N/A" de Latência no Relatório de Uso (yarn usage)

- Data/Hora: 2026-06-12 13:55
- Contexto: O agregador de console tentava parsear a string "N/A" das linhas de log históricas como número de latência, provocando contaminação do cálculo com NaN.
- Objetivo: Proteger o somatório de latência em `show_usage.ts` para ignorar valores não numéricos ou marcados como "N/A".
- Escopo: [show_usage.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/show_usage.ts)
- Riscos: Nenhum.
- Proposta: Inserir cláusula de higienização `!isNaN(latVal)` no parser de latência do console.
- Testes:
  - Executar `yarn usage` e validar se o tempo médio de resposta exibe um float formatado sem NaN.
- Rollback:
  1) `git checkout -- apps/automacao/src/scripts/show_usage.ts`
- Status: Aplicado
- Observações: Alterações aplicadas após aprovação explícita [APROVAR-CODIGO] do usuário.

### CHG-0040 — Implementação de Ordenação de Arquivos na Sidebar do Dashboard

- Data/Hora: 2026-06-12 13:58
- Contexto: A listagem de faturas na barra lateral esquerda do painel era exibida de forma fixa, dificultando a análise por critérios financeiros ou de vencimento do Zeev.
- Objetivo: Inserir controle de ordenação dinâmico (Nome, Valor e Vencimento) na barra lateral esquerda do Dashboard.
- Escopo: [Sidebar.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Sidebar.tsx)
- Riscos: Mínimos. Alteração restrita ao frontend do cliente, sem impacto no backend de automação.
- Proposta: Adicionar select dropdown e mapear a ordenação local usando hook useState e funções de comparação no Array.sort.
- Testes:
  - Validar build e transição de opções de ordenação na Sidebar do painel.
- Rollback:
  1) `git checkout -- apps/dashboard/src/components/Sidebar.tsx`
- Status: Aplicado
- Observações: Alterações aplicadas após aprovação explícita [APROVAR-CODIGO] do usuário.

### CHG-0041 — Ajuste de Estouro de Layout da Sidebar (minWidth no Select)

- Data/Hora: 2026-06-12 14:05
- Contexto: O select de ordenação recém-adicionado na Sidebar estava vazando horizontalmente devido à largura intrínseca de suas opções de texto longas.
- Objetivo: Restringir a largura do select e de seu container flexbox de forma que fiquem estritamente contidos nas dimensões da barra lateral.
- Escopo: [Sidebar.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Sidebar.tsx)
- Riscos: Nenhum.
- Proposta: Inserir `minWidth: 0` e `width: '100%'` no estilo inline do select e configurar box-sizing correto no pai.
- Testes:
  - Validar visualmente o alinhamento de bordas da barra lateral no navegador.
- Rollback:
  1) `git checkout -- apps/dashboard/src/components/Sidebar.tsx`
- Status: Aplicado
- Observações: Alterações aplicadas após aprovação explícita [APROVAR-CODIGO] do usuário.

### CHG-0042 — Enriquecimento Contábil por Número de Série de Equipamentos

- Data/Hora: 2026-06-15 10:05
- Contexto: Processamento de faturas de locação complexas (ex: test_16) que listam itens individualizados por série de hardware.
- Objetivo: Ler Excel de monitores/notebooks na raiz e mapear o de/para dos itens via série de hardware de forma dinâmica e flexível.
- Escopo: `apps/automacao/src/features/pdf/types.ts`, `apps/automacao/src/features/pdf/dataEnrichment.ts`.
- Riscos: Planilhas contendo formatações de colunas incomuns. Mitigado por algoritmo adaptativo de busca aproximada de termos de cabeçalho.
- Proposta: Integrar a biblioteca `xlsx` para construir mapa de séries em memória durante a etapa de enriquecimento de dados e buscar termos entre parênteses nos itens de despesa.
- Testes:
  - Validar compilação do TypeScript no backend.
  - Executar o reprocessamento da fatura local e verificar se o arquivo Excel final de rateio gerou as naturezas e CRs individuais para cada equipamento.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/types.ts apps/automacao/src/features/pdf/dataEnrichment.ts`
- Status: Aplicado
- Observações: Alterações de código aplicadas com sucesso sob aprovação [APROVAR-CODIGO]. Corrigido bug de correspondência que selecionava a coluna "Equipamento" ao invés de "Série". Validado enriquecimento e priorização da coluna de contrato em teste offline com sucesso.

### CHG-0046 — Paginação e Contador de Documentos na Sidebar do Dashboard

- Data/Hora: 2026-06-15 16:00
- Contexto: Solicitação de melhoria de usabilidade e performance na Sidebar do frontend para controle de grandes volumes de faturas.
- Objetivo: Implementar paginação (10 faturas por página) e um contador informativo de documentos em tela no Dashboard.
- Escopo: `apps/dashboard/src/components/Sidebar.tsx`.
- Riscos: Nenhum. Lógica 100% no cliente com atualização de estado síncrona.
- Proposta: Calcular a paginação síncrona redefinindo a página para 1 quando o termo de busca ou critério de ordenação mudarem. Adicionar componentes de botão de navegação e barra de status do total/filtrados na Sidebar.
- Testes:
  - Validar build de produção do frontend (`npm run build -w stoque-fiscal-intelligence-dashboard`).
- Rollback:
  1) `git checkout -- apps/dashboard/src/components/Sidebar.tsx`
- Status: Aplicado
- Observações: Alterações de código no frontend aplicadas com sucesso sob aprovação [APROVAR-CODIGO] do usuário e build de produção validado 100%.

### CHG-0047 — Efeito de Carregamento e Rotação no Botão Sincronizar

- Data/Hora: 2026-06-15 16:15
- Contexto: Solicitação de melhoria de feedback visual (UX) ao clicar no botão "Sincronizar" no dashboard.
- Objetivo: Adicionar um efeito visual (ícone de rotação, desativação temporária do botão e alteração do texto do botão) durando no mínimo 600ms para feedback suave de carregamento.
- Escopo: `apps/dashboard/src/App.css`, `apps/dashboard/src/components/Header.tsx`, `apps/dashboard/src/App.tsx`.
- Riscos: Nenhum. Lógica visual com debounce/delay artificial no cliente.
- Proposta:
  - Adicionar animação `@keyframes spin` e classe `.animate-spin` no arquivo CSS.
  - Implementar prop `isSyncing` no Header.
  - No App.tsx, calcular o delay com base no tempo de resposta da API para garantir no mínimo 600ms de animação de feedback orgânico.
- Testes:
  - Validar build de produção do frontend (`npm run build -w stoque-fiscal-intelligence-dashboard`).
- Rollback:
  1) `git checkout -- apps/dashboard/src/App.css apps/dashboard/src/components/Header.tsx apps/dashboard/src/App.tsx`
- Status: Aplicado
- Observações: Alterações aplicadas com sucesso sob aprovação [APROVAR-CODIGO] e build de produção validado com 100% de sucesso.

### CHG-0048 — Code Review e Correções de Bugs do Processo de Extração e Dashboard

- Data/Hora: 2026-06-15 16:30
- Contexto: Revisão geral de código solicitada pelo usuário para identificar bugs ocultos e oportunidades de melhoria contínua.
- Objetivo: Corrigir o escape de interpolação da data atual no prompt do Gemini, ajustar o parser de float brasileiro do frontend para evitar corrupção de valores floats nativos, atualizar a interface de tipos do frontend e envelopar o orquestrador de e-mails com try-catch para evitar falhas globais.
- Escopo:
  - `apps/automacao/src/features/pdf/aiExtract.ts`
  - `apps/dashboard/src/App.tsx`
  - `apps/dashboard/src/components/DataEditor.tsx`
  - `apps/dashboard/src/types/index.ts`
  - `apps/automacao/src/features/email/searchDataFromEmail.ts`
- Riscos: Baixo impacto operacional. Ajustes melhoram estabilidade e consistência operacional de cálculo e tipagem.
- Proposta:
  - Substituir `\${todayStr}` por `${todayStr}` no prompt da IA.
  - Ajustar o parser `parseBrazilianNumber` para não alterar strings com ponto decimal simples que não contenham vírgula.
  - Declarar propriedade `excel` nos arquivos representativos no frontend.
  - Introduzir bloco try-catch em `processOneLatestUnread`.
- Testes:
  - Rodar `tsc` no backend e `npm run build` no dashboard para verificar validações estáticas.
  - Executar fluxo de teste local com `npm run start -w stoque-fiscal-intelligence`.
- Rollback:
  1) Executar `git checkout -- apps/automacao/src/features/pdf/aiExtract.ts apps/dashboard/src/App.tsx apps/dashboard/src/components/DataEditor.tsx apps/dashboard/src/types/index.ts apps/automacao/src/features/email/searchDataFromEmail.ts` to discard modifications.
- Status: Aplicado
- Observações: Alterações aplicadas com sucesso sob aprovação [APROVAR-CODIGO] e prontas para validação final.

### CHG-0049 — Rateio Editável no Dashboard e Regeração Automática do Excel

- Data/Hora: 2026-06-18 13:55
- Contexto: Facilidade e curadoria contábil no dashboard dando destaque aos campos Código CR, Código de Natureza e Contrato.
- Objetivo: Posicionar inputs de rateio no topo do formulário, ocultá-los da árvore recursiva inferior, sincronizá-los dinamicamente com o item de rateio e regerar a planilha Rateio.xlsx de forma automática no salvamento.
- Escopo: `apps/dashboard/src/components/DataEditor.tsx`, `apps/dashboard/src/App.tsx`, `apps/automacao/src/server/services/noteService.ts`, `apps/automacao/src/server/controllers/noteController.ts`.
- Riscos: Mapeamentos complexos de múltiplos itens perderem integridade ao alterar o CR global. Mitigado por restrição de sincronização de cabeçalho exclusivamente a notas com apportionment unitário (tamanho 1).
- Proposta: Inserir card de rateio no topo do DataEditor.tsx, ajustar o App.tsx para sincronização, e tornar a rota de salvamento do backend Express assíncrona para chamar o gerador de Excel.
- Testes:
  - Validar build TypeScript no backend e frontend.
  - Editar dados de CR de uma nota de despesa única no dashboard e verificar a planilha Rateio.xlsx gerada na pasta da nota.
- Rollback:
  1) `git checkout -- apps/dashboard/src/components/DataEditor.tsx apps/dashboard/src/App.tsx apps/automacao/src/server/services/noteService.ts apps/automacao/src/server/controllers/noteController.ts`
- Status: Aplicado
- Observações: Alterações aplicadas com sucesso sob aprovação [APROVAR-CODIGO] do usuário. O frontend exibe a seção de rateio no topo e propaga a edição para o apportionment de item único, e o backend regera a planilha do Excel automaticamente.

### CHG-0050 — Correção de Injeção Dinâmica de Chaves no Apportionment Unitário

- Data/Hora: 2026-06-18 14:00
- Contexto: Correção de bug de sincronização onde as chaves cr, naturezaCode e contract não eram criadas no item do apportionment caso estivessem ausentes no JSON original.
- Objetivo: Remover verificação estrita in/member em App.tsx para que as propriedades de classificação contábil editadas no topo do formulário sejam criadas e propagadas de forma determinística para o rateio.
- Escopo: `apps/dashboard/src/App.tsx`.
- Riscos: Nenhum.
- Proposta: Substituir 'if (apportionmentItem && field in apportionmentItem)' por 'if (apportionmentItem)' no manipulador de estado handleInputChange.
- Testes:
  - Salvar alteração de CR e conferir arquivo JSON e Excel de rateio gerados.
- Rollback:
  1) `git checkout -- apps/dashboard/src/App.tsx`
- Status: Aplicado
- Observações: Alterações de correção aplicadas com sucesso sob aprovação [APROVAR-CODIGO] do usuário. A sincronização agora atua de forma determinística injetando as propriedades contábeis em apportionment[0] mesmo quando elas não existem no JSON de origem.

### CHG-0051 — Preenchimento e Higienização do Lote 1 de Documentos Técnicos do Projeto (docs/)

- Data/Hora: 2026-06-22 12:46
- Contexto: A pasta `docs/` contém arquivos markdown de documentação do projeto que continham textos instrucionais e exemplos genéricos desconexos do ecossistema real da aplicação.
- Objetivo: Preencher de forma personalizada os três primeiros arquivos markdown (`01-Documentação de Contexto.md`, `02-Especificação do Projeto.md` e `03-Metodologia.md`) com a realidade da stack e regras de negócio do SFI.
- Escopo: [01-Documentação de Contexto.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/01-Documenta%C3%A7%C3%A3o%20de%20Contexto.md), [02-Especificação do Projeto.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/02-Especifica%C3%A7%C3%A3o%20do%20Projeto.md), [03-Metodologia.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/03-Metodologia.md).
- Riscos: Nenhum. Alteração restrita a arquivos markdown de documentação, sem impacto em código fonte ou dependências da aplicação.
- Proposta: Substituir o conteúdo original genérico pelos textos reais que descrevem a finalidade do SFI, histórias de usuários, requisitos funcionais/não funcionais, restrições e fluxo ágil.
- Testes:
  - Validar renderização visual dos markdowns e do diagrama UML integrado em formato Mermaid.
- Rollback:
  1) `git checkout -- docs/01-Documentação\ de\ Contexto.md docs/02-Especificação\ do\ Projeto.md docs/03-Metodologia.md`
- Status: Aplicado
- Observações: Lote 1 preenchido com sucesso de acordo com a stack real do projeto.

### CHG-0052 — Preenchimento e Higienização do Lote 2 de Documentos Técnicos do Projeto (docs/)

- Data/Hora: 2026-06-22 12:51
- Contexto: A pasta `docs/` contém arquivos markdown de documentação do projeto que continham textos instrucionais e exemplos genéricos desconexos do ecossistema real da aplicação.
- Objetivo: Preencher de forma personalizada os quatro arquivos markdown do Lote 2 (`04-Projeto de Interface.md`, `05-Arquitetura da Solução.md`, `06-Template Padrão da Aplicação.md` e `07-Programação de Funcionalidades.md`) com as informações de interface, contratos de dados, fluxos Mermaid, tecnologias e mapeamento de requisitos do SFI.
- Escopo: [04-Projeto de Interface.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/04-Projeto%20de%20Interface.md), [05-Arquitetura da Solução.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/05-Arquitetura%20da%20Solu%C3%A7%C3%A3o.md), [06-Template Padrão da Aplicação.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/06-Template%20Padr%C3%A3o%20da%20Aplica%C3%A7%C3%A3o.md), [07-Programação de Funcionalidades.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/07-Programação%20de%20Funcionalidades.md).
- Riscos: Nenhum. Alteração restrita a arquivos markdown de documentação, sem impacto em código fonte ou dependências da aplicação.
- Proposta: Substituir o conteúdo original pelos detalhamentos reais do Dashboard, contrato `BoletoData` e mapeamento de requisitos no código-fonte.
- Testes:
  - Validar renderização dos markdowns no editor de documentação.
- Rollback:
  1) `git checkout -- docs/04-Projeto\ de\ Interface.md docs/05-Arquitetura\ da\ Solução.md docs/06-Template\ Padrão\ da\ Aplicação.md docs/07-Programação\ de\ Funcionalidades.md`
- Status: Aplicado
- Observações: Lote 2 preenchido e gravado com sucesso de acordo com a stack real do projeto.

### CHG-0053 — Preenchimento e Higienização do Lote 3 de Documentos Técnicos do Projeto (docs/)

- Data/Hora: 2026-06-22 12:55
- Contexto: A pasta `docs/` contém arquivos markdown de documentação do projeto que continham textos instrucionais e exemplos genéricos desconexos do ecossistema real da aplicação.
- Objetivo: Preencher de forma personalizada os seis arquivos markdown do Lote 3 (`08-Registro de Testes Unitários.md`, `09-Registro de Testes de Integração.md`, `10-Registro de Testes de Sistema.md`, `11-Registro de Contribuição.md`, `12-Apresentação do Projeto.md` e `13-Referências.md`) com as informações de roteiros de testes unitários/integração/e2e reais, organização de equipe, slides de demonstração e referências técnicas do SFI.
- Escopo: [08-Registro de Testes Unitários.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/08-Registro%20de%20Testes%20Unitários.md), [09-Registro de Testes de Integração.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/09-Registro%20de%20Testes%20de%20Integração.md), [10-Registro de Testes de Sistema.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/10-Registro%20de%20Testes%20de%20Sistema.md), [11-Registro de Contribuição.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/11-Registro%20de%20Contribuição.md), [12-Apresentação do Projeto.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/12-Apresentação%20do%20Projeto.md), [13-Referências.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/13-Referências.md).
- Riscos: Nenhum. Alteração restrita a arquivos markdown de documentação, sem impacto em código fonte ou dependências da aplicação.
- Proposta: Substituir o conteúdo original pelos detalhamentos de testes da stack JS/TS, cronograma de contribuição e referências adequadas.
- Testes:
  - Validar renderização dos markdowns no editor de documentação.
- Rollback:
  1) `git checkout -- docs/08-Registro\ de\ Testes\ Unitários.md docs/09-Registro\ de\ Testes\ de\ Integração.md docs/10-Registro\ de\ Testes\ de\ Sistema.md docs/11-Registro\ de\ Contribuição.md docs/12-Apresentação\ do\ Projeto.md docs/13-Referências.md`
- Status: Aplicado
- Observações: Lote 3 preenchido e gravado com sucesso, finalizando toda a higienização de templates de documentação.

### CHG-0054 — Correção de Ponto Flutuante na Soma e Atribuição de Rateio no Excel

- Data/Hora: 2026-06-22 13:35
- Contexto: A soma e acúmulo de itens de rateio com valores quebrados (ex: Telefônica em `test_20`) geram imprecisões no padrão IEEE 754 de ponto flutuante do JavaScript, exibindo dízimas como `188.16000000000003`.
- Objetivo: Garantir que todos os valores numéricos de rateio consolidados e individuais passem por arredondamento de duas casas decimais no arquivo Excel gerado.
- Escopo: [generateRateioExcel.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/excel/generateRateioExcel.ts)
- Riscos: Nenhum.
- Proposta: Aplicar `Math.round(val * 100) / 100` nas atribuições de `value` e no acúmulo de soma de `valueSum`.
- Testes:
  - Reprocessar fatura `test_20` e validar se a soma dos quatro itens fecha em `188.16` exatos na planilha gerada.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/excel/generateRateioExcel.ts`
- Status: Aplicado
- Observações: Correção aplicada com sucesso sob autorização [APROVAR-CODIGO].

### CHG-0056 — Consolidação Geral de Dados Contábeis da base_rateios/

- Data/Hora: 2026-06-22 13:45
- Contexto: A pasta `base_rateios/` contém dezenas de planilhas Excel financeiras com leiautes variados por fornecedor.
- Objetivo: Criar e rodar o script consolidador em `apps/automacao/src/scripts/consolidate_rateios.ts` para converter todas as regras de rateio dispersas em um único banco JSON (`data/rateios_consolidado.json`).
- Escopo: [consolidate_rateios.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/consolidate_rateios.ts), [rateios_consolidado.json](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/data/rateios_consolidado.json)
- Riscos: Mapeamento de chaves errôneas devido a variações de digitação de cabeçalhos pelas equipes financeiras. Mitigado por algoritmo adaptativo e verificação fonética.
- Proposta: Codificar consolidador dinâmico e compilar a base JSON em memória.
- Testes:
  - Executar `npx tsx apps/automacao/src/scripts/consolidate_rateios.ts` e validar se o arquivo JSON final foi gerado e possui os dicionários esperados.
- Rollback:
  1) `git clean -f apps/automacao/src/scripts/consolidate_rateios.ts`
  2) Remover arquivo JSON gerado em `data/rateios_consolidado.json`.
- Status: Aplicado
- Observações: Consolidação executada com sucesso sob aprovação [APROVAR-CODIGO]. Foram consolidados 31 fornecedores, 10 circuitos de telecomunicações, 149 equipamentos e 527 funcionários na base JSON.

### CHG-0057 — Integração do Enriquecimento Contábil com a Base Consolidada JSON

- Data/Hora: 2026-06-22 13:50
- Contexto: O enriquecedor de dados do motor backend consultava planilhas Excel isoladas e um CSV estático em cada execução de fatura.
- Objetivo: Redirecionar o arquivo `dataEnrichment.ts` para ler as regras financeiras a partir do arquivo JSON unificado `data/rateios_consolidado.json`, aumentando a performance e a cobertura de faturas complexas de Telecom e Hardware.
- Escopo: [dataEnrichment.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/dataEnrichment.ts)
- Riscos: Modificação estrutural na lógica de de/para contábil. Mitigado por sistema de fallback inteligente para o CSV antigo nos casos de parceiros não localizados no consolidado.
- Proposta: Substituir o código completo de `dataEnrichment.ts` unificando as rotas de busca contábil nos mapeamentos consolidados.
- Testes:
  - Validar build TypeScript (`npm run build -w stoque-fiscal-intelligence`).
  - Reprocessar nota local Vivo (`test_20.pdf`) e confirmar no JSON gerado o enriquecimento de CR/Natureza corretos.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/dataEnrichment.ts`
- Status: Aplicado
- Observações: Integração de base consolidada aplicada com sucesso sob autorização [APROVAR-CODIGO] e build de produção validado (100% de sucesso na compilação do backend).

### CHG-0058 — Ajuste de Caminhos Relativos no Enriquecedor Contábil (dataEnrichment.ts)

- Data/Hora: 2026-06-22 14:02
- Contexto: A resolução de caminhos em `dataEnrichment.ts` usava 4 subidas de nível (que resultavam na subpasta `apps`), impedindo o carregamento correto das bases contábeis na pasta raiz `data/` e fazendo com que faturas sem CNPJ (como Aleyant) caíssem no fallback de PENDENTE_CADASTRO.
- Objetivo: Corrigir a resolução de caminhos em `dataEnrichment.ts` para subir 5 níveis (`../../../../../`) até a raiz do workspace.
- Escopo: [dataEnrichment.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/dataEnrichment.ts)
- Riscos: Nenhum. Correção de caminho estático.
- Proposta: Substituir caminhos de subida para subir 5 níveis e alcançar a pasta de dados.
- Testes:
  - Executar enriquecedor na fatura `test_21.json` e validar se a chave `Aleyant` é correspondida com sucesso na base consolidada, preenchendo o CR `101` e a natureza `141601001`.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/dataEnrichment.ts`
- Status: Aplicado
- Observações: Ajuste de caminhos aplicado e validado com sucesso (100% de êxito na compilação e enriquecimento contábil da fatura Aleyant).

### CHG-0059 — Título Dinâmico na Planilha Excel Baseado no Nome do Parceiro

- Data/Hora: 2026-06-22 15:25
- Contexto: Os títulos das abas das planilhas Excel de rateio geradas eram estáticos, dificultando a identificação imediata do parceiro em processos manuais de auditoria contábil.
- Objetivo: Higienizar o nome do fornecedor no backend e aplicá-lo dinamicamente na primeira linha mesclada (A1) da planilha Excel.
- Escopo: [generateRateioExcel.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/excel/generateRateioExcel.ts)
- Riscos: Nenhum. Alteração estética na formatação de células de título.
- Proposta: Implementar limpeza regex de sufixos de razão social e interpolação dinâmica nos títulos das duas abas do Excel.
- Testes:
  - Salvar edições no dashboard e validar visualmente a planilha Excel gerada.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/excel/generateRateioExcel.ts`
- Status: Aplicado
- Observações: Alteração estética de títulos do Excel aplicada com sucesso sob autorização [APROVAR-CODIGO] e build de produção validado 100%.

### CHG-0060 — Correção de Células Mescladas na Planilha Excel de Rateio

- Data/Hora: 2026-06-22 15:30
- Contexto: A primeira linha de cabeçalho mesclada com o nome do parceiro comercial estava se repetindo em cada coluna da planilha Excel de rateio.
- Objetivo: Corrigir o merge das células de título (`A1`) nas abas da planilha Excel gerada (`generateRateioExcel.ts`), movendo a definição da propriedade `sheet.columns = [...]` do ExcelJS para o início da configuração da worksheet.
- Escopo: [generateRateioExcel.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/excel/generateRateioExcel.ts)
- Riscos: Nenhum. Alteração puramente de formatação interna de layout do ExcelJS.
- Proposta: Mover a atribuição de `.columns` para antes de `.mergeCells()` em ambas as planilhas (`Rateio` e `Rateio_Detalhado`).
- Testes:
  - Compilação do backend via TypeScript executada com sucesso (`npm run build -w stoque-fiscal-intelligence`).
  - Inspeção visual de planilhas geradas para certificar que a primeira linha está mesclada em uma única célula centralizada sem replicação de textos nas colunas adjacentes.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/excel/generateRateioExcel.ts`
- Status: Aplicado
- Observações: O ExcelJS reconstrói e limpa as propriedades de células existentes (incluindo mesclagens) caso `.columns` seja definido tardiamente. A mudança resolve este problema e garante o merge de layout correto.

### CHG-0061 — Mapeamento Contábil por CNPJ de Parceiro Comercial no Enriquecedor

- Data/Hora: 2026-06-22 15:45
- Contexto: A fatura `test_25.pdf` (cujo fornecedor é extraído pela IA como `"INOVACODE"`) não recuperava as informações contábeis da planilha de rateio correspondente, a qual está cadastrada sob o nome `"Guilherme Carrapatoso"`, caindo em `PENDENTE_CADASTRO`.
- Objetivo: Implementar mapeamento de CNPJs de fornecedores conhecidos (`CNPJ_TO_PARTNER`) para resolver divergências entre o nome fantasia em faturas físicas e a razão social/nome de pasta contábil nas regras de rateio consolidadas.
- Escopo: [dataEnrichment.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/dataEnrichment.ts)
- Riscos: Nenhum. Mapeamento adicional de correspondência para garantir a acurácia dos dados.
- Proposta: Declarar o dicionário de aliases `CNPJ_TO_PARTNER` e utilizá-lo na função `enrichData` antes da busca textual por nome do fornecedor.
- Testes:
  - Validar build TypeScript (`npm run build -w stoque-fiscal-intelligence`).
  - Executar script `test_pdf.ts test_25.pdf` e confirmar o preenchimento correto do CR `807` e da natureza `141601001`.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/dataEnrichment.ts`
- Status: Aplicado
- Observações: Solução de correspondência por CNPJ aplicada e testada com 100% de sucesso. A fatura do fornecedor "INOVACODE" (CNPJ `14.737.908/0001-97`) agora é vinculada dinamicamente às regras contábeis do parceiro "Guilherme Carrapatoso".

### CHG-0062 — Externalização de Aliases de CNPJ Contábeis em Configuração JSON

- Data/Hora: 2026-06-22 15:50
- Contexto: A correspondência contábil por CNPJ de fornecedores conhecidos estava hardcoded no código de `dataEnrichment.ts`, dificultando a manutenção futura pelas equipes de suporte contábil.
- Objetivo: Criar um arquivo JSON de configuração externa `data/cnpj_aliases.json` para mapear aliases de CNPJs de fornecedores e alterar o backend para lê-lo dinamicamente, mantendo o fallback seguro em memória.
- Escopo: [cnpj_aliases.json](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/data/cnpj_aliases.json) (novo), [dataEnrichment.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/dataEnrichment.ts)
- Riscos: Nenhum. Tratamento de erro implementado para evitar falha no backend caso o arquivo JSON esteja corrompido ou ausente.
- Proposta: Injetar a lógica de leitura com `fs.existsSync` e `JSON.parse` em `dataEnrichment.ts`.
- Testes:
  - Validar build TypeScript (`npm run build -w stoque-fiscal-intelligence`).
  - Validar se o arquivo `cnpj_aliases.json` é carregado no início da execução de enriquecimento.
  - Reprocessar `test_25.pdf` e confirmar o enriquecimento dinâmico correto.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/dataEnrichment.ts`
  2) Excluir o arquivo `data/cnpj_aliases.json`.
- Status: Aplicado
- Observações: Solução de externalização implementada e validada. O sistema passa a ler os CNPJs mapeados do JSON dinamicamente, mantendo a arquitetura limpa e independente de recompilação do backend.

### CHG-0063 — Reprocessamento Contábil de Faturas no Dashboard

- Data/Hora: 2026-06-22 16:00
- Contexto: O Dashboard possuía um botão obsoleto "Reprovar" e o usuário necessitava de um mecanismo ágil para reprocessar (enriquecer novamente) faturas individuais ou em lote baseando-se no arquivo consolidado de rateios atualizado.
- Objetivo: Renomear e recolorir o botão para "Reprocessar" (cor verde), e programar o backend e o frontend para executar o reprocessamento de faturas (individualmente quando uma nota estiver selecionada, ou em lote para todas as notas cadastradas quando nenhuma nota estiver selecionada).
- Escopo:
  - Backend: [noteRoutes.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/routes/noteRoutes.ts), [noteController.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/controllers/noteController.ts), [noteService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/noteService.ts)
  - Frontend: [api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts), [DataEditor.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/DataEditor.tsx), [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx), [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css)
- Riscos: Nenhum. Lógica isolada e com tratamento de erros.
- Proposta:
  - No frontend, criar botão `.btn-success` verde, mapear o clique para chamar a API de reprocessamento e passar `'all'` se nenhuma fatura estiver ativa.
  - No backend, criar rota `/reprocess/:id`, ler o JSON, rodar o `enrichData` do motor e reescrever o JSON/Excel.
- Testes:
  - Compilar backend TypeScript (`npm run build -w stoque-fiscal-intelligence`) - Sucesso.
  - Compilar frontend React/Vite (`npm run build -w stoque-fiscal-intelligence-dashboard`) - Sucesso.
- Rollback:
  1) `git checkout -- apps/automacao/src/server/routes/noteRoutes.ts apps/automacao/src/server/controllers/noteController.ts apps/automacao/src/server/services/noteService.ts apps/dashboard/src/services/api.ts apps/dashboard/src/components/DataEditor.tsx apps/dashboard/src/App.tsx apps/dashboard/src/App.css`
- Status: Aplicado
- Observações: Funcionalidade de reprocessamento em lote e individual implementada com sucesso no Dashboard e backend, e build de produção validado 100%.

### CHG-0064 — Correção do Roteamento Express de Reprocessamento no Backend

- Data/Hora: 2026-06-22 16:08
- Contexto: Ao acionar a rota de reprocessamento, o backend retornava erro 404/500 porque a chamada era capturada por outra rota.
- Objetivo: Corrigir o conflito de roteamento no arquivo `noteRoutes.ts`, onde a rota genérica curinga `/:id` (do método de salvamento) estava declarada antes de `/reprocess/:id`, fazendo com que a requisição de reprocessamento fosse erroneamente engolida e tratada como salvamento de uma nota inexistente com ID `"reprocess"`.
- Escopo: [noteRoutes.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/routes/noteRoutes.ts)
- Riscos: Nenhum. Correção estrita de ordem de carregamento de rotas.
- Proposta: Inverter as declarações de rotas no arquivo, posicionando a rota específica de reprocessamento antes da genérica curinga.
- Testes:
  - Validar build TypeScript (`npm run build -w stoque-fiscal-intelligence`) - Sucesso.
  - Verificar roteamento correto e enriquecimento de dados sem retornar erro na interface.
- Rollback:
  1) `git checkout -- apps/automacao/src/server/routes/noteRoutes.ts`
- Status: Aplicado
- Observações: Correção aplicada e compilada com sucesso. O Express passa a discriminar a rota de reprocessamento corretamente, reestabelecendo a integração com o frontend.

### CHG-0065 — Implementação de Sistema de Notificações Toast no Dashboard

- Data/Hora: 2026-06-22 16:18
- Contexto: O usuário necessitava de feedback visual (popups de toast) na interface do Dashboard ao salvar, aprovar e reprocessar faturas.
- Objetivo: Projetar e codificar um sistema de notificações Toast em Vanilla CSS e React puro para alertar o usuário sobre o resultado de suas ações de forma premium e elegante, sem a adição de dependências npm.
- Escopo: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx), [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css)
- Riscos: Nenhum.
- Proposta:
  - Declarar estrutura de estado de toasts e manipulador `showToast` no componente principal.
  - Integrar os popups de feedback nas chamadas de `handleSave` e `handleReprocess` no lugar dos alerts do navegador.
  - Estilizar o container flutuante no canto inferior direito do CSS com efeitos de transição e cores HSL limpas.
- Testes:
  - Validar compilação do dashboard (`npm run build -w stoque-fiscal-intelligence-dashboard`) - Sucesso.
  - Executar ações e checar a exibição das notificações na tela.
- Rollback:
  1) `git checkout -- apps/dashboard/src/App.tsx apps/dashboard/src/App.css`
- Status: Aplicado
- Observações: Sistema de Toasts ativado e build do frontend concluído 100%. Experiência de feedback visual de operações modernizada.

### CHG-0066 — Reposicionamento de Toasts no Canto Superior Direito no Dashboard

- Data/Hora: 2026-06-22 16:20
- Contexto: A visualização dos toasts ficava no canto inferior e o usuário solicitou o seu reposicionamento no canto superior direito para melhor legibilidade.
- Objetivo: Modificar a ancoragem do container de Toasts e a direção da animação de entrada no arquivo de estilos CSS para que fiquem no topo direito.
- Escopo: [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css)
- Riscos: Nenhum.
- Proposta:
  - Alterar `.toast-container` substituindo `bottom: 24px` por `top: 24px`.
  - Atualizar `@keyframes toastSlideIn` substituindo o movimento vertical de baixo para cima (`translateY`) por um movimento horizontal lateral da direita para a esquerda (`translateX`).
- Testes:
  - Validar compilação do dashboard (`npm run build -w stoque-fiscal-intelligence-dashboard`) - Sucesso.
  - Testar o comportamento visual da notificação no navegador.
- Rollback:
  1) `git checkout -- apps/dashboard/src/App.css`
- Status: Aplicado
- Observações: Reposicionamento executado com sucesso e build de produção validado 100%.

### CHG-0067 — Aba de Histórico de Consumo de IA (usage_log.csv) no Dashboard

- Data/Hora: 2026-06-22 16:25
- Contexto: O usuário necessitava de uma tela para consultar o histórico do uso de IA e custos operacionais a partir do arquivo `data/usage_log.csv`.
- Objetivo: Criar rotas no backend para ler e parsear o log CSV como JSON e criar abas de navegação ("Faturas" e "Histórico") no cabeçalho do Dashboard, exibindo uma tabela moderna e responsiva de consumo.
- Escopo:
  - Backend: [noteRoutes.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/routes/noteRoutes.ts), [noteController.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/controllers/noteController.ts), [noteService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/noteService.ts)
  - Frontend: [api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts), [Header.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Header.tsx), [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx)
- Riscos: Nenhum. Lógica isolada de leitura de arquivo.
- Proposta:
  - No backend, implementar a leitura do CSV através do utilitário `splitCsvLine` e expor na rota `/api/notes/usage`.
  - No frontend, estruturar abas no cabeçalho e renderizar condicionalmente a listagem principal ou a tabela de histórico formatada com datas locais brasileiras e dados financeiros.
- Testes:
  - Validar build TypeScript do backend e do frontend (Sucesso).
  - Validar carregamento correto dos logs históricos.
- Rollback:
  1) `git checkout -- apps/automacao/src/server/routes/noteRoutes.ts apps/automacao/src/server/controllers/noteController.ts apps/automacao/src/server/services/noteService.ts apps/dashboard/src/services/api.ts apps/dashboard/src/components/Header.tsx apps/dashboard/src/App.tsx`
- Status: Aplicado
- Observações: Aba de Histórico implementada e homologada via compilação 100% livre de erros.

### CHG-0068 — Padronização de Datas no Log de Consumo e Liberação de Porta da API

- Data/Hora: 2026-06-22 16:30
- Contexto: O formato brasileiro de data em `usage_log.csv` quebrava a inicialização de datas no navegador, e um processo órfão na porta 3001 impedia que a rota de histórico respondesse.
- Objetivo: Normalizar as datas em formato brasileiro do CSV no backend para formato ISO-8601 e encerrar processos órfãos na porta 3001.
- Escopo: [noteService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/noteService.ts)
- Riscos: Nenhum. Correção isolada de formato de dados.
- Proposta: Implementar função `parseCsvDate` no backend para mapear strings brasileiras para formato de string ISO.
- Testes:
  - Chamar rota `/api/notes/usage` e conferir a conversão.
  - Verificar se a tabela carrega de forma limpa no frontend.
- Rollback:
  1) `git checkout -- apps/automacao/src/server/services/noteService.ts`
- Status: Aplicado
- Observações: Processo órfão derrubado, normalização de datas aplicada no backend com sucesso e build de produção validado 100%.

### CHG-0069 — Ajuste de Overflow e Responsividade do Card de Histórico

- Data/Hora: 2026-06-22 16:38
- Contexto: O card branco do Histórico de consumo vazava visualmente da tela devido à ausência de restrição de largura em nomes de fornecedores longos e conflito de display flex na aba do histórico.
- Objetivo: Truncar nomes de fornecedores e arquivos longos na tabela do dashboard, e ajustar o comportamento do container para `display: block` e `width: 100%`.
- Escopo: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx)
- Riscos: Nenhum. Correção puramente estética.
- Proposta: Aplicar larguras fixadas por coluna e truncamento com ellipsis no arquivo e fornecedor, além de ativar o scroll horizontal interno se a largura da janela for menor que o espaço da tabela.
- Testes:
  - Validar build de produção do dashboard.
  - Verificar responsividade da tabela redimensionando a janela do browser.
- Rollback:
  1) `git checkout -- apps/dashboard/src/App.tsx`
- Status: Aplicado
- Observações: Redimensionamento e truncamento com tooltips implementados e compilados com sucesso sob build 100% livre de falhas.

### CHG-0070 — Geração de ID Único e Exibição na Tabela de Histórico

- Data/Hora: 2026-06-22 16:40
- Contexto: O usuário necessitava de um identificador sequencial visual para cada registro do histórico para auditoria e referência pontual de logs.
- Objetivo: Introduzir chave de identificação `id` auto-gerada a partir da leitura do CSV no backend e incluí-la como primeira coluna da tabela do Histórico no Dashboard.
- Escopo:
  - Backend: [noteService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/noteService.ts)
  - Frontend: [api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts), [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx)
- Riscos: Nenhum. Campo de dados leve e computado dinamicamente.
- Proposta: Injetar índice sequencial `id` na resposta JSON e renderizar no frontend como chave React estável e coluna de dados.
- Testes:
  - Validar build de TypeScript.
  - Testar correspondência de dados de log na tela.
- Rollback:
  1) `git checkout -- apps/automacao/src/server/services/noteService.ts apps/dashboard/src/services/api.ts apps/dashboard/src/App.tsx`
- Status: Aplicado
- Observações: Geração de IDs dinâmicos de log e exibição em coluna aplicada com sucesso e builds validados 100%.

### CHG-0071 — Redimensionamento Dinâmico (Arraste) da Sidebar no Dashboard

- Data/Hora: 2026-06-23 11:35
- Contexto: O usuário necessitava de responsividade simétrica (efeito de arraste do divisor) tanto na barra lateral esquerda quanto no painel de edição do lado direito.
- Objetivo: Implementar uma segunda barra resizer à esquerda do DocumentViewer para controlar a largura da barra lateral (Sidebar) de forma fluida.
- Escopo:
  - Frontend: [Sidebar.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Sidebar.tsx), [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx), [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css)
- Riscos: Quebra de layout no mobile devido a sobreposições de largura inline. (Mitigado pelo uso de variáveis CSS customizadas e min-width: 0 no mobile).
- Proposta:
  - Na Sidebar, aceitar prop `style` e injetar a variável `--sidebar-width-dynamic`.
  - No CSS, consumir essa variável com fallback e aplicar overrides seguros no mobile.
  - No App.tsx, adicionar listeners e o novo componente divisor.
- Testes:
  - Validar build do dashboard: `npm run build -w stoque-fiscal-intelligence-dashboard`
  - Validar arraste manual de ambas as divisórias em desktop.
  - Validar responsividade e sumiço de barras divisoras em resoluções menores que 768px.
- Rollback:
  1) `git checkout -- apps/dashboard/src/components/Sidebar.tsx apps/dashboard/src/App.tsx apps/dashboard/src/App.css`
- Status: Aplicado
- Observações: Implementado sem a necessidade de novas dependências e garantindo a responsividade no mobile.

### CHG-0072 — Exclusão de Scripts Temporários e de Teste Obsoletos no Backend

- Data/Hora: 2026-06-23 12:30
- Contexto: Limpeza de código morto e simplificação do diretório de scripts do backend.
- Objetivo: Excluir os scripts list_models.ts (acessório) e temp_extract.ts (obsoleto de desenvolvimento rápido).
- Escopo:
  - Excluídos: [list_models.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/list_models.ts), [temp_extract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/temp_extract.ts)
- Riscos: Nenhum. Arquivos não são referenciados no package.json ou na execução principal do motor de automação.
- Proposta: Excluir fisicamente ambos os arquivos por linha de comando.
- Testes:
  - Confirmar a compilação limpa do projeto após a deleção: `npm run build -w stoque-fiscal-intelligence`
- Rollback:
  1) `git checkout -- apps/automacao/src/scripts/list_models.ts apps/automacao/src/scripts/temp_extract.ts`
- Status: Aplicado
- Observações: Remoção concluída sob autorização explícita [APROVAR-CODIGO] do usuário e build executado com sucesso.

### CHG-0073 — Estruturação do Cliente de Consulta (GET) Zeev API para o P032

- Data/Hora: 2026-06-30 09:47
- Contexto: Preparação de infraestrutura sólida para integrar o robô ao processo "Enviar Documento Fiscal de faturas de serviços avulsos e contratos (P032)" do Zeev.
- Objetivo: Criar um cliente HTTP para requisições de consulta (`GET`) que identifique o fluxo e exporte o esquema de campos do formulário para posterior mapeamento.
- Escopo:
  - Backend: [zeevClient.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/infra/zeev/zeevClient.ts) e script [check_zeev_fields.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/check_zeev_fields.ts).
- Riscos:
  - Vazamento de credenciais: Mitigado pela delegação de credenciais estritamente às variáveis do `.env` local.
  - Bloqueio de rede ou timeout: Mitigado com timeout explícito de 10s no Axios.
- Proposta: Estrutura isolada de cliente de leitura e script de exportação do esquema de formulário.
- Testes:
  - Validar compilação do TypeScript no monorepo.
  - Execução experimental do script de exportação de schema.
- Rollback:
  - 1) Deletar pasta `apps/automacao/src/infra/zeev/`
  - 2) Deletar arquivo `apps/automacao/src/scripts/check_zeev_fields.ts`
- Status: Aplicado
- Observações: Sem impactos no fluxo de produção atual ou modificação em rotas do dashboard.

### CHG-0074 — Alteração de Script para Consulta Direta do Fluxo ID 2044

- Data/Hora: 2026-06-30 10:04
- Contexto: Usuário identificou que o ID correspondente ao processo P032 no ambiente do Zeev é o 2044.
- Objetivo: Modificar o script do robô para buscar de forma direta e exclusiva o formulário associado a esse fluxo.
- Escopo:
  - Backend: [check_zeev_fields.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/check_zeev_fields.ts).
- Riscos: Nenhum. Script permanece operando estritamente em modo de leitura (GET).
- Proposta: Injetar a leitura de `ZEEV_FLOW_ID` com fallback padrão em `2044`.
- Testes:
  - Validar a correta geração do arquivo `zeev_p032_fields_schema.json`.
- Rollback:
  - `git checkout -- apps/automacao/src/scripts/check_zeev_fields.ts`
- Status: Aplicado

### CHG-0075 — Alteração do Script de Consulta para o Fluxo de Teste ID 1908

- Data/Hora: 2026-06-30 10:18
- Contexto: Preparação de testes com fluxo sandbox/teste ID 1908 configurado pelo próprio usuário no Zeev.
- Objetivo: Simplificar o script para ler diretamente o formulário do fluxo 1908, exportando o resultado em arquivo JSON dinâmico baseado no ID.
- Escopo:
  - Backend: [check_zeev_fields.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/check_zeev_fields.ts).
- Riscos: Nenhum. Script opera em modo de leitura (GET) sem risco de poluir dados do Zeev.
- Proposta: Injetar 1908 como fallback do ID do fluxo e ajustar o nome do JSON gerado para `zeev_1908_fields_schema.json`.
- Testes:
  - Executar o script e verificar se o JSON gerado em `data/extracted/zeev_1908_fields_schema.json` é estruturado corretamente.
- Rollback:
  - `git checkout -- apps/automacao/src/scripts/check_zeev_fields.ts`
- Status: Aplicado

### CHG-0076 — Refatoração Visual e Técnica do Documento de Orientações Zeev

- Data/Hora: 2026-06-30 11:29
- Contexto: Organização e documentação clara do mapeamento de atributos lidos pelo robô para o Zeev.
- Objetivo: Melhorar a visualização do arquivo `orientacoes_envio_zeev.md` utilizando markdown rico, separando os tipos de dados (fixos vs dinâmicos) e associando com os campos da tipagem `BoletoData`.
- Escopo:
  - Documentação: [orientacoes_envio_zeev.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/orientacoes_envio_zeev.md).
- Riscos: Nenhum. Alteração estritamente de documentação markdown.
- Proposta: Nova tabela estruturada e formatação profissional de alertas de conformidade.
- Testes:
  - Validar legibilidade do documento no painel.
- Rollback:
  - `git checkout -- orientacoes_envio_zeev.md`
- Status: Aplicado

### CHG-0077 — Ingestão de Atributos Técnicos do Zeev na Documentação de Envio

- Data/Hora: 2026-06-30 11:39
- Contexto: A integração necessita de referências inequívocas das chaves técnicas de formulário do Zeev para o fluxo P032.
- Objetivo: Injetar chaves técnicas de formulário reais (ex: `possuiContrato`, `cRPrincipal`, `anexarArquivo`) obtidas a partir de `zeev_2044_fields_schema.json` nas tabelas de orientações de envio.
- Escopo:
  - Documentação: [orientacoes_envio_zeev.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/orientacoes_envio_zeev.md).
- Riscos: Nenhum. Alteração puramente documental de metadados de API.
- Proposta: Inserção de colunas com as propriedades `Chave Técnica (API)` e `Tipo de Dado` nas tabelas dinâmicas, fixas e de anexos.
- Testes:
  - Validar a legibilidade do arquivo atualizado no painel do editor.
- Rollback:
  - `git checkout -- orientacoes_envio_zeev.md`
- Status: Aplicado

### CHG-0078 — Adequação a Novas Regras de Estilo e Diretrizes da IA

- Data/Hora: 2026-06-30 12:02
- Contexto: O usuário atualizou as diretrizes do projeto no arquivo GEMINI.md.
- Objetivo: Adequar a linguagem de comunicação, regras de banco de dados e padrões de qualidade do robô às novas regras vigentes.
- Escopo:
  - Documentação interna de comportamento da IA.
- Riscos: Nenhum.
- Proposta: Adequação da comunicação textual para remover ícones, metáforas gastas e estruturas retóricas proibidas.
- Testes:
  - Validar a conformidade de estilo de escrita na resposta atual.
- Rollback:
  - Não aplicável por se tratar de instrução comportamental da IA.
- Status: Aplicado

### CHG-0079 — Paginação, Filtros e Coluna Zeev ID no Histórico do Dashboard

- Data/Hora: 2026-06-30 12:35
- Contexto: A aba de Histórico de consumo da IA precisa de paginação, filtros de pesquisa e da exibição do Zeev ID.
- Objetivo: Implementar filtros textuais/modelo/data e paginação em React, configurar scroll horizontal customizado e adicionar a coluna ID Zeev obtida do CSV.
- Escopo:
  - Frontend: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx), [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css), [api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts).
  - Backend: [noteService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/noteService.ts).
- Riscos: Quebra de layout ou de compilação TypeScript no frontend. Mitigado por testes de tipagem e largura mínima inline.
- Proposta: Inclusão de estados locais no React, novos inputs de filtro, botões de navegação, scrollbars webkit e leitura da nona coluna do CSV.
- Testes:
  - Validar compilação do dashboard: `npm run build -w stoque-fiscal-intelligence-dashboard`
  - Validar funcionamento dos filtros e alteração de páginas na interface.
- Rollback:
  - `git checkout -- apps/dashboard/src/App.tsx apps/dashboard/src/App.css apps/dashboard/src/services/api.ts apps/automacao/src/server/services/noteService.ts`
- Status: Aplicado

### CHG-0080 — Melhoria de Contraste nos Filtros de Histórico

- Data/Hora: 2026-06-30 12:38
- Contexto: Os campos de filtro na aba Histórico apresentavam baixo contraste de texto e bordas em determinadas configurações de exibição.
- Objetivo: Garantir legibilidade perfeita forçando fundos brancos, cor de texto cinza escura de alto contraste e bordas nítidas em todos os inputs.
- Escopo:
  - Frontend: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx).
- Riscos: Nenhum. Alteração estritamente estética de CSS/Style inline.
- Proposta: Injetar `backgroundColor: '#ffffff'`, `color: '#1f2937'` e `border: '1px solid #9ca3af'` nas tags de input, select e datepicker.
- Testes:
  - Verificar a legibilidade e contraste dos filtros no dashboard.
- Rollback:
  - `git checkout -- apps/dashboard/src/App.tsx`
- Status: Aplicado

### CHG-0081 — Inclusão de Colunas de Auditoria no Histórico de Consumo

- Data/Hora: 2026-06-30 12:39
- Contexto: A auditoria de logs necessita de mais dados fiscais do documento processado vinculados ao log de uso.
- Objetivo: Adicionar as colunas CNPJ do Fornecedor, Número do Documento, Valor da Fatura e Status à tabela de histórico e expandir o script do robô para gravá-las no CSV.
- Escopo:
  - Frontend: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx), [api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts).
  - Backend: [noteService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/noteService.ts).
  - Automacao: [aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts).
- Riscos: Incompatibilidade com CSVs antigos. Mitigado por fallbacks para campos indefinidos no parser.
- Proposta: Enriquecer a estrutura gravada pelo robô e consumida pelo Dashboard com dados de negócio da fatura extraída.
- Testes:
  - Testar leitura de logs legados na aba de histórico do frontend.
  - Simular extração de nota para verificar nova linha formatada no CSV.
- Rollback:
  - `git checkout -- apps/dashboard/src/App.tsx apps/dashboard/src/services/api.ts apps/automacao/src/server/services/noteService.ts apps/automacao/src/features/pdf/aiExtract.ts`
- Status: Aplicado

### CHG-0082 — Tradução de Campos de Curadoria Contábil e Adicional

- Data/Hora: 2026-06-30 12:49
- Contexto: A curadoria de dados de faturas exibia algumas chaves JSON em inglês (como `apportionment`, `previousReading`, `ourNumber`) no painel.
- Objetivo: Traduzir e mapear todas as chaves técnicas comuns extraídas da IA para rótulos em português no labelMap do editor.
- Escopo:
  - Frontend: [DataEditor.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/DataEditor.tsx).
- Riscos: Nenhum. Mapeamento de chaves estático.
- Proposta: Inclusão de traduções para chaves adicionais como `apportionment` (Itens de Rateio), `cr` (Centro de Resultado), `ourNumber` (Nosso Número) e outras no mapeamento.
- Testes:
  - Validar a correta renderização dos campos na curadoria de dados (aba "Notas") do Dashboard.
- Rollback:
  - `git checkout -- apps/dashboard/src/components/DataEditor.tsx`
- Status: Aplicado

### CHG-0083 — Efeito Hover e Melhorias de UI/UX no Histórico

- Data/Hora: 2026-06-30 12:56
- Contexto: A visualização do histórico de consumo necessitava de melhorias de feedback visual e padronização estética de botões e badges.
- Objetivo: Implementar transição de hover nas linhas da tabela, formatar os tokens/custos como badges organizados e estilizar os botões de paginação.
- Escopo:
  - Frontend: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx), [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css).
- Riscos: Nenhum. Ajustes puramente de design e classes de renderização React.
- Proposta: Inserção de classes CSS `.history-row`, `.pagination-btn`, `.cost-badge`, `.token-badge` e injeção do badge contador de total de registros no título principal.
- Testes:
  - Validar interações visuais de mouse na tabela e clique nos botões estilizados de paginação.
- Rollback:
  - `git checkout -- apps/dashboard/src/App.tsx apps/dashboard/src/App.css`
- Status: Aplicado

### CHG-0084 — Ajuste das Colunas da Aba de Rateio Consolidado no Excel

- Data/Hora: 2026-06-30 13:00
- Contexto: A aba Rateio consolidada do arquivo Excel é enviada para o Zeev e deve conter apenas dados de imputação de controle.
- Objetivo: Simplificar a aba Rateio para manter apenas Código CR, Cód. Natureza, Contrato e Valor, enquanto preserva as descrições na aba Rateio Detalhado.
- Escopo:
  - Automacao: [generateRateioExcel.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/excel/generateRateioExcel.ts).
- Riscos: Nenhum. Ajuste na modelagem das tabelas do arquivo binário gerado.
- Proposta: Reduzir a configuração de colunas de 7 para 4 na primeira worksheet do ExcelJS.
- Testes:
  - Reprocessar nota de teste e abrir o arquivo Excel gerado para confirmar a redução de colunas na aba Rateio.
- Rollback:
  - `git checkout -- apps/automacao/src/features/excel/generateRateioExcel.ts`
- Status: Aplicado

### CHG-0085 — Exibição do Nome do Cliente na Sidebar do Dashboard

- Data/Hora: 2026-06-30 13:06
- Contexto: A lista de faturas na barra lateral necessitava de melhor contextualização exibindo o nome do cliente correspondente.
- Objetivo: Injetar uma tag dinâmica indicadora de cliente sob o nome do arquivo para cada documento da Sidebar, com estilização responsiva a seleções de foco.
- Escopo:
  - Frontend: [Sidebar.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Sidebar.tsx).
- Riscos: Nenhum. Ajustes estritamente no código de markup do componente.
- Proposta: Inserção de um contêiner flexível com fallbacks e detecção de item ativo para troca dinâmica de temas de cores.
- Testes:
  - Verificar visualização do badge de clientes na Sidebar do Dashboard.
- Rollback:
  - `git checkout -- apps/dashboard/src/components/Sidebar.tsx`
- Status: Aplicado

### CHG-0086 — Inversão e Destaque do Fornecedor na Sidebar do Dashboard

- Data/Hora: 2026-06-30 13:08
- Contexto: A listagem na barra lateral prioriza o fornecedor sobre o arquivo e corrige a associação conceitual de Payer para Supplier.
- Objetivo: Modificar o topo de cada card para exibir o nome do Fornecedor em negrito e o arquivo abaixo como etiqueta secundária cinza/azul.
- Escopo:
  - Frontend: [Sidebar.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Sidebar.tsx).
- Riscos: Nenhum. Ajustes estritamente visuais no JSX.
- Proposta: Inverter a ordem, alterar chaves de `payer.name` para `supplier.name` e ajustar margens/fontes inline.
- Testes:
  - Validar visualização dos cards na Sidebar do Dashboard.
- Rollback:
  - `git checkout -- apps/dashboard/src/components/Sidebar.tsx`
- Status: Aplicado

### CHG-0087 — Expansão dos Critérios de Busca na Sidebar

- Data/Hora: 2026-06-30 13:09
- Contexto: A caixa de pesquisa de faturas na barra lateral buscava apenas pelo nome físico do arquivo.
- Objetivo: Atualizar o filtro para realizar pesquisas unificadas avaliando o nome do arquivo, nome do cliente (pagador) ou nome do fornecedor (prestador).
- Escopo:
  - Frontend: [Sidebar.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Sidebar.tsx).
- Riscos: Nenhum. Alteração na lógica condicional de filtro no frontend.
- Proposta: Reescrever a constante `filteredNotes` cruzando a propriedade `searchTerm` com `note.id`, `payer.name` e `supplier.name`.
- Testes:
  - Digitar partes do nome de fornecedores e de arquivos na busca da Sidebar e verificar se o filtro oculta ou exibe os cards conforme esperado.
- Rollback:
  - `git checkout -- apps/dashboard/src/components/Sidebar.tsx`
- Status: Aplicado

### CHG-0088 — Reestilização e Cardização da Lista de Itens na Sidebar

- Data/Hora: 2026-06-30 13:11
- Contexto: Os itens na barra lateral pareciam compactados e sem separação física nítida por estarem todos com fundo transparente sobre fundo branco.
- Objetivo: Cardizar os itens da Sidebar atribuindo-lhes fundo cinza muito suave, bordas de contorno nítidas, sombras de elevação e espaçamento vertical otimizado.
- Escopo:
  - Frontend: [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css).
- Riscos: Nenhum. Alteração meramente visual de CSS.
- Proposta: Reescrever `.note-item` em `App.css` configurando `background: #f9fafb`, `border: 1px solid #e5e7eb`, `margin-bottom: 0.5rem` e `box-shadow`.
- Testes:
  - Validar a separação e visualização dos cards na Sidebar do Dashboard.
- Rollback:
  - `git checkout -- apps/dashboard/src/App.css`
- Status: Aplicado

### CHG-0089 — Funcionalidade de Exclusão de Faturas no Dashboard e Servidor

- Data/Hora: 2026-06-30 13:14
- Contexto: Os analistas contábeis precisam remover notas duplicadas ou fora do escopo diretamente da interface do Dashboard SFI.
- Objetivo: Criar rota DELETE no backend para remover a pasta de dados do disco, adicionar ícone de lixeira (com hover) nos cards e painel de confirmação in-card vermelho/cinza para prevenção de erros.
- Escopo:
  - Backend: [noteService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/noteService.ts), [noteController.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/controllers/noteController.ts), [noteRoutes.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/routes/noteRoutes.ts).
  - Frontend: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx), [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css), [Sidebar.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Sidebar.tsx), [api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts).
- Riscos: Exclusão não intencional de faturas. Mitigado pela exigência de confirmação manual em dois cliques no próprio card.
- Proposta: Implementação de endpoints do Express, chamadas de delete com Axios e re-render do estado do React com toasts de sucesso.
- Testes:
  - Simular exclusão de uma fatura de teste e auditar a remoção da pasta do sistema de arquivos e atualização dos cards no painel.
- Rollback:
  - `git checkout -- apps/automacao/src/server/services/noteService.ts apps/automacao/src/server/controllers/noteController.ts apps/automacao/src/server/routes/noteRoutes.ts apps/dashboard/src/App.tsx apps/dashboard/src/App.css apps/dashboard/src/components/Sidebar.tsx apps/dashboard/src/services/api.ts`
- Status: Aplicado

### CHG-0090 — Resiliência Concorrente de Desmontagem para Exclusão de PDFs

- Data/Hora: 2026-06-30 13:19
- Contexto: A exclusão de faturas ativas no Windows falha devido ao bloqueio de arquivo físico mantido pelo iframe do visualizador de PDF.
- Objetivo: Modificar a ordem de execução do frontend para limpar o visualizador, esperar 250ms pela liberação do sistema de arquivos e só então disparar o delete na API.
- Escopo:
  - Frontend: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx).
- Riscos: Nenhum. Ajuste no fluxo assíncrono do React.
- Proposta: Inverter lógica do handleDeleteNote e inserir um delay técnico utilizando setTimeout encapsulado em Promise.
- Testes:
  - Validar a deleção de nota ativa pelo Dashboard sem erros de resource busy do Windows.
- Rollback:
  - `git checkout -- apps/dashboard/src/App.tsx`
- Status: Aplicado

### CHG-0091 — Coluna de Status do Arquivo Dinâmico no Histórico de Logs

- Data/Hora: 2026-06-30 13:25
- Contexto: Os logs históricos no CSV continuam gravados após faturas serem removidas físicas do disco. Os analistas necessitam de visibilidade do estado de deleção destas.
- Objetivo: Injetar a propriedade de visualização statusArquivo checada dinamicamente pelo backend e exibir a coluna correspondente no Dashboard SFI.
- Escopo:
  - Backend: [noteService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/noteService.ts).
  - Frontend: [api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts), [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx).
- Riscos: Nenhum. Lógica analítica local por demanda de requisição.
- Proposta: Mapear existencia de pasta do arquivo no backend e renderizar o componente tag colorido (Vermelho/Verde/Azul) no React.
- Testes:
  - Verificar a renderização da nova coluna "Status do Arquivo" e o comportamento reativo ao excluir documentos.
- Rollback:
  - `git checkout -- apps/automacao/src/server/services/noteService.ts apps/dashboard/src/services/api.ts apps/dashboard/src/App.tsx`
- Status: Aplicado

### CHG-0092 — Botão de Seta Voltar na Aba de Histórico do Dashboard

- Data/Hora: 2026-06-30 13:30
- Contexto: A navegação de retorno do histórico para o painel principal de notas dependia do Header superior.
- Objetivo: Injetar botão com seta esquerda interativa de voltar ao lado do título do histórico para agilizar a navegação interna.
- Escopo:
  - Frontend: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx).
- Riscos: Nenhum. Ajustes estritamente no fluxo do React.
- Proposta: Importar `ArrowLeft` do Lucide React, embutir tag button acionando `setActiveTab("notes")` e estilizar transição de foco.
- Testes:
  - Verificar a navegabilidade de retorno clicando na seta.
- Rollback:
  - `git checkout -- apps/dashboard/src/App.tsx`
- Status: Aplicado

### CHG-0093 — Herança Contábil de Cabeçalho nos Itens de Rateio do Excel

- Data/Hora: 2026-06-30 13:42
- Contexto: Edições do usuário no CR e natureza geral no Dashboard não refletiam no Excel se a nota contivesse itens de rateio de valor "N/A".
- Objetivo: Implementar lógica de fallback e herança no gerador de Excel para alimentar os itens de rateio com os dados contáveis gerais editados na interface.
- Escopo:
  - Backend: [generateRateioExcel.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/excel/generateRateioExcel.ts).
- Riscos: Nenhum. Mapeamento condicional seguro antes da montagem física da tabela.
- Proposta: Sobrescrever a lista de itens aplicando fallbacks de `accountingFields` caso o CR/natureza correspondente seja igual a "N/A" ou vazio.
- Testes:
  - Salvar nota e verificar se os dados do Excel são regenerados com o CR e natureza corrigidos.
- Rollback:
  - `git checkout -- apps/automacao/src/features/excel/generateRateioExcel.ts`
- Status: Aplicado

### CHG-0094 — Reordenação de Colunas na Tabela de Histórico do Dashboard

- Data/Hora: 2026-06-30 13:54
- Contexto: A coluna Status do Arquivo precisava de melhor prioridade visual e contexto de auditoria na aba Histórico.
- Objetivo: Mover a coluna Status do Arquivo para a 7ª posição da tabela, ocupando o local anterior de Doc. Fiscal e deslocando-o para a 8ª posição.
- Escopo:
  - Frontend: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx).
- Riscos: Nenhum. Mudança de layout estritamente de colunas no React.
- Proposta: Reordenar as tags th no thead e as tags td no tbody do App.tsx.
- Testes:
  - Verificar visualização das colunas na tabela de Histórico do Dashboard.
- Rollback:
  - `git checkout -- apps/dashboard/src/App.tsx`
- Status: Aplicado

### CHG-0095 — Fluxo Completo de Autenticação Corporativa (Cookies/JWT)

- Data/Hora: 2026-06-30 13:58
- Contexto: A aplicação do Dashboard SFI necessitava de uma tela de login e de restrição de rotas de faturas para acesso autenticado.
- Objetivo: Proteger endpoints do backend com middleware de token bearer, mapear autenticação baseada em usuário fixo, criar interceptor Axios no frontend e gravar tokens em Cookies.
- Escopo:
  - Backend: [app.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/app.ts), [authMiddleware.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/middlewares/authMiddleware.ts), [authController.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/controllers/authController.ts), [authRoutes.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/routes/authRoutes.ts).
  - Frontend: [api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts), [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx), [Header.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Header.tsx).
- Riscos: Nenhum. Credenciais estáticas em memória sem expor chaves reais em código de repositório.
- Proposta: Implementar cookies helpers e Axios headers interceptors no frontend.
- Testes:
  - Tentar fazer requisições sem token (retorna 401) e logar para validar o carregamento.
- Rollback:
  - `git checkout -- apps/automacao/src/server/app.ts apps/dashboard/src/services/api.ts apps/dashboard/src/App.tsx apps/dashboard/src/components/Header.tsx`
- Status: Revertido

### CHG-0096 — Reestilização e Identidade Visual da Tela de Login

- Data/Hora: 2026-06-30 14:04
- Contexto: A tela de login inicial com fundo escuro divergia do padrão claro/azul corporativo adotado no dashboard contábil do projeto.
- Objetivo: Reestilizar a tela de login dividindo-a em duas colunas (banner institucional com logotipo à esquerda e formulário de inputs claro à direita).
- Escopo:
  - Frontend: [Login.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Login.tsx).
- Riscos: Nenhum. Ajustes estritamente visuais de CSS inline no componente.
- Proposta: Substituir fundo escuro por gradiente azul claro, centralizar a logo da Stoque e alinhar botões e inputs ao estilo claro corporativo.
- Testes:
  - Abrir tela de login e verificar alinhamento das colunas e responsividade mobile.
- Rollback:
  - `git checkout -- apps/dashboard/src/components/Login.tsx`
- Status: Revertido

### CHG-0097 — Transição de Carregamento Suave e Spinner ao Logar

- Data/Hora: 2026-06-30 14:07
- Contexto: A transição instantânea da tela de login para o dashboard contábil causava uma quebra visual muito abrupta, afetando a usabilidade.
- Objetivo: Inserir estado de transição artificial de 1.2 segundos após sucesso de autenticação no Login, exibindo spinner de progresso e aviso de acesso autorizado.
- Escopo:
  - Frontend: [Login.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Login.tsx).
- Riscos: Nenhum. Ajustes estritamente visuais de transição de estado React.
- Proposta: Injetar animação spin de CSS no rodapé e criar render condicional baseado no estado `authSuccess`.
- Testes:
  - Validar a fluidez do carregamento e transição da tela de login.
- Rollback:
  - `git checkout -- apps/dashboard/src/components/Login.tsx`
- Status: Revertido

### CHG-0098 — Reestruturação Arquitetural e Roteamento SPA do Frontend

- Data/Hora: 2026-06-30 14:11
- Contexto: A estruturação do frontend dependia de exibições condicionais simples em App.tsx sem separação em páginas e sem controle de rotas de navegação na barra de endereços.
- Objetivo: Dividir o frontend em páginas (Login e Dashboard), implementar roteamento SPA com react-router-dom (exibindo /login e /dashboard) e criar monitor de inatividade.
- Escopo:
  - Backend: [sessionManager.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/sessionManager.ts), [authMiddleware.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/middlewares/authMiddleware.ts), [authController.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/controllers/authController.ts).
  - Frontend: [Login/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Login/index.tsx), [Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx), [useActivityTimeout.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/hooks/useActivityTimeout.ts), [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx).
- Riscos: Baixo. Atenção na migração de imports no Dashboard e referências CSS.
- Proposta: Mover markup do dashboard de App.tsx para Dashboard/index.tsx e de Login para Login/index.tsx. Implementar sessionManager em memória no Express.
- Testes:
  - Validar navegação SPA entre rotas, o redirecionamento automático de usuários não autorizados e o timeout por inatividade.
- Rollback:
  - `git checkout -- apps/automacao/src/server/app.ts apps/dashboard/src/App.tsx`
  - Remover pastas e arquivos recém-criados.
- Status: Revertido

### CHG-0099 — Correção de Interfaces de Tipo TS na Página do Dashboard e Hooks

- Data/Hora: 2026-06-30 14:16
- Contexto: A migração do painel contábil para o arquivo modular Dashboard/index.tsx causou erros de compilação TS devido a assinaturas de props incompatíveis com DocumentViewer, DataEditor e useActivityTimeout.
- Objetivo: Corrigir as assinaturas no JSX, alinhar a passagem de funções manipuladoras de input e limpar referências globais NodeJS.Timeout no hook do navegador.
- Escopo:
  - Frontend: [Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx), [useActivityTimeout.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/hooks/useActivityTimeout.ts).
- Riscos: Nenhum. Correção restrita a alinhamento de tipos TypeScript de tempo de compilação.
- Proposta: Injetar handleInputChange, passar selectedNote e isDragging para DocumentViewer, omitir parâmetros adicionais em reprocessNotes e tipar refs como any.
- Testes:
  - Executar build de produção do Vite e TypeScript com tsc -b obtendo sucesso completo.
- Rollback:
  - `git checkout -- apps/dashboard/src/pages/Dashboard/index.tsx apps/dashboard/src/hooks/useActivityTimeout.ts`
- Status: Revertido

### CHG-0101 — Correção de Reset de Tela Cheia no CSS Principal (index.css)

- Data/Hora: 2026-06-30 14:20
- Contexto: A folha de estilo index.css herdava largura restritiva de 1126px e alinhamento de texto centralizado que quebravam a diagramação do dashboard em rotas SPA.
- Objetivo: Modificar o seletor #root no index.css para atuar de forma fluida a 100% de largura/altura e sem centralização forçada.
- Escopo:
  - Frontend: [index.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/index.css).
- Riscos: Nenhum. Correção técnica em folha de estilos estática.
- Proposta: Substituir bloco #root por definição de tela cheia sem largura fixa.
- Testes:
  - Verificar no localhost:5173 se o enquadro do dashboard e de login retornou aos eixos fluidos.
- Rollback:
  - `git checkout -- apps/dashboard/src/index.css`
- Status: Revertido

### CHG-0102 — Correção de Classe do Separador de Arraste (Resizer) do Painel Contábil

- Data/Hora: 2026-06-30 14:21
- Contexto: O resizer que separa o visualizador de PDF do editor contábil perdeu a formatação e empurrou as colunas para o centro devido ao uso da classe inexistente resizer-vertical.
- Objetivo: Restaurar a classe unificada do resizer de "resizer-vertical" para "resizer" em Dashboard/index.tsx.
- Escopo:
  - Frontend: [Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx).
- Riscos: Nenhum. Correção restrita à classe CSS.
- Proposta: Substituir className de resizer-vertical para resizer.
- Testes:
  - Verificar no navegador se o layout de colunas voltou a se alinhar e o resize funciona.
- Rollback:
  - `git checkout -- apps/dashboard/src/pages/Dashboard/index.tsx`
- Status: Revertido

### Rollback Geral — Reversão da Autenticação e Roteamento SPA

- Data/Hora: 2026-06-30 14:23
- Contexto: A estruturação por rotas e a introdução da tela de login corporativo geraram quebras visuais graves na visualização fluida de curadoria de faturas (PDF e lançamentos desalinhados).
- Objetivo: Desfazer por completo a implementação de autenticação, cookies, sessões ativas e roteamento React Router, restaurando o layout plano original em App.tsx.
- Escopo:
  - Backend: [app.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/app.ts).
  - Frontend: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx), [index.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/index.css).
- Riscos: Nenhum. Retorno a uma base de código estável previamente homologada.
- Proposta: Copiar a lógica principal e de layouts de Dashboard de volta para a raiz do App.tsx, desativando os redirecionamentos e o authMiddleware no backend.
- Testes:
  - Abrir localhost:5173 e certificar-se de que o dashboard plano carrega as faturas e alinha as colunas do PDF e Editor perfeitamente.
- Status: Aplicado

### CHG-0103 — Restauração do Layout de Enquadro Estável com Login Condicional

- Data/Hora: 2026-06-30 14:26
- Contexto: A estruturação por páginas e rotas de roteador foi removida devido a quebras de enquadramento fluido, porém o fluxo de login em duas colunas e o bloqueio de acessos não autenticados devem ser preservados conforme homologação.
- Objetivo: Reinserir a renderização condicional do Login e os estados de checagem de sessão diretamente em App.tsx (sem roteamento), recriando a página de Login split-column em components/Login.tsx e reativando a proteção authMiddleware no backend.
- Escopo:
  - Backend: [app.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/app.ts).
  - Frontend: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx), [components/Login.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Login.tsx), [index.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/index.css).
- Riscos: Nenhum. Alinhado às especificações visuais de enquadramento (1126px centralizados) originais do projeto.
- Proposta: Sobrescrever App.tsx acoplando o hook initAuth de sessão corporativa, recriar components/Login.tsx com banner Stoque na esquerda, e remover pastas lógicas temporárias (pages/ e hooks/).
- Testes:
  - Validar build limpo com tsc -b.
  - Comprovar que o acesso solicita credenciais com spinner de 1.2s e revela o dashboard na proporção exata homologada.
- Status: Aplicado

### CHG-0104 — Restauração do CSS Original Homologado no Dashboard

- Data/Hora: 2026-06-30 14:28
- Contexto: Mudanças experimentais de CSS inflaram os estilos de layout da Sidebar, do Visualizador de PDF e do Histórico, causando quebras de enquadro e travamento dos controles de dimensionamento na tela do analista.
- Objetivo: Substituir as folhas de estilo ativas do frontend pelas versões originais mantidas no controle de versão Git.
- Escopo:
  - Frontend: [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css), [index.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/index.css).
- Riscos: Nenhum. Retorno seguro à folha de estilos homologada original.
- Proposta: Copiar dashboard/src/App.css e index.css por cima das cópias em apps/dashboard/src/.
- Testes:
  - Comprovar que o build do Vite reduz o bundle de CSS para 7.90 kB.
  - Verificar funcionamento do resizer do PDF e estabilidade horizontal do dashboard.
- Status: Aplicado

### CHG-0105 — Resolução de Fluidos e Largura Total no Seletor Principal do index.css

- Data/Hora: 2026-06-30 14:30
- Contexto: A regra nativa do seletor #root no index.css com width: 1126px limitava o viewport do painel e travava a barra de arraste do PDF, fazendo a curadoria contábil espremer e centralizar de forma inadequada.
- Objetivo: Garantir por completo a ocupação de tela cheia (100vw e 100vh) no seletor #root de forma imperativa (com !important), forçando o alinhamento de texto à esquerda e eliminando bordas limitadoras.
- Escopo:
  - Frontend: [index.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/index.css).
- Riscos: Nenhum. Ajustes refinados de fluidos do CSS global.
- Proposta: Injetar width: 100% !important e text-align: left !important sob o seletor #root no index.css.
- Testes:
  - Comprovar no localhost:5173 que a Sidebar, o PDF e o editor estendem-se horizontalmente ocupando 100% da tela de ponta a ponta com sliders destravados.
- Status: Aplicado

### CHG-0106 — Restauração do Frontend Baseado em Componentes de Pré-Roteamento

- Data/Hora: 2026-06-30 15:20
- Contexto: A exclusão da pasta apps/dashboard/src havia eliminado os componentes de UI modulares que o dashboard utilizava (Header, Sidebar, DocumentViewer, DataEditor) e substituído pelo App.tsx monolítico legático de 16 KB.
- Objetivo: Extrair do histórico de conversas a versão estável de App.tsx baseada em componentes (30 KB) e os componentes limpos correspondentes, gravando-os em seus locais de origem.
- Escopo:
  - Frontend: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx), [components/](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/).
- Riscos: Nenhum. Recupera o código estável testado na fase do login plano condicional.
- Proposta: Ler transcript_full.jsonl em Python, remover cabeçalhos/rodapés gerados pelo view_file, e recompor Header.tsx, Sidebar.tsx, DocumentViewer.tsx e DataEditor.tsx.
- Testes:
  - Verificar no navegador se o dashboard restabelece a Sidebar e as colunas redimensionáveis.
- Status: Aplicado

### CHG-0107 — Restauração da Arquitetura Modular de Roteamento SPA e Resolução de Fluidos

- Data/Hora: 2026-06-30 15:42
- Contexto: O usuário solicitou reverter a exclusão da arquitetura avançada modular SPA (com React Router v6, páginas Login/Dashboard e hooks de atividade) preservando o progresso técnico e corrigindo o bug visual da largura do visualizador de PDF.
- Objetivo: Resgatar cirurgicamente todas as páginas modulares e componentes de conversas antigas no disco, tipar implicitamente parâmetros TS e aplicar o resizer vertical (.resizer) na div principal do Dashboard.
- Escopo:
  - Frontend: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx), [pages/](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/), [components/](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/), [services/api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts).
- Riscos: Nenhum. Validação feita via tsc.
- Proposta: Mapear fatias no python e juntar na ordem de linhas correta. Aplicar display de tela cheia no index.css.
- Testes:
  - Executar npx tsc -b e comprovar que compila com zero erros.
- Status: Aplicado

### CHG-0108 — Correção de Endpoints e Interceptadores de Autenticação em api.ts

- Data/Hora: 2026-06-30 15:47
- Contexto: Ao tentar logar, o frontend retornava erro de conexão ou de credenciais devido à ausência do interceptor Axios e chamada incorreta a `/api/auth/session` (que não existe no backend Express, o qual utiliza `/api/auth/me` e validação via header Bearer).
- Objetivo: Restaurar a lógica exata de api.ts contendo utilitários de cookies, interceptor Axios para injetar o header Authorization em todas as requisições e mapeamento correto dos endpoints do Express.
- Escopo:
  - Frontend: [services/api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts).
- Riscos: Nenhum. Alinha os contratos de comunicação entre cliente e servidor.
- Proposta: Sobrescrever api.ts com o código de cookies e interceptores do Step 511.
- Testes:
  - Validar compilação limpa via npx tsc -b e realizar login com sucesso no navegador.
- Status: Aplicado

### CHG-0109 — Alinhamento de Classes do Dashboard JSX com Folha de Estilos App.css

- Data/Hora: 2026-06-30 15:50
- Contexto: A div de classe `viewer-pane` e `editor-pane` no JSX do Dashboard eram classes não mapeadas em App.css, fazendo com que o visualizador de PDF ficasse espremido e a curadoria de dados perdesse as regras de flexbox e overflow corretas.
- Objetivo: Adequar a estrutura do JSX eliminando a div `viewer-pane` inútil (o DocumentViewer já emite a classe `pdf-container`) e renomeando a classe do editor de `editor-pane` para `editor`.
- Escopo:
  - Frontend: [pages/Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx).
- Riscos: Nenhum. Organização do DOM CSS.
- Proposta: Substituir classes desatualizadas no JSX.
- Testes:
  - Executar npx tsc -b e constatar compilação com zero erros.
- Status: Aplicado

### CHG-0110 — Ajuste de Botões na Curadoria (DataEditor.tsx)

- Data/Hora: 2026-06-30 15:52
- Contexto: Solicitação do usuário para remover o botão "Reprovar", encurtar o botão "Reprocessar com IA" para "Reprocessar" e alterar a cor deste para verde.
- Objetivo: Deletar a tag do botão "Reprovar", ajustar o texto e adicionar estilos em linha com fundo `#10b981` no botão de reprocessamento em DataEditor.tsx. Remover o import do ícone XCircle que ficou não utilizado.
- Escopo:
  - Frontend: [components/DataEditor.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/DataEditor.tsx).
- Riscos: Nenhum. Mudança puramente visual.
- Proposta: Substituir markup de botões no JSX e limpar imports do lucide-react.
- Testes:
  - Verificar que o compilador passa com sucesso.
- Status: Aplicado

### CHG-0111 — Restauração de Estilização de Toasters em App.css

- Data/Hora: 2026-06-30 15:54
- Contexto: Usuário apontou que as caixas flutuantes de notificação (toasts) perderam a estilização devido a rollbacks passados.
- Objetivo: Restabelecer a classe de seletor fixed .toast-container e as variações de cores de alerta (.toast-success, .toast-error, .toast-info) e animações de slide-in no fim de App.css.
- Escopo:
  - Frontend: [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css).
- Riscos: Nenhum. Adição de CSS não destrutivo.
- Proposta: Inserir bloco de regras do TOAST SYSTEM no rodapé de App.css.
- Testes:
  - Disparar ações de salvar no dashboard e confirmar animação e posicionamento no canto inferior direito do navegador.
- Status: Aplicado

### CHG-0112 — Reposicionamento do Toast Container para Canto Superior Direito

- Data/Hora: 2026-06-30 15:54
- Contexto: Solicitação do usuário para mover as caixas flutuantes de toaster para o canto superior direito da tela.
- Objetivo: Modificar a regra top: 80px (abaixo do Header) e right: 24px no App.css. Ajustar a animação @keyframes toastSlideIn para realizar deslizamento horizontal a partir da borda direita da viewport (translateX(100%)).
- Escopo:
  - Frontend: [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css).
- Riscos: Nenhum. Ajuste de folha de estilos.
- Proposta: Substituir propriedades bottom por top e translateY por translateX nas keyframes.
- Testes:
  - Confirmar a renderização do toast deslizando da direita para a esquerda, logo abaixo da barra do cabeçalho.
- Status: Aplicado

### CHG-0113 — Ajuste de Fundo da Aba de Histórico para Branco

- Data/Hora: 2026-06-30 15:56
- Contexto: Usuário relatou que a aba de histórico de processamento estava exibindo fundo cinza e que a mesma deveria ter fundo branco.
- Objetivo: Injetar backgroundColor: '#ffffff' no estilo inline do container flex da aba de histórico em Dashboard/index.tsx.
- Escopo:
  - Frontend: [pages/Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx).
- Riscos: Nenhum. Ajuste estético de contraste.
- Proposta: Sobrescrever a div da aba com cor de fundo branca explícita.
- Testes:
  - Validar a cor do painel de histórico no navegador, verificando o contraste correto em relação aos filtros e tabelas.
- Status: Aplicado

### CHG-0114 — Reposicionamento e Adição de Ícone no Botão Sair (Header.tsx)

- Data/Hora: 2026-06-30 15:58
- Contexto: Solicitação do usuário para mover o botão de sair à direita do status de API Online e adicionar um ícone visual correspondente.
- Objetivo: Mudar a ordem de renderização no cabeçalho (Sincronizar -> API Status -> Sair), importar o ícone LogOut do lucide-react e adicioná-lo ao lado do texto "Sair" em Header.tsx.
- Escopo:
  - Frontend: [components/Header.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Header.tsx).
- Riscos: Nenhum. Ajuste estrutural simples de layout.
- Proposta: Mudar a sequência de tags no JSX e adicionar o ícone correspondente.
- Testes:
  - Rodar npx tsc -b para certificar-se de que compila limpo e validar o alinhamento visual dos elementos do Header.
- Status: Aplicado

### CHG-0115 — Alteração da Borda e Texto do Botão Sair para Vermelho

- Data/Hora: 2026-06-30 15:58
- Contexto: Solicitação do usuário para aplicar uma borda vermelha no botão de Sair.
- Objetivo: Modificar as propriedades de estilo borderColor e color para a cor de perigo (#ef4444) no botão de logout dentro de Header.tsx.
- Escopo:
  - Frontend: [components/Header.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Header.tsx).
- Riscos: Nenhum. Ajuste visual de destaque de botão.
- Proposta: Alterar propriedades style inline no JSX do botão.
- Testes:
  - Comprovar que o botão herda a borda vermelha e texto correspondente no Header.
- Status: Aplicado

### CHG-0116 — Habilitação de Largura Dinâmica do Arraste na Sidebar

- Data/Hora: 2026-06-30 16:00
- Contexto: A barra lateral esquerda (listagem de faturas) não respondia aos eventos de mouse do divisor vertical para redimensionamento.
- Objetivo: Modificar a regra CSS da classe .sidebar para ler a variável customizada --sidebar-width-dynamic (injetada via inline style no React), mantendo o fallback padrão var(--sidebar-w).
- Escopo:
  - Frontend: [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css).
- Riscos: Nenhum. Ajuste de CSS dinâmico.
- Proposta: Substituir largura fixa var(--sidebar-w) pela variável dinâmica em width, min-width e max-width.
- Testes:
  - Clicar e arrastar o resizer vertical ao lado da listagem de itens no navegador, confirmando que a barra lateral expande e retrai de forma contínua.
- Status: Aplicado

### CHG-0117 — Persistência de statusOverride em handleSave (Dashboard/index.tsx)

- Data/Hora: 2026-06-30 16:02
- Contexto: Ao clicar em "Aprovar", o botão não atualizava seu estado interno de "Aprovar" para "Validado". Isso ocorria porque o valor de statusOverride não era copiado para copy.status na rotina de salvamento.
- Objetivo: Atribuir copy.status = statusOverride dentro do bloco condicional correspondente em Dashboard/index.tsx para que o status correto de validação seja gravado e retornado.
- Escopo:
  - Frontend: [pages/Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx).
- Riscos: Nenhum. Mapeamento de estado de propriedade simples.
- Proposta: Inserir a atribuição direta do status no objeto enviado ao backend.
- Testes:
  - Clicar em "Aprovar" e confirmar que o texto do botão muda instantaneamente para "Validado" após a atualização.
- Status: Aplicado

### CHG-0118 — Restauração da Animação de Rotação (animate-spin)

- Data/Hora: 2026-06-30 16:14
- Contexto: A animação de ciclo no ícone de sincronização (botão Sincronizar) e no botão de reprocessar faturas parou de funcionar devido à ausência das regras de rotação no CSS global.
- Objetivo: Declarar a classe utilitária .animate-spin e as keyframes @keyframes spin com transformações de rotação (rotate(0deg) para rotate(360deg)) no fim de App.css.
- Escopo:
  - Frontend: [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css).
- Riscos: Nenhum. Adição de regras CSS padrões.
- Proposta: Inserir a classe e as keyframes de rotação no rodapé do CSS.
- Testes:
  - Clicar em "Sincronizar" no Header ou em "Reprocessar" na curadoria e confirmar que os ícones correspondentes giram de forma contínua durante o estado de carregamento.
- Status: Aplicado

### CHG-0119 — Adição de Mensagem de Despedida no Logout

- Data/Hora: 2026-06-30 16:15
- Contexto: Solicitação do usuário para emitir uma mensagem de despedida amigável ao realizar a ação de sair.
- Objetivo: Inserir a chamada de diálogo síncrona alert() contendo a mensagem de encerramento de sessão do Fiscal Intelligence (SFI) na rotina handleLogout em App.tsx.
- Escopo:
  - Frontend: [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx).
- Riscos: Nenhum. Chamada nativa de janela no navegador.
- Proposta: Injetar alert de aviso antes de invalidar o token e limpar o usuário do estado.
- Testes:
  - Clicar no botão "Sair" do cabeçalho e validar a abertura do pop-up de agradecimento antes do redirecionamento à página de Login.
- Status: Aplicado

### CHG-0120 — Substituição de alert() por Toast no Fluxo de Logout Diferido

- Data/Hora: 2026-06-30 16:16
- Contexto: Usuário solicitou a substituição do alert() nativo por uma notificação flutuante de toaster que já é utilizada em outros fluxos.
- Objetivo: Remover o alert() de App.tsx. Criar a função handleLogoutWithToast em Dashboard/index.tsx para emitir o toast e aguardar 1,5s antes de repassar a chamada para a prop onLogout(), dando tempo da animação rodar na tela.
- Escopo:
  - Frontend: [pages/Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx), [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx).
- Riscos: Nenhum. Atraso intencional e seguro de 1500ms para exibição.
- Proposta: Inserir a função com setTimeout no Dashboard e repassá-la ao Header.
- Testes:
  - Clicar em "Sair" e comprovar que o toast surge no canto superior direito e a tela muda para login após 1.5s.
- Status: Aplicado

### CHG-0121 — Configuração de Estrutura de Branches Profissional e Envio ao GitHub

- Data/Hora: 2026-07-02 09:20
- Contexto: O projeto local precisa ser publicado no GitHub com uma estratégia profissional de branching (main/develop).
- Objetivo: Atualizar o .gitignore para prevenir upload de arquivos confidenciais locais, consolidar commits pendentes da reestruturação, criar as branches locais `main` e `develop`, configurar a URL remota origin e realizar o push de ambas.
- Escopo:
  - Configuração: [.gitignore](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.gitignore)
- Riscos:
  - Envio acidental de dados confidenciais locais.
  - Divergência com commits remotos (resolvível por meio de push inicial em repositório vazio).
- Proposta: Inserir regras restritivas para planilhas no .gitignore, consolidar commits do monorepo, criar branches main/develop e realizar o push.
- Testes:
  - Validar com `git status` que planilhas e arquivos .env não aparecem nos commits.
  - Confirmar no GitHub a presença e independência das duas branches.
- Rollback:
  - Excluir branches locais criadas adicionais e retornar ao estado original.
  - Remover a origin remota.
- Status: Aplicado

### CHG-0122 — Criação e Envio do README.md Profissional ao GitHub

- Data/Hora: 2026-07-02 09:25
- Contexto: O repositório no GitHub precisa de uma documentação pública profissional e descritiva na raiz do projeto.
- Objetivo: Criar o arquivo README.md com informações estruturadas de arquitetura monorepo, dependências, credenciais fictícias de exemplo e instruções de execução local, integrando o arquivo ao fluxo de branches e subindo para o GitHub.
- Escopo:
  - Criação: [README.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/README.md)
- Riscos: Exposição de chaves ou credenciais reais do Microsoft Graph / Gemini. (Mitigado pelo uso de dados fictícios de exemplo).
- Proposta: Redigir o README.md na raiz do repositório local, realizar commit na branch de desenvolvimento, mesclar na branch de produção e fazer o push de ambas.
- Testes:
  - Verificar a integridade das instruções executando os comandos descritos no README.
  - Validar a correta formatação Markdown.
- Rollback: Deletar o arquivo README.md do repositório e restaurar as branches.
- Status: Aplicado

### CHG-0123 — Modal de Curadoria Detalhada de Rateio (Apportionment)

- Data/Hora: 2026-07-02 09:35
- Contexto: A fatura complexa test_16.pdf possui centenas de itens de rateio empilhados, o que causa lentidão e poluição visual no editor lateral de curadoria.
- Objetivo: Ocultar o campo apportionment da renderização padrão recursiva, implementar um Modal interativo contendo a listagem em tabela e um campo de busca interna para filtragem ágil e edição direta de Classificação/Série.
- Escopo:
  - Frontend: [DataEditor.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/DataEditor.tsx), [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css)
- Riscos: Lentidão do DOM ao renderizar muitas linhas e inputs simultâneos no modal. (Mitigado com filtros de busca interna para restrição de resultados ativos).
- Proposta: Inserir a exclusão de apportionment, injetar o card de acionamento do modal, desenhar a estrutura de tabela com busca no React e adicionar as regras de design no CSS.
- Testes:
  - Carregar a fatura test_16 e certificar que a barra lateral abre de forma instantânea.
  - Clicar em "Visualizar e Editar Tabela de Rateio", realizar buscas por texto e editar códigos de CR/Série.
  - Fechar o modal, clicar em "Salvar" e verificar se as edições persistem no arquivo JSON correspondente.
- Rollback: Reverter os arquivos DataEditor.tsx e App.css para os estados de commit anteriores.
- Status: Aplicado

### CHG-0124 — Sincronização Ativa de E-mails via Painel do Dashboard

- Data/Hora: 2026-07-02 09:45
- Contexto: A captura de e-mails e faturas dependia da execução manual do arquivo main.ts no backend.
- Objetivo: Expor uma rota Express /api/notes/sync que execute o GraphEmailPdfProcessor e integrá-la ao clique do botão "Sincronizar" no dashboard, recarregando a tela e emitindo notificações de status.
- Escopo:
  - Backend: [noteService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/noteService.ts), [noteController.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/controllers/noteController.ts), [noteRoutes.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/routes/noteRoutes.ts)
  - Frontend: [api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts), [Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx)
- Riscos: Timeout de rede se o processo de download e extração demorar demais no servidor local. (Prevenido pelo Express local e pela persistência de conexão no frontend).
- Proposta: Integrar a inicialização do GraphEmailPdfProcessor no NoteService, criar a rota post no roteador Express, criar a chamada Axios no frontend e integrá-la à rotina de refresh do layout do Dashboard.
- Testes:
  - Clicar em "Sincronizar" e verificar se o botão desativa e mostra "Sincronizando...".
  - Conferir nos logs do backend a busca do e-mail via Graph e a chamada ao Gemini.
  - Validar a recepção do Toast no front e a injeção do novo registro na tabela lateral.
- Rollback: Reverter os arquivos nos respectivos repositórios e branches locais.
- Status: Aplicado

### CHG-0125 — Placeholders de Herança Contábil no Modal de Rateios

- Data/Hora: 2026-07-02 10:08
- Contexto: A Classificação Contábil preenchida no topo da tela não era refletida visualmente no modal detalhado caso os itens específicos estivessem vazios, divergindo do comportamento de fallback do Excel.
- Objetivo: Injetar placeholders dinâmicos (cinza claro) nos campos de CR, Natureza e Contrato no modal de rateio para exibir os valores padrão herdados do cabeçalho geral.
- Escopo:
  - Frontend: [DataEditor.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/DataEditor.tsx)
- Riscos: Nenhum. Alteração meramente visual de usabilidade (UX).
- Proposta: Adicionar as propriedades de `placeholder` vinculadas a `formData.accountingFields` nos inputs de CR, Natureza e Contrato do modal detalhado.
- Testes:
  - Modificar a classificação padrão no topo, abrir o modal e confirmar que os campos vazios mostram os novos valores como sugestão em cinza.
- Rollback: Reverter as edições do atributo placeholder no arquivo correspondente.
- Status: Aplicado

### CHG-0126 — Gravação Física Automática ao Fechar o Modal de Rateio

- Data/Hora: 2026-07-02 10:12
- Contexto: Edições no modal de rateio dependiam de um clique manual posterior em "Salvar" na tela principal para regerar a planilha Excel física.
- Objetivo: Chamar automaticamente o callback onSave() ao fechar o modal (botões "Concluir" e fechar de cabeçalho), persistindo fisicamente os novos rateios no backend instantaneamente.
- Escopo:
  - Frontend: [DataEditor.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/DataEditor.tsx)
- Riscos: Nenhum. Melhoria direta de fluxo de usabilidade (UX).
- Proposta: Injetar a chamada de onSave() nos eventos onClick de fechamento do modal.
- Testes:
  - Realizar alteração contábil no modal, clicar em Concluir e conferir se o console do backend acusa a gravação do JSON e a regeração do Excel de imediato.
- Rollback: Remover a instrução onSave() dos acionadores do modal no React.
- Status: Aplicado
