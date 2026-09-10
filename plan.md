# Histórico de Mudanças e Decisões Técnicas (Plan.md)

Este documento registra de forma cronológica e atômica todas as decisões técnicas, mudanças, planos de teste e procedimentos de rollback executados no projeto.

## 1. Índice de Registros Arquivados

Para consultar o histórico detalhado dos meses anteriores:

- [Histórico de Maio/2026](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/changes/2026-05.md) (6 registros)
- [Histórico de Junho/2026](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/changes/2026-06.md) (104 registros)
- [Histórico de Julho/2026](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/changes/2026-07.md) (88 registros)

---

## 2. Template de Registro para Novas Mudanças

```markdown
### CHG-XXXX — <título curto da mudança>

- Data/Hora: <YYYY-MM-DD HH:mm>
- Contexto: <1–3 linhas explicando a necessidade>
- Objetivo: <o que muda e por quê>
- Escopo:
  - [caminho/do/arquivo.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/caminho/do/arquivo.ts)
- Riscos: <segurança/dados/compatibilidade/performance>
- Proposta: <resumo das alterações>
- Testes: <procedimentos de validação>
- Rollback:
  1) <passo de reversão>
- Status: Proposto | Aprovado | Aplicado | Revertido
- Observações: <decisões/pendências>
```

---

## 3. Registros Ativos — Setembro / 2026

### CHG-0227 — Fase 5: Auditoria e Higienização de Scripts Utilitários

- Data/Hora: 2026-09-10 14:05
- Contexto: Após a unificação das bases de dados em data/, scripts utilitários em apps/automacao/src/scripts/ ainda mantinham referências ao caminho obsoleto de assets do dashboard.
- Objetivo: Atualizar generate_base_json.ts para salvar exclusivamente na pasta unificada data/base_fornecedores_faturas.json, eliminando referências a caminhos antigos.
- Escopo:
  - [generate_base_json.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/generate_base_json.ts)
- Riscos: Baixo. Script utilitário isolado fora da rota em tempo real.
- Proposta: Remover jsonOutputPathDashboard e direcionar a saída unicamente para jsonOutputPathData.
- Testes:
  - Compilação via `npm run build` em apps/automacao (tsc) e apps/dashboard (tsc -b && vite build) com código 0.
- Rollback:
  1) `git checkout -- apps/automacao/src/scripts/generate_base_json.ts`
- Status: Aplicado
- Observações: Mudança aplicada sob aprovação [APROVAR-CODIGO]. Encerramento com sucesso de todas as fases (1 a 5) do plano de refatoração estrutural.

### CHG-0226 — Fase 4 (Passo 4.3): Modularização do Componente HistoryTab

- Data/Hora: 2026-09-10 14:02
- Contexto: A aba de Histórico de Processamento em Dashboard/index.tsx continha mais de 1.100 linhas de código misturando filtros multidimensionais, KPIs executivos de custo/latência, exportações complexas para Excel/PDF e pré-visualização de faturas.
- Objetivo: Isolar toda a visualização e operação do histórico em HistoryTab.tsx, desacoplando estados de busca, paginação, exportação e modais associados do orquestrador raiz.
- Escopo:
  - [HistoryTab.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/HistoryTab.tsx)
  - [Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx)
- Riscos: Baixo. Todas as props e callbacks de desarquivamento e visualização foram preservados com tipagem estrita no TypeScript.
- Proposta: Criar HistoryTab.tsx, mover filtros, paginação, exportação e modais de PDF/Rateio do histórico, e invocar o componente dentro da aba history em Dashboard/index.tsx.
- Testes:
  - Compilação via `cmd /c npm run build` em apps/dashboard com zero erros de TypeScript e bundle gerado com sucesso.
- Rollback:
  - 1) `git checkout -- apps/dashboard/src/pages/Dashboard/index.tsx`
  - 2) Remover `apps/dashboard/src/components/HistoryTab.tsx`
- Status: Aplicado
- Observações: Mudança aplicada sob aprovação [APROVAR-CODIGO]. Redução de mais de 1.100 linhas em Dashboard/index.tsx (caiu para 840 linhas).

### CHG-0225 — Fase 4 (Passo 4.2): Modularização do Componente LogsTab

- Data/Hora: 2026-09-10 13:50
- Contexto: A visualização de logs e o modal de confirmação de limpeza estavam acoplados diretamente ao componente raiz do Dashboard, inflando seu escopo com regras de console e modais secundários.
- Objetivo: Isolar a aba de logs em LogsTab.tsx, encapsulando os estados de carregamento, cópia para clipboard, terminal escuro e modal de confirmação.
- Escopo:
  - [LogsTab.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/LogsTab.tsx)
  - [Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx)
- Riscos: Baixo. Contrato direto via callbacks (onBack e showToast) e preservação das travas de acesso ADMIN.
- Proposta: Criar LogsTab.tsx e substituir mais de 250 linhas em Dashboard/index.tsx por uma invocação modularizada.
- Testes:
  - npm run build em apps/dashboard com zero erros de TypeScript e bundle gerado com sucesso.
- Rollback:
  1) `git checkout -- apps/dashboard/src/pages/Dashboard/index.tsx`
  2) Remover `apps/dashboard/src/components/LogsTab.tsx`
- Status: Aplicado
- Observações: Mudança aplicada sob aprovação [APROVAR-CODIGO]. Redução líquida de 250+ linhas em Dashboard/index.tsx.

### CHG-0224 — Fase 4 (Passo 4.1): Modularização do Componente DeadlinesTab

- Data/Hora: 2026-09-10 13:45
- Contexto: O componente Dashboard/index.tsx acumulava mais de 2.830 linhas, misturando regras e tabelas de diferentes domínios e dificultando a manutenção.
- Objetivo: Extrair a aba de Monitoramento de Prazos de Vencimento para o componente dedicado DeadlinesTab.tsx, desacoplando cálculos de dias restantes, ordenação, paginação e simulação de alertas de e-mail.
- Escopo:
  - [DeadlinesTab.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/DeadlinesTab.tsx)
  - [Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx)
- Riscos: Baixo. Contrato de propriedades bem delimitado (notes, onBack, onRefreshNotes, showToast).
- Proposta: Criar DeadlinesTab.tsx contendo toda a computação de vencimentos e substituir mais de 450 linhas do arquivo raiz por uma única invocação declarativa.
- Testes:
  - npm run build em apps/dashboard com zero erros de TypeScript e bundle gerado com sucesso.
  - npm run build em apps/automacao com compilação TypeScript validada com código 0.
- Rollback:
  1) `git checkout -- apps/dashboard/src/pages/Dashboard/index.tsx`
  2) Remover `apps/dashboard/src/components/DeadlinesTab.tsx`
- Status: Aplicado
- Observações: Mudança aplicada sob aprovação [APROVAR-CODIGO]. Redução líquida de 460+ linhas em Dashboard/index.tsx.

### CHG-0223 — Fase 3 da Refatoração: Higienização do index.css e Padronização de Classes no App.css

- Data/Hora: 2026-09-10 13:35
- Contexto: O index.css continha estilos legados do template Vite e o Dashboard utilizava centenas de linhas de CSS inline repetido para badges, paginação e tabelas.
- Objetivo: Eliminar o código morto do index.css e criar classes semânticas no App.css, reduzindo a repetição e alinhando ao Brand Center da Stoque.
- Escopo:
  - [index.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/index.css)
  - [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css)
  - [Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx)
- Riscos: Baixo. Mudanças puramente visuais e estruturais de CSS com checagem imediata no build.
- Proposta: Limpar regras residuais de template no index.css, extrair classes utilitárias para badges, tabelas e paginação no App.css e substituir blocos inline repetitivos.
- Testes:
  - npm run build em apps/dashboard com zero erros de bundle.
- Rollback:
  1) `git checkout -- apps/dashboard/src/index.css apps/dashboard/src/App.css apps/dashboard/src/pages/Dashboard/index.tsx`
- Status: Aplicado
- Observações: Alterações aplicadas sob aprovação [APROVAR-CODIGO] do usuário.

### CHG-0222 — Fase 2 da Refatoração: Centralização e Unificação das Bases Cadastrais

- Data/Hora: 2026-09-10 13:30
- Contexto: Arquivos cadastrais de CR, Naturezas e Contratos existiam duplicados entre a raiz do projeto e a pasta assets do dashboard, além de resquícios de arquivos SVG de template.
- Objetivo: Estabelecer a pasta data/ como fonte única da verdade cadastral, configurar alias @data no frontend, atualizar o backend e eliminar cópias redundantes.
- Escopo:
  - [dataEnrichment.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/dataEnrichment.ts)
  - [vite.config.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/vite.config.ts)
  - [tsconfig.app.json](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/tsconfig.app.json)
  - [DataEditor.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/DataEditor.tsx)
  - [Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx)
  - [.gitignore](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.gitignore)
- Riscos: Baixo. Validado através de compilação simultânea do backend e frontend com checagem de tipos estrita.
- Proposta: Mover cr.json e naturezas.json para data/, criar alias @data no Vite/TypeScript e eliminar duplicatas em apps/dashboard/src/assets/ e na raiz.
- Testes:
  - npm run build em apps/dashboard (código 0).
  - npm run build em apps/automacao (código 0).
  - Execução de teste de carregamento de CR e Natureza no backend (código 0).
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/dataEnrichment.ts apps/dashboard/vite.config.ts apps/dashboard/tsconfig.app.json apps/dashboard/src/components/DataEditor.tsx apps/dashboard/src/pages/Dashboard/index.tsx .gitignore`
- Status: Aplicado
- Observações: Alterações aplicadas sob aprovação [APROVAR-CODIGO] do usuário.

### CHG-0221 — Fase 1 da Refatoração: Higienização da Raiz e Atualização do Gitignore

- Data/Hora: 2026-09-10 13:25
- Contexto: Início do ciclo de refatoração do projeto para eliminar arquivos órfãos, logs residuais e artefatos de compilação desktop não rastreados.
- Objetivo: Proteger o repositório contra arquivos zip de release, eliminar arquivos residuais e organizar regras de exclusão no .gitignore.
- Escopo:
  - [.gitignore](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.gitignore)
- Riscos: Baixo. Não altera código de execução da aplicação.
- Proposta: Adicionar regras de exclusão para pacotes zip e scripts locais no .gitignore e remover logs residuais.
- Testes:
  - Execução de git status confirmando árvore de trabalho limpa.
- Rollback:
  1) `git checkout -- .gitignore`
- Status: Aplicado
- Observações: Alterações aplicadas sob aprovação [APROVAR-CODIGO] do usuário.

### CHG-0220 — Unificação de Contratos Recorrentes e Deduplicação nos Alertas de Prazos

- Data/Hora: 2026-09-10 13:05
- Contexto: O e-mail automático diário omitia contratos recorrentes como a Claro S.A./NET (1 dia restante) por consultar apenas faturas reais processadas em disco, além de duplicar linhas de fornecedores com múltiplos arquivos.
- Objetivo: Unificar a base de contratos recorrentes com as faturas reais pendentes no DeadlineAlertService, projetar datas dinâmicas no mês vigente e deduplicar fornecedores repetidos.
- Escopo:
  - [deadlineAlertService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/deadlineAlertService.ts)
  - [noteService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/noteService.ts)
- Riscos: Baixo. Leitura local em disco de arquivos JSON consolidados com fallbacks defensivos.
- Proposta: Implementar getDynamicDueDate e mesclagem de base_fornecedores_faturas.json no backend, priorizando notas fiscais reais sobre estimativas de contratos e formatando status singular/plural.
- Testes:
  - Compilação TypeScript com zero erros (cmd.exe /c "npx tsc --noEmit").
  - Execução de teste automatizado verificando a presença de Claro S.A./NET e a deduplicação de EMC.
- Rollback:
  1) `git checkout -- apps/automacao/src/server/services/deadlineAlertService.ts apps/automacao/src/server/services/noteService.ts`
- Commit: `bb80a42`
- Status: Aplicado
- Observações: Alterações aplicadas sob aprovação [APROVAR-CODIGO] do usuário.

### CHG-0219 — Linha de Somatória de Fechamento nas Abas Rateio e Rateio_Agrupado

- Data/Hora: 2026-09-10 11:36
- Contexto: Solicitação de melhoria visual e conferência fiscal de saldo nas planilhas Excel geradas para rateio contábil.
- Objetivo: Inserir linha de somatória em negrito com formatação monetária e bordas contábeis ao final das abas Rateio e Rateio_Agrupado.
- Escopo:
  - [generateRateioExcel.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/excel/generateRateioExcel.ts)
- Riscos: Nenhum impacto nos dados ou nas regras de negócio.
- Proposta: Calcular a somatória dos grupos de rateio e adicionar linhas de Total com bordas duplas contábeis no fechamento das duas primeiras abas.
- Testes:
  - Compilação TypeScript (cmd.exe /c "npx tsc --noEmit").
  - Verificação da planilha gerada via script com conferência dos valores somados.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/excel/generateRateioExcel.ts`
