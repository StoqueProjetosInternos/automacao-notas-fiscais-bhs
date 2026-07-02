# Registro de Testes de Sistema

Os testes de sistema validam o comportamento de ponta a ponta (E2E) do ecossistema **Stoque Fiscal Intelligence** a partir da perspectiva do operador financeiro no dashboard de curadoria.

## Roteiro de Teste Fim-a-Fim (E2E)

### CTS-001: Ciclo Completo de Curadoria Contábil e Regeração de Planilha
- **Objetivo**: Validar se as edições manuais efetuadas pelo operador no formulário do Dashboard são propagadas localmente e disparam a regeração do Excel de rateio de forma automática no servidor.
- **Ambiente de Teste**:
  - Servidor API rodando na porta `3001`.
  - Frontend React rodando na porta `5173`.
- **Passos de Execução**:
  1. Abrir a interface no navegador e selecionar uma fatura na Sidebar (ex: `test_19.pdf`).
  2. Visualizar o documento carregado no visualizador de PDF central.
  3. Localizar os inputs de rateio rápido (CR, Natureza, Contrato) no topo da aba de edição lateral direita.
  4. Alterar o Centro de Resultado para `102003` e a Natureza de Despesa para `3.1.90.11`.
  5. Clicar em "Salvar Dados".
  6. Verificar se a mensagem de feedback visual de sucesso é exibida instantaneamente na interface.
  7. Navegar até a pasta `data/extracted/test_19/` e abrir o arquivo `Rateio.xlsx`.
- **Resultado Esperado**: O JSON local da fatura deve refletir o CR `102003` e o arquivo Excel `Rateio.xlsx` deve ser regerado de forma síncrona contendo o rateio atualizado no cabeçalho da fatura.
- **Resultado Obtido**: Sucesso. A propagação ocorre síncrona de forma determinística e o Excel é reescrito contendo a classificação atualizada.

### CTS-002: Sincronização e Feedback de Carregamento (Loading)
- **Objetivo**: Garantir que o clique no botão "Sincronizar" no Header do Dashboard exiba animação visual de rotação e debounce síncrono.
- **Passos de Execução**:
  1. Clicar no botão "Sincronizar" no cabeçalho superior.
  2. Validar se o ícone rotaciona de forma contínua por pelo menos 600ms e se o texto do botão muda para "Sincronizando...".
- **Resultado Obtido**: Sucesso. O debounce de feedback orgânico evita cliques duplicados e fornece retorno visual adequado ao analista fiscal.
