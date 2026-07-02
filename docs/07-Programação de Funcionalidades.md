# Programação de Funcionalidades

O ecossistema monorepo distribui as funcionalidades mapeadas entre o motor backend e a interface web React.

## Mapeamento de Requisitos Funcionais e Arquivos Fonte

A tabela a seguir correlaciona os requisitos funcionais aos artefatos de código fonte criados na solução:

| Requisito | Funcionalidade | Arquivo(s) de Código Fonte (Backend / Frontend) |
| :--- | :--- | :--- |
| **RF-001** | Captura automática de PDFs via e-mail | `apps/automacao/src/features/email/searchDataFromEmail.ts` |
| **RF-002** | Extração de dados por IA (Gemini API) | `apps/automacao/src/features/pdf/aiExtract.ts` |
| **RF-003** | Enriquecimento contábil padrão (CNPJ) | `apps/automacao/src/features/pdf/dataEnrichment.ts` |
| **RF-004** | Enriquecimento por número de série (Excel) | `apps/automacao/src/features/pdf/dataEnrichment.ts` |
| **RF-005** | Painel Web de listagem de faturas | `apps/dashboard/src/components/Sidebar.tsx` e `App.tsx` |
| **RF-006** | Exibição do documento PDF na tela | `apps/dashboard/src/App.tsx` |
| **RF-007** | Ordenação de faturas na Sidebar | `apps/dashboard/src/components/Sidebar.tsx` |
| **RF-008** | Paginação e contador de faturas | `apps/dashboard/src/components/Sidebar.tsx` |
| **RF-009** | Formulário de edição de dados | `apps/dashboard/src/components/DataEditor.tsx` |
| **RF-010** | Card de rateio unitário rápido no topo | `apps/dashboard/src/components/DataEditor.tsx` |
| **RF-011** | Regeração da planilha Excel | `apps/automacao/src/server/services/noteService.ts` e `features/excel/generateRateioExcel.ts` |
| **RF-012** | Relatórios de consumo da IA | `apps/automacao/src/scripts/show_usage.ts` |

## Estrutura de Diretórios de Desenvolvimento

```text
/automacao_notas_fisicais_v2
├── apps/
│   ├── automacao/              # Motor Backend (TypeScript)
│   │   ├── src/
│   │   │   ├── features/       # Lógicas centrais (pdf, email, excel)
│   │   │   ├── server/         # API Express (index.ts, rotas, controllers)
│   │   │   └── main.ts         # Ponto de entrada local
│   │
│   └── dashboard/              # Painel Frontend (React + Vite)
│       ├── src/
│       │   ├── components/     # Componentes (Sidebar, DataEditor, Header)
│       │   ├── App.tsx         # Estado e comunicação com a API
│       │   └── App.css         # Identidade visual e tokens de estilo
```

## Instruções para Acesso e Inicialização Local

1. **Instalação de Dependências**: Na raiz do monorepo, execute:
   ```bash
   npm install
   ```
2. **Executar a API Backend**:
   ```bash
   npm run api -w stoque-fiscal-intelligence
   ```
3. **Executar o Dashboard Frontend**:
   ```bash
   npm run dev -w dashboard
   ```
4. Acesse `http://localhost:5173` no navegador de internet.