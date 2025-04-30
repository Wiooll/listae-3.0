import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsService, type Item, type NewItem, type UpdateItem } from '@/services/supabase/items';
import { subscribeToTable } from '@/services/supabase/base';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Keys para o React Query
export const itemKeys = {
  all: ['items'] as const,
  items: (listId: string) => [...itemKeys.all, listId] as const,
  item: (id: string) => [...itemKeys.all, id] as const,
};

export const useItems = (listId: string) => {
  const queryClient = useQueryClient();

  // Setup do canal Realtime
  useEffect(() => {
    const subscription = subscribeToTable(
      'items',
      '*',
      (payload) => {
        // Atualiza o cache do React Query baseado no evento
        if (payload.new?.list_id === listId || payload.old?.list_id === listId) {
          switch (payload.eventType) {
            case 'INSERT':
              queryClient.setQueryData<Item[]>(
                itemKeys.items(listId),
                (old = []) => [...old, payload.new as Item]
              );
              break;
            case 'UPDATE':
              queryClient.setQueryData<Item[]>(
                itemKeys.items(listId),
                (old = []) => old.map(item => 
                  item.id === payload.new!.id ? payload.new as Item : item
                )
              );
              break;
            case 'DELETE':
              queryClient.setQueryData<Item[]>(
                itemKeys.items(listId),
                (old = []) => old.filter(item => item.id !== payload.old!.id)
              );
              break;
          }
        }
      },
      `list_id=eq.${listId}`
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [listId, queryClient]);

  // Query para buscar todos os itens da lista
  const query = useQuery({
    queryKey: itemKeys.items(listId),
    queryFn: () => itemsService.getAll(listId),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 60, // 1 hora
  });

  // Mutation para criar item
  const createMutation = useMutation({
    mutationFn: (newItem: NewItem) => itemsService.create(newItem),
    onSuccess: (data) => {
      if (data) {
        toast.success('Item adicionado com sucesso!');
      }
    },
    onError: (error) => {
      toast.error('Erro ao adicionar item');
      console.error(error);
    }
  });

  // Mutation para atualizar item
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateItem }) => 
      itemsService.update(id, updates),
    onSuccess: (data) => {
      if (data) {
        toast.success('Item atualizado com sucesso!');
      }
    },
    onError: (error) => {
      toast.error('Erro ao atualizar item');
      console.error(error);
    }
  });

  // Mutation para deletar item
  const deleteMutation = useMutation({
    mutationFn: itemsService.delete,
    onSuccess: (success) => {
      if (success) {
        toast.success('Item removido com sucesso!');
      }
    },
    onError: (error) => {
      toast.error('Erro ao remover item');
      console.error(error);
    }
  });

  // Mutation otimista para toggle do checked
  const toggleCheckedMutation = useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) => 
      itemsService.toggleChecked(id, checked),
    onMutate: async ({ id, checked }) => {
      // Cancela queries em andamento
      await queryClient.cancelQueries({ queryKey: itemKeys.items(listId) });

      // Snapshot do estado anterior
      const previousItems = queryClient.getQueryData<Item[]>(itemKeys.items(listId));

      // Atualiza o cache otimisticamente
      queryClient.setQueryData<Item[]>(
        itemKeys.items(listId),
        old => old?.map(item => 
          item.id === id ? { ...item, checked } : item
        )
      );

      return { previousItems };
    },
    onError: (err, variables, context) => {
      // Em caso de erro, reverte para o estado anterior
      if (context?.previousItems) {
        queryClient.setQueryData(itemKeys.items(listId), context.previousItems);
      }
      toast.error('Erro ao atualizar item');
    }
  });

  // Mutation para atualização em lote
  const bulkUpdateMutation = useMutation({
    mutationFn: (items: UpdateItem[]) => itemsService.bulkUpdate(items),
    onSuccess: (data) => {
      if (data) {
        toast.success('Itens atualizados com sucesso!');
      }
    },
    onError: (error) => {
      toast.error('Erro ao atualizar itens');
      console.error(error);
    }
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createItem: createMutation.mutate,
    updateItem: updateMutation.mutate,
    deleteItem: deleteMutation.mutate,
    toggleChecked: toggleCheckedMutation.mutate,
    bulkUpdate: bulkUpdateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending || bulkUpdateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}; 