- Commit: `2350708`
- Status: Aplicado
- Observações: Alterações aplicadas sob aprovação [APROVAR-CODIGO] do usuário.

### CHG-0218 — Extração e Preenchimento Automático do Número de Série no Rateio

- Data/Hora: 2026-09-10 11:27
- Contexto: A coluna de número de série permanecia vazia para itens não cadastrados previamente na base consolidada, embora os dados constem entre parênteses na descrição do equipamento no PDF.
- Objetivo: Extrair o número de série diretamente das descrições no tableItemsExtractor e garantir sua preservação no fallback de dataEnrichment.
- Escopo:
  - [tableItemsExtractor.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/tableItemsExtractor.ts)
  - [dataEnrichment.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/dataEnrichment.ts)
- Riscos: Nenhum risco a valores monetários ou classificações.
- Proposta: Inserir extração de serial via parMatches em tableItemsExtractor e injetar serialNumber no retorno do mapeamento contábil de dataEnrichment.
- Testes:
  - Compilação TypeScript (cmd.exe /c "npx tsc --noEmit").
  - Validação da coluna Nº de Série na fatura da Magna com 356 itens.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/tableItemsExtractor.ts apps/automacao/src/features/pdf/dataEnrichment.ts`
- Commit: `2350708`
- Status: Aplicado
- Observações: Alterações aplicadas sob aprovação [APROVAR-CODIGO] do usuário.

### CHG-0217 — Extrator Nativo de Itens de Faturas de Equipamentos via Backend

- Data/Hora: 2026-09-10 09:56
- Contexto: Faturas de locação com centenas de equipamentos (Magna, EMC) ficavam resumidas em item único no rateio detalhado porque a inteligência artificial não transcrevia tabelas extensas em JSON.
- Objetivo: Extrair todos os equipamentos diretamente do texto vetorial do PDF no backend, preservando cada item individualmente e enriquecendo com Centro de Resultado (CR), Natureza e Contrato.
- Escopo:
  - [tableItemsExtractor.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/tableItemsExtractor.ts)
  - [extractDataFromPDF.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/extractDataFromPDF.ts)
- Riscos:
  - Divergência de valores. Mitigado por conferência matemática rigorosa onde os itens só substituem o rateio quando a soma fecha com o chargedValue da fatura.
- Proposta: Criar o módulo tableItemsExtractor com suporte a layouts tabulares de locação e integrá-lo no fluxo de extractDataFromPDF antes do dataEnrichment.
- Testes:
  - Compilação TypeScript com zero erros (cmd.exe /c "npx tsc --noEmit").
  - Execução de teste automatizado de extração com a fatura Magna (356 itens) e EMC (103 itens).
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/extractDataFromPDF.ts`
  2) `cmd.exe /c "del apps\automacao\src\features\pdf\tableItemsExtractor.ts"`
- Commit: `2350708`
- Status: Aplicado
- Observações: Implementação aplicada sob aprovação [APROVAR-CODIGO] do usuário com garantia expressa de reversão imediata caso necessário.

### CHG-0216 — Desacoplamento de Rateio da IA e Enriquecimento Contábil pelo Backend

- Data/Hora: 2026-09-10 09:38
- Contexto: Faturas extensas com mais de 100 itens falhavam recorrentemente na extração por divergência na contagem de itens de rateio e causavam lentidão de até 5 minutos devido a sucessivas retentativas com modelos instáveis.
- Objetivo: Restringir a IA à extração textual e fiscal do PDF, eliminar a transcrição obrigatória de tabelas extensas em JSON e transferir o enriquecimento contábil e cálculo de regras Zeev para o backend.
- Escopo:
  - [aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts)
  - [dataEnrichment.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/dataEnrichment.ts)
- Riscos:
  - Divergência em rateios detalhados preexistentes. Mitigado pela preservação de itens válidos que fechem o total cobrado da nota e fallback seguro para o rateio do fornecedor.
- Proposta: Enxugar prompt de extração, remover validação destrutiva com throw de rateio em aiExtract, remover modelo instável gemini-3.7-flash da esteira de fallback, reduzir delays de retentativa e implementar cálculo determinístico de zeevValidation e consolidação de rateio no dataEnrichment.
- Testes:
  - Verificação de tipos via compilação TypeScript (cmd.exe /c "npx tsc --noEmit").
  - Teste de extração via test_pdf.ts em PDF de fatura multipáginas.
- Rollback:
  1) `git checkout -- apps/automacao/src/features/pdf/aiExtract.ts apps/automacao/src/features/pdf/dataEnrichment.ts`
- Commit: `2350708`
- Status: Aplicado
- Observações: Alterações aplicadas com sucesso após autorização [APROVAR-CODIGO] do usuário.

### CHG-0213 — Curadoria Avançada, Auditoria de Logs e Controle de Acesso ADMIN

- Data/Hora: 2026-08-06 09:55
- Contexto: Implementação de autocomplete contábil (CR/Natureza), verificação automática de saldo do rateio, cópia de código de barras, atalhos de teclado (Ctrl+S / Ctrl+Enter), rastreabilidade de usuário e origem no CSV de auditoria e restrição das abas Histórico e Logs apenas para o perfil ADMIN.
- Objetivo: Garantir conformidade, rastreabilidade total de ações (quem/quando/o quê), produtividade na curadoria e controle de acesso por papel.
- Escopo:
  - `apps/dashboard/src/components/DataEditor.tsx`
  - `apps/dashboard/src/pages/Dashboard/index.tsx`
  - `apps/dashboard/src/components/Header.tsx`
  - `apps/dashboard/src/services/api.ts`
  - `apps/dashboard/src/assets/cr.json`
  - `apps/dashboard/src/assets/naturezas.json`
  - `apps/automacao/src/features/pdf/aiExtract.ts`
  - `apps/automacao/src/features/pdf/extractDataFromPDF.ts`
  - `apps/automacao/src/server/services/noteService.ts`
  - `apps/automacao/src/server/controllers/noteController.ts`
- Riscos:
  - Compatibilidade com registros legados do CSV de uso. Mitigado por fallbacks automáticos para colunas ausentes.
  - Bloqueio indevido de telas para o usuário ADMIN. Mitigado pela checagem estrita da propriedade `user.role === 'ADMIN'`.
- Testes:
  - Executado build da aplicação dashboard com zero erros TypeScript (`npm run build`).
  - Executada verificação de compilação do servidor de automação com zero erros (`npx tsc --noEmit`).
- Rollback:
  1) `git checkout -- apps/dashboard/src/components/DataEditor.tsx apps/dashboard/src/pages/Dashboard/index.tsx apps/dashboard/src/components/Header.tsx apps/dashboard/src/services/api.ts apps/automacao/src/features/pdf/aiExtract.ts apps/automacao/src/features/pdf/extractDataFromPDF.ts apps/automacao/src/server/services/noteService.ts apps/automacao/src/server/controllers/noteController.ts`
  2) Deletar os arquivos `apps/dashboard/src/assets/cr.json` e `apps/dashboard/src/assets/naturezas.json`
- Status: Aplicado
- Observações: Registro efetuado no plan.md sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0043 — Integração com Envio de Mensagens Zeev e Resolução de Dados Fiscais

- Data/Hora: 2026-08-06 13:36
- Contexto: Integração com a API de mensagens do Zeev e suporte a envio de ocorrências e notas fiscais.
- Objetivo: Implementar o cliente Zeev para envio de mensagens via `postInstanceMessage` e resolver fallbacks de dados de fornecedor e contrato.
- Escopo:
  - `apps/automacao/src/infra/zeev/zeevClient.ts`
  - `apps/automacao/src/server/services/zeevService.ts`
- Commit: `c0c0a678b9f2e4603becd41d4940449f12335a09`
- Status: Aplicado

### CHG-0044 — Efeitos Visuais, Ordenação do Histórico, Minimização de Blocos e Ajustes de Layout no Dashboard

- Data/Hora: 2026-08-06 13:36
- Contexto: Melhorias visuais e funcionais na interface de curadoria e histórico do Dashboard.
- Objetivo: Implementar efeito hover no menu de abas, ordenação clicável em todas as 17 colunas do Histórico, ajuste de largura dos painéis laterais, minimização individual de blocos e botão de alternância única "Expandir Todos" / "Esconder Todos".
- Escopo:
  - `apps/dashboard/src/App.css`
  - `apps/dashboard/src/components/Header.tsx`
  - `apps/dashboard/src/components/DataEditor.tsx`
  - `apps/dashboard/src/pages/Dashboard/index.tsx`
  - `GEMINI.MD`
- Status: Aplicado

### CHG-0045 — Padronização de Status Pendente e Centralização da Barra de Ações

- Data/Hora: 2026-08-06 13:42
- Contexto: Homogeneização visual e ajuste de alinhamento no Dashboard.
- Objetivo: Unificar a cor e a etiqueta "Pendente de Validação" no topo da Curadoria, na Sidebar e no Histórico, e centralizar os botões da barra de ações.
- Escopo:
  - `apps/dashboard/src/components/DataEditor.tsx`
  - `apps/dashboard/src/components/Sidebar.tsx`
  - `apps/dashboard/src/pages/Dashboard/index.tsx`
- Status: Aplicado

### CHG-0046 — Efeito Hover no Botão de Rateio e Simplificação de Rótulos de Status

- Data/Hora: 2026-08-06 14:13
- Contexto: Melhorias visuais no cabeçalho e limpeza de rótulos no Dashboard.
- Objetivo: Adicionar animação hover ao botão de rateio do cabeçalho e simplificar rótulos de status.
- Escopo:
  - `apps/dashboard/src/components/Header.tsx`
  - `apps/dashboard/src/components/DataEditor.tsx`
  - `apps/dashboard/src/components/Sidebar.tsx`
  - `apps/dashboard/src/pages/Dashboard/index.tsx`
- Commit: `59b36ff69ff228807d9f7831f2bc8a649ef2cbf6`
- Status: Aplicado

