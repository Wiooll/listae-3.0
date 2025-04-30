import { supabase } from '@/integrations/supabase/client';
import type { Tables } from './base';
import { handleError } from './base';

export type Item = Tables['items']['Row'];
export type NewItem = Tables['items']['Insert'];
export type UpdateItem = Tables['items']['Update'];

export const itemsService = {
  async getAll(listId: string) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true });

    if (error) {
      handleError(error);
      return null;
    }

    return data as Item[];
  },

  async create(item: NewItem) {
    const { data, error } = await supabase
      .from('items')
      .insert(item)
      .select()
      .single();

    if (error) {
      handleError(error);
      return null;
    }

    return data as Item;
  },

  async update(id: string, updates: UpdateItem) {
    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleError(error);
      return null;
    }

    return data as Item;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) {
      handleError(error);
      return false;
    }

    return true;
  },

  async toggleChecked(id: string, checked: boolean) {
    return this.update(id, { checked });
  },

  async updateQuantity(id: string, quantity: number) {
    return this.update(id, { quantity });
  },

  async updatePrice(id: string, price: number) {
    return this.update(id, { price });
  },

  async bulkCreate(items: NewItem[]) {
    const { data, error } = await supabase
      .from('items')
      .insert(items)
      .select();

    if (error) {
      handleError(error);
      return null;
    }

    return data as Item[];
  },

  async bulkUpdate(items: UpdateItem[]) {
    // Usando uma transação para garantir atomicidade
    const updates = items.map(item => 
      supabase
        .from('items')
        .update(item)
        .eq('id', item.id as string)
        .select()
    );

    try {
      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        handleError(errors[0].error!);
        return null;
      }

      return results.map(r => r.data![0]) as Item[];
    } catch (error) {
      handleError(error as any);
      return null;
    }
  }
}; 