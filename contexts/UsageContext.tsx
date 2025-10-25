import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UsageTracking } from '@/types/database';
import { useAuth } from './AuthContext';

const FREE_TIER_LIMIT = 1;
const FREE_TIER_RESET_DAYS = 3;

export const [UsageProvider, useUsage] = createContextHook(() => {
  const { user, isPremium } = useAuth();
  const [usage, setUsage] = useState<UsageTracking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const createUsageRecord = useCallback(async (): Promise<UsageTracking> => {
    const now = new Date();
    const resetDate = new Date(now.getTime() + FREE_TIER_RESET_DAYS * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: user!.id,
        tasks_used: 0,
        last_task_date: now.toISOString(),
        reset_date: resetDate.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }, [user]);

  const resetUsageRecord = useCallback(async (id: string): Promise<UsageTracking> => {
    const now = new Date();
    const resetDate = new Date(now.getTime() + FREE_TIER_RESET_DAYS * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('usage_tracking')
      .update({
        tasks_used: 0,
        reset_date: resetDate.toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  const checkIfShouldReset = useCallback((resetDate: string): boolean => {
    const now = new Date();
    const reset = new Date(resetDate);
    return now >= reset;
  }, []);

  const loadUsage = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        const newUsage = await createUsageRecord();
        setUsage(newUsage);
      } else {
        const shouldReset = checkIfShouldReset(data.reset_date);
        if (shouldReset) {
          const resetUsage = await resetUsageRecord(data.id);
          setUsage(resetUsage);
        } else {
          setUsage(data);
        }
      }
    } catch (error) {
      console.error('Error loading usage:', error);
    } finally {
      setLoading(false);
    }
  }, [user, createUsageRecord, resetUsageRecord, checkIfShouldReset]);

  useEffect(() => {
    if (user) {
      loadUsage();
    } else {
      setUsage(null);
      setLoading(false);
    }
  }, [user, loadUsage]);

  const canUseTask = useCallback((): boolean => {
    if (isPremium) return true;
    if (!usage) return false;
    return usage.tasks_used < FREE_TIER_LIMIT;
  }, [isPremium, usage]);

  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (!user || !usage) return false;

    if (isPremium) return true;

    if (usage.tasks_used >= FREE_TIER_LIMIT) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .update({
          tasks_used: usage.tasks_used + 1,
          last_task_date: new Date().toISOString(),
        })
        .eq('id', usage.id)
        .select()
        .single();

      if (error) throw error;
      setUsage(data);
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }, [user, usage, isPremium]);

  const getRemainingTasks = useCallback((): number => {
    if (isPremium) return Infinity;
    if (!usage) return 0;
    return Math.max(0, FREE_TIER_LIMIT - usage.tasks_used);
  }, [isPremium, usage]);

  const getTimeUntilReset = useCallback((): string => {
    if (isPremium || !usage) return '';

    const now = new Date();
    const reset = new Date(usage.reset_date);
    const diff = reset.getTime() - now.getTime();

    if (diff <= 0) return 'Available now';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }, [isPremium, usage]);

  return useMemo(() => ({
    usage,
    loading,
    canUseTask: canUseTask(),
    incrementUsage,
    getRemainingTasks: getRemainingTasks(),
    getTimeUntilReset: getTimeUntilReset(),
    refreshUsage: loadUsage,
  }), [usage, loading, canUseTask, incrementUsage, getRemainingTasks, getTimeUntilReset, loadUsage]);
});
