import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      smoking_areas: {
        Row: {
          id: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          description: string;
          facilities: any;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          is_verified: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          description?: string;
          facilities?: any;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          is_verified?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          description?: string;
          facilities?: any;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          is_verified?: boolean;
        };
      };
      smoking_area_photos: {
        Row: {
          id: string;
          smoking_area_id: string;
          photo_url: string;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          smoking_area_id: string;
          photo_url: string;
          uploaded_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          smoking_area_id?: string;
          photo_url?: string;
          uploaded_by?: string;
          created_at?: string;
        };
      };
    };
  };
};