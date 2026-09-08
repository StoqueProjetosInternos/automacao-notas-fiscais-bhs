---
name: fiscal-extraction-ai
description: Procedimentos de leitura de PDFs de faturas, busca de e-mails via Microsoft Graph API, extração estruturada com Google Gemini 1.5 Flash e enriquecimento contábil.
---

# Extração Fiscal e Inteligência Artificial

## 1. Fluxo de Extração

1. **Leitura de E-mails**: Microsoft Graph API consulta a caixa de correio institucional buscando mensagens não lidas com anexos em PDF.
2. **Processamento OCR/IA**: O PDF é enviado ao modelo Google Gemini 1.5 Flash com schema JSON estruturado (`BoletoData`).
3. **Enriquecimento Contábil**: Cruzamento do número da fatura e CNPJ com a base de referência (`base_referencia.csv`) para obtenção do Centro de Resultado (CR), Natureza de Despesa e Contrato.

## 2. Resiliência e Tolerância a Falhas

- **Retentativas**: Loop com exponential backoff (2s, 4s, 8s) para mitigar instabilidades transitórias da API do Gemini (status 429 e 503).
- **Validação de Tipos**: Garantia de tratamento para valores nulos, parsing de datas e sanitização de strings.
