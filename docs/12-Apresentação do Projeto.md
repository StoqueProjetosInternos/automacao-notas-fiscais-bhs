# Apresentação do Projeto

Este roteiro descreve a estrutura sugerida para a apresentação executiva e técnica do **Stoque Fiscal Intelligence (SFI)** a stakeholders e gerentes financeiros.

## Identidade Visual e Temática
A apresentação deve refletir o design moderno do dashboard (dark theme, contrastes suaves de azul e verde) e focar na temática de produtividade, eliminação de digitação manual de faturas e retorno sobre o investimento (ROI) na redução de licenças OCR tradicionais de baixa acurácia.

## Estrutura do Conjunto de Slides

1. **Título e Capa**: Nome da plataforma (Stoque Fiscal Intelligence) e logo.
2. **Contexto e Problema**: O gargalo de contas a pagar, faturas complexas de locação de hardware (notebooks/monitores), custos de OCRs convencionais e erro humano na classificação de centros de custo.
3. **A Solução (AI-First IDP)**: Uso contextual do Google Gemini API para interpretar qualquer layout de fatura sem quebra de regras de regex ou OCR rígidos.
4. **Demonstração do Dashboard**: Capturas de tela mostrando a Sidebar de faturas ordenada/paginada, o PDF Viewer nativo e o Data Editor com a seção de rateio no topo.
5. **Arquitetura Técnica (Monorepo)**: Estrutura baseada em workspaces npm, Node.js + TypeScript, React 19, e persistência estruturada em JSONs locais por nota fiscal.
6. **Resultados e ROI**: Tempo médio de processamento por fatura reduzido de minutos para segundos, precisão de classificação automática de séries e observabilidade de tokens consumidos.