---
name: rateio-excel
description: Regras de negócio, layout e geração de planilhas Excel (.xlsx) de rateio contábil e conferência fiscal.
---

# Geração de Planilhas de Rateio XLSX

## 1. Padrão de Planilha de Rateio

As planilhas de rateio devem ser salvas em `data/extracted/<id>/<id>.xlsx` utilizando a biblioteca `exceljs`.

## 2. Estrutura de Abas e Linhas

1. **Aba `Rateio` (Compatibilidade Estrita com IA do Zeev)**:
   - A Linha 1 **deve conter diretamente os cabeçalhos**: `Código CR`, `Cód. Natureza`, `Contrato`, `Valor`.
   - Não deve conter linhas de título mesclado na Linha 1, para permitir a leitura automatizada da IA do Zeev.
2. **Aba `Rateio_Detalhado` / `Conferência Fiscal`**:
   - Detalhamento completo com descrições de CR, Natureza, Contrato e Série.

