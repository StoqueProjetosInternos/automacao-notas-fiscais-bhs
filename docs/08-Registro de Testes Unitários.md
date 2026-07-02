# Registro de Testes Unitários

Testes unitários são executados no backend do **Stoque Fiscal Intelligence** para garantir que as funções de tratamento e conversão de dados funcionem de forma isolada, livre de dependências externas de rede ou infraestrutura.

## Configuração do Ambiente

O projeto utiliza utilitários internos TypeScript no backend Node.js (`apps/automacao/src/tests`). Para executar testes unitários locais baseados em TypeScript:
1. Instale as dependências de desenvolvimento do monorepo.
2. Utilize utilitários de asserção locais ou scripts de teste configurados com compilador `tsx`.

## Casos de Teste Unitário Mapeados

### CTU-001: Validação de Parser de Números e Moedas Brasileiras
- **Objetivo**: Garantir que valores monetários no formato brasileiro (ex: `12.450,00` ou `1.234,56`) sejam parseados para floats nativos (ex: `12450` ou `1234.56`) sem perdas, além de ignorar strings de latência e strings nulas como "N/A".
- **Artefato Testado**: `apps/dashboard/src/components/DataEditor.tsx` / `apps/automacao/src/scripts/show_usage.ts`
- **Resultado Esperado**: Strings financeiras convertidas perfeitamente; strings nulas/indefinidas convertidas para zero ou ignoradas de forma segura.

### CTU-002: Associação de Regras de Hardware por Série
- **Objetivo**: Validar a correspondência aproximada do mapeamento de números de série extraídos de itens de despesa em relação a termos em chaves parênteses no Excel de de/para.
- **Artefato Testado**: `apps/automacao/src/features/pdf/dataEnrichment.ts`
- **Resultado Esperado**: O sistema associa corretamente a série contida no item da fatura com o respectivo CR e número de contrato mapeados nas tabelas de hardware.

## Registro de Resultados
Todos os testes manuais e asserções estáticas do compilador TypeScript (`tsc`) foram executados localmente, validando que as funções de normalização numérica e leitura de cabeçalhos de planilhas Excel respondem de forma robusta e livre de regressões.
