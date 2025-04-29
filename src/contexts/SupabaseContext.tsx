import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingList, ShoppingItem } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SupabaseContextType {
  lists: ShoppingList[];
  activeList: ShoppingList | null;
  setActiveList: (listId: string) => void;
  addList: (name: string) => Promise<void>;
  updateList: (list: ShoppingList) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  addItem: (item: ShoppingItem, listId: string) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<ShoppingItem>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  toggleItemCheck: (itemId: string, checked: boolean) => Promise<void>;
  clearCheckedItems: (listId: string) => Promise<void>;
  clearAllItems: (listId: string) => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeList, setActiveListState] = useState<ShoppingList | null>(null);
  const [subscriptions, setSubscriptions] = useState<RealtimeChannel[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitialLoadRef = useRef(true);

  // Função otimizada para atualizar listas
  const updateListsState = useCallback((updater: (prev: ShoppingList[]) => ShoppingList[]) => {
    setLists(prev => {
      const newLists = updater(prev);
      // Se a lista ativa foi atualizada, atualize também o estado da lista ativa
      if (activeList) {
        const updatedActiveList = newLists.find(l => l.id === activeList.id);
        if (updatedActiveList && JSON.stringify(updatedActiveList) !== JSON.stringify(activeList)) {
          setActiveListState(updatedActiveList);
        }
      }
      return newLists;
    });
  }, [activeList]);

  // Função para configurar as subscriptions do Supabase
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user) return;

    try {
      // Limpar subscriptions anteriores
      subscriptions.forEach(subscription => subscription.unsubscribe());

      const realtimeSubscription = supabase
        .channel(`realtime-updates-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lists',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            console.log('Lists change received:', payload);
            if (payload.eventType === 'INSERT') {
              const newList = payload.new as any;
              updateListsState(prev => [...prev, {
                ...newList,
                items: [],
                createdAt: new Date(newList.created_at).getTime(),
                updatedAt: new Date(newList.updated_at).getTime(),
              }]);
            } else if (payload.eventType === 'DELETE') {
              updateListsState(prev => {
                const newLists = prev.filter(list => list.id !== payload.old.id);
                if (activeList?.id === payload.old.id && newLists.length > 0) {
                  setActiveListState(newLists[0]);
                }
                return newLists;
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedList = payload.new as any;
              updateListsState(prev => prev.map(list => 
                list.id === updatedList.id 
                  ? {
                      ...list,
                      name: updatedList.name,
                      updatedAt: new Date(updatedList.updated_at).getTime(),
                    }
                  : list
              ));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'items',
            filter: `list_id=in.(${lists.map(l => `'${l.id}'`).join(',')})`,
          },
          async (payload) => {
            console.log('Items change received:', payload);
            if (payload.eventType === 'INSERT') {
              const newItem = payload.new as any;
              updateListsState(prev => prev.map(list => 
                list.id === newItem.list_id
                  ? {
                      ...list,
                      items: [...list.items, {
                        id: newItem.id,
                        name: newItem.name,
                        quantity: newItem.quantity,
                        price: newItem.price,
                        checked: newItem.checked,
                        createdAt: new Date(newItem.created_at).getTime(),
                        updatedAt: new Date(newItem.updated_at).getTime(),
                      }],
                      updatedAt: Date.now(),
                    }
                  : list
              ));
            } else if (payload.eventType === 'DELETE') {
              updateListsState(prev => prev.map(list => ({
                ...list,
                items: list.items.filter(item => item.id !== payload.old.id),
                updatedAt: Date.now(),
              })));
            } else if (payload.eventType === 'UPDATE') {
              const updatedItem = payload.new as any;
              updateListsState(prev => prev.map(list => ({
                ...list,
                items: list.items.map(item => 
                  item.id === updatedItem.id
                    ? {
                        ...item,
                        name: updatedItem.name,
                        quantity: updatedItem.quantity,
                        price: updatedItem.price,
                        checked: updatedItem.checked,
                        updatedAt: new Date(updatedItem.updated_at).getTime(),
                      }
                    : item
                ),
                updatedAt: Date.now(),
              })));
            }
          }
        )
        .subscribe(status => {
          console.log('Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to realtime updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Error in realtime subscription');
            // Tentar reconectar após 5 segundos
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Attempting to reconnect...');
              setupRealtimeSubscriptions();
            }, 5000);
          }
        });

      setSubscriptions([realtimeSubscription]);

      // Cleanup function
      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        realtimeSubscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
      // Tentar reconectar após 5 segundos
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect after error...');
        setupRealtimeSubscriptions();
      }, 5000);
    }
  }, [user, lists, activeList, updateListsState]);

  // Carregar listas do usuário e configurar subscriptions
  useEffect(() => {
    if (!user) {
      setLists([]);
      setActiveListState(null);
      return;
    }

    const loadLists = async () => {
      try {
        const { data: listsData, error: listsError } = await supabase
          .from('lists')
          .select(`
            *,
            items (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (listsError) throw listsError;

        if (listsData) {
          const formattedLists = listsData.map(list => ({
            id: list.id,
            name: list.name,
            items: (list.items || []).map((item: any) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              checked: item.checked,
              createdAt: new Date(item.created_at).getTime(),
              updatedAt: new Date(item.updated_at).getTime(),
            })),
            createdAt: new Date(list.created_at).getTime(),
            updatedAt: new Date(list.updated_at).getTime(),
          }));
          
          setLists(formattedLists);
          
          // Se não houver lista ativa, selecione a primeira
          if (!activeList && formattedLists.length > 0) {
            setActiveListState(formattedLists[0]);
          }

          // Configurar subscriptions apenas após o carregamento inicial
          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            setupRealtimeSubscriptions();
          }
        }
      } catch (error) {
        console.error('Erro ao carregar listas:', error);
      }
    };

    loadLists();

    // Cleanup
    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, setupRealtimeSubscriptions]);

  const setActiveList = useCallback((listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (list) {
      setActiveListState(list);
    }
  }, [lists]);

  const addList = async (name: string) => {
    if (!user) return;

    // Otimistic update
    const tempId = `temp_${Date.now()}`;
    const newList: ShoppingList = {
      id: tempId,
      name,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    updateListsState(prev => [...prev, newList]);

    try {
      const { data, error } = await supabase
        .from('lists')
        .insert([{
          name,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar com o ID real
      updateListsState(prev => prev.map(list => 
        list.id === tempId 
          ? {
              ...list,
              id: data.id,
              createdAt: new Date(data.created_at).getTime(),
              updatedAt: new Date(data.updated_at).getTime(),
            }
          : list
      ));
    } catch (error) {
      // Reverter em caso de erro
      updateListsState(prev => prev.filter(list => list.id !== tempId));
      console.error('Erro ao adicionar lista:', error);
      throw error;
    }
  };

  const updateList = async (list: ShoppingList) => {
    if (!user) return;

    // Otimistic update
    updateListsState(prev => prev.map(l => 
      l.id === list.id ? { ...l, ...list } : l
    ));

    try {
      const { error } = await supabase
        .from('lists')
        .update({
          name: list.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', list.id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      // Reverter em caso de erro
      updateListsState(prev => prev.map(l => 
        l.id === list.id ? { ...l, name: list.name } : l
      ));
      console.error('Erro ao atualizar lista:', error);
      throw error;
    }
  };

  const deleteList = async (listId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar lista:', error);
      throw error;
    }
  };

  const addItem = async (item: ShoppingItem, listId: string) => {
    // Otimistic update
    const tempId = `temp_${Date.now()}`;
    const newItem = {
      ...item,
      id: tempId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    updateListsState(prev => prev.map(list =>
      list.id === listId
        ? {
            ...list,
            items: [...list.items, newItem],
            updatedAt: Date.now(),
          }
        : list
    ));

    try {
      const { data, error } = await supabase
        .from('items')
        .insert([{
          list_id: listId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          checked: item.checked,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar com o ID real
      updateListsState(prev => prev.map(list =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map(item =>
                item.id === tempId
                  ? {
                      ...item,
                      id: data.id,
                      createdAt: new Date(data.created_at).getTime(),
                      updatedAt: new Date(data.updated_at).getTime(),
                    }
                  : item
              ),
            }
          : list
      ));
    } catch (error) {
      // Reverter em caso de erro
      updateListsState(prev => prev.map(list =>
        list.id === listId
          ? {
              ...list,
              items: list.items.filter(item => item.id !== tempId),
            }
          : list
      ));
      console.error('Erro ao adicionar item:', error);
      throw error;
    }
  };

  const updateItem = async (itemId: string, updates: Partial<ShoppingItem>) => {
    // Encontrar o item e sua lista
    let listId: string | undefined;
    let originalItem: ShoppingItem | undefined;

    lists.some(list => {
      const item = list.items.find(i => i.id === itemId);
      if (item) {
        listId = list.id;
        originalItem = item;
        return true;
      }
      return false;
    });

    if (!listId || !originalItem) return;

    // Otimistic update
    updateListsState(prev => prev.map(list =>
      list.id === listId
        ? {
            ...list,
            items: list.items.map(item =>
              item.id === itemId
                ? { ...item, ...updates, updatedAt: Date.now() }
                : item
            ),
            updatedAt: Date.now(),
          }
        : list
    ));

    try {
      const { error } = await supabase
        .from('items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      // Reverter em caso de erro
      updateListsState(prev => prev.map(list =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map(item =>
                item.id === itemId
                  ? originalItem!
                  : item
              ),
            }
          : list
      ));
      console.error('Erro ao atualizar item:', error);
      throw error;
    }
  };

  const deleteItem = async (itemId: string) => {
    // Encontrar o item e sua lista
    let listId: string | undefined;
    let originalItem: ShoppingItem | undefined;
    let originalList: ShoppingList | undefined;

    lists.some(list => {
      const item = list.items.find(i => i.id === itemId);
      if (item) {
        listId = list.id;
        originalItem = item;
        originalList = { ...list };
        return true;
      }
      return false;
    });

    if (!listId || !originalItem) return;

    // Otimistic update
    updateListsState(prev => prev.map(list =>
      list.id === listId
        ? {
            ...list,
            items: list.items.filter(item => item.id !== itemId),
            updatedAt: Date.now(),
          }
        : list
    ));

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      // Reverter em caso de erro
      if (originalList) {
        updateListsState(prev => prev.map(list =>
          list.id === listId
            ? originalList!
            : list
        ));
      }
      console.error('Erro ao deletar item:', error);
      throw error;
    }
  };

  const toggleItemCheck = async (itemId: string, checked: boolean) => {
    // Encontrar o item e sua lista
    let listId: string | undefined;
    let originalItem: ShoppingItem | undefined;

    lists.some(list => {
      const item = list.items.find(i => i.id === itemId);
      if (item) {
        listId = list.id;
        originalItem = item;
        return true;
      }
      return false;
    });

    if (!listId || !originalItem) return;

    // Otimistic update
    updateListsState(prev => prev.map(list =>
      list.id === listId
        ? {
            ...list,
            items: list.items.map(item =>
              item.id === itemId
                ? { ...item, checked, updatedAt: Date.now() }
                : item
            ),
            updatedAt: Date.now(),
          }
        : list
    ));

    try {
      const { error } = await supabase
        .from('items')
        .update({
          checked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      // Reverter em caso de erro
      updateListsState(prev => prev.map(list =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map(item =>
                item.id === itemId
                  ? originalItem!
                  : item
              ),
            }
          : list
      ));
      console.error('Erro ao marcar/desmarcar item:', error);
      throw error;
    }
  };

  const clearCheckedItems = async (listId: string) => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('list_id', listId)
      .eq('checked', true);

    if (error) {
      console.error('Erro ao limpar itens marcados:', error);
      throw error;
    }
  };

  const clearAllItems = async (listId: string) => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('list_id', listId);

    if (error) {
      console.error('Erro ao limpar todos os itens:', error);
      throw error;
    }
  };

  return (
    <SupabaseContext.Provider
      value={{
        lists,
        activeList,
        setActiveList,
        addList,
        updateList,
        deleteList,
        addItem,
        updateItem,
        deleteItem,
        toggleItemCheck,
        clearCheckedItems,
        clearAllItems,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
} 