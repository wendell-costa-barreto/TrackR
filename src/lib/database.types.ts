/**
 * Types for the TrackR Supabase schema.
 * You can also generate this file with:
 *   npx supabase gen types typescript --project-id <your-project-id> > src/lib/database.types.ts
 */

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
      applications: {
        Row: {
          id: string;           // uuid
          user_id: string;      // uuid — references auth.users
          company: string;
          role: string;
          status: string;
          salary: string | null;
          applied_at: string;   // ISO date string
          logo: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company: string;
          role: string;
          status?: string;
          salary?: string | null;
          applied_at?: string;
          logo?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company?: string;
          role?: string;
          status?: string;
          salary?: string | null;
          applied_at?: string;
          logo?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}