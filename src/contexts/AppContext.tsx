
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShoppingList, ShoppingItem, SortOption, SortDirection, AppSettings, Currency } from '../types';
import {
  getLists,
  saveLists,
  getActiveListId,
  setActiveListId,
  getSettings,
  saveSettings,
  createDefaultList
} from '../services/localStorageService';
import { toast } from '@/hooks/use-toast';

interface AppContextType {
  lists: ShoppingList[];
  activeList: ShoppingList;
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
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeList, setActiveListState] = useState<ShoppingList>(createDefaultList());
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [sortOption, setSortOption] = useState<SortOption>(settings.defaultSort);
  const [sortDirection, setSortDirection] = useState<SortDirection>(settings.defaultSortDirection);

  // Load lists from localStorage on mount
  useEffect(() => {
    const storedLists = getLists();
    setLists(storedLists);
    
    // Get active list or create a default one if none exists
    let currentListId = getActiveListId();
    let currentList: ShoppingList | undefined;
    
    if (currentListId) {
      currentList = storedLists.find(list => list.id === currentListId);
    }
    
    if (!currentList && storedLists.length > 0) {
      currentList = storedLists[0];
      setActiveListId(currentList.id);
    } else if (!currentList) {
      currentList = createDefaultList();
      setLists([currentList]);
      saveLists([currentList]);
      setActiveListId(currentList.id);
    }
    
    setActiveListState(currentList);
    
    // Load sort settings
    setSortOption(settings.defaultSort);
    setSortDirection(settings.defaultSortDirection);
  }, []);

  // List operations
  const addList = () => {
    const newList = createDefaultList();
    const updatedLists = [...lists, newList];
    setLists(updatedLists);
    saveLists(updatedLists);
    setActiveList(newList.id);
    toast({
      title: "Nova lista criada",
      description: `Lista "${newList.name}" criada com sucesso`,
    });
  };

  const updateList = (list: ShoppingList) => {
    const updatedLists = lists.map(l => (l.id === list.id ? { ...list, updatedAt: Date.now() } : l));
    setLists(updatedLists);
    saveLists(updatedLists);
    
    if (activeList.id === list.id) {
      setActiveListState({ ...list, updatedAt: Date.now() });
    }
    
    toast({
      title: "Lista atualizada",
      description: `Lista "${list.name}" atualizada com sucesso`,
    });
  };

  const deleteListImpl = (listId: string) => {
    const updatedLists = lists.filter(list => list.id !== listId);
    setLists(updatedLists);
    saveLists(updatedLists);
    
    // If the active list is deleted, set the first list as active
    if (activeList.id === listId) {
      if (updatedLists.length > 0) {
        setActiveList(updatedLists[0].id);
      } else {
        const newList = createDefaultList();
        setLists([newList]);
        saveLists([newList]);
        setActiveList(newList.id);
      }
    }
    
    toast({
      title: "Lista removida",
      description: "Lista removida com sucesso",
    });
  };

  const setActiveList = (listId: string) => {
    const list = lists.find(list => list.id === listId);
    if (list) {
      setActiveListState(list);
      setActiveListId(listId);
      toast({
        title: "Lista selecionada",
        description: `Lista "${list.name}" selecionada`,
      });
    }
  };

  // Item operations
  const addItem = (item: ShoppingItem) => {
    const updatedItems = [...activeList.items, item];
    const updatedList = { ...activeList, items: updatedItems, updatedAt: Date.now() };
    
    setActiveListState(updatedList);
    updateList(updatedList);
    
    toast({
      title: "Item adicionado",
      description: `"${item.name}" adicionado à lista`,
    });
  };

  const updateItem = (itemId: string, updates: Partial<ShoppingItem>) => {
    const updatedItems = activeList.items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    
    const updatedList = { ...activeList, items: updatedItems, updatedAt: Date.now() };
    setActiveListState(updatedList);
    updateList(updatedList);
  };

  const deleteItem = (itemId: string) => {
    const itemToDelete = activeList.items.find(item => item.id === itemId);
    const updatedItems = activeList.items.filter(item => item.id !== itemId);
    const updatedList = { ...activeList, items: updatedItems, updatedAt: Date.now() };
    
    setActiveListState(updatedList);
    updateList(updatedList);
    
    if (itemToDelete) {
      toast({
        title: "Item removido",
        description: `"${itemToDelete.name}" removido da lista`,
      });
    }
  };

  const toggleItemCheck = (itemId: string) => {
    const updatedItems = activeList.items.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    
    const updatedList = { ...activeList, items: updatedItems, updatedAt: Date.now() };
    setActiveListState(updatedList);
    updateList(updatedList);
  };

  const clearCheckedItems = () => {
    const uncheckedItems = activeList.items.filter(item => !item.checked);
    const updatedList = { ...activeList, items: uncheckedItems, updatedAt: Date.now() };
    
    setActiveListState(updatedList);
    updateList(updatedList);
    
    toast({
      title: "Itens comprados removidos",
      description: "Todos os itens marcados como comprados foram removidos da lista",
    });
  };

  const clearAllItems = () => {
    const updatedList = { ...activeList, items: [], updatedAt: Date.now() };
    setActiveListState(updatedList);
    updateList(updatedList);
    
    toast({
      title: "Lista limpa",
      description: "Todos os itens foram removidos da lista",
    });
  };

  // Settings operations
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const updateSortOption = (option: SortOption) => {
    setSortOption(option);
  };

  const updateSortDirection = (direction: SortDirection) => {
    setSortDirection(direction);
  };

  // Helper functions
  const getTotal = () => {
    return activeList.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCheckedTotal = () => {
    return activeList.items
      .filter(item => item.checked)
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getSortedItems = () => {
    return [...activeList.items].sort((a, b) => {
      let comparison = 0;
      
      if (sortOption === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortOption === 'price') {
        comparison = (a.price * a.quantity) - (b.price * b.quantity);
      } else if (sortOption === 'quantity') {
        comparison = a.quantity - b.quantity;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const formatCurrency = (value: number) => {
    if (isNaN(value)) return '—';
    
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: settings.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    };
    
    const formatter = new Intl.NumberFormat('pt-BR', options);
    return formatter.format(value);
  };

  return (
    <AppContext.Provider
      value={{
        lists,
        activeList,
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
