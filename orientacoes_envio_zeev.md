# Guia de Mapeamento de Atributos - Integração Zeev

Este documento serve como referência de engenharia para o robô de extração ao estruturar as requisições HTTP do tipo `POST /api/2/instances` para o fluxo do Zeev. Ele especifica quais campos de formulário devem ser preenchidos dinamicamente a partir da nota fiscal processada e quais devem conter valores padrão de controle.

---

## 1.  Parâmetros Dinâmicos (Extraídos do Documento Fiscal)

Esses campos devem ser preenchidos em tempo de execução com os dados capturados e validados do documento original (`BoletoData`).

| Campo no Zeev                      | Origem no Robô (Tipagem)         | Descrição / Regra de Envio                                                                 |
| :--------------------------------- | :-------------------------------- | :------------------------------------------------------------------------------------------- |
| **Tipo de documento**        | `documentType`                  | Selecionar a opção correspondente:`Nota Fiscal`, `Recibo`, `Invoice` ou `Boleto`   |
| **Data de vencimento**       | `financial.dueDate`             | Data de vencimento extraída da nota fiscal (no formato esperado pelo Zeev:`YYYY-MM-DD`)   |
| **Natureza da requisição** | `accountingFields.naturezaCode` | Código da natureza de despesa enriquecido ou extraído da planilha de rateio consolidada    |
| **Finalidade do serviço**   | `additionalInfo.description`    | Descrição sucinta da finalidade (ex:`"Faturamento de serviços fiscais - [Fornecedor]"`) |

---

## 2.  Parâmetros de Controle (Valores Fixos Padrão)

Valores estáticos exigidos pelo fluxo do processo do Zeev que o robô deve enviar de forma fixa na inicialização.

| Campo no Zeev                                 | Valor Fixo Padrão          | Tipo / Elemento UI       |
| :-------------------------------------------- | :-------------------------- | :----------------------- |
| **Possui contrato?**                    | `Não`                    | Checkbox / Radio         |
| **Possui pedido de compra?**            | `Não`                    | Checkbox / Radio         |
| **Este gasto está orçado?**           | `Não`                    | Checkbox / Radio         |
| **Possui Rateio?**                      | `Sim`                     | Checkbox / Radio         |
| **CR principal**                        | `1103`                    | Input Numérico / Select |
| **Diretor/Head**                        | `Helder Venancio Marques` | Select de Pessoa         |
| **Local onde o serviço foi realizado** | `Stoque BH`               | Input Texto              |
| **Urgencia do pagamento**               | `Normal`                  | Select / Dropdown        |
| **Forma de pagamento**                  | `Boleto/Fatura`           | Select / Dropdown        |
| **Possui parcelamento**                 | `Não`                    | Checkbox / Radio         |

---

## 3.  Arquivos e Anexos Obrigatórios

Documentos físicos anexados à requisição HTTP para processamento subsequente da área financeira.

| Nome do Campo no Zeev                  | Origem do Anexo no Robô               | Tipo de Arquivo / Restrição                                |
| :------------------------------------- | :------------------------------------- | :----------------------------------------------------------- |
| **Documento Fiscal/Comprovante** | PDF original lido do e-mail            | Arquivo`.pdf` original da nota                             |
| **Boleto / Fatura**              | Boleto correspondente à despesa       | Arquivo de imagem/documento (`.pdf`, `.jpg` ou `.png`) |
| **Rateio**                       | Planilha consolidada de rateios gerada | Arquivo`.xlsx` preenchido a partir da base do robô        |

> [!IMPORTANT]
> **Confirmação de extensão correta do arquivo de rateio (Checkbox Obrigatório):**
> O robô deve enviar a confirmação de leitura marcada como `true` para a opção:
> *Confirmo que baixei o modelo disponível no link acima, incluí todas as informações de rateio e salvei no formato original do documento (xlsx). Tenho ciência que o Zeev não processará outra extensão, podendo não avançar o processo para pagamento.*

