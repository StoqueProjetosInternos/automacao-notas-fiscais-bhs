# Stoque Fiscal Intelligence - Desktop App (Electron)

Este módulo contém a versão Desktop (Electron) do **Stoque Fiscal Intelligence**, empacotando o frontend (`apps/dashboard`) e o backend (`apps/automacao`) em uma aplicação nativa para Windows.

## Arquitetura

* **Main Process (`src/main.ts`)**: Inicializa o Electron, gerencia a janela nativa e roda o servidor Express (`apps/automacao`) de forma embutida na porta 3001.
* **Renderer Process**: Carrega a interface gráfica desenvolvida em React + Vite (`apps/dashboard`).
* **Preload (`src/preload.ts`)**: Fornece uma ponte segura (IPC) entre a interface web e o sistema operacional.

## Como Executar em Modo de Desenvolvimento

1. Certifique-se de que os pacotes do monorepo estão instalados:
   ```bash
   npm install
   ```

2. Na raiz do projeto, execute o script do desktop:
   ```bash
   npm run dev -w stoque-fiscal-intelligence-desktop
   ```

## Como Gerar o Executável (.exe) para Windows

Para compilar e gerar o instalador nativo de distribuição Windows (`.exe` / portátil):

```bash
npm run dist -w stoque-fiscal-intelligence-desktop
```

O arquivo `.exe` gerado estará disponível na pasta `apps/desktop/release/`.
