# Introdução

O processamento e a conciliação fiscal de despesas corporativas são historicamente marcados por fluxos operacionais manuais e propensos a falhas. O recebimento descentralizado de faturas (notas fiscais e boletos) e a necessidade de realizar rateios financeiros complexos — baseados em ativos como hardware alugado ou contratos específicos por fornecedor — demandam esforço manual exaustivo dos times de contas a pagar. 

O **Stoque Fiscal Intelligence (SFI)** surge como uma solução inovadora de **Intelligent Document Processing (IDP)** baseada em arquitetura AI-First. Integrando a capacidade de compreensão contextual de Large Language Models (LLMs) via Google Gemini API e um painel de curadoria humana ("human-in-the-loop"), o projeto automatiza a captação, extração de dados estruturados de documentos complexos e enriquecimento contábil das faturas.

## Problema

No cenário corporativo atual, as empresas recebem diariamente dezenas de faturas em formatos variados de PDF (faturas de locação de hardware, boletos de concessionárias, notas fiscais de serviço). O processamento tradicional dessas faturas enfrenta dois grandes gargalos:
1. **Fragilidade Tecnológica**: Ferramentas de OCR convencionais e regras baseadas em expressões regulares (Regex) quebram facilmente a qualquer alteração de layout por parte do fornecedor, exigindo manutenção constante.
2. **Complexidade Contábil**: Faturas de locação que contêm múltiplos ativos agregados (ex: listas de notebooks ou monitores individuais representados por números de série) exigem que o analista fiscal busque planilhas de inventário de hardware e faça o cruzamento de/para manualmente para ratear os custos nos Centros de Resultados (CR), Naturezas de Despesa e Contratos corretos. Isso gera alta taxa de erro humano e retrabalho na entrada de dados no sistema ERP ou Zeev.

## Objetivos

O objetivo geral do projeto é desenvolver um ecossistema monorepo para automatizar de ponta a ponta o fluxo de processamento, enriquecimento contábil e curadoria de notas fiscais e boletos de despesa.

Os objetivos específicos incluem:
- **Motor AI-First de Extração**: Desenvolver um processador backend capaz de consumir PDFs de faturas, extraindo campos críticos com alta tolerância a layouts heterogêneos usando a API do Google Gemini.
- **Enriquecimento Dinâmico de Rateio**: Implementar lógica de enriquecimento contábil automatizado que cruze os dados de CNPJ do fornecedor e números de série com arquivos locais de inventário (Excel/CSV) para auto-preenchimento de CR, Natureza e Contratos.
- **Painel de Curadoria Humana**: Construir uma SPA em React integrada à API do backend que permita a revisão visual instantânea do PDF original confrontado com os dados extraídos, possibilitando edições manuais e a exportação final da planilha financeira compatível com os ERPs do cliente.
- **Rastreabilidade e Observabilidade**: Implementar ferramentas e relatórios de monitoramento de uso (latência, tokens e custos consumidos pela IA).

## Justificativa

A automatização deste fluxo reduz o tempo médio de tratamento de uma fatura de minutos para poucos segundos. Ao centralizar a validação em um painel interativo que destaca o rateio contábil no topo da interface e regera o Excel consolidado automaticamente a cada edição, o SFI elimina erros de digitação de valores financeiros e códigos de barras, acelerando o ciclo de contas a pagar e reduzindo os custos de licenciamento com softwares de OCR tradicionais de baixa precisão.

## Público-Alvo

- **Analistas Fiscais e Financeiros**: Profissionais responsáveis pela conferência, classificação contábil e aprovação de pagamentos no sistema ERP/Zeev da empresa. Possuem rotinas de alta carga operacional e necessitam de uma ferramenta de validação ágil baseada em exceções.
- **Gerentes Financeiros**: Stakeholders focados na integridade do orçamento e precisão das distribuições de centros de custos do monorepo, além do controle de custos transacionais associados à IA.
