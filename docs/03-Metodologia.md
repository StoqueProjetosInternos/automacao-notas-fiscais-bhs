# Metodologia

O desenvolvimento do **Stoque Fiscal Intelligence** adota práticas de engenharia de software ágeis e controle rigoroso de governança de código e rastreabilidade para garantir a estabilidade do monorepo de conciliação fiscal.

## Relação de Ambientes de Trabalho

Os ambientes e seus respectivos papéis no desenvolvimento e teste local do ecossistema são divididos em:

| Ambiente | Plataforma / Framework | Propósito / Acesso |
| :--- | :--- | :--- |
| **Workspace Geral** | npm Workspaces (Monorepo) | Integração estrutural das dependências de automação e painel na raiz. |
| **Backend API** | Node.js + TypeScript + Express | Hospedagem dos serviços de consulta local, alteração de faturas e regeração de planilhas na porta `3001`. |
| **Frontend Web** | React 19 + TypeScript + Vite | Interface do usuário interativa de curadoria humana rodando localmente na porta `5173`. |
| **Inteligência Artificial**| SDK `@google/generative-ai` | Extração de dados a partir do modelo de linguagem (Gemini) em ambiente de nuvem do Google AI Studio. |

## Controle de Versão

A ferramenta de controle de versão adotada no projeto é o **Git**, com hospedagem do repositório privado no **GitHub**. A governança de ramos (branches) segue as seguintes premissas:

- `main`: Versão estável do software, compatível com execução produtiva. Qualquer alteração inserida passa por testes regressivos estáticos e de compilação.
- `dev`/`branches de feature`: Versão de desenvolvimento local utilizada para prototipagem e desenvolvimento em ciclos curtos de novos requisitos.

### Convenção de Commits
Para manter a legibilidade histórica do repositório, o projeto adota o padrão **Conventional Commits**:
- `feat`: Introdução de uma nova funcionalidade (ex: `feat: add quick rate card to top of editor`).
- `fix`: Correção de bug no sistema (ex: `fix: handle Brazilian floating numbers correctly`).
- `docs`: Modificações em arquivos de documentação técnica (ex: `docs: fill contextual documents`).

### Gerência de Issues e Etiquetas (Labels)
- `bug`: Erros funcionais ou regressões identificados.
- `feature`: Novos requisitos aprovados pelo comitê técnico.
- `documentation`: Tarefas de atualização de registros e manuais técnicos.
- `enhancement`: Melhorias incrementais de usabilidade ou performance.

## Gerenciamento de Projeto

### Divisão de Papéis
A equipe atua sob modelo Scrum adaptado para pair programming e refinamento ágil:
- **Product Owner / Gestor de Contas**: Define regras de rateio e prioriza as colunas necessárias para conformidade do Zeev.
- **Desenvolvedor Sênior / Arquiteto**: Projetar a modularidade do backend, prompts da LLM, tratamento de erros de conciliação financeira e estrutura do monorepo.
- **Desenvolvedor Frontend / UI/UX**: Criação do dashboard responsivo, hooks de controle de estado e transições de feedback.

### Processo e Rastreabilidade
Cada modificação é governada por uma política de isolamento descrita no arquivo `plan.md` na raiz do projeto. O fluxo segue as seguintes etapas rígidas:
1. **Identificação do Escopo (Entendimento e Risco)**: Avaliação prévia antes de qualquer alteração de código.
2. **Registro Histórico (Proposta)**: Criação de um registro do tipo `CHG-XXXX` detalhando o contexto, escopo de arquivos afetados, planos de teste e etapas passo a passo de reversão (rollback).
3. **Aprovação Formal**: Nenhuma modificação é executada ou consolidada em branch principal sem a aprovação explícita em formato de token de verificação.
