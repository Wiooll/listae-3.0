import { supabase } from "@/integrations/supabase/client";
import { ShoppingList, ShoppingItem, AppSettings, ThemeMode, Currency, SortOption, SortDirection } from "../types";

// ---------------------- LISTAS ----------------------
export const getLists = async (userId: string): Promise<ShoppingList[]> => {
  const { data, error } = await supabase
    .from("lists")
    .select("id, name, created_at, updated_at")
    .eq("user_id", userId);

  if (error) {
    console.error("Erro ao buscar listas no Supabase:", error);
    return [];
  }

  // Para cada lista, buscar os itens relacionados
  const listsWithItems = await Promise.all(
    (data ?? []).map(async (list) => {
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("id, name, quantity, price, checked, created_at, updated_at")
        .eq("list_id", list.id);

      if (itemsError) {
        console.error("Erro ao buscar itens da lista:", itemsError);
        return {
          id: list.id,
          name: list.name,
          items: [],
          createdAt: new Date(list.created_at).getTime(),
          updatedAt: new Date(list.updated_at).getTime(),
        };
      }

      return {
        id: list.id,
        name: list.name,
        items: (items ?? []).map((item) => ({
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
      };
    })
  );

  return listsWithItems;
};

export const saveList = async (list: ShoppingList, userId: string) => {
  if (list.id) {
    const { error } = await supabase
      .from("lists")
      .update({
        name: list.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", list.id)
      .eq("user_id", userId);
    if (error) {
      console.error("Erro ao atualizar lista:", error);
    }
  } else {
    const { data, error } = await supabase
      .from("lists")
      .insert([
        {
          name: list.name,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();
    if (error) {
      console.error("Erro ao criar lista:", error);
      return null;
    }
    return data?.[0];
  }
};

export const deleteList = async (listId: string, userId: string) => {
  const { error } = await supabase
    .from("lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", userId);
  if (error) {
    console.error("Erro ao deletar lista:", error);
  }
};

// ---------------------- ITENS ----------------------
export const addItemToList = async (item: ShoppingItem, listId: string) => {
  const { data, error } = await supabase
    .from("items")
    .insert([
      {
        list_id: listId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        checked: item.checked,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select();
  if (error) {
    console.error("Erro ao adicionar item:", error);
    return null;
  }
  return data?.[0];
};

export const updateItem = async (itemId: string, updates: Partial<ShoppingItem>) => {
  const { error } = await supabase
    .from("items")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);
  if (error) {
    console.error("Erro ao atualizar item:", error);
  }
};

export const deleteItem = async (itemId: string) => {
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId);
  if (error) {
    console.error("Erro ao deletar item:", error);
  }
};

export const toggleItemCheck = async (itemId: string, checked: boolean) => {
  const { error } = await supabase
    .from("items")
    .update({
      checked,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);
  if (error) {
    console.error("Erro ao marcar/desmarcar item:", error);
  }
};

export const clearCheckedItems = async (listId: string) => {
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("list_id", listId)
    .eq("checked", true);
  if (error) {
    console.error("Erro ao limpar itens marcados:", error);
  }
};

export const clearAllItems = async (listId: string) => {
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("list_id", listId);
  if (error) {
    console.error("Erro ao limpar todos os itens:", error);
  }
};

export const getItemsFromList = async (listId: string): Promise<ShoppingItem[]> => {
  const { data, error } = await supabase
    .from("items")
    .select("id, name, quantity, price, checked, created_at, updated_at")
    .eq("list_id", listId);
  if (error) {
    console.error("Erro ao buscar itens da lista:", error);
    return [];
  }
  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    checked: item.checked,
    createdAt: new Date(item.created_at).getTime(),
    updatedAt: new Date(item.updated_at).getTime(),
  }));
};

// ---------------------- LISTA ATIVA ----------------------
export const setActiveListId = (listId: string) => {
  localStorage.setItem("listaE_activeList", listId);
};

export const getActiveListId = (): string | null => {
  return localStorage.getItem("listaE_activeList");
};

// ---------------------- CONFIGURAÇÕES ----------------------
export const getSettings = async (userId: string): Promise<AppSettings> => {
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error || !data) {
    return {
      theme: "system",
      currency: "BRL",
      defaultSort: "name",
      defaultSortDirection: "asc",
    };
  }
  return {
    theme: data.theme as ThemeMode,
    currency: data.currency as Currency,
    defaultSort: data.default_sort as SortOption,
    defaultSortDirection: data.default_sort_direction as SortDirection,
  };
};

export const saveSettings = async (settings: AppSettings, userId: string) => {
  const { error } = await supabase
    .from("app_settings")
    .upsert([
      {
        user_id: userId,
        theme: settings.theme,
        currency: settings.currency,
        default_sort: settings.defaultSort,
        default_sort_direction: settings.defaultSortDirection,
      },
    ]);
  if (error) {
    console.error("Erro ao salvar configurações:", error);
  }
};
