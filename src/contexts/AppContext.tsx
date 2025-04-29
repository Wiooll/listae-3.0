import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShoppingList, ShoppingItem, SortOption, SortDirection, AppSettings } from '../types';
import { getSettings, saveSettings } from '../services/localStorageService';
import { toast } from '@/hooks/use-toast';
import { useSupabase } from './SupabaseContext';
import { useAuth } from './AuthContext';

interface AppContextType {
  lists: ShoppingList[];
  activeList: ShoppingList | null;
  settings: AppSettings;
  sortOption: SortOption;
  sortDirection: SortDirection;
  
  addList: () => void;
  updateList: (list: ShoppingList) => void;
  deleteList: (listId: string) => void;
  setActiveList: (listId: string) => void;
  
  addItem: (item: ShoppingItem) => void;
  updateItem: (itemId: string, updates: Partial<ShoppingItem>) => void;
  deleteItem: (itemId: string) => void;
  toggleItemCheck: (itemId: string) => void;
  clearCheckedItems: () => void;
  clearAllItems: () => void;
  
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateSortOption: (option: SortOption) => void;
  updateSortDirection: (direction: SortDirection) => void;
  
  getTotal: () => number;
  getCheckedTotal: () => number;
  getSortedItems: () => ShoppingItem[];
  
  formatCurrency: (value: number) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [sortOption, setSortOption] = useState<SortOption>(settings.defaultSort);
  const [sortDirection, setSortDirection] = useState<SortDirection>(settings.defaultSortDirection);

  // List operations
  const addList = () => {
    const name = `Lista ${new Date().toLocaleDateString('pt-BR')}`;
    supabase.addList(name).then(() => {
      toast({
        title: "Nova lista criada",
        description: `Lista "${name}" criada com sucesso`,
      });
    }).catch(error => {
      console.error('Erro ao criar lista:', error);
      toast({
        title: "Erro ao criar lista",
        description: "Não foi possível criar a nova lista",
        variant: "destructive",
      });
    });
  };

  const updateList = (list: ShoppingList) => {
    supabase.updateList(list).then(() => {
      toast({
        title: "Lista atualizada",
        description: `Lista "${list.name}" atualizada com sucesso`,
      });
    }).catch(error => {
      console.error('Erro ao atualizar lista:', error);
      toast({
        title: "Erro ao atualizar lista",
        description: "Não foi possível atualizar a lista",
        variant: "destructive",
      });
    });
  };

  const deleteListImpl = (listId: string) => {
    supabase.deleteList(listId).then(() => {
      toast({
        title: "Lista removida",
        description: "Lista removida com sucesso",
      });
    }).catch(error => {
      console.error('Erro ao deletar lista:', error);
      toast({
        title: "Erro ao remover lista",
        description: "Não foi possível remover a lista",
        variant: "destructive",
      });
    });
  };

  const setActiveList = (listId: string) => {
    supabase.setActiveList(listId);
    const list = supabase.lists.find(list => list.id === listId);
    if (list) {
      toast({
        title: "Lista selecionada",
        description: `Lista "${list.name}" selecionada`,
      });
    }
  };

  // Item operations
  const addItem = (item: ShoppingItem) => {
    if (!supabase.activeList) return;
    
    supabase.addItem(item, supabase.activeList.id).then(() => {
      toast({
        title: "Item adicionado",
        description: `"${item.name}" adicionado à lista`,
      });
    }).catch(error => {
      console.error('Erro ao adicionar item:', error);
      toast({
        title: "Erro ao adicionar item",
        description: "Não foi possível adicionar o item à lista",
        variant: "destructive",
      });
    });
  };

  const updateItem = (itemId: string, updates: Partial<ShoppingItem>) => {
    supabase.updateItem(itemId, updates).catch(error => {
      console.error('Erro ao atualizar item:', error);
      toast({
        title: "Erro ao atualizar item",
        description: "Não foi possível atualizar o item",
        variant: "destructive",
      });
    });
  };

  const deleteItem = (itemId: string) => {
    const item = supabase.activeList?.items.find(item => item.id === itemId);
    supabase.deleteItem(itemId).then(() => {
      if (item) {
        toast({
          title: "Item removido",
          description: `"${item.name}" removido da lista`,
        });
      }
    }).catch(error => {
      console.error('Erro ao deletar item:', error);
      toast({
        title: "Erro ao remover item",
        description: "Não foi possível remover o item",
        variant: "destructive",
      });
    });
  };

  const toggleItemCheck = (itemId: string) => {
    const item = supabase.activeList?.items.find(item => item.id === itemId);
    if (item) {
      supabase.toggleItemCheck(itemId, !item.checked).catch(error => {
        console.error('Erro ao marcar/desmarcar item:', error);
        toast({
          title: "Erro ao marcar/desmarcar item",
          description: "Não foi possível atualizar o status do item",
          variant: "destructive",
        });
      });
    }
  };

  const clearCheckedItems = () => {
    if (!supabase.activeList) return;
    
    supabase.clearCheckedItems(supabase.activeList.id).then(() => {
      toast({
        title: "Itens comprados removidos",
        description: "Todos os itens marcados como comprados foram removidos da lista",
      });
    }).catch(error => {
      console.error('Erro ao limpar itens marcados:', error);
      toast({
        title: "Erro ao remover itens",
        description: "Não foi possível remover os itens marcados",
        variant: "destructive",
      });
    });
  };

  const clearAllItems = () => {
    if (!supabase.activeList) return;
    
    supabase.clearAllItems(supabase.activeList.id).then(() => {
      toast({
        title: "Lista limpa",
        description: "Todos os itens foram removidos da lista",
      });
    }).catch(error => {
      console.error('Erro ao limpar todos os itens:', error);
      toast({
        title: "Erro ao limpar lista",
        description: "Não foi possível remover todos os itens",
        variant: "destructive",
      });
    });
  };

  // Settings operations
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    
    if (newSettings.defaultSort) {
      setSortOption(newSettings.defaultSort);
    }
    if (newSettings.defaultSortDirection) {
      setSortDirection(newSettings.defaultSortDirection);
    }
    
    toast({
      title: "Configurações atualizadas",
      description: "Suas preferências foram salvas com sucesso",
    });
  };

  const updateSortOption = (option: SortOption) => {
    setSortOption(option);
  };

  const updateSortDirection = (direction: SortDirection) => {
    setSortDirection(direction);
  };

  // Utility functions
  const getTotal = () => {
    if (!supabase.activeList) return 0;
    return supabase.activeList.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCheckedTotal = () => {
    if (!supabase.activeList) return 0;
    return supabase.activeList.items
      .filter(item => item.checked)
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getSortedItems = () => {
    if (!supabase.activeList) return [];
    
    return [...supabase.activeList.items].sort((a, b) => {
      let comparison = 0;
      
      switch (sortOption) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = (a.price * a.quantity) - (b.price * b.quantity);
          break;
        case 'checked':
          comparison = (a.checked === b.checked) ? 0 : a.checked ? 1 : -1;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: settings.currency
    }).format(value);
  };

  return (
    <AppContext.Provider
      value={{
        lists: supabase.lists,
        activeList: supabase.activeList,
        settings,
        sortOption,
        sortDirection,
        
        addList,
        updateList,
        deleteList: deleteListImpl,
        setActiveList,
        
        addItem,
        updateItem,
        deleteItem,
        toggleItemCheck,
        clearCheckedItems,
        clearAllItems,
        
        updateSettings,
        updateSortOption,
        updateSortDirection,
        
        getTotal,
        getCheckedTotal,
        getSortedItems,
        
        formatCurrency
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