### CHG-0214 — Efeito Hover Interativo no Botão de Aprovação de Fatura

- Data/Hora: 2026-08-10 09:44
- Contexto: O botão Aprovar na tela de curadoria de faturas utilizava propriedades de cor fixas em style inline, impedindo a aplicação de efeitos visuais de passagem do cursor (:hover).
- Objetivo: Adicionar a classe CSS .btn-approve com transição suave, alteração de tonalidade verde e elevação ao passar o mouse, melhorando a usabilidade.
- Escopo:
  - Frontend:
    - [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css)
    - [DataEditor.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/DataEditor.tsx)
- Riscos: Nenhum. Alteração puramente cosmética e de experiência de usuário no frontend.
- Proposta: Criar a classe .btn-approve no App.css com regras de :hover:not(:disabled) e substituir as cores inline no DataEditor.tsx.
- Testes:
  - Validar a passagem de cursor sobre o botão Aprovar no navegador.
- Rollback:
  1) `git checkout -- apps/dashboard/src/App.css apps/dashboard/src/components/DataEditor.tsx`
- Commit: `99df429`
- Status: Aplicado
- Observações: Alterações de código aplicadas com sucesso após autorização [APROVAR-CODIGO] do usuário.

### CHG-0215 — Efeito Feedback de Clique (Active) no Botão Importar Fatura PDF

- Data/Hora: 2026-08-10 09:46
- Contexto: O botão de importação de PDF na barra lateral utilizava manipulação de estilo por eventos de mouse JS inline, carecendo de resposta visual tátil ao clique.
- Objetivo: Encapsular o estilo na classe .btn-import-sidebar no App.css e adicionar o efeito de clique :active com compressão proporcional.
- Escopo:
  - Frontend:
    - [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css)
    - [Sidebar.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Sidebar.tsx)
- Riscos: Nenhum. Alteração puramente cosmética e de usabilidade visual.
- Proposta: Criar a classe .btn-import-sidebar e aplicar os pseudo-estados :hover e :active.
- Testes:
  - Validar compilação TypeScript e resposta de clique do botão no navegador.
- Rollback:
  1) `git checkout -- apps/dashboard/src/App.css apps/dashboard/src/components/Sidebar.tsx`
- Commit: `99df429`
- Status: Aplicado
- Observações: Alterações de código aplicadas com sucesso após autorização [APROVAR-CODIGO] do usuário.

### CHG-0216 — Estabilização de Altura dos Cards de Fatura em Modo de Confirmação na Sidebar

- Data/Hora: 2026-08-10 11:52
- Contexto: Ao clicar em arquivar ou excluir uma fatura na barra lateral, o card reduzia de tamanho devido à substituição do conteúdo por um formulário de texto curto.
- Objetivo: Fixar a altura mínima minHeight em 84px com flexbox vertical, preservando as dimensões originais do card durante a confirmação de ações.
- Escopo:
  - Frontend:
    - [Sidebar.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Sidebar.tsx)
- Riscos: Nenhum. Alteração restrita às propriedades de estilização inline de layout do card.
- Proposta: Adicionar minHeight: '84px', boxSizing: 'border-box' e justifyContent: 'center' ao container do item da lista.
- Testes:
  - Validar a abertura e fechamento da caixa de confirmação de exclusão e arquivamento no navegador.
- Rollback:
  1) `git checkout -- apps/dashboard/src/components/Sidebar.tsx`
- Commit: `99df429`
- Status: Revertido
- Observações: Rollback executado a pedido do usuário devido a efeito colateral no layout da listagem de documentos.

### CHG-0217 — Correção do Relatório em PDF com Orientação Paisagem e 17 Colunas Completas

- Data/Hora: 2026-08-10 12:04
- Contexto: A função exportToPDF gerava um documento em modo retrato com desalinhamento entre o cabeçalho e o corpo da tabela, omitindo 7 colunas do relatório de auditoria.
- Objetivo: Reestruturar o gerador de HTML de impressão em modo paisagem (@page size: landscape), incluindo e alinhando todas as 17 colunas de auditoria existentes no CSV.
- Escopo:
  - Frontend:
    - [Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx)
- Riscos: Nenhum. Alteração restrita à formatação da janela de impressão temporária.
- Proposta: Inserir a regra de impressão em paisagem e alinhar as 17 colunas no TH/TD da função exportToPDF.
- Testes:
  - Validar a abertura da janela de impressão de PDF e checar a presença de todas as colunas em modo paisagem.
- Rollback:
  1) `git checkout -- apps/dashboard/src/pages/Dashboard/index.tsx`
- Commit: `6fb29ce`
- Status: Aplicado
- Observações: Alteração de código aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0218 — Metadados de Rastreabilidade e Auditoria na Exportação de PDF e CSV

- Data/Hora: 2026-08-10 12:07
- Contexto: Relatórios fiscais e de IA extraídos não continham identificação do usuário solicitante, fuso horário, filtros ativos ou código único de auditoria.
- Objetivo: Injetar bloco estruturado de metadados (ID único, Solicitante, Perfil, Data/Hora UTC-3, Filtros e Totais consolidados) nas saídas PDF e CSV.
- Escopo:
  - Frontend:
    - [Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx)
- Riscos: Nenhum. Alteração estrita nos geradores de arquivos de saída do frontend.
- Proposta: Criar a função generateAuditMetadata e incluir os metadados nos métodos exportToExcel e exportToPDF.
- Testes:
  - Exportar relatórios em PDF e CSV e conferir a exatidão dos metadados impressos.
- Rollback:
  1) `git checkout -- apps/dashboard/src/pages/Dashboard/index.tsx`
- Commit: `6fb29ce`
- Status: Aplicado
- Observações: Alteração de código aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0219 — Estado de Carregamento e Alerta de Demora Prolongada no Histórico

- Data/Hora: 2026-08-10 12:14
- Contexto: A aba de Histórico não possuía notificação visual em caso de latência estendida na busca dos logs e o colSpan do spinner estava descorrelacionado das 17 colunas da tabela.
- Objetivo: Corrigir o colSpan para 17, utilizar o ícone Loader2 animado e implementar o estado isSlowLoadingHistory após 3 segundos de espera.
- Escopo:
  - Frontend:
    - [Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx)
- Riscos: Nenhum. Alteração restrita à experiência visual do componente.
- Proposta: Inserir temporizador na função loadUsageLogs e ajustar a renderização da linha de carregamento no tbody.
- Testes:
  - Alternar para a aba Histórico e validar o feedback visual de carregamento.
- Rollback:
  1) `git checkout -- apps/dashboard/src/pages/Dashboard/index.tsx`
- Commit: `6fb29ce`
- Status: Aplicado
- Observações: Alteração de código aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0220 — Criação da Documentação de Apresentação Executiva para Liderança (apresentacao_projeto_head.md)

- Data/Hora: 2026-08-11 09:49
- Contexto: Necessidade de material de apresentação sintético, objetivo e orientado a resultados para reunião com o Head de Tecnologia.
- Objetivo: Elaborar o arquivo apresentacao_projeto_head.md destacando o problema resolvido, stack tecnológica, benefícios organizacionais e impacto do projeto.
- Escopo:
  - Documentação:
    - [apresentacao_projeto_head.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apresentacao_projeto_head.md)
- Riscos: Nenhum. Criação exclusiva de documentação técnica/executiva.
- Proposta: Criar o arquivo apresentacao_projeto_head.md na raiz do repositório.
- Testes:
  - Validar a leitura e formatação do arquivo Markdown.
- Rollback:
  1) `git checkout -- apresentacao_projeto_head.md` (ou remoção caso não rastreado)
- Commit: `6fb29ce`
- Status: Aplicado
- Observações: Documento criado com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0221 — Correção de Caminho Base de Assets para Deploy no GitHub Pages (Tela em Branco)

- Data/Hora: 2026-08-11 10:36
- Contexto: O deploy no GitHub Pages apresentava tela em branco devido ao caminho base do Vite estar configurado como '/' em vez de caminhos relativos, gerando erros 404 na busca dos assets JS e CSS.
- Objetivo: Configurar base: './' no vite.config.ts e injetar VITE_BASE_PATH: './' com cópia de 404.html no workflow deploy.yml.
- Escopo:
  - CI/CD & Configuração:
    - [vite.config.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/vite.config.ts)
    - [deploy.yml](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.github/workflows/deploy.yml)
- Riscos: Nenhum. Ajuste restrito ao roteamento de caminhos estáticos de build.
- Proposta: Atualizar vite.config.ts e deploy.yml para usar caminhos relativos e criar fallback 404.html.
- Testes:
  - Inspecionar dist/index.html gerado pelo build e testar deploy via GitHub Actions.
- Rollback:
  1) `git checkout -- apps/dashboard/vite.config.ts .github/workflows/deploy.yml`
- Commit: `6fb29ce`
- Status: Aplicado
- Observações: Alterações aplicadas com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0222 — Correção de Sintaxe CSS no App.css (.btn)

- Data/Hora: 2026-08-14 10:35
- Contexto: Erro de parse no PostCSS durante a inicialização/build do dashboard devido a fechamento duplicado de bloco CSS.
- Objetivo: Remover linhas duplicadas na classe .btn do App.css para permitir compilação correta.
- Escopo:
  - Frontend:
    - [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css)
- Riscos: Baixo. Alteração puramente sintática de CSS.
- Proposta: Remoção das linhas duplicadas de fechamento e transição em App.css.
- Testes:
  - Build do workspace dashboard com Vite.
- Rollback:
  1) `git checkout HEAD -- apps/dashboard/src/App.css`
- Status: Aplicado
- Observações: Correção aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0223 — Correção de Campos do Formulário Zeev (Remoção de Campo Desabilitado)

