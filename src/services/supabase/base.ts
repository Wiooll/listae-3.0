import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;

export type SupabaseResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

export const subscribeToTable = <T extends TableName>(
  table: T,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
  callback: (payload: {
    new: Tables[T]['Row'] | null;
    old: Tables[T]['Row'] | null;
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  }) => void,
  filter?: string
) => {
  const channelA = supabase.channel('any');
  const channelB = channelA as unknown as {
    on(
      event: 'postgres_changes',
      config: {
        event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
        schema: string;
        table: string;
        filter?: string;
      },
      callback: (payload: any) => void
    ): any;
    subscribe(): any;
  };

  return channelB
    .on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      },
      (payload) => {
        callback({
          new: payload.new as Tables[T]['Row'] | null,
          old: payload.old as Tables[T]['Row'] | null,
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
        });
      }
    )
    .subscribe();
};

export const handleError = (error: PostgrestError) => {
  console.error('Supabase error:', error);
  
  // Aqui você pode integrar com seu sistema de notificações
  // Por exemplo, usando o toast do seu projeto
  throw new Error(error.message);
};

export const optimisticUpdate = async <T>(
  promise: Promise<SupabaseResponse<T>>,
  onSuccess: (data: T) => void,
  onError: (error: PostgrestError) => void,
  optimisticData?: T
) => {
  try {
    if (optimisticData) {
      onSuccess(optimisticData);
    }

    const { data, error } = await promise;

    if (error) {
      onError(error);
      return null;
    }

    if (data) {
      onSuccess(data);
      return data;
    }

    return null;
  } catch (error) {
    onError(error as PostgrestError);
    return null;
  }
}; 