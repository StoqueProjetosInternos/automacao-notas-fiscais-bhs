---
name: db-guidelines-sqlserver
description: Diretrizes de governança, modelagem declarativa, análise de índices e restrições para bancos de dados relacionais e SQL Server.
---

# Diretrizes para Banco de Dados e SQL Server

## 1. Princípio Inegociável

A IA **NUNCA** executa, conecta, aplica ou testa qualquer operação diretamente em banco de dados (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `ALTER TABLE`, migrations ou procedures). A IA opera **exclusivamente em modo declarativo**, propondo scripts para execução humana em ambiente controlado.

## 2. Padrões de Scripts SQL

- **Idempotência**: Uso de checagens defensivas (`IF EXISTS`, `IF NOT EXISTS`).
- **Transações Curtas**: Evitar locks prolongados em tabelas de produção.
- **Índices**: Toda proposta de índice deve justificar a seletividade, colunas de `INCLUDE` e impacto de escrita.