- Data/Hora: 2026-08-14 11:45
- Contexto: A API do Zeev rejeitou a criação de instância com erro 403 (execute.msgformfieldnotenabledintaskformfield) informando que o campo confimacaoDeExtensaoCorretaDoArquivoDeRateio não está disponível na etapa inicial.
- Objetivo: Remover o campo obsoleto/desabilitado do payload no zeevService.ts.
- Escopo:
  - Backend:
    - [zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
- Riscos: Baixo. Alinhamento com os campos aceitos pelo formulário do Zeev.
- Proposta: Remover o envio de confimacaoDeExtensaoCorretaDoArquivoDeRateio em zeevService.ts.
- Testes:
  - Executar simulação de aprovação no dashboard e verificar código de sucesso retornado pela API do Zeev.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/zeevService.ts`
- Status: Aplicado
- Observações: Ajuste aplicado com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0224 — Suporte a Identificação de Requisitante na API do Zeev (ZEEV_REQUESTER)

- Data/Hora: 2026-08-14 11:50
- Contexto: A API do Zeev retornou erro informando não ter encontrado o login ou identificador necessário para definir o requisitante da solicitação.
- Objetivo: Injetar campos de identificação de requisitante (requester, requesterUser, requesterEmail) a partir da variável de ambiente ZEEV_REQUESTER no payload de criação de instâncias.
- Escopo:
  - Backend:
    - [zeevClient.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/infra/zeev/zeevClient.ts)
    - [zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
- Riscos: Baixo. Propriedade opcional lida do ambiente.
- Proposta: Adicionar suporte a requester no payload do ZeevClient e ZeevService.
- Testes:
  - Executar simulação de aprovação com ZEEV_REQUESTER configurado e validar resposta de sucesso.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/infra/zeev/zeevClient.ts apps/automacao/src/server/services/zeevService.ts`
- Status: Aplicado
- Observações: Ajuste aplicado com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0225 — Diagnóstico de Usuário e Organograma do Zeev (users/me)

- Data/Hora: 2026-08-14 11:55
- Contexto: Erro na API do Zeev por ausência de login/identificador de requisitante vinculado ao organograma do fluxo de produção.
- Objetivo: Criar script check_zeev_user.ts para consultar /api/2/users/me e extrair os identificadores exatos de time e cargo (teamId/positionId) do usuário do token.
- Escopo:
  - Backend:
    - [check_zeev_user.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/check_zeev_user.ts)
- Riscos: Baixo. Script de consulta somente leitura.
- Proposta: Implementar script de inspeção de credenciais Zeev.
- Testes:
  - Executar check_zeev_user.ts e validar resposta da API do Zeev com os metadados de autenticação.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/scripts/check_zeev_user.ts` (ou deletar arquivo)
- Status: Aplicado
- Observações: Script criado sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0226 — Script de Teste Direto de Payload da Instância Zeev (isSimulation: true)

- Data/Hora: 2026-08-14 12:00
- Contexto: Testar diretamente a abertura simulada de instância no fluxo do Zeev com variações de identificador de requisitante e campos obrigatórios.
- Objetivo: Criar test_zeev_payload.ts para depuração fina da chamada POST /api/2/instances no terminal.
- Escopo:
  - Backend:
    - [test_zeev_payload.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/test_zeev_payload.ts)
- Riscos: Baixo. Execução em modo isSimulation: true sem persistência de dados reais no Zeev.
- Proposta: Implementar script de teste de payload.
- Testes:
  - Executar test_zeev_payload.ts e analisar resposta da API do Zeev.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/scripts/test_zeev_payload.ts` (ou deletar arquivo)
- Status: Aplicado
- Observações: Script criado sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0227 — Teste Automatizado de Variações de Requisitante no Zeev

- Data/Hora: 2026-08-14 12:05
- Contexto: A API do Zeev exige formato específico para o identificador do requisitante na criação de instâncias.
- Objetivo: Atualizar test_zeev_payload.ts para testar sequencialmente 7 variações de payload (login sem domínio, requesterUser, requesterLogin, requesterEmail e objeto aninhado).
- Escopo:
  - Backend:
    - [test_zeev_payload.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/test_zeev_payload.ts)
- Riscos: Baixo. Execução somente em simulação.
- Proposta: Implementar loop de teste de variações de requisitante.
- Testes:
  - Executar test_zeev_payload.ts e identificar a variação que obtém código 200/201.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/scripts/test_zeev_payload.ts`
- Status: Aplicado
- Observações: Script atualizado sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0228 — Script de Consulta de Metadados do Fluxo Zeev (GET /api/2/flows/:id)

- Data/Hora: 2026-08-14 12:15
- Contexto: Investigar a configuração do fluxo 2149/2044 no Zeev que provoca erro de resolução de requisitante na iniciação via API.
- Objetivo: Criar check_zeev_flow_info.ts para consultar GET /api/2/flows/:id e validar status, deploy e configurações da API.
- Escopo:
  - Backend:
    - [check_zeev_flow_info.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/check_zeev_flow_info.ts)
- Riscos: Baixo. Consulta somente leitura.
- Proposta: Implementar script de inspeção de fluxo.
- Testes:
  - Executar check_zeev_flow_info.ts e inspecionar resposta.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/scripts/check_zeev_flow_info.ts` (ou deletar arquivo)
- Status: Aplicado
- Observações: Script criado sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0229 — Consulta de Processos Implantados no Zeev (GET /api/2/flows)

- Data/Hora: 2026-08-14 12:20
- Contexto: Verificar a lista de fluxos implantados (deploy: true) e validar se o fluxo 2149/2044 está publicado e acessível via API.
- Objetivo: Atualizar check_zeev_flow_info.ts para listar processos ativos via GET /api/2/flows.
- Escopo:
  - Backend:
    - [check_zeev_flow_info.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/check_zeev_flow_info.ts)
- Riscos: Baixo. Consulta somente leitura.
- Proposta: Implementar listagem e filtro de fluxos ativos no Zeev.
- Testes:
  - Executar check_zeev_flow_info.ts e inspecionar a lista de processos retornados.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/scripts/check_zeev_flow_info.ts`
- Status: Aplicado
- Observações: Script atualizado sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0230 — Inclusão de Campos de Apoio à RN00 (pessoaResponsavel e origem) no Teste Zeev

- Data/Hora: 2026-08-14 12:40
- Contexto: A regra de negócio RN00 (Mudar Solicitante) falha quando os campos de apoio como pessoaResponsavel e origem não são passados no payload.
- Objetivo: Atualizar test_zeev_payload.ts para enviar pessoaResponsavel (login/email) e origem, validando o atendimento à RN00 do Zeev.
- Escopo:
  - Backend:
    - [test_zeev_payload.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/test_zeev_payload.ts)
- Riscos: Baixo. Execução em modo isSimulation: true.
- Proposta: Implementar testes com pessoaResponsavel e origem.
- Testes:
  - Executar test_zeev_payload.ts e validar resposta da API do Zeev.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/scripts/test_zeev_payload.ts`
- Status: Aplicado
- Observações: Script atualizado sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0231 — Inclusão Definitiva dos Campos de Solicitante e Origem (pessoaResponsavel e origem) no ZeevService

- Data/Hora: 2026-08-14 12:45
- Contexto: A regra de negócio RN00 (Alterar Solicitante) do Zeev exige os campos pessoaResponsavel e origem para direcionamento autônomo sem parada em tarefa humana.
- Objetivo: Injetar pessoaResponsavel (lido de ZEEV_REQUESTER) e origem ("IA") no payload padrão do zeevService.ts.
- Escopo:
  - Backend:
    - [zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
- Riscos: Baixo. Compatibilidade total com os fluxos 2044 e 2149.
- Proposta: Adicionar pessoaResponsavel e origem na montagem de formFields.
- Testes:
  - Executar simulação de aprovação no Dashboard e validar geração do processo no Zeev.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/zeevService.ts`
- Status: Aplicado
- Observações: Campos injetados com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0232 — Diagnóstico e Homologação da API de Mensagens do Zeev (POST /api/2/messages)

- Data/Hora: 2026-08-14 13:05
- Contexto: Abertura de instâncias homologada com sucesso; ajuste fino do endpoint de mensagens para vincular comentários da IA no histórico da solicitação.
- Objetivo: Criar script test_zeev_message.ts para testar os formatos aceitos pelo endpoint /api/2/messages e atualizar ZeevClient.postInstanceMessage.
- Escopo:
  - Backend:
    - [test_zeev_message.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/test_zeev_message.ts)
- Riscos: Baixo. Teste isolado na instância 240922.
- Proposta: Implementar bateria de testes de formato de mensagem.
- Testes:
  - Executar test_zeev_message.ts e analisar detalhes de retorno da API.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/scripts/test_zeev_message.ts` (ou deletar arquivo)
- Status: Aplicado
- Observações: Script criado sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0233 — Correção do Contrato da API de Mensagens do Zeev (messageBody)

- Data/Hora: 2026-08-14 13:10
- Contexto: A validação do Zeev retornou erro 400 indicando a obrigatoriedade do campo messageBody.
- Objetivo: Ajustar ZeevClient.postInstanceMessage e test_zeev_message.ts para enviar { instanceId, messageBody }.
- Escopo:
  - Backend:
    - [zeevClient.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/infra/zeev/zeevClient.ts)
    - [test_zeev_message.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/test_zeev_message.ts)
- Riscos: Baixo. Alinhamento com o schema oficial do Zeev.
- Proposta: Substituir message por messageBody no payload de mensagens.
- Testes:
  - Executar test_zeev_message.ts e validar resposta 200/201.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/infra/zeev/zeevClient.ts apps/automacao/src/scripts/test_zeev_message.ts`
- Status: Aplicado
- Observações: Ajuste aplicado com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0234 — Ocultação do Botão de Arquivar na Aba de Arquivadas/Concluídas

- Data/Hora: 2026-08-14 13:12
- Contexto: Na aba Arquivadas/Concluídas, o botão de arquivamento continuava visível para as faturas da listagem.
- Objetivo: Condicionar a renderização do botão de arquivamento em Sidebar.tsx com !showArchived para exibi-lo apenas em notas pendentes.
- Escopo:
  - Frontend:
    - [Sidebar.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Sidebar.tsx)
- Riscos: Baixo. Ajuste exclusivamente visual.
- Proposta: Envolver botão de arquivamento com !showArchived.
- Testes:
  - Navegar para a aba Arquivadas/Concluídas e verificar a ausência do botão de arquivar nos cards da lista.
- Rollback:
  1) `git checkout HEAD -- apps/dashboard/src/components/Sidebar.tsx`
- Status: Aplicado
- Observações: Ajuste de interface aplicado com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0235 — Correção de Tag JSX no Container de Ações de Fatura em Sidebar.tsx

- Data/Hora: 2026-08-14 13:15
- Contexto: Erro de compilação Babel (Expected corresponding JSX closing tag for <>) por ausência da tag de abertura do container de botões de ação.
- Objetivo: Restaurar a tag de abertura <div style={{ display: 'flex', gap: '3px', alignItems: 'center', flexShrink: 0 }}> em Sidebar.tsx.
- Escopo:
  - Frontend:
    - [Sidebar.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Sidebar.tsx)
- Riscos: Baixo. Correção de sintaxe JSX.
- Proposta: Restaurar abertura do container de ações.
- Testes:
  - Carregar o Dashboard no navegador e validar ausência de erros de compilação.
- Rollback:
  1) `git checkout HEAD -- apps/dashboard/src/components/Sidebar.tsx`
- Status: Aplicado
- Observações: Correção aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0236 — Alternância de Seleção de Notas e Redirecionamento Imediato por Expiração de Sessão

- Data/Hora: 2026-08-14 13:20
- Contexto: Usuários relataram necessidade de desmarcar faturas ao clicar novamente no mesmo item selecionado e redirecionamento instantâneo para login quando a sessão expira.
- Objetivo:
  1) Permitir deseleção no clique em Sidebar.tsx (onSelectNote(isSelected ? null : note)).
  2) Interceptar erros 401/403 no Axios (api.ts) e despachar evento para App.tsx redirecionar imediatamente para /login.
- Escopo:
  - Frontend:
    - [Sidebar.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Sidebar.tsx)
    - [api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts)
    - [App.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.tsx)
- Riscos: Baixo. Melhorias de usabilidade e segurança de sessão.
- Proposta: Injetar toggle de seleção e interceptor global de 401 com evento.
- Testes:
  - Clicar na fatura selecionada e verificar se o painel limpa a seleção.
  - Simular expiração de sessão e validar redirecionamento automático para a tela de login.
- Rollback:
  1) `git checkout HEAD -- apps/dashboard/src/components/Sidebar.tsx apps/dashboard/src/services/api.ts apps/dashboard/src/App.tsx`
- Status: Aplicado
- Observações: Alterações aplicadas com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0237 — Configuração de Ícone Customizado para a Aplicação Desktop Electron

- Data/Hora: 2026-08-14 13:50
- Contexto: A versão desktop utilizava o ícone padrão do Electron.
- Objetivo:
  1) Criar diretório apps/desktop/resources/ com os ícones icon.png e icon.ico no design do Stoque Fiscal Intelligence.
  2) Configurar win.icon no apps/desktop/package.json para o electron-builder incorporar aos binários .exe.
  3) Definir a propriedade icon na criação de BrowserWindow em apps/desktop/src/main.ts.
- Escopo:
  - Desktop:
    - [package.json](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/desktop/package.json)
    - [main.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/desktop/src/main.ts)
    - `apps/desktop/resources/` (novo)
- Riscos: Baixo. Configuração de assets estáticos do aplicativo.
- Proposta: Integrar ícone oficial nos executáveis e na janela do aplicativo.
- Testes:
  - Reempacotar com npm.cmd run build:desktop e verificar o ícone nos arquivos .exe e na barra de tarefas.
- Rollback:
  1) `git checkout HEAD -- apps/desktop/package.json apps/desktop/src/main.ts`
- Status: Aplicado
- Observações: Configurações de código aplicadas com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0238 — Central de Configurações Segura de Credenciais e Variáveis de Ambiente (SettingsModal)

- Data/Hora: 2026-08-14 15:30
- Contexto: Necessidade de permitir a administradores a visualização e atualização de chaves de IA (Gemini), tokens do Zeev, e-mail monitorado e SMTP através da interface com mascaramento de dados sensíveis.
- Objetivo:
  1) Criar settingsService.ts e rotas /api/settings protegidas por RBAC (ADMIN).
  2) Mascarar segredos no envio para o frontend.
  3) Criar componente SettingsModal.tsx integrado ao menu de perfil do Header.
- Escopo:
  - Backend:
    - [settingsService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/settingsService.ts) (novo)
    - [settingsController.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/controllers/settingsController.ts) (novo)
    - [settingsRoutes.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/routes/settingsRoutes.ts) (novo)
    - [app.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/app.ts)
  - Frontend:
    - [SettingsModal.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/SettingsModal.tsx) (novo)
    - [Header.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Header.tsx)
    - [api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts)
- Riscos: Baixo. Acesso restrito a administradores e mascaramento de senhas.
- Proposta: Implementar central de credenciais do sistema.
- Testes:
  - Acessar modal de configurações como ADMIN, atualizar token/variável e validar persistência no .env e atualização em tempo real.
- Rollback:
  1) `git checkout HEAD -- apps/automacao apps/dashboard`
- Status: Aplicado
- Observações: Funcionalidade implementada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0239 — Correção de Fragmento JSX no Retorno de Header.tsx

- Data/Hora: 2026-08-14 15:40
- Contexto: Erro de compilação Babel devido à ausência da tag de abertura <> envolvendo <header> e <SettingsModal>.
- Objetivo: Inserir o fragmento de abertura <> no return de Header.tsx.
- Escopo:
  - Frontend:
    - [Header.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Header.tsx)
- Riscos: Baixo. Correção de sintaxe JSX.
- Proposta: Adicionar <> no return do Header.
- Testes:
  - Validar compilação do dashboard com Vite sem erros de JSX.
- Rollback:
  1) `git checkout HEAD -- apps/dashboard/src/components/Header.tsx`
- Status: Aplicado
- Observações: Correção de sintaxe JSX aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0240 — Proteção com Encadeamento Opcional para Objeto de Usuário em Header e SettingsModal

- Data/Hora: 2026-08-14 15:43
- Contexto: Tela em branco por exceção de runtime ao acessar propriedades de user antes do término da resolução da sessão.
- Objetivo: Proteger todos os acessos a user e currentUser com optional chaining e valores padrão.
- Escopo:
  - Frontend:
    - [Header.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Header.tsx)
    - [SettingsModal.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/SettingsModal.tsx)
- Riscos: Baixo. Correção defensiva de interface.
- Proposta: Inserir user?. e fallback para strings vazias.
- Testes:
  - Recarregar a página do Dashboard e validar renderização imediata de todos os elementos sem exceções no console.
- Rollback:
  1) `git checkout HEAD -- apps/dashboard/src/components/Header.tsx apps/dashboard/src/components/SettingsModal.tsx`
- Status: Aplicado
- Observações: Correção aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0241 — Correção de Importação de Tipos com verbatimModuleSyntax em SettingsModal.tsx

- Data/Hora: 2026-08-14 15:48
- Contexto: Erro TS1484 ('MaskedSettings' is a type and must be imported using a type-only import) gerado pela regra verbatimModuleSyntax do TypeScript.
- Objetivo: Declarar type explicitamente nas interfaces MaskedSettings e User em SettingsModal.tsx.
- Escopo:
  - Frontend:
    - [SettingsModal.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/SettingsModal.tsx)
- Riscos: Baixo. Adequação de tipagem estrita do TypeScript.
- Proposta: Inserir modificador type na importação.
- Testes:
  - Executar build do Dashboard e validar código de saída 0.
- Rollback:
  1) `git checkout HEAD -- apps/dashboard/src/components/SettingsModal.tsx`
- Status: Aplicado
- Observações: Correção aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0242 — Visualização de Rateio Contábil no Histórico de Faturas

- Data/Hora: 2026-08-14 16:20
- Contexto: Usuários necessitam visualizar e auditar o rateio contábil diretamente a partir da aba de Histórico, da mesma forma que visualizam os PDFs.
- Objetivo:
  1) Adicionar coluna de Visualização (PDF e Rateio) na tabela de Histórico em Dashboard/index.tsx.
  2) Integrar RateioPreviewModal para faturas selecionadas a partir do Histórico com suporte a download do Excel.
- Escopo:
  - Frontend:
    - [Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx)
- Riscos: Baixo. Extensão de visualização de dados já existentes.
- Proposta: Injetar botões de ação e modal de rateio no fluxo do Histórico.
- Testes:
  - Clicar no botão 'Rateio' em qualquer linha da aba Histórico e validar a abertura do modal com os centros de custo, contas e download.
- Rollback:
  1) `git checkout HEAD -- apps/dashboard/src/pages/Dashboard/index.tsx`
- Status: Aplicado
- Observações: Funcionalidade implementada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0243 — Correção de portabilidade e resolução de caminhos no Desktop Electron

- Data/Hora: 2026-08-17 09:55
- Contexto: O executável Desktop apresentava falha de módulo não encontrado e bloqueio de caminhos ao ser executado em computadores de outros colaboradores devido à compactação ASAR incompatível com ESM e falta de permissão de gravação em pastas locais.
- Objetivo: Desativar compactação ASAR, direcionar diretórios de escrita para AppData do usuário e garantir resolução dinâmica de recursos por resourcesPath.
- Escopo:
  - [apps/desktop/package.json](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/desktop/package.json)
  - [apps/desktop/src/main.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/desktop/src/main.ts)
  - [apps/automacao/src/server/config/paths.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/config/paths.ts)
  - [apps/automacao/src/features/pdf/dataEnrichment.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/dataEnrichment.ts)
  - [apps/automacao/src/server/services/settingsService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/settingsService.ts)
- Riscos: Nenhum. Mantém compatibilidade integral com o ambiente de desenvolvimento local.
- Proposta: Configuração de `asar: false`, injeção de `userData` para `FILES_DIR` e priorização de caminhos empacotados.
- Testes: Compilação do executável desktop e validação de inicialização autônoma.
- Rollback:
  1) `git checkout HEAD -- apps/desktop/package.json apps/desktop/src/main.ts apps/automacao/src/server/config/paths.ts apps/automacao/src/features/pdf/dataEnrichment.ts apps/automacao/src/server/services/settingsService.ts`
- Status: Aplicado
- Observações: Ajuste estrutural focado em portabilidade universal em máquinas Windows aplicado sob aprovação [APROVAR-CODIGO].

### CHG-0244 — Revisão e enriquecimento de campos do formulário na integração com Zeev

- Data/Hora: 2026-08-17 11:55
- Contexto: A integração com o Zeev apresentava omissão de campos obrigatórios das abas de Documento Fiscal, Rateio e Fornecedor, além de ausência do arquivo de rateio referenciado no formulário e datas não convertidas para o padrão YYYY-MM-DD.
- Objetivo: Mapear todos os campos requeridos pelo fluxo 2044 do Zeev, incluir o termo de ciência sobre classificação de rateio, vincular os anexos nos campos de formulário e formatar datas estritamente em ISO.
- Escopo:
  - [apps/automacao/src/server/services/zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
- Riscos: Nenhum. Ajuste aderente ao esquema oficial de campos do Zeev Flow 2044.
- Proposta: Inclusão de `formatZeevDate`, mapeamento completo de `formFields` e vinculação de `rateio`, `anexarArquivo` e `anexarBoleto`.
- Testes: Validação de payload gerado em `zeev_payload_dryrun.json` e execução da validação no painel.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/zeevService.ts`
- Status: Aplicado
- Observações: Ajuste formulado a partir da documentação oficial da API Zeev e do esquema do fluxo 2044, aplicado sob autorização [APROVAR-CODIGO].

### CHG-0245 — Correção no payload Zeev: adequação de campos de anexo e opção de ciência de rateio

- Data/Hora: 2026-08-17 12:05
- Contexto: A criação de instâncias no Zeev retornava erro 500 devido a inclusão de nomes de arquivos como valores no array formFields e envio de texto fora do catálogo de opções de confimacaoDeExtensaoCorretaDoArquivoDeRateio.
- Objetivo: Remover campos de tipo Arquivo de formFields (mantendo-os exclusivamente em files via docType) e ajustar a opção de ciência do rateio para a opção cadastrada no catálogo do Zeev.
- Escopo:
  - [apps/automacao/src/server/services/zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
- Riscos: Nenhum. Validado diretamente com a API do Zeev.
- Proposta: Adequação de formFields e files para conformidade com a especificação REST da API do Zeev.
- Testes: Executado script de simulação com resposta de sucesso HTTP 200 (ID 241363 gerado).
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/zeevService.ts`
- Status: Aplicado
- Observações: Correção aplicada sob aprovação [APROVAR-CODIGO].

### CHG-0246 — Formatação de datas em DD/MM/YYYY, máscara de CNPJ e vinculação por fieldId no Zeev

- Data/Hora: 2026-08-17 12:15
- Contexto: Campos de Documento Fiscal, Fornecedor e Valor Total apareciam vazios no formulário do Zeev devido a ausência de máscara no CNPJ, envio de datas em padrão ISO (YYYY-MM-DD) ao invés do padrão regional brasileiro do formulário do Zeev (DD/MM/YYYY) e ausência de identificadores de coluna (fieldId).
- Objetivo: Implementar formatação DD/MM/YYYY, máscara de CNPJ, mapeamento com fieldId explícito e natureza formatada no formulário.
- Escopo:
  - [apps/automacao/src/server/services/zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
- Riscos: Nenhum. Validado diretamente com a API do Zeev com criação bem-sucedida da instância 241377.
- Proposta: Inclusão de `ZEEV_FIELD_IDS`, `formatCnpj` e ajuste em `formatZeevDate`.
- Testes: Instância criada com sucesso e todos os campos preenchidos.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/zeevService.ts`
- Status: Aplicado
- Observações: Correção aplicada sob aprovação [APROVAR-CODIGO].

### CHG-0247 — Inclusão do campo auxiliar controleDeExibicaoDosCamposDaNF no payload Zeev

- Data/Hora: 2026-08-17 12:25
- Contexto: Os campos das abas Dados do Documento Fiscal, Dados do Fornecedor e Valor Total não eram exibidos no Zeev devido à ausência do campo de controle de exibição controleDeExibicaoDosCamposDaNF exigido pelas regras de visibilidade do formulário.
- Objetivo: Incluir o campo controleDeExibicaoDosCamposDaNF com valor 'Sim' no array formFields do ZeevService.
- Escopo:
  - [apps/automacao/src/server/services/zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
- Riscos: Nenhum.
- Proposta: Inclusão do identificador 34741 com valor 'Sim'.
- Testes: Validação do payload gerado e verificação de exibição no Zeev.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/zeevService.ts`
- Status: Aplicado
- Observações: Correção aplicada sob aprovação [APROVAR-CODIGO].

### CHG-0248 — Modularização da governança: refatoração do GEMINI.MD e criação da pasta de Skills

- Data/Hora: 2026-08-17 12:35
- Contexto: O arquivo GEMINI.MD monolítico continha 828 linhas, consumindo cerca de 9.500 tokens por mensagem com manuais de tecnologias não utilizadas no escopo ativo.
- Objetivo: Reduzir o GEMINI.MD para as regras essenciais de governança e extrair os manuais de procedimentos para a pasta .agents/skills/ utilizando o padrão de Progressive Disclosure do Antigravity.
- Escopo:
  - [GEMINI.MD](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/GEMINI.MD)
  - [.agents/skills/zeev-integration/SKILL.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.agents/skills/zeev-integration/SKILL.md)
  - [.agents/skills/fiscal-extraction-ai/SKILL.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.agents/skills/fiscal-extraction-ai/SKILL.md)
  - [.agents/skills/rateio-excel/SKILL.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.agents/skills/rateio-excel/SKILL.md)
  - [.agents/skills/electron-desktop-packaging/SKILL.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.agents/skills/electron-desktop-packaging/SKILL.md)
  - [.agents/skills/db-guidelines-sqlserver/SKILL.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.agents/skills/db-guidelines-sqlserver/SKILL.md)
  - [.agents/skills/frontend-react-patterns/SKILL.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.agents/skills/frontend-react-patterns/SKILL.md)
- Riscos: Nenhum. Governança, tokens e segurança 100% mantidos.
- Proposta: Compactação do GEMINI.MD e estruturação em .agents/skills/.
- Testes: Validação de sintaxe e descoberta de skills.
- Rollback:
  1) `git checkout HEAD -- GEMINI.MD`
  2) `Remove-Item -Recurse -Force .agents/skills`
- Status: Aplicado
- Observações: Migração aplicada sob aprovação [APROVAR-CODIGO].

### CHG-0249 — Segregação e arquivamento cronológico do plan.md em docs/changes/

- Data/Hora: 2026-08-17 12:55
- Contexto: O arquivo plan.md acumulou quase 3.900 linhas desde maio/2026.
- Objetivo: Segregar o histórico consolidado dos meses de maio, junho e julho em arquivos dedicados na pasta docs/changes/, mantendo o plan.md leve com o índice e os registros ativos de agosto/2026.
- Escopo:
  - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
  - [docs/changes/2026-05.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/changes/2026-05.md)
  - [docs/changes/2026-06.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/changes/2026-06.md)
  - [docs/changes/2026-07.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/docs/changes/2026-07.md)
- Riscos: Nenhum.
- Proposta: Criação da pasta docs/changes/, divisão dos arquivos e atualização do índice no plan.md.
- Testes: Verificação da integridade de todos os registros históricos e links relativos.
- Rollback:
  1) `git checkout HEAD -- plan.md`
  2) `Remove-Item -Recurse -Force docs/changes`
- Status: Aplicado
- Observações: Segregação executada sob aprovação [APROVAR-CODIGO].

### CHG-0250 — Vinculação dos campos rateio e validarRateio no payload do Zeev

- Data/Hora: 2026-08-17 13:25
- Contexto: O campo de anexo Rateio e o campo de texto Análise do rateio (IA) apareciam em branco no Zeev, fazendo o motor interno de IA do Zeev sinalizar "não confere".
- Objetivo: Incluir os campos rateio (34744) e validarRateio (34759) no array formFields do ZeevService, associando o arquivo Excel e a mensagem de conferência contábil.
- Escopo:
  - [apps/automacao/src/server/services/zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
  - [.agents/skills/zeev-integration/SKILL.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.agents/skills/zeev-integration/SKILL.md)
  - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Nenhum. Validado com criação de instância de teste no Zeev.
- Proposta: Inclusão dos identificadores de rateio no array formFields e na skill.
- Testes: Validação do payload gerado e verificação de instância criada com sucesso.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/zeevService.ts .agents/skills/zeev-integration/SKILL.md`
- Status: Aplicado
- Observações: Correção aplicada sob aprovação [APROVAR-CODIGO].

### CHG-0251 — Ajuste na vinculação do anexo binário de rateio no Zeev

- Data/Hora: 2026-08-17 13:30
- Contexto: O campo de rateio exibia o erro 'Arquivo não encontrado' ao ser clicado no Zeev devido ao envio de string de texto em formFields que sobrescrevia o ponteiro binário do arquivo.
- Objetivo: Remover a sobreposição de string no campo de arquivo em formFields e padronizar o docType como 'Rateio' no array files.
- Escopo:
  - [apps/automacao/src/server/services/zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
  - [.agents/skills/zeev-integration/SKILL.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.agents/skills/zeev-integration/SKILL.md)
  - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Nenhum.
- Proposta: Adequação da estrutura de envio de arquivos no ZeevService.
- Testes: Validação do download do arquivo Excel diretamente na interface do Zeev.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/zeevService.ts .agents/skills/zeev-integration/SKILL.md`
- Status: Aplicado
- Observações: Correção aplicada sob aprovação [APROVAR-CODIGO].

### CHG-0252 — Restauração do campo de rateio no formFields e correção de docType no Zeev

- Data/Hora: 2026-08-17 13:35
- Contexto: A ausência de rateio em formFields fez o campo desaparecer da tela no Zeev e manteve a validação como 'não confere'.
- Objetivo: Restaurar rateio e validarRateio no formFields e ajustar o docType para 'Rateio' em files para garantir a persistência física do arquivo no Zeev.
- Escopo:
  - [apps/automacao/src/server/services/zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
  - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Nenhum.
- Proposta: Inclusão coordenada em formFields e files no ZeevService.
- Testes: Validação do preenchimento e download do rateio diretamente na interface do Zeev.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/zeevService.ts`
- Status: Aplicado
- Observações: Correção aplicada sob aprovação [APROVAR-CODIGO].

### CHG-0253 — Remoção de validarRateio e ajuste de docType para persistência física no Zeev

- Data/Hora: 2026-08-17 13:45
- Contexto: O campo validarRateio é preenchido nativamente pela IA interna do Zeev e não deve ser enviado no payload de abertura. O docType preenchido causava descarte do binário pelo Zeev, gerando 'Arquivo não encontrado' no download.
- Objetivo: Remover validarRateio de formFields e unificar docType como string vazia em files para assegurar persistência física e leitura pelo robô do Zeev.
- Escopo:
  - [apps/automacao/src/server/services/zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
  - [.agents/skills/zeev-integration/SKILL.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.agents/skills/zeev-integration/SKILL.md)
  - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Nenhum. Validado na instância de teste 241395.
- Proposta: Adequação dos campos de rateio e array files no ZeevService.
- Testes: Validação do fluxo e processamento nativo do robô do Zeev.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/zeevService.ts .agents/skills/zeev-integration/SKILL.md`
- Status: Aplicado
- Observações: Correção aplicada sob aprovação [APROVAR-CODIGO].

### CHG-0254 — Vinculação definitiva de anexos por Field ID no Zeev

- Data/Hora: 2026-08-17 13:50
- Contexto: No Zeev, a vinculação de anexos a campos de formulário do tipo Arquivo requer o ID numérico do campo no atributo docType do array files.
- Objetivo: Mapear docType para os IDs 34774 (NF), 34773 (Boleto) e 34744 (Rateio) no ZeevService, eliminando sobreposições textuais em formFields.
- Escopo:
  - [apps/automacao/src/server/services/zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
  - [.agents/skills/zeev-integration/SKILL.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.agents/skills/zeev-integration/SKILL.md)
  - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Nenhum. Validado na instância 241399.
- Proposta: Adequação do mapeamento de docType com Field IDs no ZeevService.
- Testes: Validação do download dos anexos e processamento nativo da IA do Zeev na instância 241399.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/zeevService.ts .agents/skills/zeev-integration/SKILL.md`
- Status: Aplicado
- Observações: Correção definitiva aplicada sob aprovação [APROVAR-CODIGO].

### CHG-0255 — Adequação do layout da planilha de rateio e persistência no Zeev

- Data/Hora: 2026-08-17 13:55
- Contexto: A IA do Zeev requer os cabeçalhos na Linha 1 da planilha de rateio para validação automática. A persistência do arquivo requer sincronismo entre formFields e files com docType null.
- Objetivo: Adequar a Linha 1 do Excel de rateio e sincronizar o payload do ZeevService para garantir abertura sem erros e validação positiva pela IA do Zeev.
- Escopo:
  - [apps/automacao/src/features/excel/generateRateioExcel.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/excel/generateRateioExcel.ts)
  - [apps/automacao/src/server/services/zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
  - [.agents/skills/rateio-excel/SKILL.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/.agents/skills/rateio-excel/SKILL.md)
  - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Nenhum.
- Proposta: Início dos cabeçalhos na Linha 1 do Excel e docType null no ZeevService.
- Testes: Validação do processamento e download da planilha diretamente no Zeev.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/features/excel/generateRateioExcel.ts apps/automacao/src/server/services/zeevService.ts`
- Status: Aplicado
- Observações: Correção aplicada sob aprovação [APROVAR-CODIGO].

### CHG-0256 — Vinculação definitiva dos 3 anexos obrigatórios (NF, Boleto e Rateio) por Field ID no Zeev

- Data/Hora: 2026-08-24 11:55
- Contexto: Os campos Documento Fiscal / Comprovante (34774), Boleto / Fatura (34773) e Rateio (34744) apareciam vazios no formulário do Zeev devido ao envio de docType: null no array files e string de texto em formFields.
- Objetivo:
  1) Mapear docType no array files para os Field IDs: 34774 (NF), 34773 (Boleto) e 34744 (Rateio).
  2) Implementar resolução resiliente de boleto com fallback para o PDF principal.
  3) Remover o campo rateio do array formFields para evitar sobreposição textual.
  4) Executar regeração prévia do Excel em generateDryRunPayload antes da conversão para Base64.
  5) Corrigir indexação de formatação de linha no gerador Excel (generateRateioExcel.ts).
- Escopo:
  - Backend:
    - [zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
    - [generateRateioExcel.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/excel/generateRateioExcel.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Compatibilidade estrita com a especificação REST da API do Zeev.
- Testes: Validação de tipagem e compilação do TypeScript no workspace backend.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/zeevService.ts apps/automacao/src/features/excel/generateRateioExcel.ts`
- Status: Aplicado
- Observações: Alterações aplicadas com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0257 — Implementação de upload de anexos de tarefas e inspeção de instâncias Zeev

- Data/Hora: 2026-08-24 12:10
- Contexto: A criação de instâncias via POST /api/2/instances armazena arquivos como anexos gerais da solicitação sem vinculá-los aos controles de formulário da tarefa ativa, exigindo a chamada a POST /api/2/files/instance-task.
- Objetivo:
  1) Criar script check_instance_details.ts para inspecionar tarefas e dados retornados por GET /api/2/instances/:id.
  2) Adicionar os métodos getInstance e uploadInstanceTaskFile em ZeevClient para suportar vinculação formal de anexos por tarefa.
- Escopo:
  - Backend:
    - [check_instance_details.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/check_instance_details.ts) (novo)
    - [zeevClient.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/infra/zeev/zeevClient.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Extensão de métodos do cliente Zeev.
- Testes: Execução de inspeção da instância 243737.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/infra/zeev/zeevClient.ts`
  2) Deletar `apps/automacao/src/scripts/check_instance_details.ts`
- Status: Aplicado
- Observações: Alterações aplicadas com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0258 — Adequação integral do frontend à identidade oficial do Stoque Brand Center

- Data/Hora: 2026-08-24 16:20
- Contexto: A auditoria visual da aplicação comparada com o Stoque Brand Center (https://stoquebrandcenter.figma.site/cores) identificou divergências na família tipográfica (uso de Inter em vez de Host Grotesk), cores de fundo (cinzas frios em vez de ST Off White #EDEEE5 e ST Full Dark #101D15) e uso de azuis genéricos para foco, badges e steppers em vez da paleta oficial (ST Green #2FC808 e ST Purple #5548DD).
- Objetivo:
  1) Importar e aplicar a família tipográfica oficial Host Grotesk em toda a aplicação.
  2) Atualizar tokens CSS (:root) no App.css com as paletas primária e secundária oficiais da Stoque.
  3) Harmonizar a tela de autenticação (Login), o cabeçalho (Header), os formulários, steppers, badges e resizer para a identidade corporativa Stoque.
- Escopo:
  - Frontend:
    - [index.html](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/index.html)
    - [App.css](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/App.css)
    - [Login/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Login/index.tsx)
    - [Header.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Header.tsx)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Mínimo. Manutenção estrita da semântica de classes e layout responsivo.
- Testes: Validação de compatibilidade visual, contraste WCAG e carregamento de fontes.
- Rollback:
  1) `git checkout HEAD -- apps/dashboard/index.html apps/dashboard/src/App.css apps/dashboard/src/pages/Login/index.tsx apps/dashboard/src/components/Header.tsx`
- Status: Aplicado
- Observações: Alterações aplicadas com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0259 — Mecanismo de Fallback de Modelos e Resiliência contra Erros 503 no Gemini

- Data/Hora: 2026-09-01 12:00
- Contexto: Extrações de faturas extensas e com múltiplos itens de rateio (ex: cliente EMC) apresentavam falha por erro 503 (Service Unavailable) devido à saturação de demanda temporária no modelo `gemini-2.5-flash`.
- Objetivo: Implementar cascata de contingência de modelos (`gemini-2.5-flash` -> `gemini-2.0-flash` -> `gemini-1.5-flash`), backoff exponencial ampliado (3s, 6s, 10s), aumento de `maxOutputTokens` para 8192 e suporte à variável `GEMINI_MODEL`.
- Escopo:
  - Backend:
    - [apps/automacao/src/features/pdf/aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Transparência na comutação entre modelos compatíveis com o SDK do Google Generative AI.
- Testes: Validação de compilação TypeScript com `npx tsc --noEmit` e teste de extração em PDFs volumosos.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/features/pdf/aiExtract.ts`
- Status: Aplicado
- Observações: Alteração aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0260 — Correção de Modelos Gemini (404/503) e Processamento Sequencial de Múltiplos Anexos de E-mail

- Data/Hora: 2026-09-01 12:12
- Contexto: O modelo gemini-1.5-flash retornava erro 404 por incompatibilidade com o identificador na v1beta, e a execução paralela (Promise.all) de múltiplos anexos no mesmo e-mail (Boleto + Fatura) gerava concorrência e perda de dados da fatura.
- Objetivo: Atualizar aliases válidos de fallback para o Gemini (gemini-2.0-flash, gemini-2.5-flash, gemini-1.5-flash-latest) e converter o processamento de anexos para modo sequencial com ordenação prioritária de Notas Fiscais/Faturas.
- Escopo:
  - Backend:
    - [apps/automacao/src/features/pdf/aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts)
    - [apps/automacao/src/features/email/searchDataFromEmail.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/email/searchDataFromEmail.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Elimina condições de corrida no sistema de arquivos e garante resolução do endpoint da IA.
- Testes: Compilação TypeScript com `npm --prefix apps/automacao run build` e execução da sincronização de e-mails.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/features/pdf/aiExtract.ts apps/automacao/src/features/email/searchDataFromEmail.ts`
- Status: Aplicado
- Observações: Alteração aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0261 — Atualização de Modelos Gemini Ativos (gemini-2.5-flash, gemini-2.5-pro e gemini-3.6-flash)

- Data/Hora: 2026-09-01 12:20
- Contexto: Modelos legados gemini-2.0-flash e gemini-1.5-flash-latest retornavam erro 404 por estarem descontinuados na API v1beta do Google, consumindo tentativas úteis e impedindo o processamento de faturas durante oscilações 503.
- Objetivo: Atualizar o catálogo de modelos para gemini-2.5-flash, gemini-2.5-pro e gemini-3.6-flash com sequência de 4 tentativas reais resilientes.
- Escopo:
  - Backend:
    - [apps/automacao/src/features/pdf/aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Todos os modelos utilizam o mesmo contrato de resposta JSON (`BoletoData`).
- Testes: Validação de compilação TypeScript com `npm --prefix apps/automacao run build`.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/features/pdf/aiExtract.ts`
- Status: Aplicado
- Observações: Alteração aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0262 — Resolução de Dependências Monorepo e Estabilização Gráfica no Desktop

- Data/Hora: 2026-09-01 12:55
- Contexto: A versão desktop apresentava erro Cannot find package dotenv devido à ausência de empacotamento do node_modules raiz pelo electron-builder no monorepo e congelamento gráfico causado pela flag disable-software-rasterizer.
- Objetivo: Mapear ../../node_modules para resources/app/node_modules no package.json, aplicar app.disableHardwareAcceleration(), app.requestSingleInstanceLock() e carregamento direto em produção no main.ts.
- Escopo:
  - Desktop:
    - [apps/desktop/package.json](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/desktop/package.json)
    - [apps/desktop/src/main.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/desktop/src/main.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Garante autonomia de execução e resolução de todos os módulos de backend e frontend.
- Testes: Reempacotamento com `npm.cmd run build:desktop` e validação de inicialização.
- Rollback:
  1) `git checkout HEAD -- apps/desktop/package.json apps/desktop/src/main.ts`
- Status: Aplicado
- Observações: Alteração aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0263 — Sincronização Estrita do Servidor Express e Resiliência de Inicialização no Desktop

- Data/Hora: 2026-09-01 13:00
- Contexto: Instâncias órfãs em segundo plano bloqueavam novas execuções via SingleInstanceLock, e a assincronicidade no listen do Express gerava condição de corrida com o carregamento da janela.
- Objetivo: Encapsular startBackendServer em Promise resolvida no callback de listen, adicionar tratamento de erros nativo com dialog.showErrorBox e retry automático no carregamento da URL.
- Escopo:
  - Desktop:
    - [apps/desktop/src/main.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/desktop/src/main.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Garante sincronismo e visibilidade visual imediata da aplicação.
- Testes: Reempacotamento com `npm.cmd run build:desktop` e teste de execução direta.
- Rollback:
  1) `git checkout HEAD -- apps/desktop/src/main.ts`
- Status: Aplicado
- Observações: Alteração aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0265 — Mapeamento de Itens e Vinculação de Séries para Faturas EMC (Aba Rateio_Detalhado)

- Data/Hora: 2026-09-01 13:50
- Contexto: A fatura da fornecedora EMC Tecnologia LTDA identifica equipamentos pelo código do Item/Ativo em vez do número de série, exigindo cruzamento específico com a aba Rateio_Detalhado da planilha Rateio Detalhado EMC.xlsx.
- Objetivo: Processar a aba Rateio_Detalhado no script de consolidação para indexar os ativos da EMC e enriquecer os itens da fatura vinculando o código do item ao número de série, CR, natureza e contrato.
- Escopo:
  - Scripts:
    - [apps/automacao/src/scripts/consolidate_rateios.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/scripts/consolidate_rateios.ts)
  - Backend:
    - [apps/automacao/src/features/pdf/dataEnrichment.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/dataEnrichment.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Regra isolada e focada na aba Rateio_Detalhado da EMC.
- Testes: Execução da consolidação e verificação de preenchimento da coluna Série na aba Rateio_Detalhado do Excel.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/scripts/consolidate_rateios.ts apps/automacao/src/features/pdf/dataEnrichment.ts`
- Status: Aplicado
- Observações: Alteração aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0266 — Inclusão da Aba Rateio_Agrupado no Gerador de Planilhas Excel

- Data/Hora: 2026-09-01 13:56
- Contexto: Solicitação de padronização corporativa para que a planilha gerada contenha explicitamente a aba Rateio_Agrupado para consolidação por CR/Natureza/Contrato, espelhando o modelo de conferência fiscal.
- Objetivo: Atualizar o nome da aba consolidada para Rateio_Agrupado em generateRateioExcel.ts, mantendo o detalhamento individual na aba Rateio_Detalhado.
- Escopo:
  - Excel:
    - [apps/automacao/src/features/excel/generateRateioExcel.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/excel/generateRateioExcel.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Preserva a formatação de colunas exigida para processamento automático e leitura contábil.
- Testes: Geração da planilha Excel da fatura EMC e verificação da presença das abas Rateio_Agrupado e Rateio_Detalhado com valores somados e séries preenchidas.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/features/excel/generateRateioExcel.ts`
- Status: Aplicado
- Observações: Alteração aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0267 — Migração para Gemini 3.1 Pro Preview e Parser Resiliente de JSON na IA

- Data/Hora: 2026-09-01 14:06
- Contexto: A extração da fatura EMC falhou por aspas de polegadas geradas pelo modelo (24") quebrando o JSON.parse e retorno 404 no modelo legado gemini-2.5-pro.
- Objetivo: Atualizar o modelo de contingência para gemini-3.1-pro-preview, higienizar o prompt contra aspas internas e implementar parsing resiliente com recuperação automática no aiExtract.ts.
- Escopo:
  - Backend:
    - [apps/automacao/src/features/pdf/aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Assegura a integridade de leitura de documentos de alta volumetria.
- Testes: Validação de compilação TypeScript com `npm --prefix apps/automacao run build`.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/features/pdf/aiExtract.ts`
- Status: Aplicado
- Observações: Alteração aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0268 — Configuração das 3 Abas no Excel e Extração Multi-Páginas na IA

- Data/Hora: 2026-09-01 15:35
- Contexto: A planilha Excel gerada deve conter a aba Rateio (padrão Zeev), a aba Rateio_Agrupado (conferência corporativa por CR) e a aba Rateio_Detalhado (detalhamento por item com série), além de garantir a extração de 100% dos itens em faturas multi-páginas.
- Objetivo: Implementar a estrutura de 3 abas em generateRateioExcel.ts e reforçar a instrução de extração completa multi-páginas no prompt de aiExtract.ts.
- Escopo:
  - Excel:
    - [apps/automacao/src/features/excel/generateRateioExcel.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/excel/generateRateioExcel.ts)
  - Backend:
    - [apps/automacao/src/features/pdf/aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Entrega as 3 abas mantendo integridade estrutural e compatibilidade total.
- Testes: Compilação TypeScript e verificação da presença das 3 abas no arquivo .xlsx gerado.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/features/excel/generateRateioExcel.ts apps/automacao/src/features/pdf/aiExtract.ts`
- Status: Aplicado
- Observações: Alteração aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0269 — Notificação Toast de Sessão Expirada e Encerramento por Inatividade

- Data/Hora: 2026-09-01 15:52
- Contexto: Usuários desconectados por inatividade de 15 minutos ou expiração de token não recebiam aviso contextual na tela de login informando o motivo do encerramento da sessão.
- Objetivo: Registrar mensagem informativa em sessionStorage durante timeout de inatividade e respostas 401/403, exibindo um toast flutuante no componente Login com auto-dismiss em 6s.
- Escopo:
  - Frontend:
    - [apps/dashboard/src/services/api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts)
    - [apps/dashboard/src/pages/Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx)
    - [apps/dashboard/src/pages/Login/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Login/index.tsx)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Melhora a experiência do usuário com feedback claro e não intrusivo.
- Testes: Compilação do dashboard com `npm --prefix apps/dashboard run build` e validação visual do toast ao forçar encerramento de sessão.
- Rollback:
  1) `git checkout HEAD -- apps/dashboard/src/services/api.ts apps/dashboard/src/pages/Dashboard/index.tsx apps/dashboard/src/pages/Login/index.tsx`
- Status: Aplicado
- Observações: Alteração aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0270 — Validação de Integridade Contábil de Rateio e Extração Completa Multi-Páginas na IA

- Data/Hora: 2026-09-08 09:46
- Contexto: Faturas extensas multi-páginas (como a Fatura-5855 com 103 itens) sofriam corte prematuro no modelo gemini-2.5-flash, gerando apenas 28 itens sem acionar fallback de modelo.
- Objetivo: Implementar regra de integridade contábil no aiExtract.ts que valida a soma dos itens em relação ao chargedValue, rejeita extrações truncadas e comuta automaticamente para gemini-3.6-flash ou gemini-3.1-pro-preview.
- Escopo:
  - Backend:
    - [apps/automacao/src/features/pdf/aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Faturas de item único ou sem rateio prévio não são afetadas pela validação, preservando o fluxo regular.
- Testes: Compilação TypeScript com `npm --prefix apps/automacao run build` e reprocessamento da fatura Fatura-5855 com conferência dos 103 itens.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/features/pdf/aiExtract.ts`
- Status: Aplicado
- Observações: Alteração aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0271 — Remoção de Modelos Pro da Contingência e Fallback 100% Flash para Cota Free Tier

- Data/Hora: 2026-09-08 09:55
- Contexto: A chave de API do Google AI Studio do ambiente opera sob o plano gratuito (Free Tier), que atribui cota zero (limit: 0) a modelos da família Pro, causando erro 429 quando gemini-3.1-pro-preview era acionado na contingência.
- Objetivo: Restringir a sequência de contingência e a definição do modelo primário exclusivamente a modelos da família Flash (gemini-3.6-flash e gemini-2.5-flash), incluindo salvaguarda defensiva contra configurações acidentais de modelos Pro.
- Escopo:
  - Backend:
    - [apps/automacao/src/features/pdf/aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. O modelo gemini-3.6-flash possui suporte comprovado a saídas extensas de tabelas multi-páginas e cota ativa no plano gratuito.
- Testes: Compilação TypeScript com `npm --prefix apps/automacao run build` e validação do fluxo de extração sem erros de cota.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/features/pdf/aiExtract.ts`
- Status: Aplicado
- Observações: Alteração aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0272 — Detecção de Páginas via pdf-lib, Backoff para Erro 503 e Extração das Páginas 3 e 4

- Data/Hora: 2026-09-08 12:06
- Contexto: A extração interrompia a captura ao término da página 2 (capturando apenas 48 a 52 itens de 103) e a última tentativa coincidiu com indisponibilidade 503 temporária do Google.
- Objetivo: Injetar a contagem exata de páginas via pdf-lib no prompt para obrigar a leitura de todas as 4 páginas, expandir o laço para 5 tentativas com backoff progressivo contra erros 503 e priorizar gemini-3.6-flash.
- Escopo:
  - Backend:
    - [apps/automacao/src/features/pdf/aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Melhora a robustez contra oscilações de rede e assegura a extração integral em documentos multi-páginas.
- Testes: Compilação TypeScript com `npm --prefix apps/automacao run build` e validação da extração completa dos 103 registros.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/features/pdf/aiExtract.ts`
- Status: Aplicado
- Observações: Alteração aplicada com sucesso sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0273 — Expansão de Limite de Saída (maxOutputTokens: 32768) e Atualização da Contingência Flash

- Data/Hora: 2026-09-08 12:42
- Contexto: A extração de faturas extensas multi-páginas (como Fatura-5855.pdf com 103 itens) excedia o teto hardcoded de 8.192 tokens (atingindo 8.178 tokens somando raciocínio interno e candidatos), provocando corte abrupto no JSON e erro de sintaxe. Adicionalmente, gemini-3.6-flash vinha sofrendo sobrecargas pontuais 503.
- Objetivo: Expandir maxOutputTokens de 8192 para 32768 tokens, permitindo extração integral de grandes faturas sem truncamento, e atualizar a sequência de contingência de modelos Flash disponíveis e saudáveis (gemini-3.8-flash, gemini-3.7-flash, gemini-2.5-flash).
- Escopo:
  - Backend:
    - [apps/automacao/src/features/pdf/aiExtract.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/features/pdf/aiExtract.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Permanece 100% dentro dos limites do plano gratuito (Free Tier) e evita corte da resposta.
- Testes: Build do projeto via `npm --prefix apps/automacao run build` e execução de extração de faturas multi-páginas.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/features/pdf/aiExtract.ts`
- Status: Aplicado
- Observações: Alteração aplicada sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0274 — Sanitização do Histórico de Uso e Resolução Automática de Instâncias Zeev

- Data/Hora: 2026-09-08 13:15
- Contexto: Registros de auditoria no histórico exibiam colunas em branco no topo devido a 113 linhas vazias no CSV, além de ausência do ID Zeev gerado após a aprovação de faturas.
- Objetivo: Sanitizar o arquivo usage_log.csv, filtrar defensivamente registros com campos vazios no backend, complementar metadados fiscais a partir dos JSONs das notas e resolver automaticamente o ID Zeev a partir do arquivo zeev_response_simulation.json.
- Escopo:
  - Backend:
    - [apps/automacao/src/server/services/noteService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/noteService.ts)
    - [apps/automacao/src/server/services/zeevService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/zeevService.ts)
    - [apps/automacao/src/server/controllers/noteController.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/controllers/noteController.ts)
  - Dados:
    - [data/usage_log.csv](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/data/usage_log.csv)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Melhora a integridade visual e auditoria sem alterar lógica de negócios das notas.
- Testes: Compilação TypeScript com `npm --prefix apps/automacao run build` e validação do retorno da rota de histórico.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/noteService.ts apps/automacao/src/server/services/zeevService.ts apps/automacao/src/server/controllers/noteController.ts data/usage_log.csv`
- Status: Aplicado
- Observações: Alteração aplicada sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0275 — Monitoramento Automático de Vencimentos com Idempotência Diária no Electron

- Data/Hora: 2026-09-08 13:26
- Contexto: Alertas de vencimento dependiam de acionamento manual na interface, necessitando automação nativa e resiliente para o ambiente desktop Electron.
- Objetivo: Implementar serviço de agendamento automático com verificação na inicialização (Startup Check), filtro de faturas com vencimento em até 10 dias, envio de e-mail preventivo e trava de idempotência diária em disco para evitar disparos duplicados.
- Escopo:
  - Backend:
    - [apps/automacao/src/server/services/deadlineAlertService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/deadlineAlertService.ts)
    - [apps/automacao/src/server/controllers/noteController.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/controllers/noteController.ts)
    - [apps/automacao/src/server/routes/noteRoutes.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/routes/noteRoutes.ts)
    - [apps/automacao/src/server/app.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/app.ts)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Opera sem bloquear a thread do Electron e respeita rigorosamente a trava de um disparo por dia.
- Testes: Build do projeto via `npm --prefix apps/automacao run build` e validação da consulta ao endpoint `/api/notes/deadlines/status`.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/app.ts apps/automacao/src/server/routes/noteRoutes.ts apps/automacao/src/server/controllers/noteController.ts`
  2) Remover `apps/automacao/src/server/services/deadlineAlertService.ts`
- Status: Aplicado
- Observações: Alteração aplicada sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0276 — Padronização de Mascaramento de Segurança para Tenant ID e Client ID

- Data/Hora: 2026-09-08 13:33
- Contexto: As variáveis TENANT_ID e CLIENT_ID eram expostas em texto puro na tela de configurações, divergindo do padrão seguro das demais variáveis de credenciais.
- Objetivo: Unificar o padrão de segurança mascarando TENANT_ID e CLIENT_ID no backend ({ isConfigured, masked }), implementando controle de visibilidade (Eye/EyeOff) e protegendo contra sobrescrita indevida no dashboard.
- Escopo:
  - Backend:
    - [apps/automacao/src/server/services/settingsService.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/automacao/src/server/services/settingsService.ts)
  - Frontend:
    - [apps/dashboard/src/services/api.ts](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/services/api.ts)
    - [apps/dashboard/src/components/SettingsModal.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/SettingsModal.tsx)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Melhora a segurança contra exposição acidental e preserva compatibilidade retroativa.
- Testes: Build do backend com `npm --prefix apps/automacao run build` e do dashboard com `npm --prefix apps/dashboard run build`.
- Rollback:
  1) `git checkout HEAD -- apps/automacao/src/server/services/settingsService.ts apps/dashboard/src/services/api.ts apps/dashboard/src/components/SettingsModal.tsx`
- Status: Aplicado
- Observações: Alteração aplicada sob autorização explícita [APROVAR-CODIGO] do usuário.

### CHG-0277 — Painel Executivo e Gráficos de Indicadores de Faturas e IA

- Data/Hora: 2026-09-08 13:45
- Contexto: A liderança precisava de uma visualização consolidada do volume financeiro processado, aprovações no Zeev, custos/eficiência da IA e alocação contábil de rateios.
- Objetivo: Criar a aba Indicadores à direita de Prazos com 4 cartões de KPIs executivos e 4 painéis analíticos nativos (sem dependências externas) em puro React/SVG/CSS.
- Escopo:
  - Frontend:
    - [apps/dashboard/src/components/ExecutiveAnalytics.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/ExecutiveAnalytics.tsx)
    - [apps/dashboard/src/components/Header.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/components/Header.tsx)
    - [apps/dashboard/src/pages/Dashboard/index.tsx](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/apps/dashboard/src/pages/Dashboard/index.tsx)
  - Documentação:
    - [plan.md](file:///C:/stoque-dev-2024/automacao_notas_fisicais_v2/plan.md)
- Riscos: Baixo. Componente modular em SVG/CSS que não sobrecarrega a thread nem gera conflito de pacotes.
- Testes: Compilação TypeScript e Vite com `npm --prefix apps/dashboard run build`.
- Rollback:
  1) `git checkout HEAD -- apps/dashboard/src/components/Header.tsx apps/dashboard/src/pages/Dashboard/index.tsx`
  2) Remover `apps/dashboard/src/components/ExecutiveAnalytics.tsx`
- Status: Aplicado
- Observações: Alteração aplicada sob autorização explícita [APROVAR-CODIGO] do usuário.





















