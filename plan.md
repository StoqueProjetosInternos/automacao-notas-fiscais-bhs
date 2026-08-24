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

## 3. Registros Ativos — Agosto / 2026

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









