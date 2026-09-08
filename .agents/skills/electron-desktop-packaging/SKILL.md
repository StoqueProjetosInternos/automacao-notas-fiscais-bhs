---
name: electron-desktop-packaging
description: Guia de arquitetura, empacotamento desktop com Electron, instalador NSIS, caminhos em userData e isolamento de runtime.
---

# Arquitetura e Empacotamento Desktop Electron

## 1. Arquitetura do Aplicativo

- **Frontend**: Dashboard React compilado em `apps/dashboard/dist`.
- **Backend**: Servidor Express compilado em `apps/automacao/dist`.
- **Main Process**: Electron inicializa o servidor backend localmente e renderiza a interface em `BrowserWindow`.

## 2. Resolução de Caminhos em Produção

- **Persistência de Dados**: Arquivos extraídos (`data/extracted`), configurações e credenciais locais devem ser resolvidos dinamicamente priorizando `app.getPath('userData')`.
- **Modo Asar**: O empacotamento deve utilizar `asar: false` no `electron-builder` para garantir que o backend acesse os módulos nativos e scripts de execução no Windows sem bloqueios.
