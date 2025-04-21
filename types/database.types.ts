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
      user_profiles: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          display_name: string;
          age: number;
          photo_url: string | null;
          interests: string[];
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          display_name: string;
          age: number;
          photo_url?: string | null;
          interests: string[];
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          display_name?: string;
          age?: number;
          photo_url?: string | null;
          interests?: string[];
        };
      };
    };
  };
}
