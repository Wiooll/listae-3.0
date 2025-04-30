import { supabase } from '@/integrations/supabase/client';
import type { Tables } from './base';
import { handleError } from './base';

export type List = Tables['lists']['Row'];
export type NewList = Tables['lists']['Insert'];
export type UpdateList = Tables['lists']['Update'];

export const listsService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      handleError(error);
      return null;
    }

    return data as List[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      handleError(error);
      return null;
    }

    return data as List;
  },

  async create(list: NewList) {
    const { data, error } = await supabase
      .from('lists')
      .insert(list)
      .select()
      .single();

    if (error) {
      handleError(error);
      return null;
    }

    return data as List;
  },

  async update(id: string, updates: UpdateList) {
    const { data, error } = await supabase
      .from('lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleError(error);
      return null;
    }

    return data as List;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', id);

    if (error) {
      handleError(error);
      return false;
    }

    return true;
  },

  // Método para buscar listas com seus itens
  async getListWithItems(id: string) {
    const { data, error } = await supabase
      .from('lists')
      .select(`
        *,
        items (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      handleError(error);
      return null;
    }

    return data as List & { items: Tables['items']['Row'][] };
  }
}; 