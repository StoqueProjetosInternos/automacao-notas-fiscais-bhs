# Template Padrão da Aplicação

O **Stoque Fiscal Intelligence** adota uma identidade visual moderna voltada para sistemas corporativos de alta produtividade (Enterprise Dashboard), priorizando a clareza de leitura e o conforto visual durante longas jornadas de trabalho.

## Identidade Visual

A identidade visual foi construída utilizando CSS Vanilla de alto padrão no frontend React, baseado em variáveis globais do CSS (`App.css` / `index.css`).

### Paleta de Cores (HSL balanceada)
- **Fundo Principal (Dark Theme)**: HSL Dark (cinza profundo, `hsl(222, 47%, 11%)`) para conforto dos analistas.
- **Superfícies (Sidebar / Cards)**: HSL Semi-Dark (`hsl(223, 47%, 16%)`) para destacar a separação de áreas de conteúdo.
- **Destaques / Elementos de Ação**: HSL Azul Vibrante (`hsl(217, 91%, 60%)`) para botões de salvamento e seleção ativa.
- **Feedbacks Visuais**:
  - Verde Suave (`hsl(142, 71%, 45%)`) para status de sucesso na gravação e conciliação.
  - Âmbar/Laranja (`hsl(38, 92%, 50%)`) para pendências ou valores que necessitam de conferência.

### Tipografia
- Fonte primária: **Inter** ou **Roboto** (importadas de forma limpa do Google Fonts), fornecendo máxima legibilidade e densidade de informações em tabelas financeiras sem cansaço visual.

### Iconografia
- Baseada na biblioteca **Lucide-React** para manter consistência semântica e escalabilidade SVG pura (ex: ícones de carregamento com classe CSS de rotação `@keyframes spin` para o botão de sincronização, ícones de calendário para vencimento e filtros rápidos).

## Aspectos de Responsividade
- O layout aplica CSS Grid e Flexbox flexíveis. A Sidebar ocupa largura fixa adaptável (`minWidth: 0`), o visualizador de PDF aproveita a área central do navegador de forma fluida e o painel de edição se estende verticalmente à direita sem estourar as margens da viewport do monitor do operador.
