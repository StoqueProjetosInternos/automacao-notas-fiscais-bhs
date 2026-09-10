---
name: frontend-react-patterns
description: Padrões de arquitetura de componentes React, formulários, tipagem TypeScript e notificações do Dashboard fiscal.
---

# Padrões Frontend React e Dashboard

## 1. Diretrizes de Componentes

- **Separação de Camadas**: Não misturar regras de negócio ou chamadas de API no JSX.
- **Gerenciamento de Estado**: Estado local próximo ao uso; estados compartilhados gerenciados via Context ou Props explícitas.
- **Feedback ao Usuário**: Notificações e alertas padronizados via toasts (`showToast('...', 'success' | 'error' | 'info')`).

## 2. Tipagem TypeScript

- **Tipagem Estrita**: Sem uso de `any`; uso de `unknown` para dados externos antes de validação em runtime.
