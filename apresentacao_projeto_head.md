# Apresentação Executiva: Stoque Fiscal Intelligence (SFI)

## 1. Resumo Executivo e Intuito do Projeto

O **Stoque Fiscal Intelligence (SFI)** é uma plataforma de **Intelligent Document Processing (IDP)** desenvolvida para automatizar de ponta a ponta a esteira de recebimento, extração de dados, enriquecimento contábil, rateio e lançamento de faturas de telecomunicações e infraestrutura de TI da companhia.

O intuito principal do projeto é transformar o fluxo passivo de lançamento fiscal em uma operação automatizada baseada na abordagem **AI-First com Curadoria Humana (Human-in-the-Loop)**, onde os dados são extraídos com alta precisão por inteligência artificial e validados pelo analista antes da integração final com o sistema BPM (Zeev).

---

## 2. Qual Problema o Projeto Resolve?

O projeto foi concebido para sanar gargalos operacionais e financeiros críticos da operação tradicional:

1. **Digitação e Conferência Manual Custosa**: Analistas despendiam horas digitando valores, CNPJs e datas de vencimento a partir de PDFs de faturas complexas.
2. **Fragilidade de Ferramentas Tradicionais (OCR / Regex)**: Faturas de serviços de telecomunicações possuem layouts heterogêneos e não padronizados. Leitores baseados em OCR tradicional falhavam frequentemente diante de mudanças de layout de fornecedores.
3. **Complexidade nos Rateios Contábeis**: Associação manual de itens de fatura com múltiplos Centros de Resultado (CR), Naturezas de Despesa e Números de Série de hardware (notebooks/monitores), gerando alto risco de erro humano nos lançamentos.
4. **Riscos de Multa e Juros por Atraso**: Lentidão no trâmite de aprovação, ocasionando perda de prazos de vencimento e pagamentos em atraso.
5. **Falta de Rastreabilidade e Auditoria**: Ausência de histórico consolidado com carimbo de tempo, usuário responsável, consumo de tokens de IA e registros de alterações efetuadas.

---

## 3. Stack Tecnológica e Arquitetura de TI

A solução adota uma arquitetura de monorepo moderna, leve e desacoplada, utilizando dependências de código aberto e APIs gerenciadas de alta escala:

### Core & Backend (`apps/automacao`)
- **Node.js & TypeScript**: Ambiente de execução estaticamente tipado garantindo previsibilidade e segurança de código.
- **Google Gemini AI API**: Motor de inteligência artificial generativa utilizado para leitura de documentos não estruturados, substituindo regras rígidas de OCR.
- **Microsoft Graph API**: Ingestão automática e monitoramento de caixas de entrada corporativas para captura de PDFs anexados.
- **Express.js REST API**: Camada de serviços backend leve exposta para comunicação com a interface de curadoria.
- **ExcelJS**: Geração determinística de planilhas financeiras de rateio no formato exigido pelo ERP/BPM.

### Frontend & Curadoria (`apps/dashboard`)
- **React 19 & TypeScript**: Interface web SPA moderna para visualização em tempo real do documento PDF lado a lado com o formulário editável.
- **Vite**: Bundler de altíssima performance para desenvolvimento e compilação de produção.
- **Vanilla CSS**: Sistema de estilos modular e responsivo.

### Integrações e Segurança
- **Zeev API (Orquestra BPM)**: Validação síncrona de regras corporativas e abertura automática de solicitações de pagamento.
- **Security by Design**: Ausência de credenciais em código-fonte, injeção exclusiva via variáveis de ambiente (`.env`), auditoria por fuso horário (`UTC-3`) e restrição de perfis (ADMIN/OPERATOR).

---

## 4. Benefícios para a Companhia

A implementação do SFI entrega ganhos diretos em três pilares organizacionais:

### Eficiência Operacional
- Redução drástica do tempo de processamento por fatura de minutos para segundos.
- Eliminação do trabalho braçal de digitação e geração manual de planilhas de rateio.

### Redução de Custos e Risco Financeiro
- Mitigação de pagamentos duplicados ou com juros decorrentes de perda de vencimento.
- Custo de IA insignificante quando comparado ao custo de horas humanas de digitação (centavos de dólar por fatura).

### Governança e Compliance
- Rastreabilidade total com relatórios de auditoria exportáveis em PDF e CSV contendo ID único, usuário solicitante e filtros aplicados.
- Notificações preventivas diárias via e-mail para faturas com vencimento próximo (menor ou igual a 10 dias).

---

## 5. Impacto e Métricas Esperadas

- **Produtividade do Time**: Aumento na capacidade de processamento da equipe financeira sem necessidade de expansão de headcount proporcional ao volume de faturas.
- **Precisão dos Dados**: Taxa de acerto superior na captura inicial de campos fiscais com validação humana em casos de divergência.
- **Escalabilidade**: Capacidade de processar centenas de faturas simultâneas mantendo a mesma infraestrutura leve e sem necessidade de servidores dedicados de alto custo.
