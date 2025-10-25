export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          subscription_tier: 'free' | 'premium';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          subscription_tier?: 'free' | 'premium';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          subscription_tier?: 'free' | 'premium';
          created_at?: string;
          updated_at?: string;
        };
      };
      browser_tasks: {
        Row: {
          id: string;
          user_id: string;
          task_description: string;
          task_type: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          result: Json | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_description: string;
          task_type: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          result?: Json | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_description?: string;
          task_type?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          result?: Json | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      usage_tracking: {
        Row: {
          id: string;
          user_id: string;
          tasks_used: number;
          last_task_date: string;
          reset_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tasks_used?: number;
          last_task_date?: string;
          reset_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tasks_used?: number;
          last_task_date?: string;
          reset_date?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type BrowserTask = Database['public']['Tables']['browser_tasks']['Row'];
export type UsageTracking = Database['public']['Tables']['usage_tracking']['Row'];
