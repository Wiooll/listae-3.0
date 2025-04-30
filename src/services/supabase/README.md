# Sincronização em Tempo Real com Supabase

Este diretório contém a implementação da sincronização em tempo real usando Supabase e React Query.

## Estrutura

- `base.ts`: Funções e tipos base para interação com o Supabase
- `lists.ts`: Serviço para gerenciar listas
- `items.ts`: Serviço para gerenciar itens
- Hooks em `src/hooks/queries/`:
  - `useLists.ts`: Hook para gerenciar listas
  - `useItems.ts`: Hook para gerenciar itens

## Como Funciona

### 1. Serviços Base

Os serviços base (`base.ts`) fornecem:

- Tipos TypeScript para as tabelas
- Funções para criar e gerenciar canais Realtime
- Função de tratamento de erros
- Função para atualizações otimistas

### 2. Serviços Específicos

Cada serviço (lists.ts, items.ts) implementa:

- Operações CRUD básicas
- Funções específicas (ex: toggle de checked)
- Tratamento de erros consistente
- Tipagem forte com TypeScript

### 3. Hooks React Query

Os hooks combinam:

- Queries para buscar dados
- Mutations para modificar dados
- Sincronização em tempo real via Supabase Realtime
- Cache otimista para melhor UX
- Feedback visual (loading, error states)

## Exemplo de Uso

\`\`\`tsx
// Em um componente React
function ListComponent({ userId }: { userId: string }) {
const {
lists,
isLoading,
createList,
updateList,
deleteList
} = useLists(userId);

// Os dados são automaticamente sincronizados
return (
<div>
{lists.map(list => (
<ListItems key={list.id} listId={list.id} />
))}
</div>
);
}
\`\`\`

## Recursos Implementados

1. **Sincronização em Tempo Real**

   - Inscrição automática em canais Realtime
   - Atualização do cache do React Query
   - Limpeza de listeners ao desmontar

2. **Otimizações de Performance**

   - Debounce em atualizações frequentes
   - Cache configurado com staleTime e gcTime
   - Atualizações otimistas para melhor UX

3. **Tratamento de Erros**

   - Mensagens de erro amigáveis
   - Fallback para estado anterior em falhas
   - Retry automático em falhas de rede

4. **Feedback Visual**
   - Loading states
   - Mensagens de sucesso/erro
   - Indicadores de progresso

## Boas Práticas

1. **Segurança**

   - Respeito às políticas RLS
   - Validação de dados
   - Sanitização de inputs

2. **Performance**

   - Queries otimizadas
   - Cache eficiente
   - Limpeza de recursos

3. **Manutenibilidade**
   - Código tipado
   - Funções reutilizáveis
   - Documentação clara

## Testando Localmente

1. Abra duas abas do navegador
2. Faça login em ambas
3. Modifique dados em uma aba
4. Observe as atualizações em tempo real na outra aba

## Troubleshooting

Se as atualizações não aparecerem:

1. Verifique se o Realtime está habilitado no projeto Supabase
2. Confirme se as políticas RLS permitem as operações
3. Verifique os logs do console para erros
4. Tente reconectar o canal Realtime
