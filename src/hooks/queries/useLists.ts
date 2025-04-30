import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listsService, type List, type NewList, type UpdateList } from '@/services/supabase/lists';
import { subscribeToTable } from '@/services/supabase/base';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Keys para o React Query
export const listKeys = {
  all: ['lists'] as const,
  lists: () => [...listKeys.all, 'list'] as const,
  list: (id: string) => [...listKeys.lists(), id] as const,
};

export const useLists = (userId: string) => {
  const queryClient = useQueryClient();

  // Setup do canal Realtime
  useEffect(() => {
    const subscription = subscribeToTable(
      'lists',
      '*',
      (payload) => {
        // Atualiza o cache do React Query baseado no evento
        if (payload.new && (payload.new.user_id === userId)) {
          switch (payload.eventType) {
            case 'INSERT':
              queryClient.setQueryData<List[]>(
                listKeys.lists(),
                (old = []) => [payload.new as List, ...old]
              );
              break;
            case 'UPDATE':
              queryClient.setQueryData<List[]>(
                listKeys.lists(),
                (old = []) => old.map(item => 
                  item.id === payload.new!.id ? payload.new as List : item
                )
              );
              break;
            case 'DELETE':
              queryClient.setQueryData<List[]>(
                listKeys.lists(),
                (old = []) => old.filter(item => item.id !== payload.old!.id)
              );
              break;
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, queryClient]);

  // Query para buscar todas as listas
  const query = useQuery({
    queryKey: listKeys.lists(),
    queryFn: () => listsService.getAll(userId),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 60, // 1 hora
  });

  // Mutation para criar lista
  const createMutation = useMutation({
    mutationFn: (newList: NewList) => listsService.create(newList),
    onSuccess: (data) => {
      if (data) {
        toast.success('Lista criada com sucesso!');
      }
    },
    onError: (error) => {
      toast.error('Erro ao criar lista');
      console.error(error);
    }
  });

  // Mutation para atualizar lista
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateList }) => 
      listsService.update(id, updates),
    onSuccess: (data) => {
      if (data) {
        toast.success('Lista atualizada com sucesso!');
      }
    },
    onError: (error) => {
      toast.error('Erro ao atualizar lista');
      console.error(error);
    }
  });

  // Mutation para deletar lista
  const deleteMutation = useMutation({
    mutationFn: listsService.delete,
    onSuccess: (success) => {
      if (success) {
        toast.success('Lista removida com sucesso!');
      }
    },
    onError: (error) => {
      toast.error('Erro ao remover lista');
      console.error(error);
    }
  });

  return {
    lists: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createList: createMutation.mutate,
    updateList: updateMutation.mutate,
    deleteList: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}; 