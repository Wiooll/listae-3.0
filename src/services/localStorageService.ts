
import { ShoppingList, AppSettings } from '../types';

const LISTS_KEY = 'listaE_lists';
const ACTIVE_LIST_KEY = 'listaE_activeList';
const SETTINGS_KEY = 'listaE_settings';

// Default settings
const defaultSettings: AppSettings = {
  theme: 'system',
  currency: 'BRL',
  defaultSort: 'name',
  defaultSortDirection: 'asc'
};

// Default list name
export const createDefaultList = (): ShoppingList => ({
  id: generateId(),
  name: `Lista ${new Date().toLocaleDateString('pt-BR')}`,
  items: [],
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// Helper function to generate a unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Lists
export const getLists = (): ShoppingList[] => {
  try {
    const listsJSON = localStorage.getItem(LISTS_KEY);
    if (!listsJSON) return [];
    return JSON.parse(listsJSON) as ShoppingList[];
  } catch (error) {
    console.error('Error getting lists from localStorage:', error);
    return [];
  }
};

export const saveLists = (lists: ShoppingList[]): void => {
  try {
    localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
  } catch (error) {
    console.error('Error saving lists to localStorage:', error);
  }
};

export const saveList = (list: ShoppingList): void => {
  try {
    const lists = getLists();
    const index = lists.findIndex(l => l.id === list.id);
    
    if (index !== -1) {
      lists[index] = { ...list, updatedAt: Date.now() };
    } else {
      lists.push(list);
    }
    
    saveLists(lists);
  } catch (error) {
    console.error('Error saving list to localStorage:', error);
  }
};

export const deleteList = (listId: string): void => {
  try {
    const lists = getLists();
    const newLists = lists.filter(list => list.id !== listId);
    saveLists(newLists);
    
    // If the active list is deleted, set the first list as active
    const activeListId = getActiveListId();
    if (activeListId === listId) {
      setActiveListId(newLists.length > 0 ? newLists[0].id : createDefaultList().id);
    }
  } catch (error) {
    console.error('Error deleting list from localStorage:', error);
  }
};

// Active list
export const getActiveListId = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_LIST_KEY);
  } catch (error) {
    console.error('Error getting active list from localStorage:', error);
    return null;
  }
};

export const setActiveListId = (listId: string): void => {
  try {
    localStorage.setItem(ACTIVE_LIST_KEY, listId);
  } catch (error) {
    console.error('Error setting active list to localStorage:', error);
  }
};

export const getActiveList = (): ShoppingList | null => {
  try {
    const listId = getActiveListId();
    if (!listId) return null;
    
    const lists = getLists();
    return lists.find(list => list.id === listId) || null;
  } catch (error) {
    console.error('Error getting active list:', error);
    return null;
  }
};

// Settings
export const getSettings = (): AppSettings => {
  try {
    const settingsJSON = localStorage.getItem(SETTINGS_KEY);
    if (!settingsJSON) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(settingsJSON) } as AppSettings;
  } catch (error) {
    console.error('Error getting settings from localStorage:', error);
    return defaultSettings;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
  }
};
