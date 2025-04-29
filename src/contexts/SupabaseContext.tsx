import React, { createContext, useContext, useEffect, useState } from 'react';
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

  // Carregar listas do usuário
  useEffect(() => {
    if (!user) {
      setLists([]);
      setActiveListState(null);
      return;
    }

    const loadLists = async () => {
      const { data: listsData, error: listsError } = await supabase
        .from('lists')
        .select(`
          *,
          items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listsError) {
        console.error('Erro ao carregar listas:', listsError);
        return;
      }

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
      }
    };

    loadLists();

    // Inscrever-se para atualizações em tempo real
    const listsSubscription = supabase
      .channel('lists-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newList = payload.new as any;
            setLists(prev => [...prev, {
              ...newList,
              items: [],
              createdAt: new Date(newList.created_at).getTime(),
              updatedAt: new Date(newList.updated_at).getTime(),
            }]);
          } else if (payload.eventType === 'DELETE') {
            setLists(prev => prev.filter(list => list.id !== payload.old.id));
            if (activeList?.id === payload.old.id) {
              const remainingLists = lists.filter(list => list.id !== payload.old.id);
              setActiveListState(remainingLists.length > 0 ? remainingLists[0] : null);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedList = payload.new as any;
            setLists(prev => prev.map(list => 
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
      .subscribe();

    const itemsSubscription = supabase
      .channel('items-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: lists.length > 0 ? `list_id=in.(${lists.map(l => `'${l.id}'`).join(',')})` : undefined,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as any;
            setLists(prev => prev.map(list => 
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
            setLists(prev => prev.map(list => ({
              ...list,
              items: list.items.filter(item => item.id !== payload.old.id),
              updatedAt: Date.now(),
            })));
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as any;
            setLists(prev => prev.map(list => ({
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
      .subscribe();

    setSubscriptions([listsSubscription, itemsSubscription]);

    return () => {
      listsSubscription.unsubscribe();
      itemsSubscription.unsubscribe();
    };
  }, [user]);

  const setActiveList = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (list) {
      setActiveListState(list);
    }
  };

  const addList = async (name: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('lists')
      .insert([{
        name,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);

    if (error) {
      console.error('Erro ao adicionar lista:', error);
      throw error;
    }
  };

  const updateList = async (list: ShoppingList) => {
    if (!user) return;

    const { error } = await supabase
      .from('lists')
      .update({
        name: list.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', list.id)
      .eq('user_id', user.id);

    if (error) {
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
    const { error } = await supabase
      .from('items')
      .insert([{
        list_id: listId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        checked: item.checked,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);

    if (error) {
      console.error('Erro ao adicionar item:', error);
      throw error;
    }
  };

  const updateItem = async (itemId: string, updates: Partial<ShoppingItem>) => {
    const { error } = await supabase
      .from('items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (error) {
      console.error('Erro ao atualizar item:', error);
      throw error;
    }
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Erro ao deletar item:', error);
      throw error;
    }
  };

  const toggleItemCheck = async (itemId: string, checked: boolean) => {
    const { error } = await supabase
      .from('items')
      .update({
        checked,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (error) {
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