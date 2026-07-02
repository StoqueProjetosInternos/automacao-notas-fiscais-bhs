# Stoque Fiscal Intelligence (SFI)

Este projeto é uma solução de **Intelligent Document Processing (IDP)** focada na automação de captura, extração, enriquecimento de dados e validação de notas fiscais e boletos de despesas. 

A arquitetura do sistema utiliza modelos de linguagem de larga escala (LLMs) via API do Google Gemini para extrair informações estruturadas com alta precisão a partir de PDFs complexos, eliminando as fragilidades de OCR tradicionais e regras baseadas em Regex. O sistema possui uma interface de curadoria (Human-in-the-loop) para que operadores validem e editem os dados extraídos antes da consolidação final.

---

## 1. Arquitetura do Projeto (Monorepo)

O projeto é estruturado como um monorepo baseado em **npm workspaces**, isolando o motor de processamento (backend) e a interface do usuário (frontend):

```text
/automacao_notas_fisicais_v2
├── apps/
│   ├── automacao/              # Backend (Node.js + TypeScript)
│   │   ├── src/
│   │   │   ├── features/       # Módulos centrais de domínio (email, excel, pdf)
│   │   │   ├── server/         # Express API (index.ts/app.ts) que atende ao dashboard
│   │   │   ├── scripts/        # Scripts de utilidade e testes locais
│   │   │   └── main.ts         # Ponto de entrada da automação
│   │
│   └── dashboard/              # Frontend (React 19 + TypeScript + Vite)
│       ├── src/
│       │   ├── components/     # Componentes da interface (visualizador, formulários)
│       │   ├── services/       # Comunicação com a API do backend
│       │   └── App.tsx         # Componente principal do dashboard
│
├── data/                       # Armazenamento compartilhado de dados
│   ├── extracted/              # Arquivos processados (JSONs de extração, PDFs, Excel)
│   └── base_referencia.csv     # Tabela de rateio de referência (CRs e Naturezas)
│
├── rateio_monitores.xlsx       # Tabela de de/para de séries de monitores (ignorado no Git)
├── rateio_notebooks.xlsb       # Tabela de de/para de séries de notebooks (ignorado no Git)
├── .env                        # Variáveis de ambiente globais (ignorado no Git)
└── package.json                # Configuração de workspaces npm
```

---

## 2. Tecnologias Utilizadas

*   **Backend**: Node.js, Express, TypeScript, ExcelJS, PDF-Parse
*   **Frontend**: React 19, Vite, TypeScript, Vanilla CSS
*   **Integrações**: Google Gemini API (Modelos Gemini Flash), Microsoft Graph API (Leitura de caixas de correio do Office 365)

---

## 3. Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto com a seguinte estrutura de variáveis de ambiente:

```env
# Google AI Studio (Extração inteligente com Gemini)
GEMINI_API_KEY=sua_chave_do_gemini_aqui

# Integração com Microsoft Graph (Monitoramento de E-mail)
TENANT_ID=seu_tenant_id_azure
CLIENT_ID=seu_client_id_azure
CLIENT_SECRET=seu_client_secret_azure
USER_EMAIL=email_monitorado@empresa.com.br
```

---

## 4. Como Executar o Projeto Localmente

### 4.1. Instalação Geral de Dependências
Execute o comando a seguir na raiz do repositório para instalar as dependências de todos os workspaces do monorepo:
```bash
npm install
```

### 4.2. Executar o Fluxo de Automação (Local de Teste)
Para executar o fluxo automático que lê um PDF local de teste, extrai dados via Gemini, enriquece as informações com as bases de referência e gera a planilha de rateios em `data/extracted`:
```bash
npm run dev
```

### 4.3. Executar o Painel de Curadoria (Dashboard + API Backend)
Para rodar a interface de curadoria manual completa de forma síncrona:

1.  **Iniciar a API Backend**:
    ```bash
    npm run api -w stoque-fiscal-intelligence
    ```
    *O servidor Express iniciará na porta `3001`.*

2.  **Iniciar o Painel Frontend**:
    ```bash
    npm run dev -w dashboard
    ```
    *O servidor de desenvolvimento Vite iniciará na porta `5173`.*

Acesse `http://localhost:5173` no seu navegador para validar e auditar os dados fiscais das notas fiscais e boletos processados pela inteligência artificial.
