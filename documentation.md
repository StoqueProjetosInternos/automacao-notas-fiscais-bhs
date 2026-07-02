# Documentação Técnica - Stoque Fiscal Intelligence (SFI)

## 1. Visão Geral
Este projeto é uma solução de **Intelligent Document Processing (IDP)** que automatiza a captura, leitura, enriquecimento de dados e validação de notas fiscais e boletos de despesas. 

A arquitetura do sistema é **AI-First**, utilizando modelos de linguagem de larga escala (LLMs) via API do Google Gemini para extrair informações estruturadas com alta precisão a partir de PDFs complexos, eliminando a fragilidade de leitores de OCR tradicionais e regras baseadas em Regex. O sistema também oferece uma interface de curadoria (Human-in-the-loop) para que operadores validem e editem os dados extraídos.

---

## 2. Arquitetura do Projeto (Monorepo)
O projeto é estruturado como um monorepo baseado em **npm workspaces**, permitindo o isolamento de dependências e responsabilidades entre o motor de processamento (backend) e a interface do usuário (frontend).

### Estrutura de Diretórios
```text
/automacao_notas_fisicais_v2
├── apps/
│   ├── automacao/              # Backend (Node.js + TypeScript)
│   │   ├── src/
│   │   │   ├── features/       # Módulos centrais de domínio
│   │   │   │   ├── email/      # Captura via Microsoft Graph API
│   │   │   │   ├── excel/      # Geração de planilhas de rateio
│   │   │   │   └── pdf/        # Orquestração de PDFs e extração via IA
│   │   │   ├── server/         # Express API (index.ts/app.ts) servindo o dashboard
│   │   │   ├── scripts/        # Scripts de utilidade e testes locais
│   │   │   └── main.ts         # Ponto de entrada da automação
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── dashboard/              # Frontend (React 19 + TypeScript + Vite)
│       ├── src/
│       │   ├── components/     # Header, Sidebar, DocumentViewer, DataEditor
│       │   ├── services/       # Comunicação com a API do backend
│       │   ├── types/          # Tipagem unificada
│       │   └── App.tsx         # Componente principal do dashboard
│       └── package.json
│
├── data/                       # Armazenamento compartilhado de dados
│   ├── extracted/              # Arquivos processados (JSONs de extração, PDFs, Excel)
│   └── base_referencia.csv     # Tabela de rateio de referência (CRs e Naturezas)
│
├── rateio_monitores.xlsx       # Tabela de de/para de séries de monitores
├── rateio_notebooks.xlsb       # Tabela de de/para de séries de notebooks
├── .env                        # Variáveis de ambiente globais (ignorado pelo Git)
├── package.json                # Configuração de workspaces npm
└── documentation.md            # Esta documentação
```

---

## 3. Descrição dos Módulos Principais

### 3.1. Aplicativo de Automação (`apps/automacao`)
O motor responsável pela captação, extração de texto, comunicação com LLM e processamento das planilhas.

- **Email Processor (`src/features/email/searchDataFromEmail.ts`):** Integra-se com a Microsoft Graph API para buscar e-mails não lidos, baixar anexos em formato PDF e movê-los para um fluxo de processamento.
- **AI Engine (`src/features/pdf/aiExtract.ts`):** Envia o documento PDF diretamente para a API do Google Gemini (usando modelos como `gemini-1.5-flash` ou `gemini-2.0-flash`) com um prompt especializado em conformidade fiscal brasileira para obter um JSON estruturado.
- **Data Enrichment (`src/features/pdf/dataEnrichment.ts`):** Cruza as informações extraídas pela IA com a planilha de referência local (`data/base_referencia.csv`) e as bases Excel de séries de hardware (`rateio_monitores.xlsx` e `rateio_notebooks.xlsb` na raiz do projeto) para associar Centros de Custo (CR), Códigos de Natureza de Despesa e Contratos de forma individualizada para cada equipamento faturado.
- **Excel Generator (`src/features/excel/generateRateioExcel.ts`):** Consolida os dados e gera planilhas no formato de rateio financeiro aceito pelo sistema ERP/Zeev do cliente utilizando a biblioteca `exceljs`. O arquivo gerado (`Rateio.xlsx`) contém duas abas: `Rateio` (agrupamento consolidado de CR, Natureza e Contrato) e `Rateio_Detalhado` (listagem individualizada com a coluna de Série).
- **Backend Server (`src/server/index.ts` e `src/server/app.ts`):** Servidor Express na porta `3001` (organizado em Rotas, Controllers e Services) que expõe endpoints REST para listar, buscar PDFs, atualizar dados editados no JSON de extração e disparar a geração final de planilhas.

