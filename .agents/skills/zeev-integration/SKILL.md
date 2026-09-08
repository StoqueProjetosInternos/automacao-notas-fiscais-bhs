---
name: zeev-integration
description: Procedimentos de estruturação de payloads, mapeamento de campos do fluxo 2149/2044, validação dry-run e integração com a API do Zeev.
---

# Guia de Integração com a API do Zeev

Este guia contém as especificações técnicas para criação e validação de instâncias no Zeev (Orquestra BPM) para os fluxos de pagamento de faturas e serviços fiscais.

## 1. Especificações da API

- **Endpoint de Criação**: `POST /api/2/instances`
- **Endpoint de Histórico**: `POST /api/2/messages`
- **Autenticação**: `Bearer <token>` no header `Authorization`
- **Fluxo Ativo**: Fluxo 2149 (`Enviar Documento - Teste v. 2`) / Fluxo 2044 (Produção)

## 2. Regras de Formatação Obrigatórias

1. **Datas (`typeName: "Data"`)**:
   - Devem ser formatadas estritamente como `DD/MM/YYYY`. Formatos ISO (`YYYY-MM-DD`) são rejeitados pelo validador visual do formulário.
2. **CNPJ (`typeName: "CNPJ"`)**:
   - Deve conter a pontuação padrão `00.000.000/0000-00`.
3. **Moeda (`typeName: "Moeda"`)**:
   - O campo `valorTotal` e `valorDaPrimeiraParcela` devem conter valores numéricos formatados com duas casas decimais (ex.: `109.90`).
4. **Campos Auxiliares e de Rateio**:
   - `controleDeExibicaoDosCamposDaNF` (ID 34741): Deve ser enviado como `"Sim"` para ativar as regras de visibilidade dos grupos de dados do documento fiscal e fornecedor no Zeev.
   - `confimacaoDeExtensaoCorretaDoArquivoDeRateio` (ID 34752): Deve conter o texto cadastrado no catálogo: `"Confirmo que baixei o modelo disponível no link acima"`.
   - `rateio` (ID 34744), `anexarArquivo` (ID 34774), `anexarBoleto` (ID 34773): Não devem receber sobreposição de texto em `formFields`. A vinculação é realizada exclusivamente pelo array `files`.
   - `validarRateio` (ID 34759): Não deve ser enviado no `formFields`. O robô/IA nativo do Zeev executa a conferência automaticamente após a abertura.

## 3. Mapeamento de Anexos (`files`)

Os arquivos binários (PDFs e planilha XLSX) devem ser enviados no array `files` mapeando o `docType` com o **ID numérico do campo** no Zeev para assegurar a persistência física e vinculação automática aos controles visuais de formulário:
- `docType: "34774"`: PDF original da nota fiscal / fatura (vincula a `anexarArquivo`).
- `docType: "34773"`: PDF do boleto bancário correspondente (vincula a `anexarBoleto`).
- `docType: "34744"`: Planilha `.xlsx` preenchida com a classificação contábil (vincula a `rateio`).