### 3.2. Aplicativo Dashboard (`apps/dashboard`)
Uma SPA moderna construída com React e TypeScript para validação manual dos dados.

- **Sidebar (`src/components/Sidebar.tsx`):** Lista todas as notas/boletos disponíveis no repositório `data/extracted`.
- **Document Viewer (`src/components/DocumentViewer.tsx`):** Renderiza o arquivo PDF do documento em foco de forma nativa.
- **Data Editor (`src/components/DataEditor.tsx`):** Formulário interativo preenchido automaticamente com os dados vindos da IA. Permite que o operador valide ou corrija campos cruciais (CNPJs, Valores, Impostos Retidos e Centros de Custo) antes de salvar as alterações.

---

## 4. Contrato de Dados (`BoletoData`)
Definido em `apps/automacao/src/features/pdf/types.ts`, este contrato unifica a comunicação entre a IA, o backend e o frontend:

```typescript
export interface BoletoData {
  documentType?: string;          // Tipo do documento (Boleto, Nota Fiscal, etc.)
  beneficiary?: {
    name?: string;                // Nome do beneficiário
  };
  payer?: {
    name?: string;                // Nome do pagador
    cnpjCpf?: string;             // CNPJ ou CPF do pagador
  };
  supplier?: {
    name?: string;                // Nome do fornecedor/prestador
    cnpjCpf?: string;             // CNPJ ou CPF do fornecedor
  };
  financial?: {
    dueDate?: string;             // Data de vencimento (YYYY-MM-DD)
    originalValue?: number;       // Valor original
    chargedValue?: number;        // Valor cobrado (Líquido)
    issueDate?: string;           // Data de emissão
    competenceDate?: string;      // Competência fiscal
    taxes?: {
      iss?: number;               // Imposto ISS
      irrf?: number;              // Imposto IRRF
      pis?: number;               // Imposto PIS
      cofins?: number;            // Imposto COFINS
      csll?: number;              // Imposto CSLL
    };
  };
  documentIdentifiers?: {
    ourNumber?: string;           // Nosso número do boleto
    documentNumber?: string;      // Número do documento / Nota Fiscal
    clientAccount?: string;       // Conta do cliente
    issueDate?: string;
  };
  barcode?: string;               // Código de barras / Linha digitável
  additionalInfo?: Record<string, any>;
  accountingFields?: {            // Campos de enriquecimento para rateio
    cr?: string;                  // Centro de Resultado
    crDescription?: string;       // Descrição do CR
    naturezaCode?: string;        // Código da natureza
    naturezaDescription?: string; // Descrição da natureza
    contract?: string;            // Número do contrato associado
  };
  rawText?: string;               // Texto completo extraído do PDF
}
```

---

## 5. Configuração do Ambiente (`.env`)
Você deve criar um arquivo `.env` na **raiz** do projeto contendo as seguintes credenciais:

```env
# Google AI Studio (Necessário para a extração com Gemini)
GEMINI_API_KEY=sua_chave_do_gemini_aqui

# Integração com Microsoft Graph (Opcional - Monitoramento de E-mail)
TENANT_ID=seu_tenant_id_azure
CLIENT_ID=seu_client_id_azure
CLIENT_SECRET=seu_client_secret_azure
USER_EMAIL=email_monitorado@empresa.com.br
```

---

## 6. Como Executar o Projeto Localmente

### 6.1. Instalação Geral
Execute o comando a seguir na **raiz do repositório** para instalar as dependências de todos os workspaces do monorepo:
```bash
npm install
```

### 6.2. Executar Fluxo de Automação (Local de Teste)
Para executar o fluxo automático (que lê um PDF local de teste, extrai via Gemini, enriquece com a planilha e gera o Excel de rateio na pasta `data/extracted`), execute:
```bash
npm run dev
```

### 6.3. Executar o Painel de Curadoria (Dashboard + Servidor)
Para rodar a interface de curadoria manual de forma completa, você precisará subir o Servidor API e o painel Frontend simultaneamente:

1. **Iniciar a API Backend:**
   Abra um terminal na raiz e execute:
   ```bash
   npm run api -w stoque-fiscal-intelligence
   ```
   *O servidor iniciará escutando na porta `3001`.*

2. **Iniciar o Painel Frontend:**
   Abra outro terminal na raiz e execute:
   ```bash
   npm run dev -w dashboard
   ```
   *A interface Vite iniciará na porta `5173`.*

Abra o navegador em `http://localhost:5173` para interagir com o dashboard e validar as notas processadas.
